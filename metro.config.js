const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro configuration for proper bundling
config.resolver.assetExts.push('cjs');

module.exports = config;