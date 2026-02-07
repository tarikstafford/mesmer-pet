-- CreateTable
CREATE TABLE "RecoveryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'potion',
    "price" REAL NOT NULL,
    "earnable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserRecoveryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "acquiredDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRecoveryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRecoveryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RecoveryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "health" INTEGER NOT NULL DEFAULT 100,
    "hunger" INTEGER NOT NULL DEFAULT 0,
    "happiness" INTEGER NOT NULL DEFAULT 100,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "maxHealthPenalty" INTEGER NOT NULL DEFAULT 0,
    "neglectStartedAt" DATETIME,
    "friendliness" INTEGER NOT NULL DEFAULT 50,
    "energyTrait" INTEGER NOT NULL DEFAULT 50,
    "curiosity" INTEGER NOT NULL DEFAULT 50,
    "patience" INTEGER NOT NULL DEFAULT 50,
    "playfulness" INTEGER NOT NULL DEFAULT 50,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "parent1Id" TEXT,
    "parent2Id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastFedAt" DATETIME,
    "lastInteractionAt" DATETIME,
    "lastStatUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pet" ("createdAt", "curiosity", "energy", "energyTrait", "friendliness", "generation", "happiness", "health", "hunger", "id", "lastFedAt", "lastInteractionAt", "lastStatUpdate", "name", "parent1Id", "parent2Id", "patience", "playfulness", "updatedAt", "userId") SELECT "createdAt", "curiosity", "energy", "energyTrait", "friendliness", "generation", "happiness", "health", "hunger", "id", "lastFedAt", "lastInteractionAt", "lastStatUpdate", "name", "parent1Id", "parent2Id", "patience", "playfulness", "updatedAt", "userId" FROM "Pet";
DROP TABLE "Pet";
ALTER TABLE "new_Pet" RENAME TO "Pet";
CREATE INDEX "Pet_userId_idx" ON "Pet"("userId");
CREATE INDEX "Pet_parent1Id_idx" ON "Pet"("parent1Id");
CREATE INDEX "Pet_parent2Id_idx" ON "Pet"("parent2Id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryItem_itemName_key" ON "RecoveryItem"("itemName");

-- CreateIndex
CREATE INDEX "RecoveryItem_earnable_idx" ON "RecoveryItem"("earnable");

-- CreateIndex
CREATE INDEX "UserRecoveryItem_userId_idx" ON "UserRecoveryItem"("userId");

-- CreateIndex
CREATE INDEX "UserRecoveryItem_itemId_idx" ON "UserRecoveryItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRecoveryItem_userId_itemId_key" ON "UserRecoveryItem"("userId", "itemId");
