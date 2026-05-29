# ngrok setup for Clerk webhooks (local dev)

**Important:** ngrok is only for **Clerk → API webhooks**. It does **not** fix Supabase.  
You can use the app **without ngrok** if users complete `/onboarding/role` (that calls `POST /auth/sync`).

Use ngrok when you want Clerk to create the DB user **immediately on sign-up**, before onboarding.

---

## 1. Install ngrok (Windows)

### Option A — winget (recommended)

```powershell
winget install ngrok.ngrok
```

Close and reopen PowerShell, then:

```powershell
ngrok version
```

### Option B — download

1. https://ngrok.com/download  
2. Unzip `ngrok.exe` somewhere on your PATH (e.g. `C:\Users\Negza\AppData\Local\Microsoft\WindowsApps\`)

---

## 2. Create a free ngrok account

1. Sign up at https://dashboard.ngrok.com/signup  
2. **Your authtoken** → copy the token  
3. In PowerShell (once):

```powershell
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN_HERE
```

---

## 3. Run the stack (3 terminals)

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `cd C:\Users\Negza\Desktop\lime-event` → `npm run dev:api` | API on port **3001** |
| 2 | `ngrok http 3001` | Public URL → your PC |
| 3 | `npm run dev:web` | Web on port **3000** |

After `ngrok http 3001`, you will see something like:

```
Forwarding   https://a1b2c3d4.ngrok-free.app -> http://localhost:3001
```

Copy the **https** URL (not http).

---

## 4. Configure Clerk webhook

1. [Clerk Dashboard](https://dashboard.clerk.com) → your app **lime-event**  
2. **Configure → Webhooks** → **Add endpoint**  
3. **Endpoint URL:**

   ```
   https://a1b2c3d4.ngrok-free.app/auth/webhook
   ```

   Replace with **your** ngrok URL + `/auth/webhook` (no trailing slash).

4. **Subscribe to events:**
   - `user.created`
   - `user.updated`

5. **Create** → copy **Signing secret** (`whsec_...`)

6. Put it in `apps/api/.env` (quotes help if the secret contains `+`):

   ```env
   CLERK_WEBHOOK_SECRET="whsec_your_secret_here"
   ```

7. Restart the API (`Ctrl+C` in terminal 1, then `npm run dev:api` again).

---

## 5. Test the webhook

1. In Clerk → Webhooks → your endpoint → **Testing** tab → send `user.created`  
2. Or sign up a new user on http://localhost:3000/sign-up  

In the **ngrok** terminal you should see `POST /auth/webhook` with status **200**.

In the **API** terminal, no error about `Invalid webhook signature`.

Check DB: `cd apps\api` → `npx prisma studio` → `User` table.

---

## Common ngrok problems

| Problem | Fix |
|---------|-----|
| `ngrok` not recognized | Install via winget, reopen terminal |
| Clerk gets 404 | URL must end with `/auth/webhook`, API must be running |
| `Invalid webhook signature` | `CLERK_WEBHOOK_SECRET` must match Clerk endpoint secret; restart API |
| ngrok URL changes every restart | Free plan gets a new URL each time — **update Clerk endpoint** or use a reserved domain on paid plan |
| Browser shows ngrok warning page | Normal on free tier; Clerk servers are not affected |

---

## Without ngrok (simpler for now)

1. Fix Supabase connection first (see `docs/SUPABASE-CONNECTION.md`).  
2. Sign up → go to `/onboarding/role` → pick a role → **Save**.  
3. That page calls `POST /auth/sync` and creates your user in Postgres.

Add ngrok later when you want automatic sync on every sign-up.
