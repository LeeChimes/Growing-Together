import * as Network from 'expo-network';
import { supabase } from './supabase';
import { cacheOperations } from './database';

export interface SyncManager {
  syncAll: () => Promise<void>;
  syncTable: (tableName: string) => Promise<void>;
  processMutationQueue: () => Promise<void>;
  isOnline: () => Promise<boolean>;
}

class SyncManagerImpl implements SyncManager {
  private isCurrentlySync = false;

  async isOnline(): Promise<boolean> {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected && networkState.isInternetReachable !== false;
  }

  async syncAll(): Promise<void> {
    if (this.isCurrentlySync) return;
    
    const online = await this.isOnline();
    if (!online) return;

    this.isCurrentlySync = true;
    
    try {
      // First process pending mutations
      await this.processMutationQueue();
      
      // Then sync all tables
      const tables = [
        'profiles',
        'diary_entries', 
        'events',
        'event_rsvps',
        'posts',
        'tasks',
        'albums',
        'photos'
      ];

      for (const table of tables) {
        await this.syncTable(table);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isCurrentlySync = false;
    }
  }

  async syncTable(tableName: string): Promise<void> {
    try {
      // Get data from Supabase
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (data && data.length > 0) {
        // Convert arrays to JSON strings for SQLite storage
        const processedData = data.map(item => ({
          ...item,
          photos: Array.isArray(item.photos) ? JSON.stringify(item.photos) : item.photos,
          bring_list: Array.isArray(item.bring_list) ? JSON.stringify(item.bring_list) : item.bring_list,
          bringing_items: Array.isArray(item.bringing_items) ? JSON.stringify(item.bringing_items) : item.bringing_items,
          proof_photos: Array.isArray(item.proof_photos) ? JSON.stringify(item.proof_photos) : item.proof_photos,
          sync_status: 'synced'
        }));

        // Update cache
        await cacheOperations.upsertCache(`${tableName}_cache`, processedData);
      }

    } catch (error) {
      console.error(`Failed to sync ${tableName}:`, error);
    }
  }

  async processMutationQueue(): Promise<void> {
    try {
      const mutations = await cacheOperations.getPendingMutations();
      
      for (const mutation of mutations) {
        try {
          const data = JSON.parse(mutation.data);
          
          switch (mutation.operation) {
            case 'INSERT':
              await this.handleInsert(mutation.table_name, data);
              break;
            case 'UPDATE':
              await this.handleUpdate(mutation.table_name, data);
              break;
            case 'DELETE':
              await this.handleDelete(mutation.table_name, data);
              break;
          }

          // Remove successful mutation
          await cacheOperations.removeMutation(mutation.id);
          
        } catch (error) {
          console.error(`Failed to process mutation ${mutation.id}:`, error);
          // Could implement retry logic here
        }
      }
    } catch (error) {
      console.error('Failed to process mutation queue:', error);
    }
  }

  private async handleInsert(tableName: string, data: any) {
    const { error } = await supabase
      .from(tableName)
      .insert(data);
    
    if (error) throw error;
  }

  private async handleUpdate(tableName: string, data: any) {
    const { id, ...updateData } = data;
    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  }

  private async handleDelete(tableName: string, data: any) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', data.id);
    
    if (error) throw error;
  }
}

export const syncManager = new SyncManagerImpl();

// Auto-sync when coming online
let syncInterval: NodeJS.Timeout;

export const startAutoSync = () => {
  // Sync every 5 minutes when online
  syncInterval = setInterval(async () => {
    const online = await syncManager.isOnline();
    if (online) {
      await syncManager.syncAll();
    }
  }, 5 * 60 * 1000);
};

export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
};