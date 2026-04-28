export const prerender = false;

import type { APIRoute } from 'astro';
import { createSuccessResponse, createErrorResponse } from '~/lib/api-utils';

const DIFFICULTY = 4;

/**
 * 计算 SHA-256 哈希值的十六进制字符串表示
 */
async function computeHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 验证工作量证明（Proof of Work）
 */
function isValidPoW(hashHex: string): boolean {
  return hashHex.startsWith('0'.repeat(DIFFICULTY));
}

/**
 * 生成 HMAC-SHA256 签名令牌
 */
async function generateHMACToken(timestamp: number, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  const tokenData = encoder.encode(`verified:${timestamp}`);
  const key = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, tokenData);
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${signatureBase64}.${timestamp}`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);

    // 第一阶段：生成 PoW 挑战
    if (!body || typeof body.nonce !== 'number') {
      return createSuccessResponse({ challenge: crypto.randomUUID(), difficulty: DIFFICULTY }, 200);
    }

    // 第二阶段：验证 PoW 并签发令牌
    const { challenge, nonce } = body;
    const hashInput = `${challenge}:${nonce}`;
    const hashHex = await computeHash(hashInput);

    if (!isValidPoW(hashHex)) {
      return createErrorResponse('Invalid PoW', 403);
    }

    const timestamp = Date.now();
    const secret = import.meta.env.CAPTCHA_SECRET || 'refactx-edge-secret';
    const token = await generateHMACToken(timestamp, secret);

    return createSuccessResponse({ success: true, token }, 200);
  } catch {
    return createErrorResponse('Internal server error', 500);
  }
};
