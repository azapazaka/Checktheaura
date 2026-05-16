param(
  [string]$InputZip = "C:\Users\Notebook\Downloads\ce894007f79385d657bdf4b6276937e1.zip",
  [string]$WorkspaceRoot = "C:\checktheaura"
)

$modelsDir = Join-Path $WorkspaceRoot "src\assets\models"
$tempDir = Join-Path $WorkspaceRoot ".tmp\batyr-model"

if (Test-Path $tempDir) {
  Remove-Item -LiteralPath $tempDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Expand-Archive -LiteralPath $InputZip -DestinationPath $tempDir -Force

$sourceModel = Join-Path $tempDir "modelToUsed.glb"
$outputComponent = Join-Path $modelsDir "BatyrModel.tsx"

npx gltfjsx $sourceModel -T -t -o $outputComponent -R 1024 -f webp

if (Test-Path $outputComponent) {
  Remove-Item -LiteralPath $outputComponent -Force
}

Remove-Item -LiteralPath (Join-Path $modelsDir "modelToUsed.glb") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $tempDir -Recurse -Force
