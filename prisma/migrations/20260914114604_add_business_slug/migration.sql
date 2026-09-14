-- Add slug, backfill existing rows from businessName (disambiguating any
-- collisions with a numeric suffix), then lock it down NOT NULL + UNIQUE.
-- Mirrors the JS slugify() in lib/slug.ts closely enough that newly-created
-- rows and this backfill produce the same shape of slug.
ALTER TABLE "businesses" ADD COLUMN "slug" TEXT;

WITH base AS (
  SELECT id,
    NULLIF(regexp_replace(regexp_replace(lower("businessName"), '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'), '') AS base_slug,
    "createdAt"
  FROM "businesses"
),
numbered AS (
  SELECT id, base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY "createdAt", id) AS rn
  FROM base
)
UPDATE "businesses" b
SET "slug" = CASE
    WHEN numbered.rn = 1 THEN COALESCE(numbered.base_slug, 'business')
    ELSE COALESCE(numbered.base_slug, 'business') || '-' || numbered.rn::text
  END
FROM numbered
WHERE b.id = numbered.id;

ALTER TABLE "businesses" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");
