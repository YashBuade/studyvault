$ErrorActionPreference = "Stop"

$status = git status --porcelain
if (-not $status) {
  Write-Host "Working tree clean. Nothing to sync."
  exit 0
}

$branch = git branch --show-current
if (-not $branch) {
  throw "Unable to determine the current branch."
}

$status | ForEach-Object { Write-Host $_ }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git add -A

$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Host "Nothing staged after git add. Check .gitignore or file permissions."
  exit 0
}

git commit -m "chore: sync workspace ($timestamp)"

$upstream = git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null
if ($LASTEXITCODE -eq 0 -and $upstream) {
  git push
} else {
  git push --set-upstream origin $branch
}
