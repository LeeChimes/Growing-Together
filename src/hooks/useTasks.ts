import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations, syncManager } from '../lib/database';
import { enqueueMutation } from '../lib/queue';
import { useAuthStore } from '../store/authStore';
import { Database } from '../lib/database.types';
import { 
  Task, 
  TaskWithAssignment, 
  CreateTaskData, 
  TaskAssignment,
  getTaskStatus,
  isTaskAvailable,
  isTaskOverdue,
  canAcceptTask,
  canCompleteTask
} from '../types/tasks';

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
          .order('due_date', { ascending: true })
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
        const params: any[] = [];
        
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
        const cacheEntry = {
          ...taskWithUser,
          proof_photos: JSON.stringify(taskWithUser.proof_photos || []),
          sync_status: 'pending',
        };
        await cacheOperations.upsertCache('tasks_cache', [cacheEntry]);
        enqueueMutation({ type: 'task.create', payload: taskWithUser });
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
  const { data: tasks = [] } = useTasks();

  return useQuery({
    queryKey: ['task-stats', user?.id, tasks?.length],
    queryFn: async () => {
      const myTasks = tasks.filter((task: any) => task.assigned_to === user?.id);
      const completed = myTasks.filter((task: any) => task.is_completed);
      const pending = myTasks.filter((task: any) => !task.is_completed);
      const overdue = pending.filter((task: any) => task.due_date && new Date(task.due_date) < new Date());

      return {
        total: myTasks.length,
        completed: completed.length,
        pending: pending.length,
        overdue: overdue.length,
        completionRate: myTasks.length > 0 ? Math.round((completed.length / myTasks.length) * 100) : 0,
      };
    },
    enabled: !!user,
  });
};

// New comprehensive task management hooks

// Hook to get all tasks with assignments and user info
export const useAllTasks = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignments (
            id,
            task_id,
            user_id,
            accepted_at,
            started_at,
            completed_at,
            notes
          ),
          assigned_user:assignments.user_id (
            id,
            full_name,
            plot_number
          ),
          created_by_user:created_by (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TaskWithAssignment[];
    },
    enabled: !!user,
  });
};

// Hook to get available tasks (not assigned to anyone)
export const useAvailableTasks = () => {
  const { data: tasks, ...rest } = useAllTasks();
  
  const availableTasks = tasks?.filter(task => {
    const status = getTaskStatus(task);
    return status === 'available' && !task.assigned_to;
  }) || [];
  
  return {
    data: availableTasks,
    ...rest
  };
};

// Hook to get tasks assigned to current user
export const useMyAssignedTasks = () => {
  const { user } = useAuthStore();
  const { data: tasks, ...rest } = useAllTasks();
  
  const myTasks = tasks?.filter(task => 
    task.assigned_to === user?.id && 
    getTaskStatus(task) !== 'completed'
  ) || [];
  
  return {
    data: myTasks,
    ...rest
  };
};

// Hook to get overdue tasks
export const useOverdueTasks = () => {
  const { data: tasks, ...rest } = useAllTasks();
  
  const overdueTasks = tasks?.filter(task => isTaskOverdue(task)) || [];
  
  return {
    data: overdueTasks,
    ...rest
  };
};

// Hook to accept a task (members)
export const useAcceptTask = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // First, update the task to assign it to the user
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          assigned_to: user.id,
          status: 'accepted'
        })
        .eq('id', taskId);
      
      if (taskError) throw taskError;
      
      // Then create an assignment record
      const { data, error } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          accepted_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Hook to start a task (mark as in progress)
export const useStartTask = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId)
        .eq('assigned_to', user.id);
      
      if (taskError) throw taskError;
      
      // Update assignment record
      const { data, error } = await supabase
        .from('task_assignments')
        .update({ started_at: new Date().toISOString() })
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Hook to complete a task with notes
export const useCompleteTaskWithNotes = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const now = new Date().toISOString();
      
      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: now,
          is_completed: true
        })
        .eq('id', taskId)
        .eq('assigned_to', user.id);
      
      if (taskError) throw taskError;
      
      // Update assignment record
      const { data, error } = await supabase
        .from('task_assignments')
        .update({ 
          completed_at: now,
          notes: notes || null
        })
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Hook to get comprehensive task statistics
export const useComprehensiveTaskStats = () => {
  const { data: tasks, ...rest } = useAllTasks();
  
  const stats = {
    total: tasks?.length || 0,
    available: tasks?.filter(task => {
      const status = getTaskStatus(task);
      return status === 'available' && !task.assigned_to;
    }).length || 0,
    inProgress: tasks?.filter(task => getTaskStatus(task) === 'in_progress').length || 0,
    completed: tasks?.filter(task => getTaskStatus(task) === 'completed').length || 0,
    overdue: tasks?.filter(task => isTaskOverdue(task)).length || 0,
  };
  
  return {
    data: stats,
    ...rest
  };
};