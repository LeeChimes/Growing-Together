import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations } from '../lib/database';
import { syncManager } from '../lib/sync';
import { useAuthStore } from '../store/authStore';

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  steps: string[];
  photos: string[];
  created_at: string;
  updated_at: string;
};

export type RecipeInsert = Omit<Recipe, 'id' | 'created_at' | 'updated_at'> & { id?: string };

export const useRecipes = () => {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async (): Promise<Recipe[]> => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('recipes' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const processed = (data as any[]).map((r: any) => ({
            ...r,
            ingredients: Array.isArray(r.ingredients) ? JSON.stringify(r.ingredients) : r.ingredients,
            steps: Array.isArray(r.steps) ? JSON.stringify(r.steps) : r.steps,
            photos: Array.isArray(r.photos) ? JSON.stringify(r.photos) : r.photos,
            sync_status: 'synced',
          }));
          await cacheOperations.upsertCache('recipes_cache', processed);
        }

        return (data as any[]) || [];
      }

      const cached = await cacheOperations.getCache('recipes_cache');
      return cached.map((r: any) => ({
        ...r,
        ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients || '[]') : r.ingredients,
        steps: typeof r.steps === 'string' ? JSON.parse(r.steps || '[]') : r.steps,
        photos: typeof r.photos === 'string' ? JSON.parse(r.photos || '[]') : r.photos,
      }));
    },
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (recipe: Omit<RecipeInsert, 'user_id'>): Promise<Recipe> => {
      const payload: Recipe = {
        id: recipe.id || crypto.randomUUID(),
        user_id: user!.id,
        title: recipe.title,
        description: recipe.description || null,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        photos: recipe.photos || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('recipes' as any)
          .insert(payload as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const cacheEntry = {
          ...payload,
          ingredients: JSON.stringify(payload.ingredients || []),
          steps: JSON.stringify(payload.steps || []),
          photos: JSON.stringify(payload.photos || []),
          sync_status: 'pending',
        } as any;
        await cacheOperations.upsertCache('recipes_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('recipes', 'INSERT', payload);
        return payload;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
};


