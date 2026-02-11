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
    const { config, operations } = body;

    // --- JWT 修复 ---
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
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
    // ----------------

    const octokit = new Octokit({ auth: import.meta.env.GITHUB_TOKEN });
    const { owner, repo, branch, pathPrefix } = config;

    // 获取 Base Tree
    const { data: refData } = await octokit.git.getRef({
      owner, repo, ref: `heads/${branch}`,
    });
    const baseTreeSha = refData.object.sha;

    // 构建 Tree
    const tree = await Promise.all(
      operations.map(async (item: any) => {
        const fullPath = item.isDataFile || item.filename.includes('/') 
          ? item.filename 
          : `${pathPrefix}${item.filename}`;

        if (item.type === 'delete') {
          return {
            path: fullPath,
            mode: '100644',
            type: 'blob',
            sha: null,
          };
        } else {
          const { data: blobData } = await octokit.git.createBlob({
            owner, repo,
            content: Buffer.from(item.content || '').toString('base64'),
            encoding: 'base64',
          });
          return {
            path: fullPath,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha,
          };
        }
      })
    );

    // 创建 Tree
    const { data: newTree } = await octokit.git.createTree({
      owner, repo, base_tree: baseTreeSha, tree: tree as any,
    });

    // 创建 Commit
    const commitMessage = `chore(batch): update ${operations.length} files`;
    const { data: commit } = await octokit.git.createCommit({
      owner, repo, message: commitMessage, tree: newTree.sha, parents: [baseTreeSha],
    });

    // 更新 Ref
    await octokit.git.updateRef({
      owner, repo, ref: `heads/${branch}`, sha: commit.sha, force: false,
    });

    return new Response(JSON.stringify({ success: true, commitSha: commit.sha }), { status: 200 });

  } catch (error: any) {
    console.error('[Batch Error]', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}