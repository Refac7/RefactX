export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { password, filename, content, config, action = 'write', sha, isAbsolutePath } = body;

    const CORRECT_PASSWORD = import.meta.env.ADMIN_PASSWORD;
    if (password !== CORRECT_PASSWORD) return new Response(JSON.stringify({ error: 'Access Denied' }), { status: 401 });

    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    
    // 关键：如果是绝对路径模式，直接使用 filename（前端已传入完整路径）
    const fullPath = isAbsolutePath ? filename : `${config.pathPrefix}${filename}`;

    console.log(`[API] ${action.toUpperCase()}: ${fullPath}`);

    // --- 删除逻辑 ---
    if (action === 'delete') {
      let fileSha = sha;
      // 如果没传 SHA，尝试现查
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
        message: `chore(data): delete ${filename} via Admin`,
        sha: fileSha,
        branch: config.branch
      });

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // --- 写入/更新逻辑 ---
    let currentSha = sha;
    
    // 为了防止冲突，先检查文件是否存在（获取 SHA）
    if (!currentSha) {
       try {
        const { data } = await octokit.repos.getContent({
            owner: config.owner,
            repo: config.repo,
            path: fullPath,
        });
        // @ts-ignore
        currentSha = data.sha;
       } catch(e) {
         // 404 忽略，说明是新建文件
       }
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path: fullPath,
      message: `feat(data): update ${filename} via Admin`,
      content: Buffer.from(content).toString('base64'),
      sha: currentSha, 
      branch: config.branch
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error('[API Publish Error]', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}