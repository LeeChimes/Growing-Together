// hooks/useTasks.ts
import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskStatus } from '../types/task';

type CreateTaskInput = {
  title: string;
  description?: string;
  imageFile?: File | Blob | null; // web File or React Native Blob
};

type HookReturn = {
  data: Task[];
  loading: boolean;
  error?: string;
  createTask: (input: CreateTaskInput) => Promise<{ ok: boolean; id?: string; msg?: string }>;
  claimTask: (id: string) => Promise<{ ok: boolean; msg?: string }>;
  completeTask: (id: string) => Promise<{ ok: boolean; msg?: string }>;
  refetch: () => Promise<void>;
};

// helper: current user id
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// helper: upload to task-images bucket
async function uploadTaskImage(taskId: string, file: File | Blob) {
  // unique path per task
  const path = `tasks/${taskId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('task-images').upload(path, file, {
    upsert: false,
    contentType: 'image/jpeg',
  });
  if (error) throw error;
  return path; // store path in DB
}

export function useAllTasks(): HookReturn {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | undefined>(undefined);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setErr(error.message);
    setData((data ?? []) as Task[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchAll()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchAll]);

  const createTask = useCallback(async (input: CreateTaskInput) => {
    try {
      const uid = await getUserId();
      if (!uid) return { ok: false, msg: 'Not signed in' };

      // 1) create row
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: input.title,
          description: input.description ?? null,
          status: 'available' as TaskStatus,
          created_by: uid,
        })
        .select('id')
        .single();

      if (error) return { ok: false, msg: error.message };
      const taskId = data!.id as string;

      // 2) optional image
      if (input.imageFile) {
        const path = await uploadTaskImage(taskId, input.imageFile);
        const { error: e2 } = await supabase
          .from('tasks')
          .update({ image_path: path })
          .eq('id', taskId);
        if (e2) return { ok: false, msg: e2.message };
      }

      return { ok: true, id: taskId };
    } catch (e: any) {
      return { ok: false, msg: e.message ?? 'createTask failed' };
    }
  }, []);

  const claimTask = useCallback(async (id: string) => {
    try {
      const uid = await getUserId();
      if (!uid) return { ok: false, msg: 'Not signed in' };

      // claim only if currently available & unassigned
      const { error, count } = await supabase
        .from('tasks')
        .update({
          status: 'in_progress',
          assigned_to: uid,
          started_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'available')
        .is('assigned_to', null)
        .select('id', { count: 'exact', head: true });

      if (error) return { ok: false, msg: error.message };
      if (!count) return { ok: false, msg: 'Task already claimed' };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, msg: e.message ?? 'claimTask failed' };
    }
  }, []);

  const completeTask = useCallback(async (id: string) => {
    try {
      const uid = await getUserId();
      if (!uid) return { ok: false, msg: 'Not signed in' };

      const { error, count } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('assigned_to', uid)
        .neq('status', 'completed')
        .select('id', { count: 'exact', head: true });

      if (error) return { ok: false, msg: error.message };
      if (!count) return { ok: false, msg: 'Not permitted or already completed' };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, msg: e.message ?? 'completeTask failed' };
    }
  }, []);

  return { data, loading, error: err, createTask, claimTask, completeTask, refetch: fetchAll };
}

/** Legacy-compatible filtered hooks (used by TaskPanel etc.) */
export function useAvailableTasks() {
  const core = useAllTasks();
  const items = useMemo(() => core.data.filter(t => t.status === 'available'), [core.data]);
  return { ...core, data: items };
}
export async function getMyUserId() {
  return getUserId();
}
export function useMyAssignedTasks() {
  const core = useAllTasks();
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    getUserId().then(setUid);
  }, []);
  const items = useMemo(
    () => core.data.filter(t => uid && t.assigned_to === uid),
    [core.data, uid]
  );
  return { ...core, data: items };
}
export function useOverdueTasks() {
  // simple placeholder: you can later add due_date logic; for now none are overdue.
  const core = useAllTasks();
  return { ...core, data: [] };
}

/** Back-compat single export names */
export {
  useAllTasks as useTasks,
  useAllTasks as useUpcomingTasks,
  useAllTasks as useDueSoonTasks,
  useAllTasks as useUnscheduledTasks,
};
