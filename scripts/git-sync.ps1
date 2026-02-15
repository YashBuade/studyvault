$ErrorActionPreference = "Stop"

$status = git status --porcelain
if (-not $status) {
  Write-Host "Working tree clean. Nothing to sync."
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git add -A
git commit -m "Update $timestamp"
git push
