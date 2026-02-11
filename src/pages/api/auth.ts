// src/pages/api/auth.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import {
  cleanupExpiredRecords,
  getClientIP,
  checkRateLimit,
  recordFailedAttempt,
  clearRecord
} from '~/lib/rateLimit';

// 动态导入处理辅助函数
async function getJwt() {
  const imported = await import('jsonwebtoken');
  // @ts-ignore: 处理不同构建环境下的 CJS/ESM 互操作性
  return imported.default || imported; 
}

export const POST: APIRoute = async ({ request }) => {
  try {
    cleanupExpiredRecords();
    const clientIP = getClientIP(request);
    
    const limitCheck = checkRateLimit(clientIP);
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: limitCheck.message || 'Rate limit exceeded' }),
        { status: 429 }
      );
    }

    const body = await request.json();
    const inputPassword = body.password;

    const HASHED_PASSWORD = import.meta.env.ADMIN_PASSWORD;

    if (!HASHED_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: ADMIN_PASSWORD missing' }), { status: 500 });
    }

    const isMatch = await bcrypt.compare(inputPassword, HASHED_PASSWORD);
    
    if (isMatch) {
      clearRecord(clientIP);
      
      // 获取 JWT 库并签名
      const jwt = await getJwt();
      const SECRET = import.meta.env.ADMIN_JWT_SECRET || 'default_secret'; // 这里必须读取环境变量
      
      const token = jwt.sign({ ip: clientIP, ts: Date.now() }, SECRET, { expiresIn: '2h' });
      
      return new Response(JSON.stringify({ success: true, token }), { status: 200 });
    } else {
      recordFailedAttempt(clientIP);
      return new Response(JSON.stringify({ error: 'Wrong password' }), { status: 401 });
    }
  } catch (e) {
    console.error('[AUTH ERROR]', e);
    // 修复 TS 错误：安全地获取错误信息
    const errorMessage = e instanceof Error ? e.message : String(e);
    
    return new Response(
      JSON.stringify({ error: 'Invalid request', detail: errorMessage }), 
      { status: 400 }
    );
  }
}