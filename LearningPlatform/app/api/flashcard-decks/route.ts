import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'
import { toSlug } from '@/lib/utils'

const createDeckSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional().default([]),
})

/** GET /api/flashcard-decks — list decks (admin). */
export async function GET() {
  try {
    await requireAdmin()

    const decks = await prisma.flashcardDeck.findMany({
      orderBy: { name: 'asc' },
      include: {
        tags: { select: { id: true, name: true, slug: true } },
        _count: { select: { flashcards: true } },
      },
    })

    return NextResponse.json({ decks })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error('[GET /api/flashcard-decks]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/flashcard-decks — create deck (admin). */
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const parsed = createDeckSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { name, description, tagIds } = parsed.data
    const slug = parsed.data.slug?.trim() ? toSlug(parsed.data.slug.trim()) : toSlug(name)

    const deck = await prisma.flashcardDeck.create({
      data: {
        slug,
        name: name.trim(),
        description: description ?? null,
        tags: { connect: tagIds.map((id) => ({ id })) },
      },
      include: {
        tags: { select: { id: true, name: true, slug: true } },
        _count: { select: { flashcards: true } },
      },
    })

    return NextResponse.json({ deck }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            error: 'Conflict',
            issues: { slug: ['A deck with this slug already exists'] },
          },
          { status: 409 },
        )
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          {
            error: 'Validation failed',
            issues: { tagIds: ['One or more tags do not exist'] },
          },
          { status: 400 },
        )
      }
    }
    console.error('[POST /api/flashcard-decks]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
