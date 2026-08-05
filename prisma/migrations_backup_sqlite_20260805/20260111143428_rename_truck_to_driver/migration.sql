/*
  Warnings:

  - You are about to drop the column `truckName` on the `Transaction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "supplierId" INTEGER,
    "quantity" REAL NOT NULL,
    "pricePerKg" REAL,
    "totalPrice" REAL,
    "manifestWeight" REAL,
    "actualWeight" REAL,
    "weightDiff" REAL,
    "driverName" TEXT,
    "licensePlate" TEXT,
    "sourceWarehouse" TEXT,
    "notes" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("actualWeight", "createdAt", "date", "id", "licensePlate", "manifestWeight", "notes", "pricePerKg", "productId", "quantity", "sourceWarehouse", "supplierId", "totalPrice", "type", "updatedAt", "weightDiff") SELECT "actualWeight", "createdAt", "date", "id", "licensePlate", "manifestWeight", "notes", "pricePerKg", "productId", "quantity", "sourceWarehouse", "supplierId", "totalPrice", "type", "updatedAt", "weightDiff" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
