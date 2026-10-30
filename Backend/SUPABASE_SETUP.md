# TripGenie AI — Supabase Database & Authentication Setup Guide

This guide walks through configuring Supabase PostgreSQL, Authentication, Row Level Security (RLS), and applying SQL migrations for the TripGenie AI FastAPI backend.

---

## 1. Create a Supabase Project

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project** and select your organization.
3. Configure project settings:
   - **Name:** `TripGenie-AI` (or your preferred name)
   - **Database Password:** Generate and store a secure database password in a safe password manager.
   - **Region:** Select the region closest to your target users or deployment host.
4. Click **Create new project** and wait for database provisioning to complete.

---

## 2. Retrieve Project API Credentials

From your Supabase Project Dashboard:

1. Navigate to **Project Settings** (gear icon in left sidebar) -> **API**.
2. Locate the following values:
   - **Project URL:** `https://<your-project-ref>.supabase.co`
   - **Project API Keys:**
     - `anon` / `public`: The publishable key safe for client/frontend usage.
     - `service_role` / `secret`: Privileged administrative key. **Never expose this to clients or browsers.**
3. Navigate to **Project Settings** -> **API** -> **JWT Settings**:
   - **JWT Secret:** Used for symmetric signature validation.

---

## 3. Configure Local Environment Variables

In your `Backend/.env` file (copy from `Backend/.env.fastapi.example` if starting fresh):

```env
# Server Configuration
PORT=8000
FASTAPI_PORT=8000
HOST=0.0.0.0
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Security Settings
MAX_BODY_SIZE_BYTES=102400
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=20
```

> **Security Notice:** Never commit `.env` containing actual keys to Git. `Backend/.env` is ignored by Git in both root and backend `.gitignore`.

---

## 4. Apply SQL Migrations

TripGenie AI provides version-controlled, repeatable SQL migrations in `Backend/supabase/migrations/`:

| File | Purpose |
|---|---|
| `001_create_profiles.sql` | Extended user profiles table, `updated_at` trigger, and auto-provisioning `on_auth_user_created` trigger. |
| `002_create_trips.sql` | Saved trip itineraries table, constraints, performance indexes, and RLS policies. |
| `003_create_user_preferences.sql` | Reusable travel preferences table, unique user constraint, indexes, and RLS policies. |

### Option A: Using the Supabase Dashboard SQL Editor (Recommended)

1. Open your Supabase Dashboard and click **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open and copy the contents of `Backend/supabase/migrations/001_create_profiles.sql`.
4. Paste into the editor and click **Run**.
5. Repeat the process in sequence for:
   - `002_create_trips.sql`
   - `003_create_user_preferences.sql`
6. Verify in **Table Editor** that `profiles`, `trips`, and `user_preferences` exist with RLS badges enabled.

### Option B: Using the Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

---

## 5. Row Level Security (RLS) Policy Overview

Every table created in Phase 2 strictly enforces Row Level Security based on Supabase's cryptographically verified `auth.uid()`:

1. **`public.profiles`**:
   - `SELECT`: Only the user whose `id = auth.uid()` can view their profile.
   - `INSERT`: Only allowed when `id = auth.uid()`.
   - `UPDATE`: Only allowed when `id = auth.uid()`.
   - `DELETE`: Only allowed when `id = auth.uid()`.

2. **`public.trips`**:
   - `SELECT`: Only the user whose `user_id = auth.uid()` can query their saved trips.
   - `INSERT`: Only allowed when `user_id = auth.uid()`.
   - `UPDATE`: Only allowed when `user_id = auth.uid()`.
   - `DELETE`: Only allowed when `user_id = auth.uid()`.

3. **`public.user_preferences`**:
   - `SELECT`: Only the user whose `user_id = auth.uid()` can read preferences.
   - `INSERT`: Only allowed when `user_id = auth.uid()`.
   - `UPDATE`: Only allowed when `user_id = auth.uid()`.
   - `DELETE`: Only allowed when `user_id = auth.uid()`.

---

## 6. Verifying Database Connectivity

Start the FastAPI backend:

```bash
cd Backend
python run.py
```

### Health Check Probes

1. **Standard Health Probe (Unconditional):**
   ```bash
   curl http://localhost:8000/api/health
   ```
   Returns HTTP 200 indicating server uptime. Does not fail even if database credentials are not yet configured.

2. **Database Diagnostic Probe:**
   ```bash
   curl http://localhost:8000/api/health/database
   ```
   - If connected: Returns HTTP 200 with `{ "status": "connected", "healthy": true, "latency_ms": ... }`.
   - If unconfigured or unreachable: Returns HTTP 503 Service Unavailable with a sanitized failure description without leaking connection strings or credentials.

---

## 7. Running Automated Backend Tests

The project includes 36 automated unit and integration tests with complete mocking of Supabase and JWT signatures:

```bash
cd Backend
python -m pytest -v
python -m pytest --tb=short
```

