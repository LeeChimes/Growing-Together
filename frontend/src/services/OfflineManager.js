// Advanced Offline Management Service
class OfflineManager {
  constructor() {
    this.dbName = 'GrowingTogetherDB';
    this.dbVersion = 1;
    this.db = null;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.initializeDB();
    this.setupEventListeners();
  }

  async initializeDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for different data types
        const stores = [
          { name: 'diary_entries', keyPath: 'id' },
          { name: 'posts', keyPath: 'id' },
          { name: 'events', keyPath: 'id' },
          { name: 'tasks', keyPath: 'id' },
          { name: 'plants', keyPath: 'id' },
          { name: 'users', keyPath: 'id' },
          { name: 'sync_queue', keyPath: 'id' },
          { name: 'photos', keyPath: 'id' },
          { name: 'settings', keyPath: 'key' }
        ];

        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
            
            // Add indexes for better querying
            if (store.name === 'diary_entries') {
              objectStore.createIndex('user_id', 'user_id');
              objectStore.createIndex('plot_number', 'plot_number');
              objectStore.createIndex('date', 'date');
            } else if (store.name === 'posts') {
              objectStore.createIndex('created_at', 'created_at');
              objectStore.createIndex('user_id', 'user_id');
            } else if (store.name === 'events') {
              objectStore.createIndex('date', 'date');
            } else if (store.name === 'tasks') {
              objectStore.createIndex('task_type', 'task_type');
              objectStore.createIndex('completed', 'completed');
            }
          }
        });
      };
    });
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Periodic sync when online
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingData();
      }
    }, 30000); // Every 30 seconds
  }

  async saveData(storeName, data) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Add timestamp and offline flag
      const enrichedData = {
        ...data,
        offline_created: !this.isOnline,
        last_modified: new Date().toISOString()
      };
      
      const request = store.put(enrichedData);
      
      request.onsuccess = () => {
        // Add to sync queue if offline
        if (!this.isOnline) {
          this.addToSyncQueue('CREATE', storeName, enrichedData);
        }
        resolve(enrichedData);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getData(storeName, id = null) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = id ? store.get(id) : store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateData(storeName, data) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const enrichedData = {
        ...data,
        last_modified: new Date().toISOString()
      };
      
      const request = store.put(enrichedData);
      
      request.onsuccess = () => {
        if (!this.isOnline) {
          this.addToSyncQueue('UPDATE', storeName, enrichedData);
        }
        resolve(enrichedData);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async deleteData(storeName, id) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        if (!this.isOnline) {
          this.addToSyncQueue('DELETE', storeName, { id });
        }
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  addToSyncQueue(action, storeName, data) {
    const syncItem = {
      id: `${Date.now()}_${Math.random()}`,
      action,
      storeName,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
      maxRetries: 3
    };

    this.syncQueue.push(syncItem);
    this.saveData('sync_queue', syncItem);
  }

  async syncPendingData() {
    if (!this.isOnline) return;

    try {
      // Load sync queue from IndexedDB
      const queueItems = await this.getData('sync_queue');
      
      for (const item of queueItems || []) {
        try {
          await this.syncSingleItem(item);
          // Remove from queue after successful sync
          await this.deleteData('sync_queue', item.id);
        } catch (error) {
          console.error('Sync failed for item:', item, error);
          
          // Increment retry count
          item.retries = (item.retries || 0) + 1;
          
          if (item.retries >= item.maxRetries) {
            // Remove failed item after max retries
            await this.deleteData('sync_queue', item.id);
            console.error('Max retries reached for sync item:', item);
          } else {
            // Update retry count
            await this.updateData('sync_queue', item);
          }
        }
      }
    } catch (error) {
      console.error('Sync process failed:', error);
    }
  }

  async syncSingleItem(item) {
    const { action, storeName, data } = item;
    const endpoint = this.getEndpointForStore(storeName);
    
    if (!endpoint) {
      throw new Error(`No endpoint mapping for store: ${storeName}`);
    }

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const API = `${BACKEND_URL}/api`;

    switch (action) {
      case 'CREATE':
        const response = await fetch(`${API}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const createdData = await response.json();
        // Update local data with server response
        await this.updateData(storeName, createdData);
        break;

      case 'UPDATE':
        await fetch(`${API}${endpoint}/${data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        });
        break;

      case 'DELETE':
        await fetch(`${API}${endpoint}/${data.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        break;
    }
  }

  getEndpointForStore(storeName) {
    const mappings = {
      'diary_entries': '/diary',
      'posts': '/posts',
      'events': '/events',
      'tasks': '/tasks',
      'plants': '/plants'
    };
    return mappings[storeName];
  }

  async cachePhoto(photoUrl, metadata = {}) {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      
      // Convert to base64 for storage
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = () => {
          const photoData = {
            id: `photo_${Date.now()}_${Math.random()}`,
            url: photoUrl,
            base64: reader.result,
            metadata,
            cached_at: new Date().toISOString()
          };
          
          this.saveData('photos', photoData);
          resolve(photoData);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Photo caching failed:', error);
    }
  }

  async getCachedPhoto(photoUrl) {
    const photos = await this.getData('photos');
    return photos?.find(photo => photo.url === photoUrl);
  }

  async getStorageInfo() {
    if (!this.db) await this.initializeDB();
    
    const stores = ['diary_entries', 'posts', 'events', 'tasks', 'plants', 'photos', 'sync_queue'];
    const info = {};
    
    for (const store of stores) {
      const data = await this.getData(store);
      info[store] = {
        count: Array.isArray(data) ? data.length : (data ? 1 : 0),
        size: JSON.stringify(data || []).length
      };
    }
    
    return info;
  }

  async clearOfflineData() {
    if (!this.db) return;
    
    const stores = ['diary_entries', 'posts', 'events', 'tasks', 'plants', 'photos', 'sync_queue'];
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();
    }
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

export default offlineManager;