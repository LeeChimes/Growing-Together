// Mock module for expo-sqlite on web
// This prevents Metro from trying to bundle the native SQLite module for web

module.exports = {
  openDatabaseSync: () => null,
  openDatabase: () => null,
};

