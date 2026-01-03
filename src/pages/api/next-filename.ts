// src/pages/api/next-filename.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { password, config } = body;

    // 1. 简单验证密码
    const CORRECT_PASSWORD = import.meta.env.ADMIN_PASSWORD;
    if (password !== CORRECT_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Access Denied' }), { status: 401 });
    }

    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) return new Response(JSON.stringify({ error: 'Token missing' }), { status: 500 });

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    // 2. 获取目录下的所有文件
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: config.pathPrefix,
    });

    if (!Array.isArray(data)) {
      return new Response(JSON.stringify({ filename: 'post-01.md' }), { status: 200 });
    }

    // 3. 筛选并计算最大序号
    // 匹配 post-数字.md 格式
    const regex = /^post-(\d+)\.md$/;
    let maxNum = 0;

    data.forEach((file) => {
      const match = file.name.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    // 4. 生成下一个序号 (补零)
    const nextNum = maxNum + 1;
    const nextFilename = `post-${nextNum.toString().padStart(2, '0')}.md`;

    return new Response(JSON.stringify({ filename: nextFilename }), { status: 200 });

  } catch (error: any) {
    console.error('Fetch files error:', error);
    // 如果出错（比如目录不存在），默认返回 post-01
    return new Response(JSON.stringify({ filename: 'post-01.md' }), { status: 200 });
  }
}