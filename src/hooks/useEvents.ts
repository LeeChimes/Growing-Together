import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations, syncManager } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];
type EventRSVP = Database['public']['Tables']['event_rsvps']['Row'];
type EventRSVPInsert = Database['public']['Tables']['event_rsvps']['Insert'];

export const useEvents = (filters: {
  startDate?: string;
  endDate?: string;
  includeRSVPs?: boolean;
} = {}) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['events', filters],
    queryFn: async (): Promise<Event[]> => {
      if (await syncManager.isOnline()) {
        let query = supabase
          .from('events')
          .select(`
            *,
            ${filters.includeRSVPs ? 'event_rsvps(*)' : ''}
          `)
          .eq('is_cancelled', false)
          .order('start_date', { ascending: true });

        if (filters.startDate) {
          query = query.gte('start_date', filters.startDate);
        }
        
        if (filters.endDate) {
          query = query.lte('start_date', filters.endDate);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        // Cache the results
        if (data) {
          const processedData = data.map(item => ({
            ...item,
            bring_list: Array.isArray(item.bring_list) ? JSON.stringify(item.bring_list) : item.bring_list,
            sync_status: 'synced'
          }));
          await cacheOperations.upsertCache('events_cache', processedData);
        }
        
        return data || [];
      } else {
        // Fallback to cached data
        let whereClause = `is_cancelled = ?`;
        let params = [false];
        
        if (filters.startDate) {
          whereClause += ` AND start_date >= ?`;
          params.push(filters.startDate);
        }
        
        const cachedData = await cacheOperations.getCache('events_cache', whereClause, params);
        
        return cachedData.map(item => ({
          ...item,
          bring_list: typeof item.bring_list === 'string' ? JSON.parse(item.bring_list || '[]') : item.bring_list,
        }));
      }
    },
  });
};

export const useEventRSVPs = (eventId: string) => {
  return useQuery({
    queryKey: ['event-rsvps', eventId],
    queryFn: async (): Promise<EventRSVP[]> => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('event_rsvps')
          .select(`
            *,
            profiles(full_name, avatar_url)
          `)
          .eq('event_id', eventId);

        if (error) throw error;
        
        // Cache the results
        if (data) {
          const processedData = data.map(item => ({
            ...item,
            bringing_items: Array.isArray(item.bringing_items) ? JSON.stringify(item.bringing_items) : item.bringing_items,
            sync_status: 'synced'
          }));
          await cacheOperations.upsertCache('event_rsvps_cache', processedData);
        }
        
        return data || [];
      } else {
        const cachedData = await cacheOperations.getCache('event_rsvps_cache', 'event_id = ?', [eventId]);
        return cachedData.map(item => ({
          ...item,
          bringing_items: typeof item.bringing_items === 'string' ? JSON.parse(item.bringing_items || '[]') : item.bringing_items,
        }));
      }
    },
    enabled: !!eventId,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (event: EventInsert): Promise<Event> => {
      const eventWithUser = {
        ...event,
        created_by: user!.id,
        id: event.id || crypto.randomUUID(),
        is_cancelled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('events')
          .insert(eventWithUser)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const cacheEntry = {
          ...eventWithUser,
          bring_list: JSON.stringify(eventWithUser.bring_list || []),
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('events_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('events', 'INSERT', eventWithUser);
        
        return eventWithUser as Event;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useUpdateEventRSVP = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      status, 
      bringingItems = [], 
      notes = '' 
    }: {
      eventId: string;
      status: 'going' | 'maybe' | 'not_going';
      bringingItems?: string[];
      notes?: string;
    }): Promise<EventRSVP> => {
      const rsvpData = {
        event_id: eventId,
        user_id: user!.id,
        status,
        bringing_items: bringingItems,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('event_rsvps')
          .upsert(rsvpData)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const cacheEntry = {
          ...rsvpData,
          id: crypto.randomUUID(),
          bringing_items: JSON.stringify(bringingItems),
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('event_rsvps_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('event_rsvps', 'INSERT', rsvpData);
        
        return cacheEntry as EventRSVP;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-rsvps', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useMyRSVPs = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['my-rsvps', user?.id],
    queryFn: async (): Promise<EventRSVP[]> => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('event_rsvps')
          .select(`
            *,
            events(*)
          `)
          .eq('user_id', user!.id);

        if (error) throw error;
        return data || [];
      } else {
        const cachedData = await cacheOperations.getCache('event_rsvps_cache', 'user_id = ?', [user!.id]);
        return cachedData;
      }
    },
    enabled: !!user,
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string): Promise<void> => {
      if (await syncManager.isOnline()) {
        const { error } = await supabase
          .from('events')
          .update({ is_cancelled: true })
          .eq('id', eventId);

        if (error) throw error;
      } else {
        await cacheOperations.addToMutationQueue('events', 'UPDATE', { 
          id: eventId, 
          is_cancelled: true 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

// Simplified event comments using the shared comments table
type Comment = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];

export const useEventComments = (eventId: string) => {
  return useQuery({
    queryKey: ['event-comments', eventId],
    queryFn: async (): Promise<Comment[]> => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('parent_type', 'event')
          .eq('parent_id', eventId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
      } else {
        // No local cache table yet; return empty offline fallback
        return [];
      }
    },
    enabled: !!eventId,
  });
};

export const useCreateEventComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ eventId, text }: { eventId: string; text: string }): Promise<Comment> => {
      const payload: CommentInsert = {
        parent_type: 'event',
        parent_id: eventId,
        user_id: user!.id,
        text,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as any;

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('comments')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data as Comment;
      } else {
        await cacheOperations.addToMutationQueue('comments', 'INSERT', payload);
        return payload as Comment;
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['event-comments', vars.eventId] });
    },
  });
};