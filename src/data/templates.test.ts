import { describe, expect, it } from 'vitest';
import { templates } from './templates';

describe('quick-start templates', () => {
  it('contains all required editable defaults', () => {
    expect(templates.map((item) => item.name)).toEqual([
      'Interview Scheduling', 'Offer Letter Follow-up', 'Client Status Update',
    ]);
    for (const template of templates) {
      expect(template.purpose.length).toBeGreaterThan(2);
      expect(template.keyPoints.length).toBeGreaterThan(9);
      expect(['Professional', 'Friendly', 'Formal', 'Assertive']).toContain(template.tone);
      expect(['Concise', 'Standard', 'Detailed']).toContain(template.length);
    }
  });
});
