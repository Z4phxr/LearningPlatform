import type { PrismaClient } from '@prisma/client'

/** Ensures `deckId` and every `tagIds` row exist before connect/create. */
export async function validateFlashcardDeckAndTags(
  prisma: PrismaClient,
  deckId: string,
  tagIds: string[],
): Promise<{ ok: true } | { ok: false; issues: Record<string, string[]> }> {
  const deck = await prisma.flashcardDeck.findUnique({ where: { id: deckId }, select: { id: true } })
  if (!deck) {
    return { ok: false, issues: { deckId: ['Deck not found'] } }
  }
  if (tagIds.length === 0) return { ok: true }
  const found = await prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true } })
  if (found.length !== tagIds.length) {
    return { ok: false, issues: { tagIds: ['One or more tags do not exist'] } }
  }
  return { ok: true }
}
