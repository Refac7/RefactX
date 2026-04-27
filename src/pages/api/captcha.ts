export const prerender = false;
import type { APIRoute } from 'astro';

const DIFFICULTY = 4; // PoW 难度系数 (哈希前4位为0)

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);

    // 第一阶段：获取挑战
    if (!body || typeof body.nonce !== 'number') {
      return new Response(JSON.stringify({ challenge: crypto.randomUUID(), difficulty: DIFFICULTY }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 第二阶段：验证 PoW 计算结果
    const { challenge, nonce } = body;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(`${challenge}:${nonce}`));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex.startsWith('0'.repeat(DIFFICULTY))) {
      // 验证通过，签发具有时效性的 HMAC 令牌： signature.timestamp
      const timestamp = Date.now();
      const secret = encoder.encode(import.meta.env.CAPTCHA_SECRET || 'refactx-edge-secret');
      const tokenData = encoder.encode(`verified:${timestamp}`);
      const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      
      const signature = await crypto.subtle.sign('HMAC', key, tokenData);
      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
      
      return new Response(JSON.stringify({ success: true, token: `${signatureBase64}.${timestamp}` }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid PoW' }), { status: 403 });
  } catch (e) {
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
};