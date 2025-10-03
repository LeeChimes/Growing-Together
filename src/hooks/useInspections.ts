import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations, syncManager } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { InspectionT, InspectionFormDataT, PlotT, MemberNoticeT, calculateInspectionScore } from '../types/inspections';
import { ImageCompressionService } from '../lib/imageCompression';
import { notificationService } from '../lib/notifications';
import { enqueueMutation } from '../lib/queue';
// Conditional import for web compatibility
let Notifications: any;

if (typeof window === 'undefined') {
  // Native platform
  Notifications = require('expo-notifications');
} else {
  // Web platform - use mocks
  Notifications = {
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    scheduleNotificationAsync: async (notification: any) => 'mock-id',
    cancelAllScheduledNotificationsAsync: async () => {},
    setNotificationHandler: (handler: any) => {},
  };
}

// Plots hooks
export const usePlots = () => {
  return useQuery({
    queryKey: ['plots'],
    queryFn: async (): Promise<PlotT[]> => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('plots')
          .select(`
            *,
            profiles:holder_user_id(full_name, email)
          `)
          .order('number::integer', { ascending: true });

        if (error) throw error;
        return data || [];
      } else {
        const cachedData = await cacheOperations.getCache('plots_cache');
        return cachedData;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMyPlot = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['my-plot', user?.id],
    queryFn: async (): Promise<PlotT | null> => {
      if (!user) return null;

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('plots')
          .select('*')
          .eq('holder_user_id', user.id)
          .single();

        if (error) return null;
        return data;
      } else {
        const cachedData = await cacheOperations.getCache('plots_cache');
        return cachedData.find((plot: PlotT) => plot.holder_user_id === user.id) || null;
      }
    },
    enabled: !!user,
  });
};

// Inspections hooks
export const useInspections = (filters?: {
  plotId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  assessorId?: string;
}) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['inspections', filters],
    queryFn: async (): Promise<InspectionT[]> => {
      if (await syncManager.isOnline()) {
        let query = supabase
          .from('inspections')
          .select(`
            *,
            plots:plot_id(number, holder_user_id),
            profiles:assessor_user_id(full_name, email)
          `)
          .order('date', { ascending: false });

        // Apply filters
        if (filters?.plotId) {
          query = query.eq('plot_id', filters.plotId);
        }
        if (filters?.action && filters.action !== 'all') {
          query = query.eq('action', filters.action);
        }
        if (filters?.dateFrom) {
          query = query.gte('date', filters.dateFrom);
        }
        if (filters?.dateTo) {
          query = query.lte('date', filters.dateTo);
        }
        if (filters?.assessorId) {
          query = query.eq('assessor_user_id', filters.assessorId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } else {
        const cachedData = await cacheOperations.getCache('inspections_cache');
        // Apply basic filtering on cached data
        return cachedData.filter((inspection: InspectionT) => {
          if (filters?.plotId && inspection.plot_id !== filters.plotId) return false;
          if (filters?.action && filters.action !== 'all' && inspection.action !== filters.action) return false;
          return true;
        });
      }
    },
    enabled: user?.role === 'admin',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useMyPlotInspections = () => {
  const { user } = useAuthStore();
  const { data: myPlot } = useMyPlot();

  return useQuery({
    queryKey: ['my-plot-inspections', myPlot?.id],
    queryFn: async (): Promise<InspectionT[]> => {
      if (!myPlot) return [];

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('inspections')
          .select(`
            *,
            profiles:assessor_user_id(full_name, email)
          `)
          .eq('plot_id', myPlot.id)
          .eq('shared_with_member', true)
          .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        const cachedData = await cacheOperations.getCache('inspections_cache');
        return cachedData.filter((inspection: InspectionT) => 
          inspection.plot_id === myPlot.id && inspection.shared_with_member
        );
      }
    },
    enabled: !!user && !!myPlot,
  });
};

export const useCreateInspection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: InspectionFormDataT & { photos?: string[] }): Promise<InspectionT> => {
      if (!user) throw new Error('User not authenticated');

      // Compress photos if provided
      let compressedPhotos: string[] = [];
      if (data.photos && data.photos.length > 0) {
        compressedPhotos = await ImageCompressionService.compressImages(
          data.photos,
          { maxWidth: 1600, maxHeight: 1600, quality: 0.8 }
        );
      }

      // Calculate score
      const score = calculateInspectionScore(data.use_status, data.upkeep);

      const inspectionData = {
        id: crypto.randomUUID(),
        ...data,
        assessor_user_id: user.id,
        date: new Date().toISOString(),
        photos: compressedPhotos,
        score,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        // Upload photos to storage first
        const photoUrls: string[] = [];
        for (const photo of compressedPhotos) {
          try {
            const fileName = `inspections/${inspectionData.id}/${Date.now()}.jpg`;
            const response = await fetch(photo);
            const blob = await response.blob();
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('photos')
              .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: false
              });

            if (uploadError) {
              console.warn('Photo upload failed:', uploadError);
              photoUrls.push(photo); // Use local URI as fallback
            } else {
              const { data: urlData } = supabase.storage
                .from('photos')
                .getPublicUrl(uploadData.path);
              photoUrls.push(urlData.publicUrl);
            }
          } catch (error) {
            console.warn('Photo upload error:', error);
            photoUrls.push(photo); // Use local URI as fallback
          }
        }

        const finalInspectionData = {
          ...inspectionData,
          photos: photoUrls,
        };

        const { data: result, error } = await supabase
          .from('inspections')
          .insert(finalInspectionData)
          .select()
          .single();

        if (error) throw error;

        // Create member notice and task if action requires it
        await handleInspectionActions(result);

        return result;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...inspectionData,
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('inspections_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('inspections', 'INSERT', inspectionData);
        
        return inspectionData as InspectionT;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['my-plot-inspections'] });
    },
  });
};

