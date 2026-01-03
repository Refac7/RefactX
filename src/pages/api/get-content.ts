export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { password, config, filename } = body;

    // 1. 验证
    const CORRECT_PASSWORD = import.meta.env.ADMIN_PASSWORD;
    if (password !== CORRECT_PASSWORD) return new Response(JSON.stringify({ error: 'Access Denied' }), { status: 401 });

    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const fullPath = `${config.pathPrefix}${filename}`;

    // 2. 获取文件内容
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: fullPath,
    });

    // GitHub API 对于文件返回的内容在 content 字段，且是 Base64 编码
    if ('content' in data && !Array.isArray(data)) {
        const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
        return new Response(JSON.stringify({ 
            content: fileContent,
            sha: data.sha 
        }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'File not found or is a directory' }), { status: 404 });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}