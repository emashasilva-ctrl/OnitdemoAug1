/*
  Warnings:

  - You are about to drop the `MenuHighlight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Restaurant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `cardLast4` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `partySize` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `OpenHours` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `Review` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Restaurant_slug_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MenuHighlight";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Restaurant";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "notes" TEXT,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salonId" TEXT,
    "serviceId" TEXT,
    "durationMins" INTEGER,
    "priceLKR" INTEGER,
    "teamMemberId" TEXT,
    CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("createdAt", "customerId", "customerName", "customerPhone", "date", "durationMins", "id", "isManual", "kind", "notes", "priceLKR", "salonId", "serviceId", "startMinutes", "status", "teamMemberId", "time") SELECT "createdAt", "customerId", "customerName", "customerPhone", "date", "durationMins", "id", "isManual", "kind", "notes", "priceLKR", "salonId", "serviceId", "startMinutes", "status", "teamMemberId", "time" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE INDEX "Appointment_salonId_date_idx" ON "Appointment"("salonId", "date");
CREATE TABLE "new_OpenHours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salonId" TEXT,
    "day" TEXT NOT NULL,
    "openMinutes" INTEGER NOT NULL,
    "closeMinutes" INTEGER NOT NULL,
    CONSTRAINT "OpenHours_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OpenHours" ("closeMinutes", "day", "id", "openMinutes", "salonId") SELECT "closeMinutes", "day", "id", "openMinutes", "salonId" FROM "OpenHours";
DROP TABLE "OpenHours";
ALTER TABLE "new_OpenHours" RENAME TO "OpenHours";
CREATE TABLE "new_Promotion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salonId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promotion_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Promotion" ("createdAt", "description", "endDate", "id", "salonId", "startDate", "title") SELECT "createdAt", "description", "endDate", "id", "salonId", "startDate", "title" FROM "Promotion";
DROP TABLE "Promotion";
ALTER TABLE "new_Promotion" RENAME TO "Promotion";
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salonId" TEXT,
    "author" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "comment" TEXT NOT NULL,
    CONSTRAINT "Review_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("author", "comment", "date", "id", "rating", "salonId") SELECT "author", "comment", "date", "id", "rating", "salonId" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
