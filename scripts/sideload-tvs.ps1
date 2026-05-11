# Sideload Onesign Display to both LG TVs
# Usage: powershell -ExecutionPolicy Bypass -File scripts/sideload-tvs.ps1

$ErrorActionPreference = 'Stop'

$tvs = @(
    @{ Name = 'screen1'; Host = '192.168.0.39'; Passphrase = '9F06A9' },
    @{ Name = 'screen2'; Host = '192.168.0.99'; Passphrase = '7B856F' }
)

$ipk = "dist\com.onesignanddigital.display_1.0.0_all.ipk"
$sshDir = Join-Path $env:USERPROFILE '.ssh'
New-Item -ItemType Directory -Force -Path $sshDir | Out-Null

# Step 1: Fetch SSH keys
Write-Host "=== 1/4: Fetching SSH keys ===" -ForegroundColor Cyan
foreach ($tv in $tvs) {
    $keyPath = Join-Path $sshDir "$($tv.Name)_webos"
    try {
        Invoke-WebRequest -Uri "http://$($tv.Host):9991/webos_rsa" -OutFile $keyPath -UseBasicParsing -TimeoutSec 10
        $size = (Get-Item $keyPath).Length
        Write-Host "  [OK] $($tv.Name): key saved ($size bytes)" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] $($tv.Name): $_" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Register devices with ares-setup-device
Write-Host ""
Write-Host "=== 2/4: Registering devices with ares-cli ===" -ForegroundColor Cyan
$existing = (& ares-setup-device --list 2>&1) -join "`n"

foreach ($tv in $tvs) {
    $info = "host=$($tv.Host)","port=9922","username=prisoner","privatekey=$($tv.Name)_webos","passphrase=$($tv.Passphrase)","description=Onesign $($tv.Name)"
    $action = if ($existing -match $tv.Name) { '--modify' } else { '--add' }
    $args = @($action, $tv.Name)
    foreach ($i in $info) { $args += '--info'; $args += $i }
    Write-Host "  ares-setup-device $action $($tv.Name) ..."
    & ares-setup-device @args 2>&1 | ForEach-Object { Write-Host "    $_" }
    if ($LASTEXITCODE -ne 0) { Write-Host "  [FAIL] register $($tv.Name)" -ForegroundColor Red; exit 1 }
    Write-Host "  [OK] $($tv.Name) registered" -ForegroundColor Green
}

# Step 3: Install the .ipk on each
Write-Host ""
Write-Host "=== 3/4: Installing .ipk on each TV ===" -ForegroundColor Cyan
foreach ($tv in $tvs) {
    Write-Host "  Installing on $($tv.Name)..."
    & ares-install -d $tv.Name $ipk
    if ($LASTEXITCODE -ne 0) { Write-Host "  [FAIL] install on $($tv.Name)" -ForegroundColor Red; exit 1 }
    Write-Host "  [OK] $($tv.Name) installed" -ForegroundColor Green
}

# Step 4: Launch the app on each
Write-Host ""
Write-Host "=== 4/4: Launching the app on each TV ===" -ForegroundColor Cyan
foreach ($tv in $tvs) {
    & ares-launch -d $tv.Name com.onesignanddigital.display
    if ($LASTEXITCODE -ne 0) { Write-Host "  [WARN] launch returned non-zero on $($tv.Name); app may still be running" -ForegroundColor Yellow }
    Write-Host "  [OK] $($tv.Name) launch requested" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done. Onesign Display should now be running on both TVs." -ForegroundColor Green
