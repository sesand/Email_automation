import { describe, expect, it } from 'vitest';
import { emailRequestSchema } from './requestSchema';

const valid = {
  mode: 'generate', purpose: 'Interview Scheduling', recipientName: 'Rahul Sharma', recipientDesignation: 'Senior Developer',
  keyPoints: 'Monday at 11:00 AM via Microsoft Teams', tone: 'Professional', length: 'Concise',
};

describe('emailRequestSchema', () => {
  it('accepts valid generation data', () => expect(emailRequestSchema.safeParse(valid).success).toBe(true));
  it('rejects invalid tone', () => expect(emailRequestSchema.safeParse({ ...valid, tone: 'Casual' }).success).toBe(false));
  it('rejects invalid length', () => expect(emailRequestSchema.safeParse({ ...valid, length: 'Very long' }).success).toBe(false));
  it('requires current email and instruction for refinement', () => expect(emailRequestSchema.safeParse({ ...valid, mode: 'refine' }).success).toBe(false));
  it('rejects oversized input', () => expect(emailRequestSchema.safeParse({ ...valid, keyPoints: 'x'.repeat(2001) }).success).toBe(false));
});
