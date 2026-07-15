import { LENGTHS, TONES, type EmailFormValues, type FieldErrors } from '../types/email';

export function trimFormValues(values: EmailFormValues): EmailFormValues {
  return {
    ...values,
    purpose: values.purpose.trim(),
    recipientName: values.recipientName.trim(),
    recipientDesignation: values.recipientDesignation.trim(),
    keyPoints: values.keyPoints.trim(),
  };
}

export function validateForm(values: EmailFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const purpose = values.purpose.trim();
  const name = values.recipientName.trim();
  const designation = values.recipientDesignation.trim();
  const keyPoints = values.keyPoints.trim();

  if (!purpose) errors.purpose = 'Email purpose is required.';
  else if (purpose.length < 3) errors.purpose = 'Use at least 3 characters.';
  else if (purpose.length > 200) errors.purpose = 'Keep the purpose under 200 characters.';

  if (!name) errors.recipientName = 'Recipient name is required.';
  else if (name.length < 2) errors.recipientName = 'Use at least 2 characters.';
  else if (name.length > 100) errors.recipientName = 'Keep the name under 100 characters.';

  if (designation.length > 120) errors.recipientDesignation = 'Keep the designation under 120 characters.';

  if (!keyPoints) errors.keyPoints = 'Add at least one key point.';
  else if (keyPoints.length < 10) errors.keyPoints = 'Add a little more detail (at least 10 characters).';
  else if (keyPoints.length > 2_000) errors.keyPoints = 'Keep key points under 2,000 characters.';

  if (!(TONES as readonly string[]).includes(values.tone)) errors.tone = 'Choose an available tone.';
  if (!(LENGTHS as readonly string[]).includes(values.length)) errors.length = 'Choose an available length.';
  return errors;
}

export function validateRefinement(instruction: string): string | undefined {
  const trimmed = instruction.trim();
  if (!trimmed) return 'Tell us what you would like to change.';
  if (trimmed.length < 3) return 'Use at least 3 characters.';
  if (trimmed.length > 500) return 'Keep the instruction under 500 characters.';
}

export function firstErrorField(errors: FieldErrors): string | undefined {
  return ['purpose', 'recipientName', 'recipientDesignation', 'keyPoints', 'tone', 'length'].find(
    (field) => errors[field as keyof FieldErrors],
  );
}
