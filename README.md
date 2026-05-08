# Bofo Waterproofing – Internal Request App

## Project Structure
```
bofo-app/
├── client/   ← React + Vite frontend
└── server/   ← Node.js + Express + Supabase backend
```

---

## Supabase Setup

### 1. Create a Supabase project
Go to https://supabase.com → New Project

### 2. Create the submissions table
Go to your project → SQL Editor → paste and run this:

```sql
create table submissions (
  id uuid default gen_random_uuid() primary key,
  employee_name text not null,
  job_site text not null,
  request_type text not null,
  details jsonb default '{}'::jsonb,
  quantity text,
  needed_by text,
  priority text default 'normal',
  notes text default '',
  status text default 'Pending',
  timestamp timestamptz default now()
);
```

### 3. Get your credentials
Go to Project Settings → API:
- Copy **Project URL** → this is your `SUPABASE_URL`
- Copy **service_role secret key** → this is your `SUPABASE_SERVICE_KEY`

---

## Running Locally

### Backend
```bash
cd server
npm install
# Create a .env file with:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_KEY=your-service-role-key
# CLIENT_URL=http://localhost:5173
npm start
```

### Frontend
```bash
cd client
npm install
npm start
```

---

## Render Deployment

### Backend (Web Service)
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `node index.js`
- Environment Variables:
  - `SUPABASE_URL` = your Supabase project URL
  - `SUPABASE_SERVICE_KEY` = your Supabase service role key
  - `CLIENT_URL` = your frontend Render URL

### Frontend (Static Site)
- Root Directory: `client`
- Build Command: `npm install && node node_modules/vite/bin/vite.js build`
- Publish Directory: `dist`
- Environment Variables:
  - `VITE_API_URL` = your backend Render URL
