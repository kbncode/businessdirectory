# KBN Business Directory

A community business directory web app + PWA, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Prisma.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Prisma ORM** targeting **Vercel Postgres**
- **@vercel/blob** for file uploads (logos, photos, documents)

## Project structure

```
/app
  /(public)   home, browse, search, business detail pages
  /(auth)     viewer login / signup / reset password
  /(owner)    "my listings" pages for business owners
  /admin      admin login + panel (own layout)
  /api        API routes
/lib          prisma client, auth helpers, utils
/components   shared UI components
/prisma       schema.prisma, seed.ts
```

No data model has been defined yet — `prisma/schema.prisma` only has the datasource and generator blocks. Models will be added in a follow-up step, after which you'll run `prisma migrate dev`.

## 1. Set up environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Then fill in `.env.local` with real values (see "Where to find these values" below).

## 2. Set DATABASE_URL / DIRECT_URL from Vercel Postgres

1. In the [Vercel dashboard](https://vercel.com/dashboard), open your project → **Storage** → create or select a **Postgres** database.
2. Go to the database's **.env.local** tab (or **Quickstart**) — Vercel lists several connection strings. Map them into `.env.local` as follows:
   - `DATABASE_URL` ← the value Vercel calls **`POSTGRES_PRISMA_URL`** (pooled, includes `?pgbouncer=true`). Used by the app and by Prisma Client at runtime.
   - `DIRECT_URL` ← the value Vercel calls **`POSTGRES_URL_NON_POOLING`** (direct connection, no pooler). Used by Prisma Migrate, which needs a direct connection to run migrations.
3. Save `.env.local`.

## 3. Set BLOB_READ_WRITE_TOKEN from Vercel Blob

1. In the same project, go to **Storage** → create or select a **Blob** store.
2. Open its **.env.local** / Quickstart tab and copy the value listed as **`BLOB_READ_WRITE_TOKEN`**.
3. Paste it into `.env.local`.

## 4. Install dependencies

```bash
npm install
```

(`npm install` also runs `prisma generate` automatically via the `postinstall` script.)

## 5. Run Prisma migrations

Once a data model has been added to `prisma/schema.prisma`:

```bash
npx prisma migrate dev
```

This creates/updates tables in your Vercel Postgres database using `DIRECT_URL`, and regenerates Prisma Client.

To (re)generate Prisma Client without running a migration:

```bash
npx prisma generate
```

To seed the database (once `prisma/seed.ts` has real seed data):

```bash
npx prisma db seed
```

## 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see "KBN Business Directory - Coming Soon".

## Environment variables reference

| Variable | Where it comes from | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Vercel Postgres → `POSTGRES_PRISMA_URL` | Pooled DB connection used at runtime |
| `DIRECT_URL` | Vercel Postgres → `POSTGRES_URL_NON_POOLING` | Direct DB connection used by Prisma Migrate |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store | Upload/read access for file storage |
| `NEXT_PUBLIC_APP_URL` | Set manually | Public base URL of the app |

See `.env.example` for the full list with inline comments.
