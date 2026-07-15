export const TONES = ['Professional', 'Friendly', 'Formal', 'Assertive'] as const;
export const LENGTHS = ['Concise', 'Standard', 'Detailed'] as const;

export type Tone = (typeof TONES)[number];
export type EmailLength = (typeof LENGTHS)[number];
export type RequestMode = 'generate' | 'refine';

export interface EmailFormValues {
  templateId: string;
  purpose: string;
  recipientName: string;
  recipientDesignation: string;
  keyPoints: string;
  tone: Tone;
  length: EmailLength;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface EmailRequest extends Omit<EmailFormValues, 'templateId'> {
  mode: RequestMode;
  currentEmail?: GeneratedEmail;
  refinementInstruction?: string;
}

export type FieldErrors = Partial<Record<keyof EmailFormValues | 'refinementInstruction', string>>;

export const EMPTY_FORM: EmailFormValues = {
  templateId: '',
  purpose: '',
  recipientName: '',
  recipientDesignation: '',
  keyPoints: '',
  tone: 'Professional',
  length: 'Standard',
};
