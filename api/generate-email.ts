import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  generateWithAi,
  ProviderConfigurationError,
  ProviderRateLimitError,
  ProviderRequestError,
  ProviderTimeoutError,
} from './lib/aiProvider';
import { InvalidAiResponseError, parseAiResponse } from './lib/parseAiResponse';
import { emailRequestSchema } from './lib/requestSchema';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = requestBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_REQUESTS;
}

function fail(res: VercelResponse, status: number, code: string, message: string) {
  return res.status(status).json({ success: false, error: { code, message } });
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim();
  return forwardedIp || req.socket?.remoteAddress || 'unknown';
}

function getRequestBody(req: VercelRequest): unknown {
  if (typeof req.body !== 'string') return req.body;
  try {
    return JSON.parse(req.body) as unknown;
  } catch {
    return undefined;
  }
}

async function handleRequest(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'METHOD_NOT_ALLOWED', 'This endpoint accepts POST requests only.');
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > 16_000) return fail(res, 413, 'REQUEST_TOO_LARGE', 'The request is too large. Please shorten your details.');

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.setHeader('Retry-After', '60');
    return fail(res, 429, 'RATE_LIMITED', 'Too many requests. Please wait a minute and try again.');
  }

  const parsedRequest = emailRequestSchema.safeParse(getRequestBody(req));
  if (!parsedRequest.success) return fail(res, 400, 'INVALID_REQUEST', 'Check the form details and try again.');

  const raw = await generateWithAi(parsedRequest.data);
  const email = parseAiResponse(raw);
  return res.status(200).json({ success: true, data: email });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handleRequest(req, res);
  } catch (error) {
    const errorCode = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
    const providerStatus = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
      ? error.status
      : undefined;
    if (error instanceof ProviderConfigurationError || errorCode === 'PROVIDER_CONFIGURATION') return fail(res, 503, 'SERVICE_NOT_CONFIGURED', 'Email generation is not configured yet.');
    if (error instanceof ProviderRateLimitError || errorCode === 'PROVIDER_RATE_LIMIT') return fail(res, 429, 'PROVIDER_RATE_LIMITED', 'The email service is busy. Please wait a moment and try again.');
    if (error instanceof ProviderTimeoutError || errorCode === 'PROVIDER_TIMEOUT') return fail(res, 504, 'GENERATION_TIMEOUT', 'Email generation took too long. Please try again.');
    if ((error instanceof ProviderRequestError || errorCode === 'PROVIDER_REQUEST') && (providerStatus === 401 || providerStatus === 403)) {
      return fail(res, 503, 'PROVIDER_AUTH_FAILED', 'Gemini rejected the configured API key. Update GEMINI_API_KEY in Vercel and redeploy.');
    }
    if ((error instanceof ProviderRequestError || errorCode === 'PROVIDER_REQUEST') && providerStatus === 400) {
      return fail(res, 502, 'PROVIDER_REQUEST_REJECTED', 'Gemini rejected the model request. Check the configured Gemini model names.');
    }
    if (error instanceof ProviderRequestError || errorCode === 'PROVIDER_REQUEST') return fail(res, 502, 'GENERATION_FAILED', 'Unable to generate the email right now.');
    if (error instanceof InvalidAiResponseError || errorCode === 'INVALID_AI_RESPONSE') return fail(res, 502, 'INVALID_AI_RESPONSE', 'The email service returned an incomplete draft. Please try again.');
    console.error('Unhandled generate-email error', {
      name: error instanceof Error ? error.name : typeof error,
      code: typeof errorCode === 'string' ? errorCode : undefined,
    });
    return fail(res, 500, 'INTERNAL_ERROR', 'The email service encountered an unexpected error. Please try again.');
  }
}
