# offr

Data-driven university offer predictions for IB and A-Level students.

## Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, EB Garamond
- **Backend**: FastAPI (Python), Vercel Serverless
- **Database**: Supabase (Postgres + Auth)
- **AI**: Google Gemini (PS analysis + counsellor feedback)

## Setup

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Settings → API** and copy your Project URL and anon key
4. Go to **Authentication → URL Configuration** and add your site URL + `https://your-site.com/auth/callback` to redirect URLs

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```

For Vercel, add these in **Settings → Environment Variables**.

### 3. Data

Copy your `master_courses.csv` into `api/data/master_courses.csv`.

### 4. Run locally

```bash
npm install
npm run dev
```

For the Python backend locally:
```bash
pip install -r api/requirements.txt
uvicorn api.index:app --reload --port 8000
```

### 5. Deploy

Push to GitHub and connect to Vercel. It will auto-deploy.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth` | Sign in (magic link) |
| `/onboarding` | First-time profile setup |
| `/dashboard` | Home dashboard |
| `/dashboard/assess` | Run offer assessment |
| `/dashboard/result` | View latest result |
| `/dashboard/tracker` | UCAS offer tracker |
| `/dashboard/explore` | Course discovery |
| `/dashboard/profile` | Edit profile |
| `/dashboard/faq` | FAQs |
