import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations, syncManager } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { Database } from '../lib/database.types';

type Post = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
type PostUpdate = Database['public']['Tables']['posts']['Update'];

export const usePosts = (filters: {
  limit?: number;
  pinnedOnly?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: async (): Promise<(Post & { author: { full_name: string; avatar_url?: string } })[]> => {
      if (await syncManager.isOnline()) {
        let query = supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey(full_name, avatar_url)
          `)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        if (filters.pinnedOnly) {
          query = query.eq('is_pinned', true);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        // Cache the results
        if (data) {
          const processedData = data.map(item => ({
            ...item,
            photos: Array.isArray(item.photos) ? JSON.stringify(item.photos) : item.photos,
            sync_status: 'synced'
          }));
          await cacheOperations.upsertCache('posts_cache', processedData);
        }
        
        return data?.map(post => ({
          ...post,
          author: post.profiles,
        })) || [];
      } else {
        // Fallback to cached data
        const cachedData = await cacheOperations.getCache('posts_cache', 
          filters.pinnedOnly ? 'is_pinned = ?' : undefined,
          filters.pinnedOnly ? [true] : undefined
        );
        
        return cachedData.map(item => ({
          ...item,
          photos: typeof item.photos === 'string' ? JSON.parse(item.photos || '[]') : item.photos,
          author: { full_name: 'Cached User', avatar_url: null }, // Simplified for offline
        }));
      }
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (post: PostInsert): Promise<Post> => {
      const postWithUser = {
        ...post,
        user_id: user!.id,
        id: post.id || crypto.randomUUID(),
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('posts')
          .insert(postWithUser)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...postWithUser,
          photos: JSON.stringify(postWithUser.photos || []),
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('posts_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('posts', 'INSERT', postWithUser);
        
        return postWithUser as Post;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PostUpdate }): Promise<Post> => {
      const updatedPost = {
        ...updates,
        id,
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('posts')
          .update(updatedPost)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...updatedPost,
          photos: JSON.stringify(updatedPost.photos || []),
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('posts_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('posts', 'UPDATE', updatedPost);
        
        return updatedPost as Post;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useTogglePin = () => {
  const updateMutation = useUpdatePost();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async ({ postId, isPinned }: { postId: string; isPinned: boolean }) => {
      // Only admins can pin/unpin posts
      if (profile?.role !== 'admin') {
        throw new Error('Only admins can pin posts');
      }

      return updateMutation.mutateAsync({
        id: postId,
        updates: { is_pinned: isPinned },
      });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      if (await syncManager.isOnline()) {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId)
          .eq('user_id', user!.id); // Only allow users to delete their own posts

        if (error) throw error;
      } else {
        // Remove from cache and add to mutation queue
        await cacheOperations.addToMutationQueue('posts', 'DELETE', { id: postId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Hook for post reactions/likes (simplified - would normally be separate table)
export const usePostReactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reaction }: { postId: string; reaction: 'like' | 'love' | 'helpful' }) => {
      // This would normally interact with a separate reactions table
      // For now, we'll simulate reactions as part of the post data
      
      if (await syncManager.isOnline()) {
        // In a real implementation, this would be a separate reactions table
        console.log('Reaction added:', { postId, reaction });
        return { success: true };
      } else {
        await cacheOperations.addToMutationQueue('post_reactions', 'INSERT', { 
          post_id: postId, 
          reaction 
        });
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Hook for post comments (simplified - would normally be separate table)
export const usePostComments = (postId: string) => {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      // This would normally be a separate comments table
      // For now, returning mock data structure
      return [
        {
          id: '1',
          post_id: postId,
          content: 'Great post! Thanks for sharing.',
          author: { full_name: 'Jane Smith', avatar_url: null },
          created_at: new Date().toISOString(),
        }
      ];
    },
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      // This would normally insert into a comments table
      console.log('Comment created:', { postId, content });
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] });
    },
  });
};