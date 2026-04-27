@AGENTS.md

# Project: E-Commerce Order Management System

Small Mexican electronics business — order management system for customers and admins.

## Stack

- **Framework**: Next.js 15 App Router, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Backend/DB**: Supabase (browser + server clients in `src/lib/supabase.ts`)
- **Deployment**: Vercel
- **Package manager**: pnpm — always use `pnpm` for installations, never npm/yarn

## Routing

- `(store)` — customer-facing pages
- `(admin)` — admin panel (no auth protection yet)

## Database tables

- `products`, `categories`, `orders`, `order_items`, `payment_receipts`

## Design

- Dark-accented tech aesthetic
- Accent colors: red and yellow
- Clean and minimal — use shadcn/ui components exclusively, never build UI primitives from scratch

## Rules

- Use server components for data fetching by default; only use client components when interactivity requires it
- Always use shadcn/ui components — never build UI primitives from scratch
- Use pnpm for all package installations
- Third-party services: addresses/geocoding use Google Maps Places API (the client has chosen it). Don't propose swaps to community-run proxies, scrapers, or self-hosted datasets unless the SaaS has a concrete failure mode for this use case — "free forever" and "no external dependency" aren't automatic wins.
