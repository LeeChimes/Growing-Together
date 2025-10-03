// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Provide a web-compatible mock for expo-sqlite
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return {
      filePath: path.resolve(__dirname, 'expo-sqlite.web.js'),
      type: 'sourceFile',
    };
  }
  // Use default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
