// src/hooks/useTasks.ts
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Minimal user access; if you already have an auth store, swap this.
async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  status?: 'available' | 'accepted' | 'in_progress' | 'completed' | string | null;
  priority?: 'low' | 'medium' | 'high' | string | null;
  category?: string | null;
  due_date?: string | null; // ISO
  assigned_to?: string | null;
  created_by?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Q<T> = { data: T | undefined; error: unknown; loading: boolean };

// ---- Base: all tasks (single source of truth) ----
export function useAllTasks(): Q<Task[]> {
  const q = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });
  return { data: q.data, error: q.error, loading: q.isLoading };
}

// ---- Derived lists for filters ----
export function useAvailableTasks(): Q<Task[]> {
  const { data, error, loading } = useAllTasks();
  const filtered = useMemo(
    () => (data ?? []).filter(t => (t.status ?? 'available') === 'available'),
    [data]
  );
  return { data: filtered, error, loading };
}

export function useMyAssignedTasks(userId?: string | null): Q<Task[]> {
  const { data, error, loading } = useAllTasks();
  const filtered = useMemo(
    () => (data ?? []).filter(t => !!userId && t.assigned_to === userId),
    [data, userId]
  );
  return { data: filtered, error, loading };
}

export function useOverdueTasks(): Q<Task[]> {
  const { data, error, loading } = useAllTasks();
  const now = useMemo(() => new Date(), []);
  const filtered = useMemo(() => {
    return (data ?? []).filter(t => {
      if (!t.due_date) return false;
      if ((t.status ?? '') === 'completed') return false;
      return new Date(t.due_date) < now;
    });
  }, [data, now]);
  return { data: filtered, error, loading };
}

// ---- Stats for badges ----
export function useComprehensiveTaskStats(): Q<{
  available: number;
  inProgress: number;
  completed: number;
  overdue: number;
}> {
  const { data, error, loading } = useAllTasks();
  const stats = useMemo(() => {
    const s = { available: 0, inProgress: 0, completed: 0, overdue: 0 };
    const list = data ?? [];
    const now = new Date();
    for (const t of list) {
      const st = (t.status ?? 'available') as string;
      if (st === 'completed') s.completed++;
      else if (st === 'in_progress' || st === 'accepted') s.inProgress++;
      else s.available++;

      if (t.due_date && st !== 'completed' && new Date(t.due_date) < now) s.overdue++;
    }
    return s;
  }, [data]);
  return { data: stats, error, loading };
}

// ---- Mutations (create/update + wrappers the UI calls) ----
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string | null;
      image_url?: string | null;
      due_date?: string | null;
      priority?: string | null;
      category?: string | null;
    }) => {
      const uid = await getUserId();
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: input.title,
          description: input.description ?? null,
          image_url: input.image_url ?? null,
          status: 'available',
          due_date: input.due_date ?? null,
          priority: input.priority ?? null,
          category: input.category ?? null,
          assigned_to: null,
          created_by: uid,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; updates: Partial<Task> }) => {
      const { id, updates } = args;
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useStartTask() {
  const update = useUpdateTask();
  return {
    mutateAsync: async (taskId: string) => {
      const uid = await getUserId();
      return update.mutateAsync({
        id: taskId,
        updates: { status: 'in_progress', assigned_to: uid, started_at: new Date().toISOString() },
      });
    },
    ...update,
  };
}

export function useCompleteTaskWithNotes() {
  const update = useUpdateTask();
  return {
    mutateAsync: async (args: { taskId: string; notes?: string | null }) => {
      // If you later add a notes column, include it here.
      return update.mutateAsync({
        id: args.taskId,
        updates: { status: 'completed', completed_at: new Date().toISOString() },
      });
    },
    ...update,
  };
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

// Back-compat names used around the app
export {
  useAllTasks as useTasks,
  useAvailableTasks as useAvailableTasks,
  useMyAssignedTasks as useMyAssignedTasks,
  useOverdueTasks as useOverdueTasks,
};
