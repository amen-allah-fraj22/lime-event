# Quick network check for LIME Event (Supabase + local API)
# Session pooler (IPv4-friendly) — update if your Supabase region changes
$dbHost = "aws-1-eu-central-1.pooler.supabase.com"
Write-Host "=== Supabase host: $dbHost ===" -ForegroundColor Cyan

Write-Host "`nDNS (IPv4 A record):"
Resolve-DnsName $dbHost -Type A -ErrorAction SilentlyContinue | Format-Table Name, IPAddress

Write-Host "DNS (IPv6 AAAA record):"
Resolve-DnsName $dbHost -Type AAAA -ErrorAction SilentlyContinue | Format-Table Name, IPAddress

Write-Host "`nTCP port 5432:"
$t = Test-NetConnection $dbHost -Port 5432 -WarningAction SilentlyContinue
Write-Host "  TcpTestSucceeded: $($t.TcpTestSucceeded)"
if (-not $t.TcpTestSucceeded) {
  Write-Host @"

  LIKELY CAUSE: Your network only has IPv4 internet, but Supabase direct host
  resolves to IPv6 only. Fix in Supabase Dashboard:
    Project -> Connect -> choose "Session pooler" or enable "IPv4 add-on"
    Copy the new URI into apps/api/.env as DATABASE_URL

"@ -ForegroundColor Yellow
}

Write-Host "`nLocal API (if running):"
try {
  $h = Invoke-RestMethod http://localhost:3001/health -TimeoutSec 2
  Write-Host "  API: $($h.status)" -ForegroundColor Green
  try {
    $db = Invoke-RestMethod http://localhost:3001/health/db -TimeoutSec 5
    Write-Host "  DB:  $($db.database)" -ForegroundColor Green
  } catch {
    Write-Host "  DB:  disconnected (fix DATABASE_URL first)" -ForegroundColor Red
  }
} catch {
  Write-Host "  API not running - start with: npm run dev:api" -ForegroundColor Gray
}
