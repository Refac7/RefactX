export const prerender = false;

import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { cleanupExpiredRecords, getClientIP, checkRateLimit, recordFailedAttempt, clearRecord } from '~/lib/rateLimit';
import { createErrorResponse, createSuccessResponse, rateLimitMiddleware } from '~/lib/api-utils';
import { signJWT } from '~/lib/jwt-handler';

const CAPTCHA_VALIDITY_MS = 5 * 60 * 1000;

/**
 * 验证 CAPTCHA 令牌的有效性和签名
 */
async function verifyCaptchaToken(token: string, secret: string): Promise<boolean> {
  try {
    const [signatureBase64, timestampStr] = token.split('.');
    const timestamp = parseInt(timestampStr, 10);

    // 检查时间戳有效性（防重放攻击）
    if (Date.now() - timestamp > CAPTCHA_VALIDITY_MS) {
      return false;
    }

    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    const tokenData = encoder.encode(`verified:${timestamp}`);
    const key = await crypto.subtle.importKey('raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);

    const binaryString = atob(signatureBase64);
    const signatureBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      signatureBytes[i] = binaryString.charCodeAt(i);
    }

    return await crypto.subtle.verify('HMAC', key, signatureBytes, tokenData);
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    cleanupExpiredRecords();

    // 速率限制检查
    const limitResult = rateLimitMiddleware(request);
    if (!limitResult.allowed) {
      return limitResult.response;
    }

    const body = await request.json();
    const { password, captchaToken } = body;

    if (!captchaToken) {
      return createErrorResponse('Missing CAPTCHA verification', 403);
    }

    // 验证 CAPTCHA 令牌
    const captchaSecret = import.meta.env.CAPTCHA_SECRET || 'refactx-edge-secret';
    const isCaptchaValid = await verifyCaptchaToken(captchaToken, captchaSecret);
    if (!isCaptchaValid) {
      return createErrorResponse('Invalid or expired CAPTCHA', 403);
    }

    // 验证密码
    const hashedPassword = import.meta.env.ADMIN_PASSWORD;
    if (!hashedPassword) {
      return createErrorResponse('Server misconfiguration: ADMIN_PASSWORD missing', 500);
    }

    const isPasswordMatch = await bcrypt.compare(password, hashedPassword);

    if (isPasswordMatch) {
      clearRecord(limitResult.clientIP);
      const secret = import.meta.env.ADMIN_JWT_SECRET || 'default_secret';
      const token = await signJWT(
        { ip: limitResult.clientIP, ts: Date.now() },
        secret,
        '2h'
      );
      return createSuccessResponse({ success: true, token }, 200);
    } else {
      recordFailedAttempt(limitResult.clientIP);
      return createErrorResponse('Wrong password', 401);
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse('Invalid request', 400, errorMessage);
  }
}
