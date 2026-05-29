# Apply migrations, generate Prisma client, seed demo artists
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
Write-Host "Seeding demo artists..."
npm run db:seed
Write-Host "Done. Test: curl http://localhost:3001/health/db"
