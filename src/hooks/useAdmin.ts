import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations, syncManager } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type JoinCode = Database['public']['Tables']['join_codes']['Row'];
type JoinCodeInsert = Database['public']['Tables']['join_codes']['Insert'];

export const useMembers = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['admin-members'],
    queryFn: async (): Promise<Profile[]> => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        const cachedData = await cacheOperations.getCache('profiles_cache');
        return cachedData;
      }
    },
    enabled: user?.role === 'admin',
  });
};

export const useJoinCodes = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['admin-join-codes'],
    queryFn: async (): Promise<JoinCode[]> => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('join_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        // Fallback to cached data
        const cachedData = await cacheOperations.getCache('join_codes_cache');
        return cachedData;
      }
    },
    enabled: user?.role === 'admin',
  });
};

export const useCreateJoinCode = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (joinCodeData: {
      role: 'admin' | 'member' | 'guest';
      expires_at?: string | null;
      max_uses?: number | null;
    }): Promise<JoinCode> => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const newJoinCode: JoinCodeInsert = {
        code,
        role: joinCodeData.role,
        created_by: user!.id,
        expires_at: joinCodeData.expires_at,
        max_uses: joinCodeData.max_uses,
        is_active: true,
        current_uses: 0,
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('join_codes')
          .insert(newJoinCode)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...newJoinCode,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('join_codes_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('join_codes', 'INSERT', newJoinCode);
        
        return cacheEntry as JoinCode;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-join-codes'] });
    },
  });
};

export const useToggleJoinCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (await syncManager.isOnline()) {
        const { error } = await supabase
          .from('join_codes')
          .update({ is_active: isActive })
          .eq('id', id);

        if (error) throw error;
      } else {
        await cacheOperations.addToMutationQueue('join_codes', 'UPDATE', {
          id,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-join-codes'] });
    },
  });
};

export const useApproveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      if (await syncManager.isOnline()) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_approved: approved })
          .eq('id', userId);

        if (error) throw error;
      } else {
        await cacheOperations.addToMutationQueue('profiles', 'UPDATE', {
          id: userId,
          is_approved: approved,
          updated_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'member' | 'guest' }) => {
      if (await syncManager.isOnline()) {
        const { error } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', userId);

        if (error) throw error;
      } else {
        await cacheOperations.addToMutationQueue('profiles', 'UPDATE', {
          id: userId,
          role,
          updated_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
  });
};

export const useExportData = () => {
  return useMutation({
    mutationFn: async (dataType: 'all' | 'members' | 'posts' | 'events' | 'tasks' | 'diary') => {
      if (!(await syncManager.isOnline())) {
        throw new Error('Data export requires internet connection');
      }

      const exportData: any = {};

      switch (dataType) {
        case 'all':
          // Export all data
          const [members, posts, events, tasks, diary] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('posts').select('*, profiles(full_name, email)'),
            supabase.from('events').select('*, profiles(full_name, email)'),
            supabase.from('tasks').select('*, profiles(full_name, email)'),
            supabase.from('diary_entries').select('*, profiles(full_name, email)'),
          ]);

          exportData.members = members.data;
          exportData.posts = posts.data;
          exportData.events = events.data;
          exportData.tasks = tasks.data;
          exportData.diary_entries = diary.data;
          break;

        case 'members':
          const { data: membersData } = await supabase.from('profiles').select('*');
          exportData.members = membersData;
          break;

        case 'posts':
          const { data: postsData } = await supabase
            .from('posts')
            .select('*, profiles(full_name, email)');
          exportData.posts = postsData;
          break;

        case 'events':
          const { data: eventsData } = await supabase
            .from('events')
            .select('*, profiles(full_name, email)');
          exportData.events = eventsData;
          break;

        case 'tasks':
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*, profiles(full_name, email)');
          exportData.tasks = tasksData;
          break;

        case 'diary':
          const { data: diaryData } = await supabase
            .from('diary_entries')
            .select('*, profiles(full_name, email)');
          exportData.diary_entries = diaryData;
          break;
      }

      // Add metadata
      exportData.exported_at = new Date().toISOString();
      exportData.export_type = dataType;

      return exportData;
    },
  });
};

export const useHideContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentType, contentId, hidden }: {
      contentType: 'post' | 'event' | 'task';
      contentId: string;
      hidden: boolean;
    }) => {
      if (await syncManager.isOnline()) {
        let tableName = '';
        switch (contentType) {
          case 'post':
            tableName = 'posts';
            break;
          case 'event':
            tableName = 'events';
            break;
          case 'task':
            tableName = 'tasks';
            break;
        }

        // Add a hidden field or use a separate moderation table
        // For now, we'll use is_cancelled for events and a custom field for others
        const updateField = contentType === 'event' ? 'is_cancelled' : 'is_hidden';
        
        const { error } = await supabase
          .from(tableName)
          .update({ [updateField]: hidden })
          .eq('id', contentId);

        if (error) throw error;
      } else {
        await cacheOperations.addToMutationQueue(
          contentType === 'post' ? 'posts' : contentType === 'event' ? 'events' : 'tasks',
          'UPDATE',
          {
            id: contentId,
            [contentType === 'event' ? 'is_cancelled' : 'is_hidden']: hidden,
            updated_at: new Date().toISOString(),
          }
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      if (variables.contentType === 'post') {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      } else if (variables.contentType === 'event') {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      } else if (variables.contentType === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    },
  });
};

export const useAdminStats = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      if (!(await syncManager.isOnline())) {
        return {
          totalMembers: 0,
          pendingApprovals: 0,
          activeJoinCodes: 0,
          totalPosts: 0,
          totalEvents: 0,
          totalTasks: 0,
        };
      }

      const [members, joinCodes, posts, events, tasks] = await Promise.all([
        supabase.from('profiles').select('id, is_approved'),
        supabase.from('join_codes').select('id, is_active'),
        supabase.from('posts').select('id'),
        supabase.from('events').select('id'),
        supabase.from('tasks').select('id'),
      ]);

      return {
        totalMembers: members.data?.length || 0,
        pendingApprovals: members.data?.filter(m => !m.is_approved).length || 0,
        activeJoinCodes: joinCodes.data?.filter(j => j.is_active).length || 0,
        totalPosts: posts.data?.length || 0,
        totalEvents: events.data?.length || 0,
        totalTasks: tasks.data?.length || 0,
      };
    },
    enabled: user?.role === 'admin',
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};