export const useUpdateInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InspectionT> & { id: string }) => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('inspections')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        await cacheOperations.addToMutationQueue('inspections', 'UPDATE', {
          id,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['my-plot-inspections'] });
    },
  });
};

export const useDeleteInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (await syncManager.isOnline()) {
        const { error } = await supabase
          .from('inspections')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } else {
        await cacheOperations.addToMutationQueue('inspections', 'DELETE', { id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['my-plot-inspections'] });
    },
  });
};

// Member notices hooks
export const useMyNotices = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['my-notices', user?.id],
    queryFn: async (): Promise<MemberNoticeT[]> => {
      if (!user) return [];

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('member_notices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        const cachedData = await cacheOperations.getCache('member_notices_cache');
        return cachedData.filter((notice: MemberNoticeT) => notice.user_id === user.id);
      }
    },
    enabled: !!user,
  });
};

export const useAcknowledgeNotice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noticeId: string) => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('member_notices')
          .update({ 
            status: 'acknowledged',
            updated_at: new Date().toISOString(),
          })
          .eq('id', noticeId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        await cacheOperations.addToMutationQueue('member_notices', 'UPDATE', {
          id: noticeId,
          status: 'acknowledged',
          updated_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notices'] });
    },
  });
};

// Helper function to handle inspection actions
const handleInspectionActions = async (inspection: InspectionT) => {
  if (['advisory', 'warning', 'final_warning', 'recommend_removal'].includes(inspection.action)) {
    try {
      // Get plot info to find the holder
      const { data: plot } = await supabase
        .from('plots')
        .select('*, profiles:holder_user_id(full_name, email)')
        .eq('id', inspection.plot_id)
        .single();

      if (plot && plot.holder_user_id) {
        // Create member notice
        const noticeTitle = `Plot ${plot.number} Inspection - ${inspection.action.charAt(0).toUpperCase() + inspection.action.slice(1)}`;
        const noticeBody = `Your plot has been inspected with the following result: ${inspection.action}. ${inspection.notes ? `Notes: ${inspection.notes}` : ''}`;

        await supabase
          .from('member_notices')
          .insert({
            user_id: plot.holder_user_id,
            inspection_id: inspection.id,
            title: noticeTitle,
            body: noticeBody,
            status: 'open',
          });

        // Create task for admin follow-up
        await supabase
          .from('tasks')
          .insert({
            title: `Follow up with Plot ${plot.number}`,
            description: `Follow up on ${inspection.action} issued for plot ${plot.number}`,
            type: 'site',
            assigned_to: inspection.assessor_user_id,
            created_by: inspection.assessor_user_id,
            due_date: inspection.reinspect_by,
            priority: inspection.action === 'recommend_removal' ? 'high' : 'medium',
          });

        // Reinspection reminder scheduling is disabled in this build.
      }
    } catch (error) {
      console.error('Failed to handle inspection actions:', error);
    }
  }
};

