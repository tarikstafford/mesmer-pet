-- CreateTable
CREATE TABLE "Trait" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "traitName" TEXT NOT NULL,
    "traitType" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PetTrait" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "traitId" TEXT NOT NULL,
    "inheritanceSource" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PetTrait_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PetTrait_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "Trait" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Trait_traitName_key" ON "Trait"("traitName");

-- CreateIndex
CREATE INDEX "Trait_traitType_idx" ON "Trait"("traitType");

-- CreateIndex
CREATE INDEX "Trait_rarity_idx" ON "Trait"("rarity");

-- CreateIndex
CREATE INDEX "PetTrait_petId_idx" ON "PetTrait"("petId");

-- CreateIndex
CREATE INDEX "PetTrait_traitId_idx" ON "PetTrait"("traitId");

-- CreateIndex
CREATE UNIQUE INDEX "PetTrait_petId_traitId_key" ON "PetTrait"("petId", "traitId");
