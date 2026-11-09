import { z } from 'zod';

// Accepts ISO dates. A date-only "to" (YYYY-MM-DD) includes the whole day.
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

export const dateRangeQuery = z.object({
  from: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
    .transform((v) => new Date(v))
    .optional(),
  to: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
    .transform((v) => (dateOnly.test(v) ? new Date(`${v}T23:59:59.999Z`) : new Date(v)))
    .optional(),
});
