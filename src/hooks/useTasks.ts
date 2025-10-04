// src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// --- Types ---
export type TaskRow = {
  id: string;
  title: string;
  type: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
};

type NewTask = {
  title: string;
  type?: string | null;
  status?: string | null;
  created_by?: string | null;
};

// --- Reads (simple, no embeds) ---
export function useAllTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,type,status,created_by,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });
}

// --- Create (always-insert, minimal) ---
export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewTask) => {
      const user = (await supabase.auth.getUser()).data.user;
      const payload = {
        title: input.title ?? "",
        type: input.type ?? null,
        status: input.status ?? "open",
        created_by: input.created_by ?? user?.id ?? null,
      };

      console.log("RUNTIME_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL);
      console.log("task.create user", user?.id);
      console.log("About to insert taskWithUser", payload);

      const { data, error, status } = await supabase
        .from("tasks")
        .insert(payload)
        .select("id")
        .single();

      console.log("INSERT RESULT", { status, error, data });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log("🎉 Task created successfully, invalidating queries…");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// --- Back-compat export names (NO new identifiers) ---
export { 
  useAllTasks as useTasks, 
  useAllTasks as useAvailableTasks,
  useAllTasks as useMyAssignedTasks,
  useAllTasks as useOverdueTasks,
  useAllTasks as useTodayTasks,
  useAllTasks as useUpcomingTasks,
  useAllTasks as useDueSoonTasks,
  useAllTasks as useUnscheduledTasks
};