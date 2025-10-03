export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string; // ISO date string
  created_at: string;
  updated_at: string;
  created_by: string; // user_id of admin who created it
  status: TaskStatus;
  assigned_to?: string; // user_id of member who accepted it
  completed_at?: string; // ISO date string when completed
  priority: TaskPriority;
  category: TaskCategory;
  estimated_duration?: number; // in minutes
  location?: string; // optional location on allotment
}

export type TaskStatus = 
  | 'available'    // Available for members to accept
  | 'accepted'     // Accepted by a member but not started
  | 'in_progress'  // Member is currently working on it
  | 'completed'    // Task is finished
  | 'overdue';     // Past due date and not completed

export type TaskPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type TaskCategory = 
  | 'general'
  | 'maintenance'
  | 'planting'
  | 'harvesting'
  | 'cleaning'
  | 'repair'
  | 'inspection'
  | 'community';

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  accepted_at: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  category: TaskCategory;
  estimated_duration?: number;
  location?: string;
}

export interface TaskWithAssignment extends Task {
  assignment?: TaskAssignment;
  assigned_user?: {
    id: string;
    full_name: string;
    plot_number?: string;
  };
  created_by_user?: {
    id: string;
    full_name: string;
  };
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low Priority',
  medium: 'Medium Priority',
  high: 'High Priority',
  urgent: 'Urgent'
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  available: 'Available',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue'
};

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  general: 'General',
  maintenance: 'Maintenance',
  planting: 'Planting',
  harvesting: 'Harvesting',
  cleaning: 'Cleaning',
  repair: 'Repair',
  inspection: 'Inspection',
  community: 'Community'
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#4CAF50',      // Green
  medium: '#FF9800',   // Orange
  high: '#F44336',     // Red
  urgent: '#9C27B0'    // Purple
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  available: '#2196F3',    // Blue
  accepted: '#FF9800',     // Orange
  in_progress: '#9C27B0',  // Purple
  completed: '#4CAF50',    // Green
  overdue: '#F44336'       // Red
};

export const TASK_CATEGORY_ICONS: Record<TaskCategory, string> = {
  general: 'list',
  maintenance: 'build',
  planting: 'eco',
  harvesting: 'agriculture',
  cleaning: 'cleaning-services',
  repair: 'handyman',
  inspection: 'visibility',
  community: 'people'
};

// Helper functions
export const getTaskStatus = (task: Task): TaskStatus => {
  const now = new Date();
  const dueDate = new Date(task.due_date);
  
  if (task.status === 'completed') return 'completed';
  if (now > dueDate && task.status !== 'completed') return 'overdue';
  return task.status;
};

export const isTaskAvailable = (task: Task): boolean => {
  const status = getTaskStatus(task);
  return status === 'available';
};

export const isTaskOverdue = (task: Task): boolean => {
  const status = getTaskStatus(task);
  return status === 'overdue';
};

export const canAcceptTask = (task: Task, userId: string): boolean => {
  const status = getTaskStatus(task);
  return status === 'available' && !task.assigned_to;
};

export const canCompleteTask = (task: Task, userId: string): boolean => {
  return task.assigned_to === userId && 
         (task.status === 'accepted' || task.status === 'in_progress');
};

export const formatTaskDueDate = (dueDate: string): string => {
  return new Date(dueDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getTaskUrgency = (task: Task): 'low' | 'medium' | 'high' => {
  const now = new Date();
  const dueDate = new Date(task.due_date);
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) return 'high'; // Overdue
  if (daysUntilDue <= 1) return 'high'; // Due today or tomorrow
  if (daysUntilDue <= 3) return 'medium'; // Due in 2-3 days
  return 'low'; // Due in 4+ days
};
