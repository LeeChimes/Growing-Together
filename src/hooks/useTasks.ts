// src/hooks/useTasks.ts
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ---- Types kept intentionally light for compatibility ----
export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status?: 'available' | 'accepted' | 'in_progress' | 'completed' | 'overdue' | string | null;
  priority?: 'low' | 'medium' | 'high' | string | null;
  category?: string | null;
  due_date?: string | null;           // ISO
  assigned_to?: string | null;        // user id
  created_by?: string | null;         // user id
  created_at?: string | null;         // ISO
  updated_at?: string | null;         // ISO
};

// ---- Base: all tasks (single source of truth) ----
export function useAllTasks() {
  const q = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
  return { data: q.data, error: q.error, loading: q.isLoading, isLoading: q.isLoading };
}

// ---- Derivations used by filters (client-side for simplicity & stability) ----
export function useAvailableTasks() {
  const { data, error, loading, isLoading } = useAllTasks();
  const filtered = useMemo(
    () => (data ?? []).filter(t => (t.status ?? 'available') === 'available'),
    [data]
  );
  return { data: filtered, error, loading, isLoading };
}

export function useMyAssignedTasks() {
  const userId = useAuthStore.getState().user?.id ?? null;
  const { data, error, loading, isLoading } = useAllTasks();
  const filtered = useMemo(
    () => (data ?? []).filter(t => !!userId && t.assigned_to === userId),
    [data, userId]
  );
  return { data: filtered, error, loading, isLoading };
}

export function useOverdueTasks() {
  const { data, error, loading, isLoading } = useAllTasks();
  const filtered = useMemo(() => {
    const now = new Date();
    return (data ?? []).filter(t => {
      if (!t.due_date) return false;
      if ((t.status ?? '') === 'completed') return false;
      const due = new Date(t.due_date);
      return due < now;
    });
  }, [data]);
  return { data: filtered, error, loading, isLoading };
}

// ---- Stats used by TaskPanel badges ----
export function useComprehensiveTaskStats() {
  const { data, error, loading, isLoading } = useAllTasks();

  const stats = useMemo(() => {
    const s = { available: 0, inProgress: 0, completed: 0, overdue: 0 };
    const list = data ?? [];
    const now = new Date();

    for (const t of list) {
      const status = (t.status ?? 'available') as string;
      if (status === 'completed') s.completed++;
      else if (status === 'in_progress' || status === 'accepted') s.inProgress++;
      else s.available++;

      if (t.due_date && status !== 'completed') {
        try {
          const due = new Date(t.due_date);
          if (due < now) s.overdue++;
        } catch {
          // ignore bad dates
        }
      }
    }
    return s;
  }, [data]);

  return { data: stats, error, loading, isLoading };
}

// ---- Mutations ----
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Task> & { title: string }) => {
      const payload: Partial<Task> = {
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? 'available',
        due_date: input.due_date ?? null,
        priority: input.priority ?? null,
        category: input.category ?? null,
        assigned_to: input.assigned_to ?? null,
        created_by: input.created_by ?? null,
      };
      const { data, error } = await supabase.from('tasks').insert(payload).select().single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      const key = ['tasks'];
      // Invalidate both base and derived queries
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; updates: Partial<Task> }) => {
      const { id, updates } = args;
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      const key = ['tasks'];
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      const key = ['tasks'];
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useToggleTaskComplete() {
  const update = useUpdateTask();
  return {
    mutateAsync: async (id: string, shouldComplete: boolean) => {
      const updates: Partial<Task> = { status: shouldComplete ? 'completed' : 'available' };
      return update.mutateAsync({ id, updates });
    },
    ...update,
  };
}

// ---- Small wrapper mutations the panel imports ----
export function useAcceptTask() {
  const update = useUpdateTask();
  return {
    mutateAsync: async (taskId: string) =>
      update.mutateAsync({ id: taskId, updates: { status: 'accepted' } }),
    ...update,
  };
}

export function useStartTask() {
  const update = useUpdateTask();
  return {
    mutateAsync: async (taskId: string) =>
      update.mutateAsync({ id: taskId, updates: { status: 'in_progress' } }),
    ...update,
  };
}

export function useCompleteTaskWithNotes() {
  const update = useUpdateTask();
  return {
    mutateAsync: async (args: { taskId: string; notes?: string | null }) => {
      return update.mutateAsync({
        id: args.taskId,
        updates: { status: 'completed' },
      });
    },
    ...update,
  };
}

// ---- Backwards-compat exports (legacy names used around the app) ----
export { useAllTasks as useTasks };
// Optional legacy aliases if referenced elsewhere
export { useAvailableTasks as useTodayTasks, useAvailableTasks as useUpcomingTasks, useAvailableTasks as useDueSoonTasks, useAvailableTasks as useUnscheduledTasks };