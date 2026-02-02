export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';
import bcrypt from 'bcryptjs';
import {
  cleanupExpiredRecords,
  getClientIP,
  checkRateLimit,
  recordFailedAttempt,
  clearRecord
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
    const { password, config, filename, absolutePath } = body;

    // 1. 鉴权
    const HASHED_PASSWORD = import.meta.env.ADMIN_PASSWORD;
    if (!HASHED_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }
    const isMatch = await bcrypt.compare(password, HASHED_PASSWORD);
    if (!isMatch) {
      recordFailedAttempt(clientIP);
      return new Response(JSON.stringify({ error: 'Access Denied' }), { status: 401 });
    }
    clearRecord(clientIP);

    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server Token Missing' }), { status: 500 });
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    
    // 2. 路径处理
    // 如果前端传了 absolutePath (JSON文件)，直接用；否则拼前缀 (文章)
    const fullPath = absolutePath ? absolutePath : `${config.pathPrefix}${filename}`;

    console.log(`[API] Fetching: ${fullPath}`);

    // 3. 获取内容
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: fullPath,
    });

    // 4. 解码返回
    if ('content' in data && !Array.isArray(data)) {
        const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
        return new Response(JSON.stringify({ 
            content: fileContent,
            sha: data.sha 
        }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Target is a directory, not a file' }), { status: 400 });

  } catch (error: any) {
    console.error(`[API Error] ${error.status} - ${error.message}`);
    
    // [!code warning] 关键修复：透传 GitHub 的 404 状态
    // 这样前端才能识别 "文件不存在"，并触发自动初始化逻辑
    if (error.status === 404) {
      return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}