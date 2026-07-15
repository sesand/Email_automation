export class InvalidAiResponseError extends Error {
  readonly code = 'INVALID_AI_RESPONSE' as const;
  constructor() { super('The AI provider returned an invalid email response.'); }
}

function stripUnsafeControls(value: string): string {
  return [...value].filter((character) => {
    const code = character.charCodeAt(0);
    return code === 9 || code === 10 || code === 13 || code >= 32;
  }).join('');
}

function extractJsonObject(raw: string): string {
  const withoutFence = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start < 0 || end <= start) throw new InvalidAiResponseError();
  return withoutFence.slice(start, end + 1);
}

export function parseAiResponse(raw: string) {
  if (!raw || raw.length > 50_000) throw new InvalidAiResponseError();
  try {
    const parsed: unknown = JSON.parse(extractJsonObject(raw));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new InvalidAiResponseError();
    const value = parsed as Record<string, unknown>;
    if (Object.keys(value).some((key) => key !== 'subject' && key !== 'body')) throw new InvalidAiResponseError();
    if (typeof value.subject !== 'string' || !value.subject.trim() || value.subject.trim().length > 300) throw new InvalidAiResponseError();
    if (typeof value.body !== 'string' || !value.body.trim() || value.body.trim().length > 10_000) throw new InvalidAiResponseError();
    return {
      subject: stripUnsafeControls(value.subject).trim(),
      body: stripUnsafeControls(value.body).replace(/\r\n/g, '\n').trim(),
    };
  } catch (error) {
    if (error instanceof InvalidAiResponseError) throw error;
    throw new InvalidAiResponseError();
  }
}
