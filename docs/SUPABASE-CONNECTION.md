# Supabase connection on Windows / home WiFi

## What we found on your machine

Running `scripts\test-network.ps1` shows:

- Host `db.srzntaxfuthpcudzxaxe.supabase.co` resolves to **IPv6 only** (`2a05:d014:...`)
- **TCP port 5432 fails** (`TcpTestSucceeded: False`)

Many home routers and ISPs (including Windows on WiFi) have **no working IPv6 path** to the internet. Your URL can be correct and Prisma still reports **P1001 Can't reach database server**.

This is **not** caused by ngrok. ngrok is only for Clerk webhooks.

---

## Fix (pick one)

### Option A — Session pooler (free, recommended)

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project  
2. Click **Connect** (top) or **Project Settings → Database**  
3. **Connection string** → tab **ORM** or **URI**  
4. Choose **Session pooler** (or “Pooler” / port **5432**, not Transaction **6543**)  
5. Copy the URI. It looks like:

   ```text
   postgresql://postgres.srzntaxfuthpcudzxaxe:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```

   Host is `aws-0-....pooler.supabase.com` (IPv4-friendly), user is `postgres.PROJECT_REF`.

6. Paste into:
   - `C:\Users\Negza\Desktop\lime-event\apps\api\.env` → `DATABASE_URL=...`
   - Root `.env` (same value)

7. URL-encode special characters in the password if needed (`+` → `%2B`).

8. Apply schema:

   ```powershell
   cd C:\Users\Negza\Desktop\lime-event
   .\scripts\test-network.ps1
   .\scripts\setup-db.ps1
   ```

9. Confirm:

   ```powershell
   npm run dev:api
   curl http://localhost:3001/health/db
   ```

### Option B — IPv4 add-on (direct host)

Supabase → **Project Settings → Add-ons** → enable **IPv4** for direct connections.  
Use the new **IPv4** connection string they show (still `db.*.supabase.co` but reachable over IPv4).

### Option C — Run SQL in Supabase (if migrate still fails)

1. Dashboard → **SQL Editor**  
2. Paste contents of `apps/api/prisma/migrations/20250520100000_init/migration.sql`  
3. Run  
4. Then locally: `cd apps\api` → `npx prisma generate` → `npm run db:seed`

---

## Firewall / WiFi checks

If pooler still fails:

1. **Supabase project not paused** — Dashboard → Restore project if needed.  
2. **Windows Firewall** — allow outbound to port **5432** (or temporarily disable firewall to test).  
3. **University / office WiFi** — often blocks port 5432; try phone hotspot.  
4. **VPN** — try off or on (some VPNs block database ports).

Run the diagnostic anytime:

```powershell
.\scripts\test-network.ps1
```

---

## Direct vs pooler (reference)

| Type | Host example | IPv4 on home WiFi? | Prisma migrate |
|------|----------------|---------------------|----------------|
| Direct | `db.xxx.supabase.co:5432` | Often **no** (IPv6 only) | Yes |
| Session pooler | `aws-0-xxx.pooler.supabase.com:5432` | Usually **yes** | Yes |
| Transaction pooler | port **6543** | Yes | **No** (use for app runtime only) |

Use **Session pooler** URI for `DATABASE_URL` in local dev unless you have the IPv4 add-on.
