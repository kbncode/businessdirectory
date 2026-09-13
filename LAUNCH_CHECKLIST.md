# KBN Business Directory — Pre-Launch Checklist

Work through this top to bottom before pointing real traffic at the site.

## 1. Environment variables (set in Vercel, not just `.env.local`)

Vercel → Project → Settings → Environment Variables. Every var below needs a
**Production** value; see `.env.example` for the full list with comments.

- [ ] `DATABASE_URL` — real Vercel Postgres pooled connection string (`POSTGRES_PRISMA_URL`)
- [ ] `DIRECT_URL` — real Vercel Postgres direct connection string (`POSTGRES_URL_NON_POOLING`)
- [ ] `BLOB_READ_WRITE_TOKEN` — real Vercel Blob token. **Currently a placeholder** — the app
      silently falls back to writing uploads into `/public/uploads` on local disk when this
      isn't set. That fallback does not work on Vercel's read-only, ephemeral filesystem, so
      this MUST be a real token before launch or uploads will fail in production.
- [ ] `NEXTAUTH_SECRET` — generate a **fresh** value for production (`openssl rand -base64 32`).
      Do not reuse the value from local dev.
- [ ] `NEXTAUTH_URL` — set to the real production URL (e.g. `https://kbndirectory.com`)
- [ ] `RESEND_API_KEY` — real key from resend.com/api-keys
- [ ] `EMAIL_FROM` — see section 3 below (still the sandbox sender as of this checklist)
- [ ] `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — real Upstash Redis credentials.
      **Currently unset** — rate limiting falls back to an in-memory limiter that is
      per-instance and does not survive restarts or work across multiple serverless
      instances. This MUST be a real Upstash database before launch, or rate limits are
      effectively unenforceable under real traffic.
- [ ] `NEXT_PUBLIC_APP_URL` — real production URL (used in email links, sitemap, robots.txt)

## 2. Database migration

- [ ] Point `DATABASE_URL`/`DIRECT_URL` at the production Postgres instance
- [ ] Run `npx prisma migrate deploy` (not `migrate dev`) against production — this applies
      all existing migrations without prompting or generating new ones
- [ ] Run the master-data seed (`npx prisma db seed`) if production starts from an empty
      database — confirm country/state/city/category/entity/type tables are populated
- [ ] Do **not** run `prisma/seed-demo-businesses.ts` or `prisma/create-admin.ts` against
      production without deliberately choosing the values first (see section 4)

## 3. Resend domain verification

- [ ] Verify a custom sending domain in the Resend dashboard (Domains → Add Domain), add the
      DNS records it gives you
- [ ] Once verified, update `EMAIL_FROM` to use that domain (e.g.
      `"KBN Business Directory <notifications@yourdomain.com>"`) instead of the sandbox
      `onboarding@resend.dev` sender
- [ ] Sandbox sender can only deliver to the email address verified on the Resend account —
      confirm this has been swapped before relying on `RegistrationReceived`,
      `ListingApproved`, `ListingRejected`, or `AdminNewSubmission` reaching real users
- [ ] Remove or update the sandbox-limitation note currently shown on `/admin/admin-users`
      once the custom domain is live

## 4. Admin account credentials

- [ ] The current admin account (`kbn.gky@gmail.com`) was created with a randomly-generated
      **temporary** password during development/testing. Confirm whoever holds that password
      has either already changed it or will do so immediately after launch — there is no
      admin self-service password reset yet (noted as a future feature), so a rotation
      currently means creating a new admin from `/admin/admin-users` and deleting the old one,
      or a manual database update
- [ ] Delete or repurpose any other test admin/viewer accounts created during development
      (e.g. accounts created purely to test the email flow) before launch
- [ ] Confirm `AdminNewSubmission` emails and the sandbox-limitation note both point at the
      real, intended admin inbox — `kbn.gky@gmail.com` is currently hardcoded in
      `app/api/businesses/route.ts` as `ADMIN_ALERT_EMAIL`

## 5. `robots.txt` and `sitemap.xml`

- [x] `app/robots.ts` — present. Disallows `/admin`, `/api`, `/my-listings`,
      `/register/success`, `/offline`; allows everything else; references the sitemap
- [x] `app/sitemap.ts` — present. Lists the home page, `/browse`, `/about`, `/contact`, and
      every `APPROVED` business detail page
- [ ] After deploying, load `/robots.txt` and `/sitemap.xml` on the real production domain and
      confirm they render (Next.js serves these from the `app/robots.ts` / `app/sitemap.ts`
      files automatically — no static files needed)
- [ ] Submit the sitemap URL in Google Search Console once the domain is live

## 6. Rate limiting & spam protection sanity check

- [ ] With real Upstash credentials in place, re-run the rate-limit test against production
      (6 rapid `POST /api/businesses` calls → 6th should 429) to confirm the real Redis-backed
      limiter is active, not the in-memory fallback
- [ ] Confirm the honeypot field (`website_url`) is invisible in a real browser on the
      registration, signup, and forgot-password forms (inspect visually, not just in code)

## 7. Manual smoke test (run this end-to-end after deploying)

1. [ ] **Register**: sign up a fresh viewer account, submit a new business listing with a
       photo and brochure
2. [ ] **Email received**: confirm `RegistrationReceived` arrives in the submitter's inbox,
       and `AdminNewSubmission` arrives at the admin inbox
3. [ ] **Admin approve**: log into `/admin/login`, find the listing in `/admin/pending`, view
       full details, approve it
4. [ ] **Approval email**: confirm `ListingApproved` arrives in the submitter's inbox with a
       working link to the listing
5. [ ] **Appears public**: confirm the listing now shows up in `/browse` and on its
       `/business/[id]` page while logged out
6. [ ] **Login-gated contact visible**: confirm the business phone/email/brochure are hidden
       behind the "Log in to view contact details" gate when logged out, and appear correctly
       when logged in as any viewer
7. [ ] **Reject path**: submit a second test listing, reject it from `/admin/pending` with a
       reason, confirm `ListingRejected` arrives with that reason and the listing does not
       appear on the public site
8. [ ] Clean up any test accounts/listings created during this smoke test
