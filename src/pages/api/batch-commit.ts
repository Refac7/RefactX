// src/pages/api/batch-commit.ts
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

// 定义操作类型
interface BatchOperation {
  type: 'write' | 'delete';
  filename: string;
  content?: string;
  sha?: string;
  isDataFile?: boolean;
}

// GitHub API 类型定义
interface GitTreeEntry {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha: string | null;
}

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
    const { password, config, operations } = body as {
      password: string;
      config: {
        owner: string;
        repo: string;
        branch: string;
        pathPrefix: string;
      };
      operations: BatchOperation[];
    };
    
    // 1. 密码验证
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

    // 2. 初始化 GitHub
    const octokit = new Octokit({ auth: import.meta.env.GITHUB_TOKEN });
    const { owner, repo, branch, pathPrefix } = config;

    console.log(`[API] Starting Batch of ${operations.length} items...`);

    // 3. 获取最新的提交引用
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    
    const baseTreeSha = refData.object.sha;

    // 4. 创建树对象：一次性创建所有文件变更
    const tree = await Promise.all(
      operations.map(async (item: BatchOperation) => {
        const fullPath = item.isDataFile || item.filename.includes('/') 
          ? item.filename 
          : `${pathPrefix}${item.filename}`;

        if (item.type === 'delete') {
          // 删除文件：模式设为 0 表示删除
          return {
            path: fullPath,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: null, // SHA 设为 null 表示删除
          };
        } else {
          // 创建或更新文件
          const content = Buffer.from(item.content || '').toString('base64');
          
          // 先创建 blob
          const { data: blobData } = await octokit.git.createBlob({
            owner,
            repo,
            content,
            encoding: 'base64' as const,
          });

          return {
            path: fullPath,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blobData.sha,
          };
        }
      })
    ) as GitTreeEntry[];

    // 5. 创建新树
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
    });

    // 6. 创建提交（只有一个提交！）
    const commitMessage = `chore(batch): update ${operations.length} files\n\n` +
      operations.map((item: BatchOperation) => {
        const action = item.type === 'delete' ? '🗑️ DELETE' : '📝 UPDATE';
        const name = item.filename.split('/').pop() || item.filename;
        return `• ${action} ${name}`;
      }).join('\n');

    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: newTree.sha,
      parents: [baseTreeSha],
    });

    // 7. 更新分支引用
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
      force: false,
    });

    console.log(`[API] Batch completed with 1 commit: ${commit.sha}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Batch completed in 1 commit',
        commitSha: commit.sha,
        filesCount: operations.length 
      }), 
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[Batch Error]', error);
    
    // 提供更详细的错误信息
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.status === 409) {
      errorMessage = 'File conflict detected. Please refresh and try again.';
      statusCode = 409;
    } else if (error.status === 404) {
      errorMessage = 'Repository or branch not found. Check configuration.';
      statusCode = 404;
    } else if (error.status === 401) {
      errorMessage = 'GitHub authentication failed. Check GITHUB_TOKEN.';
      statusCode = 401;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.response?.data || error.toString()
    }), { status: statusCode });
  }
}