# INFLUX Atlas - Influencer Database & Filtering Tool

Internal web application for influencer marketing agency staff to manage and filter influencer data.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Supabase Auth
- **Deployment**: Railway

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_connection_string
```

3. Run database migrations:
```bash
npm run db:push
```

4. Seed demo data (optional):
```bash
npm run seed
```

5. Run development server:
```bash
npm run dev
```

## Features

- **Authentication**: Email/password login with role-based access (admin/staff)
- **Dashboard**: KPI cards and recent influencers overview
- **Influencer List**: Advanced filtering, search, sorting, and pagination
- **Import**: Excel/CSV file upload with column mapping
- **Notes**: Add and manage notes for influencers
- **Export**: Export filtered results to CSV

## Roles

- **Admin**: Full access including import, CRUD operations, and user management
- **Staff**: View, filter, export, and add notes (read-only for core fields)

