const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// as migrations do Drizzle sao arquivos .sql importados pelo bundle
config.resolver.sourceExts.push('sql');

module.exports = config;
