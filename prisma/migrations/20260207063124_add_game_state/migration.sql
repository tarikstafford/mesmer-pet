-- CreateTable
CREATE TABLE "GameState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "turn" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "winner" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameState_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GameState_petId_idx" ON "GameState"("petId");

-- CreateIndex
CREATE INDEX "GameState_gameType_idx" ON "GameState"("gameType");

-- CreateIndex
CREATE INDEX "GameState_status_idx" ON "GameState"("status");
