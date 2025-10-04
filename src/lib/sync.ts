// Temporary hard-disable of sync features to stop error spam
export const syncManager = undefined;
export const cacheOperations = undefined;

// If something still imports the class, keep harmless stubs:
export class SyncManagerImpl {
  async isOnline() { return true; }
  async processMutationQueue() { /* no-op */ }
  async syncAll() { /* no-op */ }
}