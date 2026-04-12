/**
 * Flashcards (Prisma). Deduped by (deck + question + card tag set). Run after tags.
 */
module.exports = {
  deck: {
    slug: 'javascript-flashcards',
    name: 'JavaScript Flashcards',
    description: 'Core JavaScript concepts.',
    tagSlugs: ['javascript'],
  },
  cards: [
    {
      question: 'What is the JS engine in Chrome called?',
      answer: 'V8',
      tagSlugs: ['javascript', 'basics'],
    },
  ],
}
