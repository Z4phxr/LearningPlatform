import { z } from 'zod'

export const aiProviderSchema = z.enum(['anthropic', 'openai'])

export const discoverySchema = z.object({
  topic: z.string().min(2),
  title: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  currentKnowledge: z.enum(['beginner', 'novice', 'intermediate', 'advanced']),
  learningWhy: z.enum(['job', 'project', 'school', 'professional', 'hobby']),
  depth: z.enum(['overview', 'foundation', 'deep', 'expert']),
  timeBudget: z.enum(['week30', 'month1h', 'months2h', 'selfpaced']),
  focusAreas: z.string().optional(),
  wantFlashcards: z.boolean().default(false),
  flashcardTarget: z.enum(['50', '100', '200']).optional(),
  provider: aiProviderSchema.default('anthropic'),
  model: z.string().optional(),
})

export const tagDraftSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  main: z.boolean().optional(),
})

export const lessonDraftSchema = z.object({
  title: z.string().min(2),
  order: z.number().int().positive(),
  isPublished: z.boolean().default(false),
  learningGoal: z.string().min(3),
  targetTheoryBlocks: z.number().int().min(4).max(20),
  targetTasks: z.number().int().min(2).max(12),
})

export const moduleDraftSchema = z.object({
  title: z.string().min(2),
  order: z.number().int().positive(),
  isPublished: z.boolean().default(false),
  lessons: z.array(lessonDraftSchema).min(1),
})

export const draftCourseSchema = z.object({
  subject: z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
  }),
  course: z.object({
    title: z.string().min(2),
    slug: z.string().min(2),
    description: z.string().min(10),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    isPublished: z.boolean().default(false),
  }),
  tags: z.array(tagDraftSchema).default([]),
  modules: z.array(moduleDraftSchema).min(1),
  flashcards: z
    .object({
      enabled: z.boolean(),
      targetCount: z.number().int().positive().optional(),
    })
    .optional(),
})

export const draftRequestSchema = z.object({
  discovery: discoverySchema,
  userMessage: z.string().min(1),
  currentDraft: z
    .unknown()
    .optional()
    .transform((val): z.infer<typeof draftCourseSchema> | undefined => {
      if (val === undefined) return undefined
      const parsed = draftCourseSchema.safeParse(val)
      return parsed.success ? parsed.data : undefined
    }),
})

export const theoryBlockSchema = z.discriminatedUnion('blockType', [
  z.object({
    blockType: z.literal('text'),
    content: z.string().min(20),
  }),
  z.object({
    blockType: z.literal('callout'),
    variant: z.enum(['info', 'warning', 'tip']),
    title: z.string().optional(),
    content: z.string().min(10),
  }),
  z.object({
    blockType: z.literal('table'),
    caption: z.string().optional(),
    hasHeaders: z.boolean(),
    headers: z.array(z.string()).default([]),
    rows: z.array(z.array(z.string())).default([]),
  }),
  z.object({
    blockType: z.literal('image'),
    image: z.string(),
    caption: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    width: z.enum(['sm', 'md', 'lg', 'full']).optional(),
  }),
  z.object({
    blockType: z.literal('video'),
    videoUrl: z.string().url(),
    title: z.string().min(2).optional(),
    caption: z.string().optional(),
    aspectRatio: z.enum(['16:9', '4:3']).default('16:9'),
  }),
  z.object({
    blockType: z.literal('math'),
    latex: z.string().min(1),
    displayMode: z.boolean().default(true),
    note: z.string().optional(),
  }),
])

export const taskOutSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('MULTIPLE_CHOICE'),
    order: z.number().int().positive(),
    prompt: z.string().min(5),
    tagSlugs: z.array(z.string()).default([]),
    choices: z.array(z.string()).min(2),
    correctAnswer: z.string().min(1),
    solution: z.string().min(5),
    points: z.number().int().positive().default(1),
    isPublished: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('TRUE_FALSE'),
    order: z.number().int().positive(),
    prompt: z.string().min(5),
    tagSlugs: z.array(z.string()).default([]),
    correctAnswer: z.enum(['true', 'false']),
    solution: z.string().min(5),
    points: z.number().int().positive().default(1),
    isPublished: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('OPEN_ENDED'),
    order: z.number().int().positive(),
    prompt: z.string().min(5),
    tagSlugs: z.array(z.string()).default([]),
    solution: z.string().min(5),
    points: z.number().int().positive().default(2),
    isPublished: z.boolean().default(false),
  }),
])

export const finalLessonSchema = z.object({
  title: z.string().min(2),
  order: z.number().int().positive(),
  isPublished: z.boolean().default(false),
  theoryBlocks: z.array(theoryBlockSchema).min(4),
  tasks: z.array(taskOutSchema).min(2),
})

export const finalModuleSchema = z.object({
  title: z.string().min(2),
  order: z.number().int().positive(),
  isPublished: z.boolean().default(false),
  lessons: z.array(finalLessonSchema).min(1),
})

export const finalModuleResponseSchema = z.object({
  module: finalModuleSchema,
})

export const flashcardResponseSchema = z.object({
  deck: z.object({
    slug: z.string().min(2),
    name: z.string().min(2),
    description: z.string().optional(),
    tagSlugs: z.array(z.string()).default([]),
  }),
  cards: z.array(
    z.object({
      question: z.string().min(3),
      answer: z.string().min(3),
      tagSlugs: z.array(z.string()).default([]),
    }),
  ),
})

export const acceptRequestSchema = z.object({
  discovery: discoverySchema,
  draft: draftCourseSchema,
})

export type DraftCourse = z.infer<typeof draftCourseSchema>
export type DiscoveryInput = z.infer<typeof discoverySchema>
