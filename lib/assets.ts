/**
 * Centralização de assets (imagens, ícones, etc.)
 * Usa caminhos relativos para garantir compatibilidade com require()
 * 
 * IMPORTANTE: O arquivo deve se chamar "telos-control-logo.png" (sem espaços, sem acentos)
 * Se o arquivo atual tiver espaços ou acentos, renomeie-o para evitar erros de módulo.
 */

// Logo da empresa
// Use o nome exato do arquivo sem espaços e sem acentos
export const TELOS_LOGO = require('../assets/images/telos-control-logo.png');
