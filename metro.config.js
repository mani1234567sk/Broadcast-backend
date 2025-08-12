const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable hermes for better performance in production builds
config.transformer.hermesCommand = 'hermes';

// Optimize for production builds
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Add support for additional asset types
config.resolver.assetExts.push('ttf', 'otf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg');

module.exports = config;