# Uruchom w PowerShell: powershell -ExecutionPolicy Bypass -File .\scripts\init-git.ps1
$ErrorActionPreference = 'Stop'
$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Repo
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Zainstaluj Git for Windows i uruchom skrypt ponownie.' }
if (-not (Test-Path '.git')) {
  & git init -b main
  if ($LASTEXITCODE -ne 0) { throw 'git init nie powiodło się.' }
  Write-Host 'Utworzono lokalne repozytorium Git.' -ForegroundColor Green
} else {
  Write-Host 'Repozytorium Git już istnieje — nie nadpisuję historii.' -ForegroundColor Yellow
}
$AuthorName = (& git config user.name)
$AuthorEmail = (& git config user.email)
if (-not $AuthorName -or -not $AuthorEmail) {
  Write-Host 'Brak tożsamości Git. Najpierw wykonaj:' -ForegroundColor Yellow
  Write-Host 'git config --global user.name "Twoje imię i nazwisko"'
  Write-Host 'git config --global user.email "adres-powiazany-z-GitHub"'
  exit 1
}
& git add --all
if ($LASTEXITCODE -ne 0) { throw 'Nie udało się dodać plików.' }
& git diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
  & git commit -m 'chore: import MAD-NET V18 HERO RACK and project scaffold'
  if ($LASTEXITCODE -ne 0) { throw 'Nie udało się wykonać commita.' }
  Write-Host 'Wykonano commit bazowy.' -ForegroundColor Green
} elseif ($LASTEXITCODE -eq 0) {
  Write-Host 'Brak nowych zmian do commita.'
} else { throw 'Błąd git diff.' }
& git status --short --branch
Write-Host 'Gotowe. Następnie możesz uruchomić .\scripts\publish-github.ps1' -ForegroundColor Green