// Export data hook
export const useExportInspections = () => {
  return useMutation({
    mutationFn: async (filters?: {
      dateFrom?: string;
      dateTo?: string;
      action?: string;
      format: 'csv' | 'json';
    }) => {
      if (!(await syncManager.isOnline())) {
        throw new Error('Export requires internet connection');
      }

      let query = supabase
        .from('inspections')
        .select(`
          *,
          plots:plot_id(number, holder_user_id, profiles:holder_user_id(full_name, email)),
          profiles:assessor_user_id(full_name, email)
        `)
        .order('date', { ascending: false });

      // Apply filters
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }
      if (filters?.action && filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (filters?.format === 'csv') {
        return convertToCSV(data);
      }

      return {
        inspections: data,
        exported_at: new Date().toISOString(),
        filters,
      };
    },
  });
};

// Batch helper: plot iterator and draft save
export function usePlotIterator(allPlots: number[], completedPlotIds: number[]) {
  const completed = new Set(completedPlotIds);
  const getNext = (current?: number) => {
    if (!allPlots?.length) return undefined;
    if (current == null) return allPlots.find(p => !completed.has(p));
    const idx = allPlots.indexOf(current);
    if (idx === -1) return allPlots.find(p => !completed.has(p));
    for (let i = idx + 1; i < allPlots.length; i++) {
      if (!completed.has(allPlots[i])) return allPlots[i];
    }
    return undefined;
  };
  return { getNext };
}

export type InspectionDraft = {
  plotNumber: number;
  useStatus?: 'active'|'partial'|'not_used';
  upkeep?: 'good'|'fair'|'poor';
  issues?: string[];
  notes?: string;
  photos?: string[];
  action?: 'none'|'advisory'|'warning'|'final_warning'|'recommend_removal';
  reinspectBy?: string;
};

export async function saveInspectionDraftAndSync(draft: InspectionDraft) {
  return enqueueMutation({
    type: 'inspection.create',
    payload: draft,
  });
}

export async function scheduleReinspectNotification(plotNumber: number, reinspectISO: string) {
  const trigger = new Date(reinspectISO);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Re-inspect Plot ${plotNumber}`,
      body: `Time to re-check plot ${plotNumber}.`,
    },
    // @ts-ignore Expo types accept Date object or scheduling object
    trigger: trigger as any,
  });
}

// Helper function to convert inspections to CSV
const convertToCSV = (inspections: any[]): string => {
  const headers = [
    'Date',
    'Plot Number',
    'Plot Holder',
    'Assessor',
    'Use Status',
    'Upkeep',
    'Issues',
    'Score',
    'Action',
    'Reinspect By',
    'Notes'
  ];

  const rows = inspections.map(inspection => [
    new Date(inspection.date).toLocaleDateString(),
    inspection.plots?.number || '',
    inspection.plots?.profiles?.full_name || 'Vacant',
    inspection.profiles?.full_name || '',
    inspection.use_status,
    inspection.upkeep,
    inspection.issues.join('; '),
    inspection.score,
    inspection.action,
    inspection.reinspect_by ? new Date(inspection.reinspect_by).toLocaleDateString() : '',
    inspection.notes || ''
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
};