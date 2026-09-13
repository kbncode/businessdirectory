ALTER TABLE "businesses" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "businesses" ADD COLUMN "featuredStartDate" TIMESTAMP(3);
ALTER TABLE "businesses" ADD COLUMN "featuredEndDate" TIMESTAMP(3);

CREATE INDEX "businesses_isFeatured_status_idx" ON "businesses" ("isFeatured", "status");
