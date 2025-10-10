// types/task.ts
export type TaskStatus = 'available' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  image_path?: string | null;
  status: TaskStatus;
  created_by: string;
  assigned_to?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

