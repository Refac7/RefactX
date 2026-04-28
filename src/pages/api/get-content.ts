export const prerender = false;

import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';
import { cleanupExpiredRecords } from '~/lib/rateLimit';
import { createErrorResponse, createSuccessResponse, verifyJWTMiddleware, rateLimitMiddleware } from '~/lib/api-utils';

export const POST: APIRoute = async ({ request }): Promise<Response> => {
  try {
    cleanupExpiredRecords();

    // 速率限制检查
    const limitResult = rateLimitMiddleware(request);
    if (!limitResult.allowed) {
      return limitResult.response;
    }

    const body = await request.json();
    const { config, filename, absolutePath } = body;

    // JWT 验证
    const secret = import.meta.env.ADMIN_JWT_SECRET || 'default_secret';
    const jwtResult = await verifyJWTMiddleware(request, secret);
    if (jwtResult.error) {
      return createErrorResponse(jwtResult.error, jwtResult.status, jwtResult.details);
    }

    // GitHub 配置验证
    const githubToken = import.meta.env.GITHUB_TOKEN;
    if (!githubToken) {
      return createErrorResponse('Server Token Missing', 500);
    }

    const octokit = new Octokit({ auth: githubToken });
    const fullPath = absolutePath ? absolutePath : `${config.pathPrefix}${filename}`;

    try {
      const { data } = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: fullPath,
      });

      // 验证是否为文件而非目录
      if (!('content' in data) || Array.isArray(data)) {
        return createErrorResponse('Target is not a file', 400);
      }

      const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
      return createSuccessResponse({ content: fileContent, sha: data.sha }, 200);
    } catch (githubError: any) {
      if (githubError.status === 404) {
        return createErrorResponse('File not found', 404);
      }
      throw githubError;
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse('Internal server error', 500, errorMessage);
  }
}
