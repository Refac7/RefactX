export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';
import {
  cleanupExpiredRecords,
  getClientIP,
  checkRateLimit
} from '~/lib/rateLimit';

// 定义操作的接口类型
interface FileOperation {
  type: 'update' | 'create' | 'delete';
  filename: string;
  content?: string;
  isDataFile?: boolean;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    cleanupExpiredRecords();
    const clientIP = getClientIP(request);
    
    const limitCheck = checkRateLimit(clientIP);
    if (!limitCheck.allowed) return new Response(JSON.stringify({ error: limitCheck.message }), { status: 429 });

    const body = await request.json();
    const { config, operations } = body; // operations 是原始的操作数组

    // --- JWT 修复 (保持原有逻辑) ---
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

    // 使用 Map，Key 为完整文件路径。后续的操作会直接覆盖前面的操作。
    const uniqueOpsMap = new Map<string, any>();

    (operations as FileOperation[]).forEach((op) => {
      // 预先计算完整路径，确保去重是基于真实文件位置的
      const fullPath = op.isDataFile || op.filename.includes('/') 
          ? op.filename 
          : `${pathPrefix}${op.filename}`;
      
      // 存入 Map，如果路径已存在，新的 op 会覆盖旧的
      // 这样自然实现了：
      // - 修改A -> 修改B => 最终只保留修改B
      // - 修改 -> 删除 => 最终只保留删除
      uniqueOpsMap.set(fullPath, { ...op, finalPath: fullPath });
    });

    // 将 Map 转回数组，用于后续处理
    const distinctOperations = Array.from(uniqueOpsMap.values());

    // 如果合并后没有操作，直接返回（可选）
    if (distinctOperations.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No changes to commit' }), { status: 200 });
    }

    // 2. 获取 Base Tree
    const { data: refData } = await octokit.git.getRef({
      owner, repo, ref: `heads/${branch}`,
    });
    const baseTreeSha = refData.object.sha;

    // 3. 构建 Tree (使用去重后的 distinctOperations)
    const tree = await Promise.all(
      distinctOperations.map(async (item: any) => {
        // 注意：这里直接使用我们上面计算好的 finalPath
        if (item.type === 'delete') {
          return {
            path: item.finalPath,
            mode: '100644',
            type: 'blob',
            sha: null, // 删除文件的核心标志
          };
        } else {
          const { data: blobData } = await octokit.git.createBlob({
            owner, repo,
            content: Buffer.from(item.content || '').toString('base64'),
            encoding: 'base64',
          });
          return {
            path: item.finalPath,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha,
          };
        }
      })
    );

    // 4. 创建 Tree
    const { data: newTree } = await octokit.git.createTree({
      owner, repo, base_tree: baseTreeSha, tree: tree as any,
    });

    // 5. 创建 Commit
    const commitMessage = `chore(batch): update ${distinctOperations.length} files`;
    const { data: commit } = await octokit.git.createCommit({
      owner, repo, message: commitMessage, tree: newTree.sha, parents: [baseTreeSha],
    });

    // 6. 更新 Ref
    await octokit.git.updateRef({
      owner, repo, ref: `heads/${branch}`, sha: commit.sha, force: false,
    });

    return new Response(JSON.stringify({ success: true, commitSha: commit.sha }), { status: 200 });

  } catch (error: any) {
    console.error('[Batch Error]', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}