param(
    [string]$RootPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [switch]$UpdateExisting,
    [switch]$AdoptExisting
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

function Assert-CommandAvailable {
    param([string]$Name)
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) {
        throw "Required command '$Name' is not available in PATH."
    }
}

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Is-GitRepository {
    param([string]$Path)
    return Test-Path -LiteralPath (Join-Path $Path ".git")
}

function Get-DefaultBranchName {
    param([string]$RepoPath)
    try {
        $headRef = (& git -C $RepoPath symbolic-ref refs/remotes/origin/HEAD 2>$null)
    }
    catch {
        return $null
    }
    if ($LASTEXITCODE -ne 0) {
        return $null
    }
    if (-not $headRef) {
        return $null
    }
    if ($headRef -match "refs/remotes/origin/(.+)$") {
        return $Matches[1]
    }
    return $null
}

function Ensure-OriginRemote {
    param(
        [string]$RepoPath,
        [string]$RepoUrl
    )

    try {
        $originUrl = (& git -C $RepoPath remote get-url origin 2>$null)
    }
    catch {
        $originUrl = $null
    }

    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($originUrl)) {
        git -C $RepoPath remote add origin $RepoUrl
        return
    }

    if ($originUrl -ne $RepoUrl) {
        Write-Warning "Origin URL differs. Updating origin in $RepoPath"
        git -C $RepoPath remote set-url origin $RepoUrl
    }
}

function Update-Repository {
    param(
        [string]$RepoPath,
        [string]$RepoUrl
    )

    Ensure-OriginRemote -RepoPath $RepoPath -RepoUrl $RepoUrl
    git -C $RepoPath fetch --quiet origin
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Could not fetch origin for $RepoPath. Skipping update."
        return $false
    }
    $defaultBranch = Get-DefaultBranchName -RepoPath $RepoPath
    if (-not $defaultBranch) {
        Write-Warning "Could not resolve default branch for $RepoPath. Skipping update."
        return $false
    }

    try {
        $currentBranch = (& git -C $RepoPath rev-parse --abbrev-ref HEAD 2>$null)
    }
    catch {
        $currentBranch = $null
    }
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($currentBranch)) {
        $currentBranch = $defaultBranch
    }

    try {
        $checkoutResult = (& git -C $RepoPath checkout -q $defaultBranch 2>&1)
    }
    catch {
        $checkoutResult = $null
        $global:LASTEXITCODE = 1
    }
    if ($LASTEXITCODE -ne 0) {
        try {
            $checkoutFallback = (& git -C $RepoPath checkout -q -B $defaultBranch "origin/$defaultBranch" 2>&1)
        }
        catch {
            $checkoutFallback = $null
            $global:LASTEXITCODE = 1
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Could not checkout $defaultBranch in $RepoPath. Skipping update."
            return $false
        }
    }

    try {
        $pullResult = (& git -C $RepoPath pull --ff-only --quiet origin $defaultBranch 2>&1)
    }
    catch {
        $pullResult = $null
        $global:LASTEXITCODE = 1
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Could not fast-forward $RepoPath from origin/$defaultBranch."
        return $false
    }

    return $true
}

function Adopt-ExistingDirectoryAsGit {
    param(
        [string]$RepoPath,
        [string]$RepoUrl
    )

    Write-Host "[ADOPT] Initializing git repo: $RepoPath"
    git -C $RepoPath init --quiet

    Ensure-OriginRemote -RepoPath $RepoPath -RepoUrl $RepoUrl

    git -C $RepoPath fetch --quiet --depth 1 origin
    $defaultBranch = Get-DefaultBranchName -RepoPath $RepoPath
    if (-not $defaultBranch) {
        Write-Warning "Could not resolve origin default branch for $RepoPath. Keeping initialized repo only."
        return
    }

    $headCheck = (& git -C $RepoPath rev-parse --verify HEAD 2>$null)
    $hasLocalCommits = ($LASTEXITCODE -eq 0 -and $headCheck -ne $null)
    if ($hasLocalCommits) {
        Write-Warning "Local commits already exist in $RepoPath. Skipping auto-checkout."
        return
    }

    $checkoutResult = & git -C $RepoPath checkout -q -B $defaultBranch "origin/$defaultBranch" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Checkout conflict in $RepoPath. Repository initialized and fetched; resolve manually if needed."
        return
    }
}

Assert-CommandAvailable -Name "git"

$registryPath = Join-Path $PSScriptRoot "global-skills-registry.json"
if (-not (Test-Path -LiteralPath $registryPath)) {
    throw "Registry file not found: $registryPath"
}

$registry = Get-Content -LiteralPath $registryPath -Raw | ConvertFrom-Json
if (-not $registry.repositories) {
    throw "No repositories found in registry."
}

Write-Host "Bootstrapping global skills registry..."
Write-Host "Workspace root: $RootPath"
Write-Host "Update existing repositories: $UpdateExisting"
Write-Host "Adopt non-git directories: $AdoptExisting"
Write-Host ""

$clonedCount = 0
$updatedCount = 0
$adoptedCount = 0
$skippedCount = 0
$invalidCount = 0

foreach ($entry in $registry.repositories) {
    $relativePath = [string]$entry.path
    $repoUrl = [string]$entry.url
    $category = [string]$entry.category

    if ([string]::IsNullOrWhiteSpace($relativePath) -or [string]::IsNullOrWhiteSpace($repoUrl)) {
        Write-Warning "Invalid entry detected. Missing path or url."
        $invalidCount++
        continue
    }

    $targetPath = Join-Path $RootPath $relativePath
    $parentPath = Split-Path -Parent $targetPath
    Ensure-Directory -Path $parentPath

    if (-not (Test-Path -LiteralPath $targetPath)) {
        Write-Host "[CLONE] $category"
        Write-Host "        $repoUrl -> $targetPath"
        git clone --quiet --depth 1 $repoUrl $targetPath
        $clonedCount++
        continue
    }

    if (-not (Is-GitRepository -Path $targetPath)) {
        if ($AdoptExisting) {
            try {
                Adopt-ExistingDirectoryAsGit -RepoPath $targetPath -RepoUrl $repoUrl
                $adoptedCount++
            }
            catch {
                Write-Warning "[SKIP] Adopt failed for $targetPath : $($_.Exception.Message)"
                $skippedCount++
            }
        }
        else {
            Write-Warning "[SKIP] Path exists but is not a git repository: $targetPath"
            $skippedCount++
        }
        continue
    }

    if ($UpdateExisting) {
        Write-Host "[UPDATE] $targetPath"
        try {
            $updated = Update-Repository -RepoPath $targetPath -RepoUrl $repoUrl
        }
        catch {
            Write-Warning "[SKIP] Update failed for $targetPath : $($_.Exception.Message)"
            $updated = $false
        }
        if ($updated) {
            $updatedCount++
        }
        else {
            $skippedCount++
        }
    }
    else {
        Write-Host "[OK] Already present: $targetPath"
        $skippedCount++
    }
}

Write-Host ""
Write-Host "Bootstrap completed."
Write-Host "Cloned : $clonedCount"
Write-Host "Updated: $updatedCount"
Write-Host "Adopted: $adoptedCount"
Write-Host "Skipped: $skippedCount"
Write-Host "Invalid: $invalidCount"
