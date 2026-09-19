-- CreateEnum
CREATE TYPE "PromotionEventType" AS ENUM ('IMPRESSION', 'CLICK');

-- CreateTable
CREATE TABLE "business_views" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "viewDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_events" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "eventType" "PromotionEventType" NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_views_businessId_viewDate_idx" ON "business_views"("businessId", "viewDate");

-- CreateIndex
CREATE UNIQUE INDEX "business_views_businessId_visitorKey_viewDate_key" ON "business_views"("businessId", "visitorKey", "viewDate");

-- CreateIndex
CREATE INDEX "promotion_events_promotionId_eventType_eventDate_idx" ON "promotion_events"("promotionId", "eventType", "eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_events_promotionId_eventType_visitorKey_eventDate_key" ON "promotion_events"("promotionId", "eventType", "visitorKey", "eventDate");

-- AddForeignKey
ALTER TABLE "business_views" ADD CONSTRAINT "business_views_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_events" ADD CONSTRAINT "promotion_events_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
