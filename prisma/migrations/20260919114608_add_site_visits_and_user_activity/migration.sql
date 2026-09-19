-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "site_visits" (
    "id" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "viewDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_visits_viewDate_idx" ON "site_visits"("viewDate");

-- CreateIndex
CREATE UNIQUE INDEX "site_visits_visitorKey_viewDate_key" ON "site_visits"("visitorKey", "viewDate");
