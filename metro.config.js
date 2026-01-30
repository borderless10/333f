const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === 'react-native-pluggy-connect') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'scripts/metro-stub-pluggy-web.js'),
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
