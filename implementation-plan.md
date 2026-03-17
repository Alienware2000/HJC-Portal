# Healing Jesus Conference Portal — Implementation Plan

## Context

Every year, the Healing Jesus Conference in Ghana hosts 150-500 board members who currently manage their itineraries via Google Sheets. This causes problems:

- Changes get missed by admins (no notification when a board member updates the sheet)
- No role-based access — anyone with the link can edit anything
- No structured data — hard to sort, filter, or export for hotels and pickup coordinators
- No change tracking — admins don't know what changed or when

This platform replaces that workflow with a proper web application that gives board members a simple portal to fill in their itinerary, while giving admins full visibility, change tracking, and export tools.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router) + React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 + shadcn/ui components |
| **Backend/DB** | Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage) |
| **PDF Generation** | @react-pdf/renderer |
| **Excel/CSV** | xlsx (SheetJS) + papaparse |
| **Forms** | react-hook-form + zod validation |
| **Data Tables** | @tanstack/react-table |
| **Email** | Resend (via Supabase Edge Functions) |
| **Deployment** | Vercel (frontend) + Supabase (backend) |

---

## User Roles

| Role | Access | Auth Method |
|------|--------|-------------|
| **Board Member** | Own itinerary + family/guests | Unique access code (e.g., `SMITH-2026`) |
| **Admin** | Full control: all members, exports, imports, notifications | Email + password |
| **Staff** | Read-only: search/view for pickup coordination, hotel liaisons | Email + password |

---

## Project Structure

```
healing-jesus-project/
├── .env.local                          # Environment variables (gitignored)
├── .env.example                        # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── components.json                     # shadcn/ui config
├── middleware.ts                       # Auth session refresh + route protection
│
├── public/
│   ├── logo.svg
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Landing / redirect to login
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                     # Unauthenticated pages
│   │   │   ├── layout.tsx              # Centered card layout
│   │   │   ├── login/page.tsx          # Access code login (board members)
│   │   │   ├── staff-login/page.tsx    # Email/password login (staff)
│   │   │   └── admin-login/page.tsx    # Email/password login (admin)
│   │   │
│   │   ├── (dashboard)/                # Authenticated pages
│   │   │   ├── layout.tsx              # Sidebar + header layout
│   │   │   │
│   │   │   ├── member/                 # Board member pages
│   │   │   │   ├── page.tsx            # Dashboard (completion overview)
│   │   │   │   ├── itinerary/page.tsx  # Edit own itinerary
│   │   │   │   ├── party/page.tsx      # List family/guests
│   │   │   │   ├── party/new/page.tsx  # Add family/guest
│   │   │   │   ├── party/[personId]/page.tsx  # Edit family/guest itinerary
│   │   │   │   └── profile/page.tsx    # Account settings
│   │   │   │
│   │   │   ├── admin/                  # Admin pages
│   │   │   │   ├── page.tsx            # Dashboard (stats + activity feed)
│   │   │   │   ├── members/page.tsx    # All members table (filterable/sortable)
│   │   │   │   ├── members/[memberId]/page.tsx  # View/edit specific member
│   │   │   │   ├── members/new/page.tsx         # Add new board member
│   │   │   │   ├── access-codes/page.tsx        # Generate/manage access codes
│   │   │   │   ├── events/page.tsx     # Conference year management
│   │   │   │   ├── activity/page.tsx   # Full change log
│   │   │   │   ├── exports/page.tsx    # Export center (PDF + CSV/Excel)
│   │   │   │   └── imports/page.tsx    # CSV import with column mapping
│   │   │   │
│   │   │   └── staff/                  # Staff pages
│   │   │       ├── page.tsx            # Search dashboard
│   │   │       ├── members/page.tsx    # Search/browse (read-only)
│   │   │       └── members/[memberId]/page.tsx  # View details (read-only)
│   │   │
│   │   └── api/                        # API route handlers
│   │       ├── auth/login-code/route.ts
│   │       ├── auth/callback/route.ts
│   │       ├── exports/pdf/route.ts
│   │       ├── exports/csv/route.ts
│   │       ├── imports/validate/route.ts
│   │       ├── imports/process/route.ts
│   │       └── webhooks/supabase/route.ts
│   │
│   ├── actions/                        # Server Actions
│   │   ├── auth.ts
│   │   ├── members.ts
│   │   ├── itinerary.ts
│   │   ├── party.ts
│   │   ├── access-codes.ts
│   │   ├── events.ts
│   │   ├── exports.ts
│   │   └── imports.ts
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── layout/                     # Sidebar, header, mobile nav
│   │   ├── auth/                       # Login forms, logout button
│   │   ├── member/                     # Itinerary form sections, party cards
│   │   ├── admin/                      # Data table, filters, activity feed, stats
│   │   ├── exports/                    # Export dialog, column selector
│   │   ├── imports/                    # File upload, column mapper, preview
│   │   └── shared/                     # Loading skeleton, empty state, etc.
│   │
│   ├── lib/
│   │   ├── supabase/                   # Client, server, admin Supabase clients
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   ├── validations/                # Zod schemas
│   │   ├── pdf/                        # PDF templates (itinerary, rooming list, pickup)
│   │   ├── csv/                        # CSV export/parse logic
│   │   └── hooks/                      # useRealtime, useDebounce, usePagination
│   │
│   └── types/                          # TypeScript types
│
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   ├── migrations/                     # SQL migration files (numbered)
│   └── functions/                      # Edge Functions (notifications)
│
└── docs/
```

