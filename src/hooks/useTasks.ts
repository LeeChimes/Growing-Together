import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations, syncManager } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { Database } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export const useTasks = (filters: {
  type?: 'personal' | 'site';
  assignedToMe?: boolean;
  completed?: boolean;
} = {}) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['tasks', user?.id, filters],
    queryFn: async (): Promise<(Task & { assignee?: { full_name: string; avatar_url?: string }; creator?: { full_name: string } })[]> => {
      if (await syncManager.isOnline()) {
        let query = supabase
          .from('tasks')
          .select(`
            *,
            assignee:profiles!tasks_assigned_to_fkey(full_name, avatar_url),
            creator:profiles!tasks_created_by_fkey(full_name)
          `)
          .order('due_date', { ascending: true, nullsLast: true })
          .order('created_at', { ascending: false });

        if (filters.type) {
          query = query.eq('type', filters.type);
        }

        if (filters.assignedToMe) {
          query = query.eq('assigned_to', user!.id);
        }

        if (filters.completed !== undefined) {
          query = query.eq('is_completed', filters.completed);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        // Cache the results
        if (data) {
          const processedData = data.map(item => ({
            ...item,
            proof_photos: Array.isArray(item.proof_photos) ? JSON.stringify(item.proof_photos) : item.proof_photos,
            sync_status: 'synced'
          }));
          await cacheOperations.upsertCache('tasks_cache', processedData);
        }
        
        return data || [];
      } else {
        // Fallback to cached data
        let whereClause = '1=1';
        let params: any[] = [];
        
        if (filters.type) {
          whereClause += ' AND type = ?';
          params.push(filters.type);
        }
        
        if (filters.assignedToMe) {
          whereClause += ' AND assigned_to = ?';
          params.push(user!.id);
        }
        
        if (filters.completed !== undefined) {
          whereClause += ' AND is_completed = ?';
          params.push(filters.completed);
        }
        
        const cachedData = await cacheOperations.getCache('tasks_cache', whereClause, params);
        
        return cachedData.map(item => ({
          ...item,
          proof_photos: typeof item.proof_photos === 'string' ? JSON.parse(item.proof_photos || '[]') : item.proof_photos,
          assignee: { full_name: 'Cached User', avatar_url: null },
          creator: { full_name: 'Cached User' },
        }));
      }
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (task: TaskInsert): Promise<Task> => {
      const taskWithUser = {
        ...task,
        created_by: user!.id,
        id: task.id || crypto.randomUUID(),
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('tasks')
          .insert(taskWithUser)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...taskWithUser,
          proof_photos: JSON.stringify(taskWithUser.proof_photos || []),
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('tasks_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('tasks', 'INSERT', taskWithUser);
        
        return taskWithUser as Task;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TaskUpdate }): Promise<Task> => {
      const updatedTask = {
        ...updates,
        id,
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('tasks')
          .update(updatedTask)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...updatedTask,
          proof_photos: JSON.stringify(updatedTask.proof_photos || []),
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('tasks_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('tasks', 'UPDATE', updatedTask);
        
        return updatedTask as Task;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useCompleteTask = () => {
  const updateMutation = useUpdateTask();

  return useMutation({
    mutationFn: async ({ taskId, proofPhotos }: { taskId: string; proofPhotos?: string[] }) => {
      return updateMutation.mutateAsync({
        id: taskId,
        updates: {
          is_completed: true,
          completed_at: new Date().toISOString(),
          proof_photos: proofPhotos || [],
        },
      });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      if (await syncManager.isOnline()) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .eq('created_by', user!.id); // Only allow creators to delete tasks

        if (error) throw error;
      } else {
        // Remove from cache and add to mutation queue
        await cacheOperations.addToMutationQueue('tasks', 'DELETE', { id: taskId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useMyTasks = () => {
  const { user } = useAuthStore();
  
  return useTasks({ assignedToMe: true });
};

export const useTaskStats = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['task-stats', user?.id],
    queryFn: async () => {
      const { data: allTasks } = await useTasks().queryFn();
      
      const myTasks = allTasks.filter(task => task.assigned_to === user?.id);
      const completed = myTasks.filter(task => task.is_completed);
      const pending = myTasks.filter(task => !task.is_completed);
      const overdue = pending.filter(task => 
        task.due_date && new Date(task.due_date) < new Date()
      );

      return {
        total: myTasks.length,
        completed: completed.length,
        pending: pending.length,
        overdue: overdue.length,
        completionRate: myTasks.length > 0 ? Math.round((completed.length / myTasks.length) * 100) : 0,
      };
    },
  });
};