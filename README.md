# MyGameList

Personal games tracker inspired by MyAnimeList. Browse a large game catalog ([RAWG](https://rawg.io/apidocs)), create a profile, and track play status, scores, and hours — hosted for free on **GitHub Pages**.

## Stack

| Layer | Tech |
|--------|------|
| Frontend | Vite + React + TypeScript + Tailwind CSS v4 |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |
| Auth + DB | Supabase (free tier) |
| Games API | [RAWG](https://rawg.io/apidocs) (proxied by Supabase Edge Function) |

## Features (V1)

- Search / browse games
- Sign up / log in and create a profile
- Add games to your list with status: Playing, Completed, On Hold, Dropped, Plan to Play
- Score (1–10), hours played, and notes
- Profile page with status tabs and inline edits

## Quick start

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Supabase project

1. Create a free project at [supabase.com](https://supabase.com)
2. In the SQL editor, run the migration in [`supabase/migrations/20260328000000_init.sql`](supabase/migrations/20260328000000_init.sql)
3. Copy **Project URL** and **anon public** key into `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. (Recommended for local testing) In Authentication → Providers → Email, you can disable “Confirm email” while developing.

### 3. RAWG API key

1. Create an account at [rawg.io](https://rawg.io/)
2. Open [RAWG API docs](https://rawg.io/apidocs) → **Get API Key**
3. Copy the key
4. In Supabase → **Project Settings → Edge Functions → Secrets**, set:

| Secret | Value |
|--------|--------|
| `RAWG_API_KEY` | your RAWG API key |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually available automatically to Edge Functions.

Free plan notes (see [RAWG API docs](https://rawg.io/apidocs)): personal/hobby use, attribution link required on pages that show RAWG data (footer already links to RAWG), up to ~20,000 requests/month.

### 4. Deploy the Edge Function

**Without CLI (Dashboard):**

1. Confirm secret `RAWG_API_KEY` under **Project Settings → Edge Functions → Secrets**
2. **Edge Functions → Deploy a new function** named exactly `rawg-proxy`
3. Paste [`supabase/functions/rawg-proxy/index.ts`](supabase/functions/rawg-proxy/index.ts) and deploy
4. Open the function → turn **off** “Verify JWT” / “Enforce JWT verification”  
   (guest search must work without login; the RAWG key stays on the server)

**With CLI (optional):**

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy rawg-proxy --no-verify-jwt
```

### 5. Run locally

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/MyGameList/`).

## GitHub Pages deploy

1. Push this repo to GitHub as **MyGameList** (repo name matches Vite `base: '/MyGameList/'`)
2. Repo **Settings → Pages → Build and deployment → Source**: GitHub Actions
3. Repo **Settings → Secrets and variables → Actions → Secrets**, add repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`  
   (These are baked into the static JS at build time. Use the full Supabase **anon/public** key.)
4. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually) so a **new build** picks up the secrets

The site will be at `https://<username>.github.io/MyGameList/`.

If you use a different repo name or a custom domain at the site root, change `base` in [`vite.config.ts`](vite.config.ts).

## Project layout

```
src/
  components/   UI (Layout, GameCard, ListEditor, …)
  context/      AuthProvider
  lib/          Supabase client, RAWG proxy calls, list CRUD
  pages/        Home, Games, Detail, Profile, Auth
  types/        Shared TypeScript types
supabase/
  migrations/   Postgres schema + RLS
  functions/    rawg-proxy Edge Function
.github/workflows/deploy.yml
```

> Note: the DB column `igdb_id` stores the **RAWG game id** (name kept to avoid a breaking schema rename).

## Security notes

- Never put `RAWG_API_KEY` or the Supabase **service role** key in the Vite app or GitHub Pages build.
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are public; Row Level Security keeps each user’s list private.
- Attribute [RAWG](https://rawg.io/) as the game data source (footer link included).

## License

MIT — use freely for personal / portfolio projects.
