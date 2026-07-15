import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateWithAi, ProviderRequestError } from './aiProvider';
import type { ValidatedEmailRequest } from './requestSchema';

const input: ValidatedEmailRequest = {
  mode: 'generate', purpose: 'Interview Scheduling', recipientName: 'Rahul Sharma',
  recipientDesignation: 'Senior Developer', keyPoints: 'Monday at 11:00 AM via Microsoft Teams',
  tone: 'Professional', length: 'Concise',
};

const successResponse = () => new Response(JSON.stringify({
  candidates: [{ content: { parts: [{ text: '{"subject":"Interview","body":"Dear Rahul,\\n\\nYour interview is Monday.\\n\\nBest regards,\\nRecruitment Team"}' }] } }],
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('Gemini provider fallback', () => {
  beforeEach(() => {
    vi.stubEnv('AI_PROVIDER', 'gemini');
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    vi.stubEnv('AI_MODEL', 'gemini-3.1-pro-preview');
    vi.stubEnv('AI_FALLBACK_MODELS', 'gemini-3.5-flash,gemini-3.1-flash-lite');
  });

  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it('falls back from Pro to Flash on a transient provider failure', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(successResponse());
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateWithAi(input)).resolves.toContain('"subject":"Interview"');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('gemini-3.1-pro-preview');
    expect(String(fetchMock.mock.calls[1][0])).toContain('gemini-3.5-flash');
  });

  it('falls back when the runtime fetch implementation rejects unexpectedly', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(successResponse());
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateWithAi(input)).resolves.toContain('"subject":"Interview"');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not fall back when credentials are rejected', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateWithAi(input)).rejects.toBeInstanceOf(ProviderRequestError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('normalizes a key copied in env-file format', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'GEMINI_API_KEY="test-key"');
    const fetchMock = vi.fn().mockResolvedValue(successResponse());
    vi.stubGlobal('fetch', fetchMock);
    await generateWithAi(input);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: expect.objectContaining({ 'x-goog-api-key': 'test-key' }) });
  });

  it('sends the API key in a server-side Gemini header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse());
    vi.stubGlobal('fetch', fetchMock);
    await generateWithAi(input);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: expect.objectContaining({ 'x-goog-api-key': 'test-key' }) });
  });
});
