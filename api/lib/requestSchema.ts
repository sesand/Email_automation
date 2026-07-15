export type Tone = 'Professional' | 'Friendly' | 'Formal' | 'Assertive';
export type EmailLength = 'Concise' | 'Standard' | 'Detailed';

export interface GeneratedEmail {
  subject: string;
  body: string;
}

interface BaseEmailRequest {
  purpose: string;
  recipientName: string;
  recipientDesignation: string;
  keyPoints: string;
  tone: Tone;
  length: EmailLength;
}

export type ValidatedEmailRequest = BaseEmailRequest & (
  | { mode: 'generate' }
  | { mode: 'refine'; currentEmail: GeneratedEmail; refinementInstruction: string }
);

type ParseResult<T> = { success: true; data: T } | { success: false; error: string };
const fail = <T>(): ParseResult<T> => ({ success: false, error: 'Invalid input.' });
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function exactKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function boundedString(value: unknown, min: number, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max ? trimmed : undefined;
}

export const generatedEmailSchema = {
  safeParse(value: unknown): ParseResult<GeneratedEmail> {
    if (!isRecord(value) || !exactKeys(value, ['subject', 'body'])) return fail();
    const subject = boundedString(value.subject, 1, 300);
    const body = boundedString(value.body, 1, 10_000);
    return subject && body ? { success: true, data: { subject, body } } : fail();
  },
};

export const emailRequestSchema = {
  safeParse(value: unknown): ParseResult<ValidatedEmailRequest> {
    if (!isRecord(value) || (value.mode !== 'generate' && value.mode !== 'refine')) return fail();
    const commonKeys = ['mode', 'purpose', 'recipientName', 'recipientDesignation', 'keyPoints', 'tone', 'length'];
    const allowed = value.mode === 'refine' ? [...commonKeys, 'currentEmail', 'refinementInstruction'] : commonKeys;
    if (!exactKeys(value, allowed)) return fail();

    const purpose = boundedString(value.purpose, 3, 200);
    const recipientName = boundedString(value.recipientName, 2, 100);
    const recipientDesignation = value.recipientDesignation === undefined
      ? ''
      : boundedString(value.recipientDesignation, 0, 120);
    const keyPoints = boundedString(value.keyPoints, 10, 2_000);
    const tone = ['Professional', 'Friendly', 'Formal', 'Assertive'].includes(String(value.tone)) ? value.tone as Tone : undefined;
    const length = ['Concise', 'Standard', 'Detailed'].includes(String(value.length)) ? value.length as EmailLength : undefined;
    if (!purpose || !recipientName || recipientDesignation === undefined || !keyPoints || !tone || !length) return fail();

    const base: BaseEmailRequest = { purpose, recipientName, recipientDesignation, keyPoints, tone, length };
    if (value.mode === 'generate') return { success: true, data: { ...base, mode: 'generate' } };

    const currentEmail = generatedEmailSchema.safeParse(value.currentEmail);
    const refinementInstruction = boundedString(value.refinementInstruction, 3, 500);
    if (!currentEmail.success || !refinementInstruction) return fail();
    return { success: true, data: { ...base, mode: 'refine', currentEmail: currentEmail.data, refinementInstruction } };
  },
};
