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

// Turnstile removed — CAPTCHA not required

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

    // 获取环境变量中的哈希密码
    const HASHED_PASSWORD = import.meta.env.ADMIN_PASSWORD;

    if (!HASHED_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
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