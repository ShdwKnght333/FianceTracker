// Metro configuration for Expo + Expo Router
// See: https://docs.expo.dev/guides/metro-config/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add customizations here if needed (e.g., extra asset extensions)
// Example:
// config.resolver.assetExts.push('cbor');

module.exports = config;
