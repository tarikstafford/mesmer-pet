-- CreateTable
CREATE TABLE "UserTutorial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "rewardGranted" BOOLEAN NOT NULL DEFAULT false,
    "stepCreatePet" BOOLEAN NOT NULL DEFAULT false,
    "stepFeed" BOOLEAN NOT NULL DEFAULT false,
    "stepChat" BOOLEAN NOT NULL DEFAULT false,
    "stepViewStats" BOOLEAN NOT NULL DEFAULT false,
    "stepLearnBreeding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "UserTutorial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTutorial_userId_key" ON "UserTutorial"("userId");

-- CreateIndex
CREATE INDEX "UserTutorial_userId_idx" ON "UserTutorial"("userId");

-- CreateIndex
CREATE INDEX "UserTutorial_completed_idx" ON "UserTutorial"("completed");
