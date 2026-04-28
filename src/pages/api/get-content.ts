export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';
import jwt from 'jsonwebtoken';
import {
  cleanupExpiredRecords,
  getClientIP,
  checkRateLimit
} from '~/lib/rateLimit';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 速率限制检查
    cleanupExpiredRecords();
    const clientIP = getClientIP(request);
    const limitCheck = checkRateLimit(clientIP);
    
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429 }
      );
    }

    const body = await request.json();
    const { config, filename, absolutePath } = body;

    // 身份验证
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const SECRET = import.meta.env.ADMIN_JWT_SECRET;

    if (!SECRET) {
      console.error('[Config Error] ADMIN_JWT_SECRET is missing');
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }

    try {
      jwt.verify(token, SECRET);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // GitHub API 调用
    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      console.error('[Config Error] GITHUB_TOKEN is missing');
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const fullPath = absolutePath || `${config.pathPrefix}${filename}`;

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
      if (githubError.status === 404) {
        return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
      }
      throw githubError;
    }

  } catch (error) {
    console.error('[API Critical Error]', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};