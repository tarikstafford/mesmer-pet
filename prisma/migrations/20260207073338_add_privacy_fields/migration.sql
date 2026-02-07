-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" DATETIME,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "provider" TEXT DEFAULT 'email',
    "providerId" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "dateOfBirth" DATETIME,
    "cookieConsent" BOOLEAN NOT NULL DEFAULT false,
    "dataProcessingConsent" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "deletionRequestedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "emailVerifiedAt", "id", "isAdmin", "name", "password", "provider", "providerId", "updatedAt") SELECT "createdAt", "email", "emailVerified", "emailVerifiedAt", "id", "isAdmin", "name", "password", "provider", "providerId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
