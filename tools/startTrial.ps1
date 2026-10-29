param([int]$Port = 5180, [switch]$OpenBrowser)
$ErrorActionPreference = 'Stop'
$projectDir = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$indexPath = Join-Path $projectDir 'dist\index.html'
if (-not (Test-Path -LiteralPath $indexPath)) { throw 'Chua co ban build. Chay npm run build trong gdmt-vn truoc.' }
$localUrl = "http://localhost:$Port/"
$existing = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if ($existing) {
  $response = Invoke-WebRequest -Uri $localUrl -TimeoutSec 5 -UseBasicParsing
  if ($response.Content -notmatch 'GDMT-VN') { throw "Cong $Port dang duoc ung dung khac su dung." }
} else {
  $nodePath = (Get-Command node -ErrorAction Stop).Source
  $viteCli = Join-Path $projectDir 'node_modules\vite\bin\vite.js'
  $runtimeDir = Join-Path $projectDir 'reports\internal-trial-runtime'
  New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
  $server = Start-Process -FilePath $nodePath -ArgumentList @("`"$viteCli`"", 'preview', '--host', '0.0.0.0', '--port', "$Port", '--strictPort') -WorkingDirectory $projectDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'server.log') -RedirectStandardError (Join-Path $runtimeDir 'server-error.log')
  $server.Id | Set-Content (Join-Path $runtimeDir 'server.pid')
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $localUrl -TimeoutSec 1 -UseBasicParsing
      if ($response.Content -match 'GDMT-VN') { $ready = $true; break }
    } catch { Start-Sleep -Milliseconds 200 }
  }
  if (-not $ready) { throw "Khong khoi dong duoc GDMT-VN. Xem log tai $runtimeDir" }
}
Write-Host "GDMT-VN internal trial: $localUrl"
Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.InterfaceAlias -notmatch 'Loopback' } | ForEach-Object { Write-Host "LAN: http://$($_.IPAddress):$Port/" }
Write-Host 'Chi dung ca gia lap. HTTP LAN khong ho tro day du PWA/offline.'
if ($OpenBrowser) { Start-Process $localUrl }
