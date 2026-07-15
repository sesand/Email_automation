import { describe, expect, it } from 'vitest';
import { InvalidAiResponseError, parseAiResponse } from './parseAiResponse';

describe('parseAiResponse', () => {
  it('parses valid JSON', () => {
    expect(parseAiResponse('{"subject":"Hello","body":"Dear Rahul,\\n\\nHello.\\n\\nBest regards,\\nRecruitment Team"}').subject).toBe('Hello');
  });

  it('parses markdown-fenced JSON and leading explanation defensively', () => {
    const fenced = 'Here is the result:\n```json\n{"subject":"Update","body":"Dear Priya,\\n\\nAn update.\\n\\nBest regards,\\nRecruitment Team"}\n```';
    expect(parseAiResponse(fenced).subject).toBe('Update');
  });

  it.each([
    ['missing subject', '{"body":"Body"}'],
    ['missing body', '{"subject":"Subject"}'],
    ['empty subject', '{"subject":"","body":"Body"}'],
    ['invalid JSON', 'not json'],
  ])('rejects %s', (_label, raw) => expect(() => parseAiResponse(raw)).toThrow(InvalidAiResponseError));
});
