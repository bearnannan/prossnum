# Prossnum Module Update Script
# Usage: .\update_modules.ps1

Write-Host "--- Prossnum Ecosystem Update Started ---" -ForegroundColor Cyan

# Get all directories in the current folder
$dirs = Get-ChildItem -Directory

foreach ($dir in $dirs) {
    $gitPath = Join-Path $dir.FullName ".git"
    
    if (Test-Path $gitPath) {
        Write-Host "Updating $($dir.Name)..." -ForegroundColor Yellow
        pushd $dir.FullName
        
        # Try to pull updates
        $output = git pull origin main 2>&1
        if ($LASTEXITCODE -ne 0) {
            # Try master if main fails
            $output = git pull origin master 2>&1
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully updated $($dir.Name)" -ForegroundColor Green
        } else {
            Write-Host "Failed to update $($dir.Name). Check for conflicts or branch name." -ForegroundColor Red
            Write-Host $output
        }
        
        popd
    }
}

Write-Host "--- Update Complete ---" -ForegroundColor Cyan
