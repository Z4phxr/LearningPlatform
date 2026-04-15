import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { getRun } from '@/lib/ai-agent/progress-store'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ runId: string }> },
) {
  try {
    await requireAdmin()
    const { runId } = await ctx.params
    const run = getRun(runId)
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }
    return NextResponse.json({ run })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error('[GET /api/admin/ai-agent/progress/[runId]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
