-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Skill" ("category", "createdAt", "description", "id", "price", "skillName") SELECT "category", "createdAt", "description", "id", "price", "skillName" FROM "Skill";
DROP TABLE "Skill";
ALTER TABLE "new_Skill" RENAME TO "Skill";
CREATE UNIQUE INDEX "Skill_skillName_key" ON "Skill"("skillName");
CREATE INDEX "Skill_category_idx" ON "Skill"("category");
CREATE INDEX "Skill_featured_idx" ON "Skill"("featured");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
