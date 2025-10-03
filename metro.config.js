const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prefer explicit platform order
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Keep web aliasing minimal (Expo already handles most cases)
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native$': 'react-native-web',
};

// Ensure ESM modules (.mjs) are transpiled by Metro (so Babel can transform import.meta)
config.resolver.sourceExts = Array.from(new Set([...(config.resolver.sourceExts || []), 'mjs', 'cjs']));

// Use default transformer options (Expo defaults are stable)
module.exports = config;
