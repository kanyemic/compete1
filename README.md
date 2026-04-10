<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9fee406a-4660-4c63-84b1-46447ab23602

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`
3. Set the `GEMINI_API_KEY` in `.env.local`
4. Optional: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable real backend data
5. If using Supabase, run [supabase/schema.sql](/Users/kanyemic/Desktop/medical challenge/compete1/supabase/schema.sql) and [supabase/seed.sql](/Users/kanyemic/Desktop/medical challenge/compete1/supabase/seed.sql) in your database
6. Run the app:
   `npm run dev`

## Data Sources

- Without Supabase env vars, the app falls back to local mock data.
- With Supabase configured, `fetchRandomCase` and `fetchLeaderboard` will prefer backend data automatically.
