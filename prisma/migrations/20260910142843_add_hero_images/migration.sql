-- CreateTable
CREATE TABLE "hero_images" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "originalSizeKb" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hero_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_images_isActive_sortOrder_idx" ON "hero_images"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "hero_images" ADD CONSTRAINT "hero_images_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
