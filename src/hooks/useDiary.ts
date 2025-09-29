import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations, syncManager } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { Database } from '../lib/database.types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];
type DiaryEntryInsert = Database['public']['Tables']['diary_entries']['Insert'];
type DiaryEntryUpdate = Database['public']['Tables']['diary_entries']['Update'];

export const useDiaryEntries = (filters: {
  templateType?: string;
  startDate?: string;
  endDate?: string;
  plantId?: string;
  tag?: string;
} = {}) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['diary-entries', user?.id, filters],
    queryFn: async (): Promise<DiaryEntry[]> => {
      // Try to get online data first
      if (await syncManager.isOnline()) {
        let query = supabase
          .from('diary_entries')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });

        if (filters.templateType) {
          query = query.eq('template_type', filters.templateType);
        }
        
        if (filters.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        
        if (filters.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        // Client-side filter for plant/tag until backend fields exist
        if (data) {
          if (filters.plantId) {
            data = (data as any[]).filter((e: any) => e.plant_id === filters.plantId);
          }
          if (filters.tag) {
            data = (data as any[]).filter((e: any) => Array.isArray(e.tags) ? e.tags.includes(filters.tag) : false);
          }

          const processedData = (data as any[]).map((item: any) => ({
            ...item,
            photos: Array.isArray(item.photos) ? JSON.stringify(item.photos) : item.photos,
            tags: Array.isArray(item.tags) ? JSON.stringify(item.tags) : item.tags,
            sync_status: 'synced'
          }));
          await cacheOperations.upsertCache('diary_entries_cache', processedData);
        }
        
        return data || [];
      } else {
        // Fallback to cached data
        let whereClause = `user_id = ?`;
        const params = [user!.id];
        
        if (filters.templateType) {
          whereClause += ` AND template_type = ?`;
          params.push(filters.templateType);
        }
        
        const cachedData = await cacheOperations.getCache('diary_entries_cache', whereClause, params);
        
        let mapped = cachedData.map(item => ({
          ...item,
          photos: typeof item.photos === 'string' ? JSON.parse(item.photos || '[]') : item.photos,
          tags: typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : item.tags,
        }));

        if (filters.plantId) {
          mapped = mapped.filter((e: any) => e.plant_id === filters.plantId);
        }
        if (filters.tag) {
          mapped = mapped.filter((e: any) => Array.isArray(e.tags) ? e.tags.includes(filters.tag) : false);
        }
        return mapped as any;
      }
    },
    enabled: !!user,
  });
};

export const useCreateDiaryEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (entry: Omit<DiaryEntryInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>): Promise<DiaryEntry> => {
      const entryWithUser = {
        ...entry,
        user_id: user!.id,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('diary_entries')
          .insert(entryWithUser as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...entryWithUser,
          photos: JSON.stringify(entryWithUser.photos || []),
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('diary_entries_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('diary_entries', 'INSERT', entryWithUser);
        
        return entryWithUser as DiaryEntry;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary-entries'] });
    },
  });
};

export const useUpdateDiaryEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DiaryEntryUpdate }): Promise<DiaryEntry> => {
      const updatedEntry = {
        ...updates,
        id,
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('diary_entries')
          .update(updatedEntry as any)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...updatedEntry,
          photos: JSON.stringify(updatedEntry.photos || []),
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('diary_entries_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('diary_entries', 'UPDATE', updatedEntry);
        
        return updatedEntry as DiaryEntry;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary-entries'] });
    },
  });
};

export const useDeleteDiaryEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (await syncManager.isOnline()) {
        const { error } = await supabase
          .from('diary_entries')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } else {
        // Remove from cache and add to mutation queue
        await cacheOperations.addToMutationQueue('diary_entries', 'DELETE', { id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary-entries'] });
    },
  });
};