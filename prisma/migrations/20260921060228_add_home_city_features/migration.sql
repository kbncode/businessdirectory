-- CreateTable
CREATE TABLE "home_city_features" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "iconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_city_features_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "home_city_features_cityId_key" ON "home_city_features"("cityId");

-- CreateIndex
CREATE INDEX "home_city_features_isActive_sortOrder_idx" ON "home_city_features"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "home_city_features" ADD CONSTRAINT "home_city_features_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
