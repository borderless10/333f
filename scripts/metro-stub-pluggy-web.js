/**
 * Stub para react-native-pluggy-connect na web.
 * Usado pelo Metro quando platform === 'web' para evitar 500 (pacote é nativo).
 */
const { View } = require('react-native');

function PluggyConnect() {
  return null;
}

module.exports = { PluggyConnect };
