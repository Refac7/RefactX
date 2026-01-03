export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    // 新增 action 参数，默认为 'write'
    const { password, filename, content, config, action = 'write', sha } = body;

    const CORRECT_PASSWORD = import.meta.env.ADMIN_PASSWORD;
    if (password !== CORRECT_PASSWORD) return new Response(JSON.stringify({ error: 'Access Denied' }), { status: 401 });

    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const fullPath = `${config.pathPrefix}${filename}`;

    // --- 删除逻辑 ---
    if (action === 'delete') {
      // 删除需要提供文件的 SHA
      let fileSha = sha;
      
      // 如果前端没传 SHA，尝试先获取一下
      if (!fileSha) {
        try {
          const { data } = await octokit.repos.getContent({
            owner: config.owner,
            repo: config.repo,
            path: fullPath,
          });
          // @ts-ignore
          fileSha = data.sha;
        } catch (e) {
          return new Response(JSON.stringify({ error: 'File not found to delete' }), { status: 404 });
        }
      }

      await octokit.repos.deleteFile({
        owner: config.owner,
        repo: config.repo,
        path: fullPath,
        message: `chore(content): delete ${filename} via Admin Panel`,
        sha: fileSha,
        branch: config.branch
      });

      return new Response(JSON.stringify({ success: true, message: 'Deleted successfully' }), { status: 200 });
    }

    // --- 写入/更新逻辑 (原有逻辑) ---
    let currentSha = sha;
    // 如果是写入操作，为了防止冲突，最好先检查是否存在（获取 SHA）
    if (!currentSha) {
       try {
        const { data } = await octokit.repos.getContent({
            owner: config.owner,
            repo: config.repo,
            path: fullPath,
        });
        // @ts-ignore
        currentSha = data.sha;
       } catch(e) {} // 文件不存在，则是新建
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path: fullPath,
      message: `feat(content): ${currentSha ? 'update' : 'create'} ${filename} via Admin Panel`,
      content: Buffer.from(content).toString('base64'),
      sha: currentSha, 
      branch: config.branch
    });

    return new Response(JSON.stringify({ success: true, message: 'Published successfully' }), { status: 200 });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}