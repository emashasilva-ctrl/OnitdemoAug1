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
    "restaurantId" TEXT,
    "partySize" INTEGER,
    "cardLast4" TEXT,
    CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("cardLast4", "createdAt", "customerId", "customerName", "customerPhone", "date", "durationMins", "id", "kind", "notes", "partySize", "priceLKR", "restaurantId", "salonId", "serviceId", "startMinutes", "status", "time") SELECT "cardLast4", "createdAt", "customerId", "customerName", "customerPhone", "date", "durationMins", "id", "kind", "notes", "partySize", "priceLKR", "restaurantId", "salonId", "serviceId", "startMinutes", "status", "time" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE INDEX "Appointment_salonId_date_idx" ON "Appointment"("salonId", "date");
CREATE INDEX "Appointment_restaurantId_date_idx" ON "Appointment"("restaurantId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
