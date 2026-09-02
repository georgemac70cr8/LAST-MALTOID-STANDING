# THE NINE — Vercel + Supabase

This version removes Netlify Blobs. Vercel hosts the site and API; Supabase stores the shared game state.

## 1. Create Supabase project
Create a project in Supabase, then open SQL Editor and run:

```sql
create table if not exists public.game_state (
  id bigint primary key,
  state jsonb not null
);

alter table public.game_state enable row level security;
```

No public policy is required because the app uses the Supabase secret key only from the Vercel server function.

## 2. Get Supabase credentials
In Supabase Project Settings → API Keys, copy:
- Project URL → `SUPABASE_URL`
- Secret key → `SUPABASE_SECRET_KEY`

Never put the secret key in the browser or send it to anyone.

## 3. Deploy to Vercel
Import/upload this project to Vercel. In Vercel Project Settings → Environment Variables add both variables above for **Production** (and Preview if desired), then redeploy.

The site will use `/api/game` and the database will be shared by all players.

## Current seeded game
Round 3; alive: DAMO, JOYCEY, MAU, MURPH, STEVE; eliminated: DAVE, GEORGE, MARK, RYAN; pot: €180.
