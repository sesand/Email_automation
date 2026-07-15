import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from './generate-email';

const validBody = {
  mode: 'generate',
  purpose: 'Interview Scheduling',
  recipientName: 'Rahul Sharma',
  recipientDesignation: 'Senior Developer',
  keyPoints: 'Monday at 11:00 AM via Microsoft Teams',
  tone: 'Professional',
  length: 'Concise',
};

function createResponse() {
  const response = {
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

describe('generate-email handler', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns a controlled configuration error when Vercel omits request.socket', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const request = {
      method: 'POST',
      headers: { 'content-length': '200' },
      body: validBody,
    } as unknown as VercelRequest;
    const response = createResponse();

    await expect(handler(request, response as unknown as VercelResponse)).resolves.toBeDefined();
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'SERVICE_NOT_CONFIGURED', message: 'Email generation is not configured yet.' },
    });
  });

  it('returns 400 for an invalid JSON string body', async () => {
    const request = {
      method: 'POST', headers: {}, body: '{invalid',
    } as unknown as VercelRequest;
    const response = createResponse();
    await handler(request, response as unknown as VercelResponse);
    expect(response.status).toHaveBeenCalledWith(400);
  });
});
