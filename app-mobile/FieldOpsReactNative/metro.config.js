
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite que o Metro reconheça arquivos WebAssembly usados pelo SQLite Web.
config.resolver.assetExts.push('wasm');

module.exports = config;
