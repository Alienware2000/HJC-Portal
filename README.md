# Healing Jesus Conference Portal

A web app that replaces spreadsheets for managing conference attendee logistics. Board members log in with a personal access code and fill in their own travel details — flights, hotels, transport, visa info, emergency contacts — plus the same for any family or guests in their party.

**Live**: [healing-jesus-project.vercel.app](https://healing-jesus-project.vercel.app)

## How It Works

**Board Members** get an access code (e.g. `SMITH-2026`), log in, and fill out their itinerary and party member details at their own pace. A progress tracker shows what's complete.

**Admins** have full control — generate access codes, monitor completion, track changes, import/export data in bulk, and manage staff accounts.

**Staff** get read-only access to look up any attendee's details on the spot, useful during the conference for logistics coordination.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Forms**: react-hook-form + zod validation
- **Tables**: @tanstack/react-table
- **Exports**: PDF (@react-pdf/renderer) + CSV (SheetJS, papaparse)
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Features

- **Self-service itineraries** — members fill in their own data (arrival, departure, accommodation, transport, visa, emergency contact)
- **Party management** — board members add spouse, children, or guests, each with their own itinerary
- **Real-time completion tracking** — percentage progress with automatic calculation via database triggers
- **Access code auth** — simple code-based login for board members, email/password for staff and admin
- **Role-based access** — admin (full control), staff (read-only), board member (own data only)
- **Team management** — admin can create/delete staff and admin accounts, change roles, reset passwords
- **Bulk import/export** — CSV upload with column mapping, PDF/CSV exports for rooming lists and pickup schedules
- **Activity log** — field-level audit trail of all itinerary changes
- **Mobile responsive** — works on phone, tablet, and desktop

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)

### Local Development

```bash
# Install dependencies
npm install

# Start local Supabase
npx supabase start

# Run database migrations and seed data
npx supabase db reset

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=your-resend-api-key  # optional, for email notifications
```

Local Supabase keys are printed when you run `npx supabase start`.

## Project Structure

```
src/
  actions/        Server actions (auth, members, itinerary, team, etc.)
  app/
    (auth)/       Login pages (access code, admin, staff)
    (dashboard)/  Authenticated pages
      admin/      Admin dashboard, members, access codes, team, exports, imports
      member/     Board member itinerary and party management
      staff/      Staff read-only view
  components/     React components (admin panels, forms, layout, UI primitives)
  lib/            Supabase clients, constants, validations, utilities
  types/          TypeScript type definitions

supabase/
  migrations/     SQL migrations (tables, RLS policies, triggers)
  seed.sql        Seed data for local development
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npx supabase start   # Start local Supabase
npx supabase db reset  # Reset local DB with migrations + seed
```