---

## Database Schema

### Tables

#### 1. `events` — Conference years
```sql
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- "Healing Jesus Conference 2026"
  year INTEGER NOT NULL UNIQUE,
  start_date DATE,
  end_date DATE,
  location TEXT,
  is_active BOOLEAN DEFAULT false,             -- Only one active at a time
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. `profiles` — Extends Supabase auth.users
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'board_member', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. `access_codes` — Login codes for board members
```sql
CREATE TABLE public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,                   -- "SMITH-2026" or generated
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  board_member_id UUID REFERENCES board_members(id) ON DELETE SET NULL,
  assigned_to_name TEXT,                       -- Pre-assigned name
  is_used BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

#### 4. `board_members` — One per person per event
```sql
CREATE TABLE public.board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  access_code_id UUID REFERENCES access_codes(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deactivated')),
  itinerary_completion_pct INTEGER DEFAULT 0,  -- Cached completion %
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, event_id)
);
```

#### 5. `party_members` — Family/guests of a board member
```sql
CREATE TABLE public.party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_member_id UUID NOT NULL REFERENCES board_members(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('self', 'spouse', 'child', 'guest', 'other')),
  full_name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,            -- true = the board member themselves
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 6. `itineraries` — One per party member (wide table)
```sql
CREATE TABLE public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_member_id UUID NOT NULL UNIQUE REFERENCES party_members(id) ON DELETE CASCADE,
  board_member_id UUID NOT NULL REFERENCES board_members(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Personal Info
  full_name TEXT,
  phone TEXT,
  email TEXT,
  nationality TEXT,
  passport_number TEXT,

  -- Arrival Travel
  arrival_airline TEXT,
  arrival_flight_number TEXT,
  arrival_date DATE,
  arrival_time TIME,
  arrival_airport TEXT,

  -- Departure Travel
  departure_airline TEXT,
  departure_flight_number TEXT,
  departure_date DATE,
  departure_time TIME,
  departure_airport TEXT,

  -- Accommodation
  hotel_preference TEXT,
  room_type TEXT CHECK (room_type IN ('single', 'double', 'suite', 'shared', 'other') OR room_type IS NULL),
  check_in_date DATE,
  check_out_date DATE,
  special_room_requests TEXT,

  -- Conference Details
  tshirt_size TEXT CHECK (tshirt_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL') OR tshirt_size IS NULL),
  dietary_restrictions TEXT,
  events_attending TEXT[],

  -- Ground Transport
  airport_pickup_needed BOOLEAN DEFAULT false,
  pickup_location TEXT,
  dropoff_preferences TEXT,

  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  -- Visa Info
  visa_required BOOLEAN DEFAULT false,
  visa_status TEXT CHECK (visa_status IN ('not_started', 'in_progress', 'approved', 'denied') OR visa_status IS NULL),
  visa_number TEXT,

  -- Special Requests
  special_requests TEXT,

  -- Metadata
  completion_pct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 7. `change_log` — Audit trail for all changes
```sql
CREATE TABLE public.change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  board_member_id UUID NOT NULL REFERENCES board_members(id) ON DELETE CASCADE,
  party_member_id UUID REFERENCES party_members(id) ON DELETE SET NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  changes JSONB NOT NULL,                      -- { field: { old: "...", new: "..." } }
  changed_at TIMESTAMPTZ DEFAULT now()
);
```

#### 8. `notification_queue` — Email notification batching
```sql
CREATE TABLE public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('itinerary_change', 'reminder', 'welcome')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);
```

### Key Database Features

**Row Level Security (RLS)** on all tables:
- Board members: can only see/edit their own data
- Staff: read-only access to all member data
- Admins: full access to everything

**PostgreSQL Triggers**:
- Auto-compute `completion_pct` on itinerary insert/update
- Auto-log changes to `change_log` with field-level diffs (old vs new values)
- Sync user role to JWT custom claims (no extra DB call per request)

**Indexes** on: arrival_date, departure_date, hotel_preference, event_id for fast admin filtering.

---

## Authentication System

### Board Members (Access Code Login)

Uses Supabase Auth with synthetic emails — no custom JWT infrastructure needed:

1. Admin creates access code `SMITH-2026` → system creates Supabase auth user with email `SMITH-2026@conference.internal` and password = the code
2. Board member enters code on login page → system calls `signInWithPassword` with the synthetic email + code as password
3. On first login, auto-provisions: `board_members` row + `party_members` (self) + blank `itineraries` row
4. Session cookie set via `@supabase/ssr` — standard Supabase auth from here on

**Why this approach**: Keeps everything within Supabase Auth, so RLS policies using `auth.uid()` work seamlessly. No custom JWT signing needed.

### Staff & Admin (Email/Password)

Standard Supabase email/password auth:
1. Admin creates staff/admin accounts through the admin dashboard
2. `supabase.auth.admin.createUser()` called server-side
3. Standard `signInWithPassword()` on login

### Route Protection (middleware.ts)

- Refreshes session on every request
- Reads role from JWT custom claims (no DB call needed)
- Enforces: `/member/*` → board_member, `/admin/*` → admin, `/staff/*` → staff
- Redirects unauthenticated users to `/login`

---

## Core Feature Details

### 1. Board Member Itinerary Form

Multi-section form (tabs or accordion) with 8 sections:
- Personal Info — name, phone, email, nationality, passport
- Arrival Travel — airline, flight number, date, time, airport
- Departure Travel — same fields
- Accommodation — hotel, room type, check-in/out, special requests
- Conference — t-shirt size, dietary restrictions, events attending
- Ground Transport — pickup needed, location, drop-off preferences
- Emergency Contact — name, phone, relationship
- Visa Info — required, status, number
- Special Requests — free text

**Auto-save on blur** with debounce to prevent excessive writes. Visual completion indicator shows progress.

### 2. Admin Data Table

Built on @tanstack/react-table with:
- Server-side pagination (Supabase `.range()`)
- Column sorting (Supabase `.order()`)
- Faceted filters: arrival date range, hotel, t-shirt size, dietary needs, completion status
- Text search on name
- Row selection for bulk actions (send reminders, export selected)
- Expandable rows showing party members inline

### 3. Change Tracking & Notifications

**The core problem this solves:**
- PostgreSQL trigger captures every field change with old/new values into `change_log`
- Admin dashboard shows **real-time activity feed** via Supabase Realtime subscriptions
- **Email notifications** batched every 5 minutes via Supabase Edge Functions + Resend
  - Batching prevents email spam when a member fills out their entire itinerary at once
  - Summary email lists all changed fields with old → new values

### 4. Exports

| Export Type | Format | Use Case |
|------------|--------|----------|
| Individual Itinerary | PDF | Print or share one person's full travel details |
| Hotel Rooming List | PDF + CSV | Send to hotels — grouped by hotel, with room details |
| Airport Pickup Schedule | PDF + CSV | For pickup coordinators — grouped by date/time |
| Bulk Data Export | CSV/Excel | Full data dump with column selection and filters |

Generated server-side through API route handlers that stream the file response.

### 5. CSV Import

For migrating from existing Google Sheets:
1. Upload CSV file (drag-and-drop)
2. Map columns: smart auto-matching + manual override
3. Validate: server-side check against Zod schemas, per-row error reporting
4. Preview: review before importing, fix or exclude invalid rows
5. Import: bulk processing with access code generation for new members
6. Results: N created, N updated, N skipped, N errors

---

## Implementation Phases

### Phase 1: Foundation
- Initialize Next.js 15 + Tailwind + shadcn/ui
- Set up Supabase project + all database migrations
- Build Supabase client utilities (browser, server, admin)
- Implement middleware.ts (session refresh + route protection)
- Build auth pages (access code login, admin login, staff login)
- Build dashboard layout with sidebar navigation
- Create role-based layout guards

**Deliverable**: Users can log in and see role-appropriate empty dashboards.

### Phase 2: Board Member Portal
- Build 8-section itinerary form with zod validation
- Implement auto-save with debounce
- Build party member management (list, add, remove, edit)
- Implement completion % calculation (DB trigger + UI indicator)
- Build member dashboard with completion overview

**Deliverable**: Board members can fully manage their itinerary and family/guests.

### Phase 3: Admin Dashboard
- Build filterable/sortable members data table
- Build access code management (generate, assign, deactivate)
- Build real-time activity feed
- Build admin dashboard with stats cards
- Build conference event management
- Implement bulk actions

**Deliverable**: Admins have full visibility and control.

### Phase 4: Staff Portal
- Build read-only search and view interface
- Pickup coordination view (filter by arrival date/airport)

**Deliverable**: Staff can search and view member data.

### Phase 5: Exports
- PDF templates: itinerary, rooming list, pickup schedule
- CSV/Excel with column selection
- Export center page with filters

**Deliverable**: Admins can generate formatted exports for hotels and coordinators.

### Phase 6: Notifications
- Supabase Edge Functions + Resend for email
- Batching strategy (5-minute windows)
- Email templates (change summary, reminder, welcome)
- In-app notification indicators

**Deliverable**: Admins get notified of itinerary changes.

### Phase 7: Imports
- CSV upload + column mapping UI
- Validation + preview
- Bulk import processing with duplicate detection

**Deliverable**: Admins can bulk-import from Google Sheets exports.

### Phase 8: Polish & Deploy
- Mobile responsiveness
- Error handling + loading states
- Vercel deployment + Supabase production setup
- End-to-end testing

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Server-only
RESEND_API_KEY=re_xxx                      # For email notifications
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.5",
    "tailwindcss": "^4",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "zod": "^3",
    "@tanstack/react-table": "^8",
    "@react-pdf/renderer": "^4",
    "xlsx": "^0.18",
    "papaparse": "^5",
    "date-fns": "^3",
    "lucide-react": "latest",
    "sonner": "^1",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2"
  }
}
```

---

## Design Decisions

1. **Synthetic emails for access codes** — Keeps everything within Supabase Auth so RLS works. Avoids custom JWT complexity.
2. **Wide itinerary table** — All fields in one table instead of normalized. Data is always accessed together; normalization adds join complexity for no benefit at this scale (~2,500 max rows).
3. **Server Actions for mutations, API routes for streaming** — Server Actions are simpler for form handling. API routes only for PDF/CSV downloads that need streaming responses.
4. **Change logging via DB triggers** — Guarantees every change is captured regardless of code path (server action, admin edit, import). More reliable than application-level diffing.
5. **Completion % caching** — Denormalized on both `itineraries` and `board_members` tables via triggers. Eliminates recomputing for every row in the admin table.
