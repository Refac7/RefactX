export const prerender = false; // 必须标记为动态路由

import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import {
  cleanupExpiredRecords,
  getClientIP,
  checkRateLimit,
  recordFailedAttempt,
  clearRecord
} from '~/lib/rateLimit';

// Cloudflare Turnstile 验证函数
async function verifyTurnstile(token: string, remoteIP: string): Promise<boolean> {
  const TURNSTILE_SECRET = import.meta.env.TURNSTILE_SECRET_KEY;
  
  // 如果未配置 Turnstile，跳过验证（开发/测试模式）
  if (!TURNSTILE_SECRET) {
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET,
        response: token,
        remoteip: remoteIP
      })
    });

    const data = await response.json() as {
      success: boolean;
      challenge_ts?: string;
      hostname?: string;
      error_codes?: string[];
      'error-codes'?: string[];
    };

    if (data.success) {
      return true;
    }

    console.warn(`[Turnstile] Verification failed for ${remoteIP}`, {
      success: data.success,
      errors: data.error_codes || data['error-codes']
    });
    return false;
  } catch (error) {
    console.error('[Turnstile] Verification error:', error);
    // 网络错误时，允许请求继续（防止服务中断）
    return true;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // 清理过期记录
    cleanupExpiredRecords();

    const clientIP = getClientIP(request);
    
    // 检查频率限制
    const limitCheck = checkRateLimit(clientIP);
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: limitCheck.message || 'Rate limit exceeded' }),
        { status: 429 }
      );
    }

    const body = await request.json();
    const inputPassword = body.password;
    const turnstileToken = body.turnstileToken;
    // 获取环境变量中的哈希密码
    const HASHED_PASSWORD = import.meta.env.ADMIN_PASSWORD;

    if (!HASHED_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }

    // Turnstile 验证（可选）
    if (turnstileToken) {
      const isTurnstileValid = await verifyTurnstile(turnstileToken, clientIP);
      if (!isTurnstileValid) {
        recordFailedAttempt(clientIP);
        return new Response(
          JSON.stringify({ error: 'Turnstile verification failed' }),
          { status: 403 }
        );
      }
    }

    // bcrypt 校验
    const isMatch = await bcrypt.compare(inputPassword, HASHED_PASSWORD);
    if (isMatch) {
      clearRecord(clientIP);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      recordFailedAttempt(clientIP);
      return new Response(JSON.stringify({ error: 'Wrong password' }), { status: 401 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
}