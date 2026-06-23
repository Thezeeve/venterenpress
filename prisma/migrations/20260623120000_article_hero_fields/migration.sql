-- AlterTable
ALTER TABLE "Article"
ADD COLUMN "showOnHero" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "heroStartAt" TIMESTAMP(3),
ADD COLUMN "heroEndAt" TIMESTAMP(3),
ADD COLUMN "heroPriority" INTEGER;

-- CreateIndex
CREATE INDEX "Article_showOnHero_heroStartAt_heroEndAt_heroPriority_publishedAt_idx"
ON "Article"("showOnHero", "heroStartAt", "heroEndAt", "heroPriority", "publishedAt");
