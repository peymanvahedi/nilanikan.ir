# start-backend.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "🔧 Building & starting backend (Docker Compose)…"
docker compose up -d --build --remove-orphans

# Health check روی /api و /admin (حداکثر 8 بار هر 2 ثانیه)
$ok = $false
for ($i=1; $i -le 8; $i++) {
  Start-Sleep -Seconds 2
  try {
    $api = (Invoke-WebRequest http://localhost:8000/api/ -UseBasicParsing).StatusCode
    $adm = (Invoke-WebRequest http://localhost:8000/admin -UseBasicParsing).StatusCode
    if ($api -eq 200 -and $adm -eq 200) { $ok = $true; break }
  } catch { }
  Write-Host "⏳ waiting… ($i/8)"
}

if ($ok) {
  Write-Host "`n✅ Backend is UP!"
  Start-Process "http://localhost:8000/admin"
  Start-Process "http://localhost:8000/api/"
} else {
  Write-Warning "پاسخ نگرفتیم. لاگ‌ها رو ببین:"
  docker compose logs -f
}
