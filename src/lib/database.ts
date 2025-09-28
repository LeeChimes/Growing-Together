import * as SQLite from 'expo-sqlite';
import { Database } from './database.types';

// Initialize SQLite database
export const db = SQLite.openDatabaseSync('growing_together.db');

// Database initialization
export const initializeDatabase = async (): Promise<void> => {
  try {
    // For the new SQLite API, we execute SQL directly
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);
    // Profiles cache
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profiles_cache (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL,
        plot_number TEXT,
        phone TEXT,
        emergency_contact TEXT,
        join_date TEXT NOT NULL,
        is_approved BOOLEAN NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

      // Diary entries cache
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS diary_entries_cache (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          template_type TEXT NOT NULL,
          weather TEXT,
          temperature REAL,
          photos TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        );
      `);

      // Events cache
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS events_cache (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT,
          location TEXT NOT NULL,
          max_attendees INTEGER,
          bring_list TEXT,
          created_by TEXT NOT NULL,
          is_cancelled BOOLEAN NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        );
      `);

      // Event RSVPs cache
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS event_rsvps_cache (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          status TEXT NOT NULL,
          bringing_items TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        );
      `);

      // Posts cache
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS posts_cache (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          photos TEXT,
          is_pinned BOOLEAN NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        );
      `);

      // Tasks cache
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS tasks_cache (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          assigned_to TEXT,
          due_date TEXT,
          is_completed BOOLEAN NOT NULL,
          proof_photos TEXT,
          completed_at TEXT,
          created_by TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        );
      `);

      // Albums cache
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS albums_cache (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          cover_photo TEXT,
          created_by TEXT NOT NULL,
          is_private BOOLEAN NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        );
      `);

      // Photos cache
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS photos_cache (
          id TEXT PRIMARY KEY,
          url TEXT NOT NULL,
          album_id TEXT,
          caption TEXT,
          uploaded_by TEXT NOT NULL,
          created_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        );
      `);

      // Mutation queue for offline operations
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS mutation_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT NOT NULL,
          operation TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at TEXT NOT NULL,
          retry_count INTEGER DEFAULT 0,
          last_error TEXT
        );
      `);

      // Sync status tracking
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS sync_status (
          table_name TEXT PRIMARY KEY,
          last_sync TEXT NOT NULL,
          is_syncing BOOLEAN DEFAULT false
        );
      `);

    }, reject, resolve);
  });
};

// Generic cache operations
export const cacheOperations = {
  // Insert or update cache
  upsertCache: (tableName: string, data: any[]) => {
    return new Promise<void>((resolve, reject) => {
      if (data.length === 0) {
        resolve();
        return;
      }

      db.transaction((tx) => {
        data.forEach((item) => {
          const keys = Object.keys(item);
          const values = Object.values(item);
          const placeholders = keys.map(() => '?').join(', ');
          const updateSet = keys.map(key => `${key} = ?`).join(', ');

          tx.executeSql(
            `INSERT OR REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
            values
          );
        });
      }, reject, resolve);
    });
  },

  // Get cached data
  getCache: (tableName: string, where?: string, params?: any[]) => {
    return new Promise<any[]>((resolve, reject) => {
      const query = `SELECT * FROM ${tableName}${where ? ` WHERE ${where}` : ''}`;
      
      db.transaction((tx) => {
        tx.executeSql(
          query,
          params || [],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Clear cache
  clearCache: (tableName: string) => {
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(`DELETE FROM ${tableName}`);
      }, reject, resolve);
    });
  },

  // Add to mutation queue
  addToMutationQueue: (tableName: string, operation: string, data: any) => {
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO mutation_queue (table_name, operation, data, created_at) VALUES (?, ?, ?, ?)`,
          [tableName, operation, JSON.stringify(data), new Date().toISOString()]
        );
      }, reject, resolve);
    });
  },

  // Get pending mutations
  getPendingMutations: () => {
    return new Promise<any[]>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM mutation_queue ORDER BY created_at ASC`,
          [],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  // Remove processed mutation
  removeMutation: (id: number) => {
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(`DELETE FROM mutation_queue WHERE id = ?`, [id]);
      }, reject, resolve);
    });
  },
};

// Sync manager for online/offline detection
export const syncManager = {
  isOnline: async (): Promise<boolean> => {
    try {
      // Simple network check - in a real app you might want more sophisticated detection
      return true; // For now, assume always online in development
    } catch {
      return false;
    }
  },
};