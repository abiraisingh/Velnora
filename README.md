# Velnora Candles

A calm storefront for handcrafted scented candles.

## Features

- Product catalogue with Rose, Jasmine, and Mogra candles
- Account creation and sign-in
- Login-protected cart and checkout
- Cash on delivery and UPI order selection
- Customer order history at `/orders`
- Reach-us contact form
- Admin operations dashboard at `/admin`
- Responsive layout for mobile and desktop

## Getting Started

Requirements: Node.js 18+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

## Available Scripts

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start the development server     |
| `npm run build`   | Create a production build        |
| `npm run preview` | Preview the production build     |
| `npm run lint`    | Run ESLint                       |
| `npm run format`  | Format the project with Prettier |

## Production Architecture

- Supabase Auth manages accounts and persistent sessions.
- Supabase PostgreSQL stores profiles, orders, and contact messages.
- Row Level Security limits customers to their own orders and reserves management operations for admins.
- Cashfree Sandbox creates and verifies UPI payments server-side.
- Cashfree webhooks update payment state idempotently after signature verification.
- `localStorage` is used only for the temporary cart; it is never the source of truth for users, orders, or payments.

## Environment Setup

Copy `.env.example` to `.env` for local development and fill in the values from Supabase and Cashfree. Never commit `.env` or server-only secrets.

Apply the existing schema once when setting up a new Supabase project. For the already-created database described by this repository, review and apply `supabase/migrations/20260904000000_cashfree_migration.sql`; it is non-destructive and is not run automatically by the application.

Before deploying to Cloudflare:

- Configure all `.env.example` values as Cloudflare environment variables or secrets.
- Configure Cashfree's webhook URL as `https://your-domain.example/api/payment/webhook`.
- Create the admin user through Supabase Auth, then set that user's `profiles.role` to `admin` in Supabase.
- Keep `CASHFREE_ENVIRONMENT=sandbox` until live credentials and production payment checks are approved.
