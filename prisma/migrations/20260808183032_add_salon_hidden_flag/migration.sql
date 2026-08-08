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
    "noShowFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "noShowFeePercent" INTEGER NOT NULL DEFAULT 20,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Salon_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Salon" ("about", "address", "amenities", "area", "cancellationFeeEnabled", "cancellationFeePercent", "categories", "coverImage", "featured", "galleryImages", "gallerySeeds", "id", "imageSeed", "lat", "lng", "mioSalonEmbedCode", "name", "noShowFeeEnabled", "noShowFeePercent", "ownerId", "phone", "priceLevel", "rating", "reviewCount", "slug", "tagline", "whatsappNumber") SELECT "about", "address", "amenities", "area", "cancellationFeeEnabled", "cancellationFeePercent", "categories", "coverImage", "featured", "galleryImages", "gallerySeeds", "id", "imageSeed", "lat", "lng", "mioSalonEmbedCode", "name", "noShowFeeEnabled", "noShowFeePercent", "ownerId", "phone", "priceLevel", "rating", "reviewCount", "slug", "tagline", "whatsappNumber" FROM "Salon";
DROP TABLE "Salon";
ALTER TABLE "new_Salon" RENAME TO "Salon";
CREATE UNIQUE INDEX "Salon_slug_key" ON "Salon"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
