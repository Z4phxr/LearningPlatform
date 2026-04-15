import type { DraftCourse, DiscoveryInput } from './schemas'

function discoverySummary(input: DiscoveryInput): string {
  return [
    `topic=${input.topic}`,
    `optionalTitle=${input.title || '(none)'}`,
    `level=${input.level || '(infer)'}`,
    `currentKnowledge=${input.currentKnowledge}`,
    `learningWhy=${input.learningWhy}`,
    `depth=${input.depth}`,
    `timeBudget=${input.timeBudget}`,
    `focusAreas=${input.focusAreas || '(none)'}`,
    `wantFlashcards=${input.wantFlashcards ? 'yes' : 'no'}`,
    `flashcardTarget=${input.flashcardTarget || '(none)'}`,
  ].join('\n')
}

export function draftSystemPrompt(): string {
  return [
    'You are an educational course architect for an admin learning platform.',
    'Return STRICT JSON only; no markdown and no explanation.',
    'Output shape keys: subject, course, tags, modules, flashcards.',
    'Draft mode only: do not write full theoryBlocks/tasks content.',
    'Each lesson must include learningGoal, targetTheoryBlocks, targetTasks.',
    'Tags should be useful for future tasks and flashcards.',
    'Ordering must be sequential and deterministic.',
  ].join('\n')
}

export function buildDraftUserPrompt(args: {
  discovery: DiscoveryInput
  userMessage: string
  currentDraft?: DraftCourse | null
}): string {
  const { discovery, userMessage, currentDraft } = args
  const base = [
    'Generate or revise a draft course structure from this discovery data.',
    'If currentDraft exists, treat userMessage as follow-up edits to apply.',
    'Preserve stable ordering unless user asks changes.',
    '',
    'DISCOVERY:',
    discoverySummary(discovery),
    '',
    'FOLLOW_UP_REQUEST:',
    userMessage,
  ]
  if (currentDraft) {
    base.push('', 'CURRENT_DRAFT_JSON:', JSON.stringify(currentDraft))
  }
  return base.join('\n')
}

export function moduleSystemPrompt(): string {
  return [
    'You generate full module content JSON for a learning platform.',
    'Return STRICT JSON only: {"module":{...}}.',
    'Include lessons with theoryBlocks and tasks.',
    'Theory blocks should be pedagogical and detailed.',
    'Use image placeholders as "__IMPORT_PLACEHOLDER_IMAGE__" when visuals help.',
    'Task tagSlugs should come from provided tags when possible.',
  ].join('\n')
}

export function buildModuleUserPrompt(args: {
  discovery: DiscoveryInput
  draft: DraftCourse
  moduleOrder: number
}): string {
  const mod = args.draft.modules.find((m) => m.order === args.moduleOrder)
  return [
    'Generate full content for exactly one module.',
    'Respect this module draft and keep lesson titles/orders stable.',
    'Course context JSON:',
    JSON.stringify({
      discovery: args.discovery,
      subject: args.draft.subject,
      course: args.draft.course,
      tags: args.draft.tags,
    }),
    'Target module draft JSON:',
    JSON.stringify(mod),
  ].join('\n')
}

export function flashcardsSystemPrompt(): string {
  return [
    'Generate flashcards JSON for the course.',
    'Return STRICT JSON only with keys: deck, cards.',
    'Cards should be concise and self-contained.',
    'Use provided tag slugs where possible.',
  ].join('\n')
}

export function buildFlashcardsUserPrompt(args: { draft: DraftCourse; discovery: DiscoveryInput }): string {
  return [
    'Generate deck and cards aligned with this course draft.',
    'Course draft:',
    JSON.stringify(args.draft),
    'Discovery:',
    JSON.stringify(args.discovery),
  ].join('\n')
}

export function repairPrompt(errors: string[], badJson: string): string {
  return [
    'Your previous JSON failed validation.',
    'Fix only these issues and return corrected JSON only.',
    'Validation issues:',
    ...errors.map((e) => `- ${e}`),
    '',
    'Original JSON:',
    badJson,
  ].join('\n')
}
