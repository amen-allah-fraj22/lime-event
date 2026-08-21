# Apply migrations and generate the Prisma client. Does NOT seed demo data —
# see -WithDemoData below. This script is safe to re-run against a database
# that already has real users in it.
param(
  # Also seed fake demo accounts (yasmine.demo@..., djkarim.demo@..., etc.).
  # Only use this against a fresh database with no real users — see the
  # warning in prisma/seed.ts.
  [switch]$WithDemoData
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root "apps\api")

if (-not (Test-Path ".env")) {
  if (Test-Path (Join-Path $root ".env")) {
    Copy-Item (Join-Path $root ".env") ".env"
    Write-Host "Copied root .env -> apps/api/.env"
  } else {
    throw "Missing apps/api/.env — copy root .env first (see SETUP.md)"
  }
}

Write-Host "Running Prisma migrate deploy..."
npx prisma migrate deploy
npx prisma generate

if ($WithDemoData) {
  Write-Host "Seeding demo artists..."
  $env:SEED_CONFIRM = "yes"
  npm run db:seed
}

Write-Host "Done. Test: curl http://localhost:3001/health/db"
