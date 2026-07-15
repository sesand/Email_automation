import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  generateWithAi,
  ProviderConfigurationError,
  ProviderRateLimitError,
  ProviderRequestError,
  ProviderTimeoutError,
} from './lib/aiProvider';
import { InvalidAiResponseError, parseAiResponse } from './lib/parseAiResponse';
import type { EmailLength, Tone, ValidatedEmailRequest } from './lib/requestSchema';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

class HandlerStageError extends Error {
  readonly code = 'HANDLER_STAGE' as const;
  constructor(public readonly stage: 'validation' | 'provider' | 'parsing', cause: unknown) {
    super(`Email handler failed during ${stage}.`, { cause });
  }
}

function getErrorCode(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
}

function isExpectedServiceError(error: unknown): boolean {
  return [
    'PROVIDER_CONFIGURATION', 'PROVIDER_RATE_LIMIT', 'PROVIDER_TIMEOUT',
    'PROVIDER_REQUEST', 'INVALID_AI_RESPONSE',
  ].includes(String(getErrorCode(error)));
}

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

function diagnosticFail(res: VercelResponse, error: HandlerStageError) {
  const cause = error.cause;
  const diagnostic = cause instanceof Error
    ? `${cause.name}: ${cause.message}`.slice(0, 180)
    : typeof cause;
  return res.status(500).json({
    success: false,
    error: {
      code: `INTERNAL_${error.stage.toUpperCase()}_ERROR`,
      message: 'The email service encountered an unexpected error. Please try again.',
      diagnostic,
    },
  });
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

function stringField(value: unknown, min: number, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max ? trimmed : undefined;
}

function validateRequest(value: unknown): ValidatedEmailRequest | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const body = value as Record<string, unknown>;
  if (body.mode !== 'generate' && body.mode !== 'refine') return undefined;
  const purpose = stringField(body.purpose, 3, 200);
  const recipientName = stringField(body.recipientName, 2, 100);
  const recipientDesignation = body.recipientDesignation === undefined ? '' : stringField(body.recipientDesignation, 0, 120);
  const keyPoints = stringField(body.keyPoints, 10, 2_000);
  const tone = ['Professional', 'Friendly', 'Formal', 'Assertive'].includes(String(body.tone)) ? body.tone as Tone : undefined;
  const length = ['Concise', 'Standard', 'Detailed'].includes(String(body.length)) ? body.length as EmailLength : undefined;
  if (!purpose || !recipientName || recipientDesignation === undefined || !keyPoints || !tone || !length) return undefined;
  const base = { purpose, recipientName, recipientDesignation, keyPoints, tone, length };
  if (body.mode === 'generate') return { ...base, mode: 'generate' };
  if (typeof body.currentEmail !== 'object' || body.currentEmail === null || Array.isArray(body.currentEmail)) return undefined;
  const current = body.currentEmail as Record<string, unknown>;
  const subject = stringField(current.subject, 1, 300);
  const emailBody = stringField(current.body, 1, 10_000);
  const refinementInstruction = stringField(body.refinementInstruction, 3, 500);
  if (!subject || !emailBody || !refinementInstruction) return undefined;
  return { ...base, mode: 'refine', currentEmail: { subject, body: emailBody }, refinementInstruction };
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

  let parsedRequest: ValidatedEmailRequest | undefined;
  try {
    parsedRequest = validateRequest(getRequestBody(req));
  } catch (error) {
    throw new HandlerStageError('validation', error);
  }
  if (!parsedRequest) return fail(res, 400, 'INVALID_REQUEST', 'Check the form details and try again.');

  let raw: string;
  try {
    raw = await generateWithAi(parsedRequest);
  } catch (error) {
    if (isExpectedServiceError(error)) throw error;
    throw new HandlerStageError('provider', error);
  }
  let email: ReturnType<typeof parseAiResponse>;
  try {
    email = parseAiResponse(raw);
  } catch (error) {
    if (isExpectedServiceError(error)) throw error;
    throw new HandlerStageError('parsing', error);
  }
  return res.status(200).json({ success: true, data: email });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handleRequest(req, res);
  } catch (error) {
    const errorCode = getErrorCode(error);
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
      stage: error instanceof HandlerStageError ? error.stage : undefined,
      causeName: error instanceof HandlerStageError && error.cause instanceof Error ? error.cause.name : undefined,
    });
    if (error instanceof HandlerStageError) {
      return diagnosticFail(res, error);
    }
    return fail(res, 500, 'INTERNAL_ERROR', 'The email service encountered an unexpected error. Please try again.');
  }
}
