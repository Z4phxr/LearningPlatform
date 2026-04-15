import { randomUUID } from 'crypto'

/** In-memory run state only: lost on redeploy, not shared across server instances. Suitable for single-node / local dev; use a shared store for multi-instance production. */

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed'
export type TimelineStatus = 'pending' | 'running' | 'done' | 'error'

export interface TimelineItem {
  id: string
  label: string
  status: TimelineStatus
  detail?: string
  at: number
}

export interface GenerationRun {
  runId: string
  status: RunStatus
  createdAt: number
  updatedAt: number
  progress: number
  timeline: TimelineItem[]
  result?: Record<string, unknown>
  error?: string
}

const runs = new Map<string, GenerationRun>()
const MAX_RUNS = 50

function now(): number {
  return Date.now()
}

function trimStore() {
  if (runs.size <= MAX_RUNS) return
  const byOldest = Array.from(runs.values()).sort((a, b) => a.updatedAt - b.updatedAt)
  for (const item of byOldest.slice(0, runs.size - MAX_RUNS)) {
    runs.delete(item.runId)
  }
}

export function createRun(): GenerationRun {
  const run: GenerationRun = {
    runId: randomUUID(),
    status: 'queued',
    createdAt: now(),
    updatedAt: now(),
    progress: 0,
    timeline: [],
  }
  runs.set(run.runId, run)
  trimStore()
  return run
}

export function getRun(runId: string): GenerationRun | null {
  return runs.get(runId) ?? null
}

export function setRunStatus(runId: string, status: RunStatus) {
  const run = runs.get(runId)
  if (!run) return
  run.status = status
  run.updatedAt = now()
}

export function setProgress(runId: string, progress: number) {
  const run = runs.get(runId)
  if (!run) return
  run.progress = Math.max(0, Math.min(100, Math.round(progress)))
  run.updatedAt = now()
}

export function addTimeline(
  runId: string,
  item: Omit<TimelineItem, 'at'> & { at?: number },
): string | null {
  const run = runs.get(runId)
  if (!run) return null
  const entry: TimelineItem = { ...item, at: item.at ?? now() }
  run.timeline.push(entry)
  run.updatedAt = now()
  return entry.id
}

export function updateTimeline(runId: string, id: string, patch: Partial<TimelineItem>) {
  const run = runs.get(runId)
  if (!run) return
  const idx = run.timeline.findIndex((t) => t.id === id)
  if (idx < 0) return
  run.timeline[idx] = { ...run.timeline[idx], ...patch, at: now() }
  run.updatedAt = now()
}

export function completeRun(runId: string, result?: Record<string, unknown>) {
  const run = runs.get(runId)
  if (!run) return
  run.status = 'completed'
  run.progress = 100
  run.result = result
  run.updatedAt = now()
}

export function failRun(runId: string, error: string) {
  const run = runs.get(runId)
  if (!run) return
  run.status = 'failed'
  run.error = error
  run.updatedAt = now()
}
