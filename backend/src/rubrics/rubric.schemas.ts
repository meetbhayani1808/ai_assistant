import { z } from 'zod';

const criterionSchema = z
  .object({
    _id: z.string().optional(), // keep id when editing an existing criterion
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(500).default(''),
    minScore: z.number().int().default(1),
    maxScore: z.number().int().default(5),
  })
  .strict()
  .refine((c) => c.minScore < c.maxScore, { message: 'minScore must be less than maxScore' });

const base = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).default(''),
  criteria: z
    .array(criterionSchema)
    .min(1, 'At least one criterion is required')
    .max(20)
    .refine(
      (list) => new Set(list.map((c) => c.name.toLowerCase())).size === list.length,
      { message: 'Criterion names must be unique' },
    ),
});

export const createRubricSchema = base.strict();
export const updateRubricSchema = base.partial().strict();
