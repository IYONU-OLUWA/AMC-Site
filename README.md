# Ajoshe Model College (AMC) — Website & Alumni Portal

An independent alumni-run site for AMC (Alagbado, Ilorin, Kwara State): school info (admissions, exams, achievements) plus a moderated alumni directory with admin-managed news and events.

## What's inside
- **Backend:** Node.js + Express, server-rendered pages (EJS) — no separate frontend app to deploy
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Alumni sign up → sit in a "pending" queue → an admin approves them into the public directory. Admins log in separately and get a dashboard.

## 1. Set up the database (free)
1. Create a free Postgres database at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com)
2. Copy the connection string it gives you (looks like `postgresql://user:pass@host/db?sslmode=require`)

## 2. Local setup
```bash
npm install
cp .env.example .env
# paste your DATABASE_URL and set a SESSION_SECRET in .env

npx prisma migrate dev --name init   # creates the tables
npm run seed                          # creates your first admin login
npm run dev                           # starts the site at http://localhost:3000
```

The seed script prints the first admin's email/password in your terminal (defaults to `admin@ajoshemodelcollege.com` / `changeme123` unless you set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`). **Log in and change this immediately** by creating a proper admin account for yourself via the sign-up form, then promoting it to admin from the dashboard, then removing the seed account's admin access.

## 3. Add your content
Everything text-based (About, Founder bio, Admissions info, Exam info, Achievements) starts as a placeholder. Log in as admin → **Site Content** in the sidebar → fill it in. It updates live, no code changes needed.

## 4. Deploy it for real
- **App hosting:** [Render.com](https://render.com) free web service tier. Connect your GitHub repo, set the same environment variables from `.env`, and it builds automatically.
- **Database:** keep using your Neon/Supabase Postgres — just point `DATABASE_URL` at it in Render's environment settings too.
- After first deploy, run `npx prisma migrate deploy` (Render lets you run one-off commands) and then `npm run seed` once to create your admin login.

## Project structure
```
server.js              # app entry point
routes/                # public.js (school pages), auth.js (login/signup), admin.js (dashboard)
middleware/auth.js      # login/admin route guards
prisma/schema.prisma    # database models
views/                  # EJS templates (public site + views/admin for the dashboard)
public/                 # CSS + images
```

## Notes
- This site is explicitly framed as **independently run by alumni**, not an official school publication — see the footer disclaimer. Worth getting the school's blessing if it grows.
- A few images (achievement photos, exam registration flyer) are already wired in from what was shared. Swap files in `public/images/` (same filenames) to update them.
