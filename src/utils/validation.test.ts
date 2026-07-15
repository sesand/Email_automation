import { describe, expect, it } from 'vitest';
import { EMPTY_FORM } from '../types/email';
import { validateForm } from './validation';

const valid = {
  ...EMPTY_FORM,
  purpose: 'Interview Scheduling',
  recipientName: 'Rahul Sharma',
  keyPoints: 'Monday at 11:00 AM via Microsoft Teams',
};

describe('validateForm', () => {
  it('rejects required and whitespace-only fields', () => {
    const errors = validateForm({ ...EMPTY_FORM, purpose: ' ', recipientName: ' ', keyPoints: ' ' });
    expect(errors.purpose).toBeTruthy();
    expect(errors.recipientName).toBeTruthy();
    expect(errors.keyPoints).toBeTruthy();
  });

  it('accepts a valid form', () => expect(validateForm(valid)).toEqual({}));

  it('enforces character limits', () => {
    const errors = validateForm({ ...valid, purpose: 'x'.repeat(201), recipientDesignation: 'x'.repeat(121), keyPoints: 'x'.repeat(2001) });
    expect(errors.purpose).toContain('200');
    expect(errors.recipientDesignation).toContain('120');
    expect(errors.keyPoints).toContain('2,000');
  });

  it('rejects unsupported tone and length values', () => {
    const errors = validateForm({ ...valid, tone: 'Casual' as never, length: 'Huge' as never });
    expect(errors.tone).toBeTruthy();
    expect(errors.length).toBeTruthy();
  });
});
