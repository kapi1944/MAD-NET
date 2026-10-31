# Prywatne repozytorium kapi1944/MAD-NET — wywołanie wymaga dostępu do GitHub CLI.
$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not (Test-Path '.git')) { throw 'Najpierw uruchom .\scripts\init-git.ps1' }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Brak GitHub CLI. Zainstaluj: winget install --id GitHub.cli --exact; potem gh auth login.' }
& gh auth status
if ($LASTEXITCODE -ne 0) { throw 'Zaloguj się przez: gh auth login' }
$Repo = 'kapi1944/MAD-NET'
& gh repo view $Repo --json name -q .name 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Host 'Repozytorium na GitHub już istnieje.' -ForegroundColor Yellow
  & git remote get-url origin 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    & git remote add origin ('https://github.com/' + $Repo + '.git')
    if ($LASTEXITCODE -ne 0) { throw 'Nie udało się dodać origin.' }
  }
  $Url = (& git remote get-url origin)
  if ($Url -notmatch '(^https://github\.com/kapi1944/MAD-NET(\.git)?$|^git@github\.com:kapi1944/MAD-NET(\.git)?$)') {
    throw "Istniejący origin prowadzi do innego repozytorium: $Url. Nie nadpisuję."
  }
  & git push -u origin main
  if ($LASTEXITCODE -ne 0) { throw 'Git push nie powiódł się. Nie wymuszam aktualizacji.' }
} else {
  Write-Host 'Tworzę PRYWATNE repozytorium kapi1944/MAD-NET i publikuję main...' -ForegroundColor Cyan
  & gh repo create $Repo --private --source . --remote origin --push
  if ($LASTEXITCODE -ne 0) { throw 'Nie udało się utworzyć repozytorium lub wykonać push.' }
}
Write-Host 'Gotowe: https://github.com/kapi1944/MAD-NET' -ForegroundColor Green
