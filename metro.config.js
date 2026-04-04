const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable package exports support which is often needed for modern packages like i18next
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
