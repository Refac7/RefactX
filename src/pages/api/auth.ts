export const prerender = false; // 必须标记为动态路由

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const inputPassword = body.password;
    
    // 获取环境变量中的正确密码
    const CORRECT_PASSWORD = import.meta.env.ADMIN_PASSWORD;

    if (!CORRECT_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }

    if (inputPassword === CORRECT_PASSWORD) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: 'Wrong password' }), { status: 401 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
}