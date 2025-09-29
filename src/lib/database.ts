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
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS diary_entries_cache (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        template_type TEXT NOT NULL,
        plant_id TEXT,
        tags TEXT,
        weather TEXT,
        temperature REAL,
        photos TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Events cache
    await db.execAsync(`
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
    await db.execAsync(`
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
    await db.execAsync(`
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
    await db.execAsync(`
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
    await db.execAsync(`
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
    await db.execAsync(`
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
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS mutation_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        next_attempt_at TEXT,
        max_retries INTEGER DEFAULT 5
      );
    `);

    // Sync status tracking
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_status (
        table_name TEXT PRIMARY KEY,
        last_sync TEXT NOT NULL,
        is_syncing BOOLEAN DEFAULT false
      );
    `);

  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Generic cache operations
export const cacheOperations = {
  // Insert or update cache
  upsertCache: async (tableName: string, data: any[]): Promise<void> => {
    if (data.length === 0) {
      return;
    }

    for (const item of data) {
      const keys = Object.keys(item);
      const values = Object.values(item);
      const placeholders = keys.map(() => '?').join(', ');
      
      const query = `INSERT OR REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
      await db.runAsync(query, values);
    }
  },

  // Get cached data
  getCache: async (tableName: string, where?: string, params?: any[]): Promise<any[]> => {
    const query = `SELECT * FROM ${tableName}${where ? ` WHERE ${where}` : ''}`;
    const result = await db.getAllAsync(query, params || []);
    return result;
  },

  // Clear cache
  clearCache: async (tableName: string): Promise<void> => {
    await db.runAsync(`DELETE FROM ${tableName}`);
  },

  // Add to mutation queue
  addToMutationQueue: async (tableName: string, operation: string, data: any): Promise<void> => {
    await db.runAsync(
      `INSERT INTO mutation_queue (table_name, operation, data, created_at) VALUES (?, ?, ?, ?)`,
      [tableName, operation, JSON.stringify(data), new Date().toISOString()]
    );
  },

  // Get pending mutations
  getPendingMutations: async (): Promise<any[]> => {
    const nowIso = new Date().toISOString();
    const result = await db.getAllAsync(
      `SELECT * FROM mutation_queue 
       WHERE next_attempt_at IS NULL OR next_attempt_at <= ?
       ORDER BY created_at ASC`,
      [nowIso]
    );
    return result;
  },

  // Remove processed mutation
  removeMutation: async (id: number): Promise<void> => {
    await db.runAsync(`DELETE FROM mutation_queue WHERE id = ?`, [id]);
  },

  // Record mutation attempt failure with backoff scheduling
  bumpMutationRetryWithBackoff: async (
    id: number,
    currentRetryCount: number,
    lastError: string,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 60_000
  ): Promise<void> => {
    const nextRetryCount = currentRetryCount + 1;
    const backoffDelay = Math.min(Math.pow(2, currentRetryCount) * baseDelayMs, maxDelayMs);
    const nextAttemptAt = new Date(Date.now() + backoffDelay).toISOString();
    await db.runAsync(
      `UPDATE mutation_queue 
       SET retry_count = ?, last_error = ?, next_attempt_at = ?
       WHERE id = ?`,
      [nextRetryCount, lastError, nextAttemptAt, id]
    );
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