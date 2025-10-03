module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Transform `import.meta` so classic scripts can execute
      ['babel-plugin-transform-import-meta'],
    ],
  };
};
