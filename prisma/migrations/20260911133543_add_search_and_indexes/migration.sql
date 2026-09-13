-- Composite index backing the cursor pagination + status filter combo used
-- on /browse (status: APPROVED) and /admin/pending (status: PENDING), both
-- ordered by createdAt DESC.
CREATE INDEX "businesses_status_createdAt_idx" ON "businesses" ("status", "createdAt" DESC);

-- Generated tsvector column for full-text search across businessName
-- (weighted A, matches rank highest), about and productsServices (weighted
-- B). STORED so it's computed once on write, not on every query, and kept
-- in sync automatically by Postgres whenever the source columns change.
ALTER TABLE "businesses" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("businessName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("about", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("productsServices", '')), 'B')
  ) STORED;

CREATE INDEX "businesses_searchVector_idx" ON "businesses" USING GIN ("searchVector");
