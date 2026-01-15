# ===================================
# SCRIPT DE CORREÇÃO - NODE COMPATIBILITY
# ===================================
# Execute este script APÓS fazer downgrade do Node para v20

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  CORREÇÃO NODE v24 → v20 LTS       " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar versão do Node
Write-Host "1. Verificando versão do Node..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "   Node version: $nodeVersion" -ForegroundColor Green

if ($nodeVersion -like "v24*") {
    Write-Host "   ❌ ERRO: Ainda está usando Node v24!" -ForegroundColor Red
    Write-Host "   ⚠️  Por favor, faça o downgrade primeiro:" -ForegroundColor Red
    Write-Host "   1. Desinstale Node v24" -ForegroundColor Red
    Write-Host "   2. Instale Node v20 LTS de https://nodejs.org/" -ForegroundColor Red
    Write-Host "   3. Reinicie o terminal e execute este script novamente" -ForegroundColor Red
    exit 1
}

if ($nodeVersion -like "v20*" -or $nodeVersion -like "v18*") {
    Write-Host "   ✅ Node LTS detectado! Prosseguindo..." -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Versão não recomendada. Continue por sua conta e risco." -ForegroundColor Yellow
}

Write-Host ""

# Verificar versão do NPM
Write-Host "2. Verificando versão do NPM..." -ForegroundColor Yellow
$npmVersion = npm --version
Write-Host "   NPM version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Limpar node_modules
Write-Host "3. Removendo node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ node_modules removido" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  node_modules já não existe" -ForegroundColor Gray
}
Write-Host ""

# Limpar package-lock.json
Write-Host "4. Removendo package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ package-lock.json removido" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  package-lock.json já não existe" -ForegroundColor Gray
}
Write-Host ""

# Limpar cache do NPM
Write-Host "5. Limpando cache do NPM..." -ForegroundColor Yellow
npm cache clean --force 2>&1 | Out-Null
Write-Host "   ✅ Cache do NPM limpo" -ForegroundColor Green
Write-Host ""

# Reinstalar dependências
Write-Host "6. Instalando dependências (isso pode levar alguns minutos)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Dependências instaladas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro ao instalar dependências" -ForegroundColor Red
    Write-Host "   Execute manualmente: npm install" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Limpar cache do Expo
Write-Host "7. Limpando cache do Expo..." -ForegroundColor Yellow
npx expo start -c 2>&1 | Out-Null
Write-Host "   ✅ Cache do Expo limpo" -ForegroundColor Green
Write-Host ""

# Resumo final
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  ✅ CORREÇÃO CONCLUÍDA COM SUCESSO  " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Versões instaladas:" -ForegroundColor Yellow
Write-Host "  Node: $nodeVersion" -ForegroundColor White
Write-Host "  NPM: $npmVersion" -ForegroundColor White
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Execute: npm start" -ForegroundColor White
Write-Host "  2. Escaneie QR code no Expo Go (Android)" -ForegroundColor White
Write-Host "  3. App deve funcionar normalmente! ✅" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Pronto para desenvolvimento!" -ForegroundColor Green
