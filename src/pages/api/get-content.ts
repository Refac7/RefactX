export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';
import {
  cleanupExpiredRecords,
  getClientIP,
  checkRateLimit
} from '~/lib/rateLimit';

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
    const { config, filename, absolutePath } = body;

    // --- JWT 验证调试版 开始 ---
    const authHeader = request.headers.get('authorization');
    
    // 1. 检查 Header 是否存在
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth Fail] Missing or invalid Authorization header');
      return new Response(JSON.stringify({ error: 'Missing Bearer token' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // 2. 稳健导入 JWT
    const jwtImport = await import('jsonwebtoken');
    // @ts-ignore
    const jwt = jwtImport.default || jwtImport;

    // 3. 获取密钥 (打印一部分日志用于调试，注意不要打印完整密钥)
    const SECRET = import.meta.env.ADMIN_JWT_SECRET || 'default_secret';
    // console.log('[Debug] Using Secret length:', SECRET.length); // 调试时可以打开

    try {
      // 4. 核心验证
      jwt.verify(token, SECRET);
    } catch (e: any) {
      // 关键：打印真实错误原因到服务器控制台
      console.error('[JWT Error] Verification failed:', e.message);
      
      // 如果是代码错误 (如 jwt.verify is not a function)，这会帮助你发现
      if (e.name !== 'JsonWebTokenError' && e.name !== 'TokenExpiredError') {
        console.error('[System Error] Unexpected error during verification:', e);
      }

      return new Response(JSON.stringify({ 
        error: 'Invalid token', 
        details: e.message // 将错误详情透传给前端，方便你在 Network 面板看到
      }), { status: 401 });
    }
    // --- JWT 验证调试版 结束 ---

    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server Token Missing' }), { status: 500 });
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    
    const fullPath = absolutePath ? absolutePath : `${config.pathPrefix}${filename}`;

    console.log(`[API] Fetching content: ${fullPath}`);

    try {
      const { data } = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: fullPath,
      });

      if ('content' in data && !Array.isArray(data)) {
          const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
          return new Response(JSON.stringify({ 
              content: fileContent,
              sha: data.sha 
          }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: 'Target is not a file' }), { status: 400 });

    } catch (githubError: any) {
      // 处理 GitHub API 错误
      console.error(`[GitHub Error] ${fullPath}:`, githubError.status);
      
      if (githubError.status === 404) {
        return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
      }
      throw githubError; // 抛出给外层 catch 处理
    }

  } catch (error: any) {
    console.error('[API Critical Error]', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}