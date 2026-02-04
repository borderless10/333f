# Script para renomear o arquivo do logo
# Execute este script no PowerShell na pasta do projeto

$oldName = "télos control logo.png"
$newName = "telos-control-logo.png"
$imagesPath = "assets\images"

# Verificar se o arquivo existe
$oldPath = Join-Path $imagesPath $oldName
if (Test-Path $oldPath) {
    Write-Host "Arquivo encontrado: $oldPath" -ForegroundColor Green
    
    # Renomear
    $newPath = Join-Path $imagesPath $newName
    Rename-Item -Path $oldPath -NewName $newName -Force
    Write-Host "Arquivo renomeado com sucesso!" -ForegroundColor Green
    Write-Host "De: $oldName" -ForegroundColor Yellow
    Write-Host "Para: $newName" -ForegroundColor Yellow
} else {
    Write-Host "ERRO: Arquivo não encontrado em $oldPath" -ForegroundColor Red
    Write-Host "Verificando arquivos na pasta..." -ForegroundColor Yellow
    Get-ChildItem -Path $imagesPath | Select-Object Name
}
