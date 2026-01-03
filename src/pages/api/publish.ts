export const prerender = false; // 标记此路由为动态渲染 (SSR)

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { password, filename, content, config } = body;

    // 1. 验证密码 (读取服务端环境变量)
    const CORRECT_PASSWORD = import.meta.env.ADMIN_PASSWORD;
    
    if (!CORRECT_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: ADMIN_PASSWORD not set' }), { status: 500 });
    }

    if (password !== CORRECT_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Access Denied: Wrong Password' }), { status: 401 });
    }

    // 2. 验证 Token
    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: GITHUB_TOKEN not set' }), { status: 500 });
    }

    // 3. 操作 GitHub
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const fullPath = `${config.pathPrefix}${filename}`;
    
    // 检查文件是否存在以获取 SHA
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: fullPath,
      });
      // @ts-ignore
      if (data.sha) sha = data.sha;
    } catch (e) {
      // 文件不存在，说明是新建
    }

    // 推送更新
    await octokit.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path: fullPath,
      message: `feat(content): update ${filename} via Vercel Admin`,
      content: Buffer.from(content).toString('base64'), // Node环境使用 Buffer 编码更方便
      sha,
      branch: config.branch
    });

    return new Response(JSON.stringify({ success: true, message: 'Published successfully' }), { status: 200 });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}