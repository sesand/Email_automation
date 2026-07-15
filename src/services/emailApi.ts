import type { EmailRequest, GeneratedEmail } from '../types/email';

interface ApiSuccess { success: true; data: GeneratedEmail }
interface ApiFailure { success: false; error: { code: string; message: string } }

export class EmailApiError extends Error {
  constructor(message: string, public readonly code = 'REQUEST_FAILED') {
    super(message);
  }
}

export async function requestEmail(payload: EmailRequest): Promise<GeneratedEmail> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 35_000);

  try {
    const response = await fetch('/api/generate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = (await response.json().catch(() => null)) as ApiSuccess | ApiFailure | null;
    if (!response.ok || !result?.success) {
      const failure = result as ApiFailure | null;
      throw new EmailApiError(
        failure?.error?.message ?? 'We could not generate the email right now. Please try again.',
        failure?.error?.code,
      );
    }
    return result.data;
  } catch (error) {
    if (error instanceof EmailApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new EmailApiError('The request took too long. Please try again.', 'TIMEOUT');
    }
    throw new EmailApiError('We could not reach the email service. Check your connection and try again.', 'NETWORK_ERROR');
  } finally {
    window.clearTimeout(timeout);
  }
}
