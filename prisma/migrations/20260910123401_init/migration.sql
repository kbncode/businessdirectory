-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_entities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "business_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "business_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_main_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "business_main_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_sub_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mainCategoryId" TEXT NOT NULL,

    CONSTRAINT "business_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "establishedYear" INTEGER,
    "businessPhone" TEXT NOT NULL,
    "personalPhone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "entityId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "mainCategoryId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "stateId" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "nativePlace" TEXT,
    "address" TEXT,
    "about" TEXT,
    "productsServices" TEXT,
    "experience" TEXT,
    "socialLinks" TEXT,
    "photoUrl" TEXT,
    "brochureUrl" TEXT,
    "additionalNote" TEXT,
    "status" "BusinessStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_sub_category_map" (
    "businessId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,

    CONSTRAINT "business_sub_category_map_pkey" PRIMARY KEY ("businessId","subCategoryId")
);

-- CreateTable
CREATE TABLE "app_messages" (
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "app_messages_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE INDEX "states_countryId_idx" ON "states"("countryId");

-- CreateIndex
CREATE INDEX "cities_stateId_idx" ON "cities"("stateId");

-- CreateIndex
CREATE INDEX "cities_name_idx" ON "cities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "business_entities_name_key" ON "business_entities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "business_types_name_key" ON "business_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "business_main_categories_name_key" ON "business_main_categories"("name");

-- CreateIndex
CREATE INDEX "business_sub_categories_mainCategoryId_idx" ON "business_sub_categories"("mainCategoryId");

-- CreateIndex
CREATE INDEX "businesses_countryId_stateId_city_status_idx" ON "businesses"("countryId", "stateId", "city", "status");

-- CreateIndex
CREATE INDEX "businesses_mainCategoryId_status_idx" ON "businesses"("mainCategoryId", "status");

-- CreateIndex
CREATE INDEX "businesses_submittedById_idx" ON "businesses"("submittedById");

-- CreateIndex
CREATE INDEX "business_sub_category_map_subCategoryId_idx" ON "business_sub_category_map"("subCategoryId");

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_sub_categories" ADD CONSTRAINT "business_sub_categories_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "business_main_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "business_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "business_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "business_main_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_sub_category_map" ADD CONSTRAINT "business_sub_category_map_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_sub_category_map" ADD CONSTRAINT "business_sub_category_map_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "business_sub_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
