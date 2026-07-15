import { generatedEmailSchema } from './requestSchema';

export class InvalidAiResponseError extends Error {
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
    const result = generatedEmailSchema.safeParse(parsed);
    if (!result.success) throw new InvalidAiResponseError();
    return {
      subject: stripUnsafeControls(result.data.subject).trim(),
      body: stripUnsafeControls(result.data.body).replace(/\r\n/g, '\n').trim(),
    };
  } catch (error) {
    if (error instanceof InvalidAiResponseError) throw error;
    throw new InvalidAiResponseError();
  }
}
