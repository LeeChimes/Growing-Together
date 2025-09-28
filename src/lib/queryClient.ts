import { QueryClient } from '@tanstack/react-query';
import { syncManager } from './sync';

// Create query client with offline-first configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cached data for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Don't refetch on window focus (mobile app)
      refetchOnWindowFocus: false,
      // Use cached data while revalidating
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry failed mutations 3 times
      retry: 3,
      // Add failed mutations to queue for offline handling
      onError: (error, variables, context: any) => {
        console.error('Mutation failed, adding to queue:', error);
        // The individual hooks will handle adding to mutation queue
      },
    },
  },
});

// Initialize sync when query client is created
syncManager.syncAll().catch(console.error);