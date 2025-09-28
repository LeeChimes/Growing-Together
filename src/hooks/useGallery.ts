import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations, syncManager } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { Database } from '../lib/database.types';

type Album = Database['public']['Tables']['albums']['Row'];
type AlbumInsert = Database['public']['Tables']['albums']['Insert'];
type AlbumUpdate = Database['public']['Tables']['albums']['Update'];
type Photo = Database['public']['Tables']['photos']['Row'];
type PhotoInsert = Database['public']['Tables']['photos']['Insert'];

export const useAlbums = (filters: {
  includePrivate?: boolean;
} = {}) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['albums', user?.id, filters],
    queryFn: async (): Promise<(Album & { photo_count: number; cover_photo_url?: string })[]> => {
      if (await syncManager.isOnline()) {
        let query = supabase
          .from('albums')
          .select(`
            *,
            photos(count)
          `)
          .order('created_at', { ascending: false });

        if (!filters.includePrivate) {
          query = query.or(`is_private.eq.false,created_by.eq.${user?.id}`);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        // Cache the results
        if (data) {
          const processedData = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            cover_photo: item.cover_photo,
            created_by: item.created_by,
            is_private: item.is_private,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_status: 'synced'
          }));
          await cacheOperations.upsertCache('albums_cache', processedData);
        }
        
        return data?.map(album => ({
          ...album,
          photo_count: album.photos?.[0]?.count || 0,
          cover_photo_url: album.cover_photo,
        })) || [];
      } else {
        // Fallback to cached data
        const cachedData = await cacheOperations.getCache('albums_cache');
        return cachedData.map(item => ({
          ...item,
          photo_count: 0, // Simplified for offline
          cover_photo_url: item.cover_photo,
        }));
      }
    },
  });
};

export const usePhotos = (albumId?: string) => {
  return useQuery({
    queryKey: ['photos', albumId],
    queryFn: async (): Promise<(Photo & { uploader: { full_name: string; avatar_url?: string } })[]> => {
      if (await syncManager.isOnline()) {
        let query = supabase
          .from('photos')
          .select(`
            *,
            profiles!photos_uploaded_by_fkey(full_name, avatar_url)
          `)
          .order('created_at', { ascending: false });

        if (albumId) {
          query = query.eq('album_id', albumId);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        // Cache the results
        if (data) {
          const processedData = data.map(item => ({
            ...item,
            sync_status: 'synced'
          }));
          await cacheOperations.upsertCache('photos_cache', processedData);
        }
        
        return data?.map(photo => ({
          ...photo,
          uploader: photo.profiles,
        })) || [];
      } else {
        // Fallback to cached data
        const whereClause = albumId ? 'album_id = ?' : undefined;
        const params = albumId ? [albumId] : undefined;
        const cachedData = await cacheOperations.getCache('photos_cache', whereClause, params);
        
        return cachedData.map(item => ({
          ...item,
          uploader: { full_name: 'Cached User', avatar_url: null },
        }));
      }
    },
    enabled: true,
  });
};

export const useCreateAlbum = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (album: AlbumInsert): Promise<Album> => {
      const albumWithUser = {
        ...album,
        created_by: user!.id,
        id: album.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('albums')
          .insert(albumWithUser)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...albumWithUser,
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('albums_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('albums', 'INSERT', albumWithUser);
        
        return albumWithUser as Album;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
};

export const useUploadPhotos = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ photos, albumId, captions }: {
      photos: string[];
      albumId?: string;
      captions?: string[];
    }): Promise<Photo[]> => {
      const uploadedPhotos: Photo[] = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const caption = captions?.[i] || '';

        let photoUrl = photo;

        if (await syncManager.isOnline()) {
          try {
            // Upload to Supabase Storage
            const fileName = `${user!.id}/${Date.now()}-${i}.jpg`;
            const response = await fetch(photo);
            const blob = await response.blob();
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('photos')
              .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: false
              });

            if (uploadError) {
              console.warn('Storage upload failed, using local URI:', uploadError);
              // Fall back to local URI if storage upload fails
            } else {
              // Get public URL
              const { data: urlData } = supabase.storage
                .from('photos')
                .getPublicUrl(uploadData.path);
              
              photoUrl = urlData.publicUrl;
            }
          } catch (error) {
            console.warn('Storage upload error, using local URI:', error);
          }
        }

        const photoData = {
          id: crypto.randomUUID(),
          url: photoUrl,
          album_id: albumId || null,
          caption: caption || null,
          uploaded_by: user!.id,
          created_at: new Date().toISOString(),
        };

        if (await syncManager.isOnline()) {
          const { data, error } = await supabase
            .from('photos')
            .insert(photoData)
            .select()
            .single();

          if (error) throw error;
          uploadedPhotos.push(data);
        } else {
          // Store in cache and mutation queue
          const cacheEntry = {
            ...photoData,
            sync_status: 'pending',
          };
          
          await cacheOperations.upsertCache('photos_cache', [cacheEntry]);
          await cacheOperations.addToMutationQueue('photos', 'INSERT', photoData);
          
          uploadedPhotos.push(photoData as Photo);
        }
      }

      return uploadedPhotos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
};

export const useUpdateAlbum = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AlbumUpdate }): Promise<Album> => {
      const updatedAlbum = {
        ...updates,
        id,
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('albums')
          .update(updatedAlbum)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...updatedAlbum,
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('albums_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('albums', 'UPDATE', updatedAlbum);
        
        return updatedAlbum as Album;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (photoId: string): Promise<void> => {
      if (await syncManager.isOnline()) {
        const { error } = await supabase
          .from('photos')
          .delete()
          .eq('id', photoId)
          .eq('uploaded_by', user!.id); // Only allow users to delete their own photos

        if (error) throw error;
      } else {
        // Remove from cache and add to mutation queue
        await cacheOperations.addToMutationQueue('photos', 'DELETE', { id: photoId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
};

export const useDeleteAlbum = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (albumId: string): Promise<void> => {
      if (await syncManager.isOnline()) {
        // First delete all photos in the album
        await supabase
          .from('photos')
          .delete()
          .eq('album_id', albumId);

        // Then delete the album
        const { error } = await supabase
          .from('albums')
          .delete()
          .eq('id', albumId)
          .eq('created_by', user!.id); // Only allow creators to delete albums

        if (error) throw error;
      } else {
        // Add to mutation queue
        await cacheOperations.addToMutationQueue('albums', 'DELETE', { id: albumId });
        await cacheOperations.addToMutationQueue('photos', 'DELETE', { album_id: albumId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
};

export const useGalleryStats = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['gallery-stats', user?.id],
    queryFn: async () => {
      const { data: albums } = await useAlbums().queryFn();
      const { data: photos } = await usePhotos().queryFn();

      const myAlbums = albums.filter(album => album.created_by === user?.id);
      const myPhotos = photos.filter(photo => photo.uploaded_by === user?.id);
      const totalPhotos = photos.length;
      const publicAlbums = albums.filter(album => !album.is_private);

      return {
        myAlbums: myAlbums.length,
        myPhotos: myPhotos.length,
        totalPhotos,
        publicAlbums: publicAlbums.length,
      };
    },
  });
};