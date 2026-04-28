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
    if (!limitCheck.allowed) return new Response(JSON.stringify({ error: limitCheck.message }), { status: 429 });

    const body = await request.json();
    const { config } = body;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    try {
      const jwtImport = await import('jsonwebtoken');
      // @ts-ignore
      const jwt = jwtImport.default || jwtImport;
      const SECRET = import.meta.env.ADMIN_JWT_SECRET;
      jwt.verify(token, SECRET || 'default_secret');
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) return new Response(JSON.stringify({ error: 'Token missing' }), { status: 500 });

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    // 获取文件列表
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: config.pathPrefix,
    });

    if (!Array.isArray(data)) {
      return new Response(JSON.stringify({ filename: 'post-01.md' }), { status: 200 });
    }

    // 计算下一个序号
    const regex = /^post-(\d+)\.md$/;
    let maxNum = 0;

    data.forEach((file) => {
      const match = file.name.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    const nextFilename = `post-${nextNum.toString().padStart(2, '0')}.md`;

    return new Response(JSON.stringify({ filename: nextFilename }), { status: 200 });

  } catch (error: any) {
    // 如果目录不存在或为空，返回默认值
    return new Response(JSON.stringify({ filename: 'post-01.md' }), { status: 200 });
  }
}