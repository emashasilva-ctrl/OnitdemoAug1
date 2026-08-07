-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "appliedRuleLabel" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "basePriceLKR" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "cancellationFeeLKR" INTEGER;

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salonId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "days" TEXT NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "appliesToAllServices" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PricingRule_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PricingRuleServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PricingRuleServices_A_fkey" FOREIGN KEY ("A") REFERENCES "PricingRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PricingRuleServices_B_fkey" FOREIGN KEY ("B") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Salon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "categories" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "priceLevel" INTEGER NOT NULL,
    "imageSeed" TEXT NOT NULL,
    "gallerySeeds" TEXT NOT NULL,
    "coverImage" TEXT,
    "galleryImages" TEXT,
    "about" TEXT NOT NULL,
    "amenities" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "mioSalonEmbedCode" TEXT,
    "cancellationFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cancellationFeePercent" INTEGER NOT NULL DEFAULT 20,
    CONSTRAINT "Salon_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Salon" ("about", "address", "amenities", "area", "categories", "coverImage", "featured", "galleryImages", "gallerySeeds", "id", "imageSeed", "lat", "lng", "mioSalonEmbedCode", "name", "ownerId", "phone", "priceLevel", "rating", "reviewCount", "slug", "tagline", "whatsappNumber") SELECT "about", "address", "amenities", "area", "categories", "coverImage", "featured", "galleryImages", "gallerySeeds", "id", "imageSeed", "lat", "lng", "mioSalonEmbedCode", "name", "ownerId", "phone", "priceLevel", "rating", "reviewCount", "slug", "tagline", "whatsappNumber" FROM "Salon";
DROP TABLE "Salon";
ALTER TABLE "new_Salon" RENAME TO "Salon";
CREATE UNIQUE INDEX "Salon_slug_key" ON "Salon"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_PricingRuleServices_AB_unique" ON "_PricingRuleServices"("A", "B");

-- CreateIndex
CREATE INDEX "_PricingRuleServices_B_index" ON "_PricingRuleServices"("B");
