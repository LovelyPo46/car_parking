// Metro configuration for Expo project
// Prefer compiled JS entrypoints from node_modules over TS sources
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prefer React Native and browser fields to ensure proper ESM resolution
config.resolver = config.resolver || {};
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

module.exports = config;
