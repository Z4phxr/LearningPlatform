-- CreateTable
CREATE TABLE "flashcard_decks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DeckTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_decks_slug_key" ON "flashcard_decks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_DeckTags_AB_unique" ON "_DeckTags"("A", "B");

-- CreateIndex
CREATE INDEX "_DeckTags_B_index" ON "_DeckTags"("B");

-- AddForeignKey
ALTER TABLE "_DeckTags" ADD CONSTRAINT "_DeckTags_A_fkey" FOREIGN KEY ("A") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeckTags" ADD CONSTRAINT "_DeckTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default deck for existing rows (stable id for migration only)
INSERT INTO "flashcard_decks" ("id", "slug", "name", "description", "createdAt", "updatedAt")
VALUES ('cmigflashdecklegcy1', 'legacy-ungrouped', 'General', 'Cards created before flashcard decks existed.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "flashcards" ADD COLUMN "deckId" TEXT;

UPDATE "flashcards" SET "deckId" = 'cmigflashdecklegcy1' WHERE "deckId" IS NULL;

ALTER TABLE "flashcards" ALTER COLUMN "deckId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "flashcards_deckId_idx" ON "flashcards"("deckId");

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "flashcard_decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
