# Simple Task Manager

A lightweight task manager built with **Next.js 14, React and TypeScript**, ready to push to GitHub and deploy on Vercel.

## Features
- Add, edit and delete tasks
- Set start date, due date and priority
- Track progress from 0–100%
- Track status: Not started, In progress, Blocked or Completed
- Dashboard counts and overdue indicator
- Search and filter tasks
- Browser-local persistence using `localStorage`
- Export tasks to a JSON backup and import them later

## Run locally
1. Install Node.js 18.17 or later.
2. Extract this ZIP and open the folder in a terminal.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open http://localhost:3000

## Push to GitHub
Create an empty GitHub repository, then run from this folder:
```bash
git init
git add .
git commit -m "Initial task manager app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

## Deploy to Vercel
1. Sign in to Vercel and choose **Add New → Project**.
2. Import the GitHub repository.
3. Keep the detected framework as **Next.js** and use the default build settings.
4. Select **Deploy**. Vercel will provide your app URL.

## Important data note
This starter version stores tasks in the browser that created them (`localStorage`). It does not yet use a shared database or user accounts. Tasks will not automatically sync between devices or browsers. Use **Export backup** periodically. For multi-device access, team sharing, or reliable cloud storage, connect a database such as Supabase in a next iteration.
