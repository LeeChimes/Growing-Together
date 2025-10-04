import { Platform } from 'react-native';

// Conditional import for web compatibility
let SQLite: any;

if (Platform.OS === 'web') {
  // Web platform - use localStorage mock
  SQLite = {
    openDatabaseSync: (name: string) => ({
      execAsync: async (query: string) => {
        console.log('[SQLite Mock] execAsync:', query);
        return { rows: [] };
      },
      runAsync: async (query: string, params: any[] = []) => {
        console.log('[SQLite Mock] runAsync:', query, params);
        return { lastInsertRowId: 1, changes: 1 };
      },
      getAllAsync: async (query: string, params: any[] = []) => {
        console.log('[SQLite Mock] getAllAsync:', query, params);
        return [];
      },
      getFirstAsync: async (query: string, params: any[] = []) => {
        console.log('[SQLite Mock] getFirstAsync:', query, params);
        return null;
      },
    })
  };
} else {
  // Native platform - use actual SQLite
  SQLite = require('expo-sqlite');
}

// Database instance
let db: any = null;
let isInitialized = false;

// Initialize database
export const initializeDatabase = async () => {
  if (isInitialized) return;
  
  try {
    db = SQLite.openDatabaseSync('growing_together.db');
    
    // Create essential tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks_cache (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        due_date TEXT,
        priority TEXT DEFAULT 'medium',
        category TEXT,
        estimated_duration INTEGER,
        location TEXT,
        status TEXT DEFAULT 'available',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        proof_photos TEXT,
        completion_notes TEXT,
        completed_at TEXT
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS task_assignments_cache (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        assigned_at TEXT NOT NULL,
        status TEXT DEFAULT 'assigned',
        started_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks_cache (id),
        FOREIGN KEY (user_id) REFERENCES profiles_cache (id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profiles_cache (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT DEFAULT 'member',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS mutation_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        last_retry_at TEXT
      );
    `);

    isInitialized = true;
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Ensure database is ready
export const ensureDbReady = async () => {
  if (!isInitialized) {
    await initializeDatabase();
  }
  return isInitialized;
};

// Generic cache operations
export const cacheOperations = {
  async upsertCache(table: string, data: any) {
    if (!db) {
      console.warn('Database not initialized, skipping cache operation');
      return;
    }
    
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      const updateClause = keys.map(key => `${key} = ?`).join(', ');
      
      await db.runAsync(
        `INSERT OR REPLACE INTO ${table}_cache (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
    } catch (error) {
      console.error(`Error upserting to ${table}_cache:`, error);
    }
  },

  async getCache(table: string, conditions: Record<string, any> = {}) {
    if (!db) {
      console.warn('Database not initialized, returning empty array');
      return [];
    }
    
    try {
      let query = `SELECT * FROM ${table}_cache`;
      const values: any[] = [];
      
      if (Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
        query += ` WHERE ${whereClause}`;
        values.push(...Object.values(conditions));
      }
      
      return await db.getAllAsync(query, values);
    } catch (error) {
      console.error(`Error getting from ${table}_cache:`, error);
      return [];
    }
  },

  async clearCache(table: string) {
    if (!db) {
      console.warn('Database not initialized, skipping cache clear');
      return;
    }
    
    try {
      await db.runAsync(`DELETE FROM ${table}_cache`);
    } catch (error) {
      console.error(`Error clearing ${table}_cache:`, error);
    }
  },

  async addToMutationQueue(table: string, operation: string, data: any) {
    if (!db) {
      console.warn('Database not initialized, skipping mutation queue');
      return;
    }
    
    try {
      const id = `${table}_${operation}_${Date.now()}_${Math.random()}`;
      await db.runAsync(
        'INSERT INTO mutation_queue (id, table_name, operation, data, created_at) VALUES (?, ?, ?, ?, ?)',
        [id, table, operation, JSON.stringify(data), new Date().toISOString()]
      );
    } catch (error) {
      console.error('Error adding to mutation queue:', error);
    }
  },

  async getPendingMutations() {
    if (!db) {
      console.warn('Database not initialized, returning empty mutations');
      return [];
    }
    
    try {
      return await db.getAllAsync('SELECT * FROM mutation_queue ORDER BY created_at ASC');
    } catch (error) {
      console.error('Error getting pending mutations:', error);
      return [];
    }
  },

  async removeMutation(id: string) {
    if (!db) {
      console.warn('Database not initialized, skipping mutation removal');
      return;
    }
    
    try {
      await db.runAsync('DELETE FROM mutation_queue WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error removing mutation:', error);
    }
  },

  async bumpMutationRetryWithBackoff(id: string) {
    if (!db) {
      console.warn('Database not initialized, skipping retry bump');
      return;
    }
    
    try {
      await db.runAsync(
        'UPDATE mutation_queue SET retry_count = retry_count + 1, last_retry_at = ? WHERE id = ?',
        [new Date().toISOString(), id]
      );
    } catch (error) {
      console.error('Error bumping mutation retry:', error);
    }
  }
};

// Sync manager
export const syncManager = {
  async syncTable(table: string) {
    if (!db) {
      console.warn('Database not initialized, skipping sync');
      return;
    }
    
    try {
      // This is a simplified sync - in a real app you'd sync with Supabase
      console.log(`Syncing ${table} table...`);
    } catch (error) {
      console.error(`Error syncing ${table}:`, error);
    }
  },

  async syncAll() {
    if (!db) {
      console.warn('Database not initialized, skipping sync all');
      return;
    }
    
    try {
      const tables = ['tasks', 'task_assignments', 'profiles'];
      for (const table of tables) {
        await this.syncTable(table);
      }
    } catch (error) {
      console.error('Error syncing all tables:', error);
    }
  },

  async processMutationQueue() {
    if (!db) {
      console.warn('Database not initialized, skipping mutation processing');
      return;
    }
    
    try {
      const mutations = await cacheOperations.getPendingMutations();
      console.log(`Processing ${mutations.length} pending mutations...`);
      
      for (const mutation of mutations) {
        try {
          // Process mutation (simplified)
          console.log(`Processing mutation: ${mutation.operation} on ${mutation.table_name}`);
          await cacheOperations.removeMutation(mutation.id);
        } catch (error) {
          console.error('Error processing mutation:', error);
          await cacheOperations.bumpMutationRetryWithBackoff(mutation.id);
        }
      }
    } catch (error) {
      console.error('Error processing mutation queue:', error);
    }
  }
};

// Initialize database on module load
initializeDatabase().catch(console.error);

// Debug logging for exports
console.log('🔧 database.ts - syncManager exported:', !!syncManager);
console.log('🔧 database.ts - cacheOperations exported:', !!cacheOperations);
console.log('🔧 database.ts - ensureDbReady exported:', !!ensureDbReady);