-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "petId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platform" TEXT NOT NULL,
    "deviceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OfflineAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "petId" TEXT,
    "actionType" TEXT NOT NULL,
    "actionData" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "platform" TEXT NOT NULL,
    "deviceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" DATETIME,
    "error" TEXT
);

-- CreateIndex
CREATE INDEX "SyncState_userId_idx" ON "SyncState"("userId");

-- CreateIndex
CREATE INDEX "SyncState_petId_idx" ON "SyncState"("petId");

-- CreateIndex
CREATE INDEX "SyncState_entityType_idx" ON "SyncState"("entityType");

-- CreateIndex
CREATE INDEX "SyncState_lastSyncedAt_idx" ON "SyncState"("lastSyncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyncState_userId_entityType_entityId_key" ON "SyncState"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "OfflineAction_userId_idx" ON "OfflineAction"("userId");

-- CreateIndex
CREATE INDEX "OfflineAction_petId_idx" ON "OfflineAction"("petId");

-- CreateIndex
CREATE INDEX "OfflineAction_status_idx" ON "OfflineAction"("status");

-- CreateIndex
CREATE INDEX "OfflineAction_createdAt_idx" ON "OfflineAction"("createdAt");
