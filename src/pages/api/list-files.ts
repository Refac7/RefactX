export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { password, config } = body;

    const CORRECT_PASSWORD = import.meta.env.ADMIN_PASSWORD;
    if (password !== CORRECT_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Access Denied' }), { status: 401 });
    }

    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: config.pathPrefix,
    });

    if (!Array.isArray(data)) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    // 过滤出 .md 或 .mdx 文件
    const files = data
      .filter((file) => file.name.endsWith('.md') || file.name.endsWith('.mdx'))
      .map((file) => ({
        name: file.name,
        sha: file.sha, // 记录 SHA 用于后续操作
        path: file.path
      }));

    return new Response(JSON.stringify({ files }), { status: 200 });

  } catch (error: any) {
    console.error('List files error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}