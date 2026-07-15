import { describe, expect, it } from 'vitest';
import { formatFullEmail } from './clipboard';

describe('formatFullEmail', () => {
  it('preserves clean paragraph formatting', () => {
    expect(formatFullEmail({ subject: 'Interview on Monday', body: 'Dear Rahul,\n\nYour interview is at 11:00 AM.\n\nBest regards,\nRecruitment Team' }))
      .toBe('Subject: Interview on Monday\n\nDear Rahul,\n\nYour interview is at 11:00 AM.\n\nBest regards,\nRecruitment Team');
  });
});
