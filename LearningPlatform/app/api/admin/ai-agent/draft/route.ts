import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { generateDraft } from '@/lib/ai-agent/generation'

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const draft = await generateDraft(body)
    return NextResponse.json({ draft })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error('[POST /api/admin/ai-agent/draft]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
