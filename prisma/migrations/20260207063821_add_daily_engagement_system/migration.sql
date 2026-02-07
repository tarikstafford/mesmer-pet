-- CreateTable
CREATE TABLE "UserEngagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lastLoginDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStreak" INTEGER NOT NULL DEFAULT 1,
    "longestStreak" INTEGER NOT NULL DEFAULT 1,
    "totalLogins" INTEGER NOT NULL DEFAULT 1,
    "virtualCurrency" INTEGER NOT NULL DEFAULT 0,
    "milestone7Days" BOOLEAN NOT NULL DEFAULT false,
    "milestone30Days" BOOLEAN NOT NULL DEFAULT false,
    "milestone100Days" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserEngagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "challengeType" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "reward" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "assignedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" DATETIME,
    CONSTRAINT "UserChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEngagement_userId_key" ON "UserEngagement"("userId");

-- CreateIndex
CREATE INDEX "UserEngagement_userId_idx" ON "UserEngagement"("userId");

-- CreateIndex
CREATE INDEX "UserEngagement_lastLoginDate_idx" ON "UserEngagement"("lastLoginDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_challengeName_key" ON "DailyChallenge"("challengeName");

-- CreateIndex
CREATE INDEX "DailyChallenge_active_idx" ON "DailyChallenge"("active");

-- CreateIndex
CREATE INDEX "UserChallenge_userId_idx" ON "UserChallenge"("userId");

-- CreateIndex
CREATE INDEX "UserChallenge_challengeId_idx" ON "UserChallenge"("challengeId");

-- CreateIndex
CREATE INDEX "UserChallenge_assignedDate_idx" ON "UserChallenge"("assignedDate");

-- CreateIndex
CREATE INDEX "UserChallenge_completed_idx" ON "UserChallenge"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_userId_challengeId_assignedDate_key" ON "UserChallenge"("userId", "challengeId", "assignedDate");
