import { z } from 'zod';

// Plot schema
export const Plot = z.object({
  id: z.string(),
  number: z.string(),
  holder_user_id: z.string().nullable(),
  size: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PlotT = z.infer<typeof Plot>;

// Inspection schema
export const Inspection = z.object({
  id: z.string().optional(),
  plot_id: z.string(),
  assessor_user_id: z.string(),
  date: z.string(), // ISO
  use_status: z.enum(['active', 'partial', 'not_used']),
  upkeep: z.enum(['good', 'fair', 'poor']),
  issues: z.array(z.string()).default([]),
  notes: z.string().optional(),
  photos: z.array(z.string()).default([]), // URLs after sync
  score: z.number().min(0).max(100),
  action: z.enum(['none', 'advisory', 'warning', 'final_warning', 'recommend_removal']).default('none'),
  reinspect_by: z.string().optional(),
  shared_with_member: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export type InspectionT = z.infer<typeof Inspection>;

// Inspection form data (for UI)
export const InspectionFormData = z.object({
  plot_id: z.string(),
  use_status: z.enum(['active', 'partial', 'not_used']),
  upkeep: z.enum(['good', 'fair', 'poor']),
  issues: z.array(z.string()).default([]),
  notes: z.string().optional(),
  photos: z.array(z.string()).default([]),
  action: z.enum(['none', 'advisory', 'warning', 'final_warning', 'recommend_removal']).default('none'),
  reinspect_by: z.string().optional(),
});

export type InspectionFormDataT = z.infer<typeof InspectionFormData>;

// Member notice schema
export const MemberNotice = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  inspection_id: z.string().optional(),
  title: z.string(),
  body: z.string(),
  status: z.enum(['open', 'acknowledged', 'closed']).default('open'),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MemberNoticeT = z.infer<typeof MemberNotice>;

// Inspection issues (predefined tags)
export const INSPECTION_ISSUES = [
  'overgrown',
  'rubbish_present',
  'structures_not_permitted',
  'unsafe_items',
  'pests',
  'weeds_spreading',
  'path_blocked',
  'water_waste',
  'fire_hazard',
  'other',
] as const;

export const INSPECTION_ISSUE_LABELS = {
  overgrown: 'Overgrown',
  rubbish_present: 'Rubbish Present',
  structures_not_permitted: 'Structures Not Permitted',
  unsafe_items: 'Unsafe Items',
  pests: 'Pests',
  weeds_spreading: 'Weeds Spreading',
  path_blocked: 'Path Blocked',
  water_waste: 'Water Waste',
  fire_hazard: 'Fire Hazard',
  other: 'Other',
} as const;

// Use status labels
export const USE_STATUS_LABELS = {
  active: 'Actively Used',
  partial: 'Partially Used',
  not_used: 'Not Used',
} as const;

// Upkeep labels
export const UPKEEP_LABELS = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
} as const;

// Action labels
export const ACTION_LABELS = {
  none: 'No Action Required',
  advisory: 'Advisory',
  warning: 'Warning',
  final_warning: 'Final Warning',
  recommend_removal: 'Recommend Removal',
} as const;

// Scoring system
export const calculateInspectionScore = (useStatus: string, upkeep: string): number => {
  const usePoints = {
    active: 60,
    partial: 30,
    not_used: 0,
  };

  const upkeepPoints = {
    good: 40,
    fair: 20,
    poor: 0,
  };

  return (usePoints[useStatus as keyof typeof usePoints] || 0) + 
         (upkeepPoints[upkeep as keyof typeof upkeepPoints] || 0);
};

// Get score color based on value
export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 60) return '#eab308'; // yellow
  if (score >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
};

// Get action severity
export const getActionSeverity = (action: string): 'low' | 'medium' | 'high' | 'critical' => {
  switch (action) {
    case 'none':
      return 'low';
    case 'advisory':
      return 'low';
    case 'warning':
      return 'medium';
    case 'final_warning':
      return 'high';
    case 'recommend_removal':
      return 'critical';
    default:
      return 'low';
  }
};