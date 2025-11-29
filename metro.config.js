// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurar extensões de plataforma
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;