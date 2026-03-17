# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Healing Jesus Conference Portal — a Next.js 15 web app replacing Google Sheets for managing conference attendee itineraries (150-500 board members annually in Ghana). Three user roles: Board Members (access code auth), Admin (email/password, full control), Staff (email/password, read-only).

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Forms**: react-hook-form + zod validation
- **Tables**: @tanstack/react-table
- **PDF**: @react-pdf/renderer
- **CSV/Excel**: xlsx (SheetJS) + papaparse
- **Email**: Resend via Supabase Edge Functions
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Common Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx supabase start   # Start local Supabase (Docker required)
npx supabase db reset # Reset local DB and re-run migrations + seed
npx supabase migration new <name>  # Create new migration file
```

## Architecture

### Authentication

Three auth flows, all through Supabase Auth:
- **Board members**: Access code (e.g., `SMITH-2026`) → converted to synthetic email (`SMITH-2026@conference.internal`) with code as password. Auto-provisions board_members, party_members, and itineraries on first login.
- **Staff/Admin**: Standard email + password via `supabase.auth.admin.createUser()`.
- **Route protection**: `middleware.ts` refreshes sessions and reads role from JWT custom claims (no DB call) to enforce `/member/*`, `/admin/*`, `/staff/*` access.

### App Router Layout

- `(auth)/` route group — unauthenticated pages (login, staff-login, admin-login) with centered card layout
- `(dashboard)/` route group — authenticated pages with sidebar + header layout
  - `member/` — board member self-service (itinerary, party management)
  - `admin/` — full control (members table, access codes, events, exports, imports, activity log)
  - `staff/` — read-only search and view

### Data Flow Pattern

- **Server Actions** (`src/actions/`) for all mutations (auth, members, itinerary, party, access-codes, events, exports, imports)
- **API Routes** (`src/app/api/`) only for streaming/file downloads (PDF, CSV exports) and webhooks
- **Supabase clients**: separate browser client, server client (cookies-based), and admin client (service role key)

### Database

8 core PostgreSQL tables with Row Level Security:
- `events` — conference years
- `profiles` — extends auth.users with role
- `access_codes` — board member login codes
- `board_members` — one per person per event
- `party_members` — family/guests of board members
- `itineraries` — one per party member (~25 fields: travel, accommodation, conference, transport, visa, emergency)
- `change_log` — audit trail (JSONB changes)
- `notification_queue` — email batching

Key DB patterns:
- Completion percentage is **denormalized** on both `itineraries` and `board_members`, updated via PostgreSQL triggers
- Field-level change logging is done via DB triggers (not application code)
- Wide itinerary table by design (~2,500 max rows, no need to normalize)

### Supabase Directory

- `supabase/migrations/` — numbered SQL migration files (schema + RLS policies + triggers)
- `supabase/functions/` — Edge Functions (email notifications)
- `supabase/seed.sql` — seed data for local development

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        # Server-only, never expose to client
RESEND_API_KEY                   # For email notifications
NEXT_PUBLIC_APP_URL
```

## Implementation Phases

Defined in `implementation-plan.md`:
1. Foundation (Next.js setup, Supabase, auth, dashboard layout)
2. Board Member Portal (itinerary form, party management, completion tracking)
3. Admin Dashboard (data table, access codes, activity feed, stats)
4. Staff Portal (read-only search/view)
5. Exports (PDF/CSV: itinerary, rooming list, pickup schedule)
6. Notifications (email batching via Edge Functions + Resend)
7. Imports (CSV upload, column mapping, bulk processing)
8. Polish & Deploy (mobile responsiveness, error handling, deployment)
