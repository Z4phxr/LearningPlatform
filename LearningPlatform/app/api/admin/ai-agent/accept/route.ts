import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { createRun } from '@/lib/ai-agent/progress-store'
import { runAcceptPipeline } from '@/lib/ai-agent/generation'

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()
    const run = createRun()

    void runAcceptPipeline(run.runId, body, {
      id: admin.id,
      email: admin.email,
    })

    return NextResponse.json({ runId: run.runId }, { status: 202 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error('[POST /api/admin/ai-agent/accept]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
