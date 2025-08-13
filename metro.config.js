const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable hermes for better performance in production builds
// Temporarily disable hermes to debug release issues
// config.transformer.hermesCommand = 'hermes';

// Optimize for production builds
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Add support for additional asset types
config.resolver.assetExts.push('ttf', 'otf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg');

// Add minifier options for better debugging
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Disable minification in release for debugging
config.transformer.minifierPath = require.resolve('metro-minify-terser');
module.exports = config;