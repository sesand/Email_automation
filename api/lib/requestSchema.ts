import { z } from 'zod';

export const toneSchema = z.enum(['Professional', 'Friendly', 'Formal', 'Assertive']);
export const lengthSchema = z.enum(['Concise', 'Standard', 'Detailed']);

const baseSchema = z.object({
  purpose: z.string().trim().min(3).max(200),
  recipientName: z.string().trim().min(2).max(100),
  recipientDesignation: z.string().trim().max(120).default(''),
  keyPoints: z.string().trim().min(10).max(2_000),
  tone: toneSchema,
  length: lengthSchema,
}).strict();

const generatedEmailSchema = z.object({
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(10_000),
}).strict();

export const emailRequestSchema = z.discriminatedUnion('mode', [
  baseSchema.extend({ mode: z.literal('generate') }),
  baseSchema.extend({
    mode: z.literal('refine'),
    currentEmail: generatedEmailSchema,
    refinementInstruction: z.string().trim().min(3).max(500),
  }),
]);

export type ValidatedEmailRequest = z.infer<typeof emailRequestSchema>;
export { generatedEmailSchema };
