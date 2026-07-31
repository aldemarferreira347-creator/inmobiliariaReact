$ErrorActionPreference = 'Stop'
$repoUrl = "git@github.com:aldemarferreira347-creator/inmobiliariaReact.git"
$branch = "main"

# Disable strict host key checking for this push
$env:GIT_SSH_COMMAND = "ssh -o StrictHostKeyChecking=no"

Write-Host "Inicializando repositorio..."
if (-not (Test-Path ".git")) {
    git init
}

# Crear .gitignore
$gitignoreContent = @"
node_modules/
build/
.env
.DS_Store
*.log
"@
if (-not (Test-Path ".gitignore")) {
    Set-Content -Path ".gitignore" -Value $gitignoreContent
}

# Cambiar rama a main
git branch -M $branch

# Agregar remote si no existe
$remotes = git remote
if ($remotes -notcontains "origin") {
    git remote add origin $repoUrl
} else {
    git remote set-url origin $repoUrl
}

# Obtener todos los archivos, ignorando carpetas pesadas
Write-Host "Buscando archivos..."
$allFiles = Get-ChildItem -Path . -Recurse -File | Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\build\\" -and
    $_.FullName -notmatch "\\\.git\\"
} | Select-Object -ExpandProperty FullName

$totalFiles = $allFiles.Count
Write-Host "Se encontraron $totalFiles archivos."

if ($totalFiles -eq 0) {
    Write-Host "No hay archivos para commitear."
    exit
}

$numCommits = 30
$filesPerCommit = [Math]::Ceiling($totalFiles / $numCommits)

for ($i = 0; $i -lt $numCommits; $i++) {
    $startIndex = $i * $filesPerCommit
    if ($startIndex -ge $totalFiles) {
        break
    }
    
    $endIndex = [Math]::Min($startIndex + $filesPerCommit - 1, $totalFiles - 1)
    $batch = $allFiles[$startIndex..$endIndex]
    
    Write-Host "Haciendo commit $( $i + 1 ) de $numCommits con $( $batch.Count ) archivos..."
    
    foreach ($file in $batch) {
        git add $file
    }
    
    # Hacer el commit
    $commitMsg = "Commit incremental $( $i + 1 ) de $numCommits"
    git commit -m $commitMsg
}

Write-Host "Commits terminados. Empujando a GitHub..."
# Empujar
git push -u origin $branch

Write-Host "Proceso finalizado exitosamente!"
