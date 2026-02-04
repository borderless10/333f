# Script PowerShell para renomear o logo removendo espaços e acentos
# Execute: .\scripts\rename-logo.ps1

$assetsPath = Join-Path $PSScriptRoot "..\assets\images"
$oldNames = @(
    "télos control logo.png",
    "télos-control-logo.png",
    "telos control logo.png"
)
$newName = "telos-control-logo.png"

foreach ($oldName in $oldNames) {
    $oldPath = Join-Path $assetsPath $oldName
    if (Test-Path $oldPath) {
        $newPath = Join-Path $assetsPath $newName
        Write-Host "Renomeando: $oldName -> $newName"
        Rename-Item -Path $oldPath -NewName $newName -Force
        Write-Host "✅ Arquivo renomeado com sucesso!"
        break
    }
}

if (-not (Test-Path (Join-Path $assetsPath $newName))) {
    Write-Host "⚠️ Arquivo não encontrado. Verifique o nome do arquivo em assets/images/"
}
