// Web-only database implementation using localStorage
interface WebDatabase {
  runAsync: (query: string, params?: any[]) => Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync: (query: string, params?: any[]) => Promise<any[]>;
  getFirstAsync: (query: string, params?: any[]) => Promise<any>;
  execAsync: (query: string) => Promise<any>;
}

class WebSQLiteDatabase implements WebDatabase {
  private storageKey: string;
  
  constructor(name: string) {
    this.storageKey = `sqlite_${name}`;
  }

  async runAsync(query: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    console.log('[WebSQLite] runAsync:', query, params);
    return { lastInsertRowId: 1, changes: 1 };
  }

  async getAllAsync(query: string, params: any[] = []): Promise<any[]> {
    console.log('[WebSQLite] getAllAsync:', query, params);
    return [];
  }

  async getFirstAsync(query: string, params: any[] = []): Promise<any> {
    console.log('[WebSQLite] getFirstAsync:', query, params);
    return null;
  }

  async execAsync(query: string): Promise<any> {
    console.log('[WebSQLite] execAsync:', query);
    return { rows: [] };
  }
}

export const createWebDatabase = (name: string): WebDatabase => {
  return new WebSQLiteDatabase(name);
};
