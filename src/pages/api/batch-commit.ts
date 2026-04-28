export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';
import { cleanupExpiredRecords, checkRateLimit } from '~/lib/rateLimit';
import { createErrorResponse, createSuccessResponse, verifyJWTMiddleware, rateLimitMiddleware } from '~/lib/api-utils';

interface FileOperation {
  type: 'update' | 'create' | 'delete';
  filename: string;
  content?: string;
  isDataFile?: boolean;
}

interface GitTreeItem {
  path: string;
  mode: string;
  type: 'blob';
  sha: string | null;
}

/**
 * 去重文件操作，后续操作覆盖前面的操作
 */
function deduplicateOperations(operations: FileOperation[], pathPrefix: string): FileOperation[] {
  const uniqueOpsMap = new Map<string, FileOperation>();

  operations.forEach((op) => {
    const fullPath = op.isDataFile || op.filename.includes('/')
      ? op.filename
      : `${pathPrefix}${op.filename}`;

    uniqueOpsMap.set(fullPath, { ...op, filename: fullPath });
  });

  return Array.from(uniqueOpsMap.values());
}

/**
 * 构建 Git Tree 项数组
 */
async function buildGitTree(
  operations: FileOperation[],
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitTreeItem[]> {
  return Promise.all(
    operations.map(async (op: any) => {
      if (op.type === 'delete') {
        return {
          path: op.filename,
          mode: '100644',
          type: 'blob',
          sha: null,
        };
      } else {
        const { data: blobData } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(op.content || '').toString('base64'),
          encoding: 'base64',
        });
        return {
          path: op.filename,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        };
      }
    })
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    cleanupExpiredRecords();

    // 速率限制检查
    const limitResult = rateLimitMiddleware(request);
    if (!limitResult.allowed) {
      return limitResult.response;
    }

    const body = await request.json();
    const { config, operations } = body;

    // JWT 验证
    const secret = import.meta.env.ADMIN_JWT_SECRET || 'default_secret';
    const jwtResult = await verifyJWTMiddleware(request, secret);
    if (jwtResult.error) {
      return createErrorResponse(jwtResult.error, jwtResult.status);
    }

    // GitHub 配置验证
    const githubToken = import.meta.env.GITHUB_TOKEN;
    if (!githubToken) {
      return createErrorResponse('Server Token Missing', 500);
    }

    const octokit = new Octokit({ auth: githubToken });
    const { owner, repo, branch, pathPrefix } = config;

    // 去重操作
    const distinctOperations = deduplicateOperations(operations, pathPrefix);

    if (distinctOperations.length === 0) {
      return createSuccessResponse({ success: true, message: 'No changes to commit' }, 200);
    }

    // 获取基础 Tree 引用
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const baseTreeSha = refData.object.sha;

    // 构建新的 Tree
    const treeItems = await buildGitTree(distinctOperations, octokit, owner, repo);
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: treeItems as any,
    });

    // 创建 Commit
    const commitMessage = `chore(batch): update ${distinctOperations.length} files`;
    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: newTree.sha,
      parents: [baseTreeSha],
    });

    // 更新 Branch 引用
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
      force: false,
    });

    return createSuccessResponse({ success: true, commitSha: commit.sha }, 200);
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse('Internal server error', 500, errorMessage);
  }
}
