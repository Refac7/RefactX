// API 工具库 - 统一 API 路由的公共逻辑处理

import type { APIRoute } from 'astro';
import { verifyJWT } from './jwt-handler';
import { getClientIP, checkRateLimit } from './rateLimit';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
}

/**
 * 创建成功响应
 * @param data - 响应数据
 * @param status - HTTP 状态码，默认 200
 * @returns Response 对象
 */
export function createSuccessResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), { status });
}

/**
 * 创建错误响应
 * @param error - 错误消息
 * @param status - HTTP 状态码，默认 400
 * @param details - 详细错误信息
 * @returns Response 对象
 */
export function createErrorResponse(error: string, status: number = 400, details?: string): Response {
  const response: ApiResponse<null> = { error };
  if (details) response.details = details;
  return new Response(JSON.stringify(response), { status });
}

/**
 * 从请求头中提取 JWT 令牌
 * @param request - 请求对象
 * @returns JWT 令牌，如果不存在返回 null
 */
export function extractJWT(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

/**
 * 验证 JWT 令牌的中间件模式
 * @param request - 请求对象
 * @param secret - JWT 签名密钥
 * @returns 如果验证成功返回载荷，失败返回 error 对象
 */
export async function verifyJWTMiddleware(request: Request, secret: string) {
  const token = extractJWT(request);
  if (!token) {
    return { error: 'Missing Bearer token', status: 401 };
  }

  try {
    const payload = await verifyJWT(token, secret);
    return { payload, status: 200 };
  } catch (error: any) {
    return { error: 'Invalid token', details: error.message, status: 401 };
  }
}

/**
 * 检查速率限制的中间件模式
 * @param request - 请求对象
 * @returns 如果允许返回 { allowed: true }，否则返回 { allowed: false, response: Response }
 */
export function rateLimitMiddleware(request: Request): { allowed: boolean; response?: Response; clientIP: string } {
  const clientIP = getClientIP(request);
  const limitCheck = checkRateLimit(clientIP);

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      response: createErrorResponse(
        limitCheck.message || 'Rate limit exceeded',
        429
      ),
      clientIP,
    };
  }

  return { allowed: true, clientIP };
}

/**
 * 安全的 JSON 解析，出错时返回 null
 * @param data - 要解析的 JSON 字符串
 * @returns 解析结果或 null
 */
export function safeJsonParse<T>(data: string): T | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * 组合多个中间件的高阶函数，用于 API 路由
 * @param handler - 真正的处理函数
 * @param middlewares - 中间件数组
 * @returns 中间件链处理后的 APIRoute
 */
export function withMiddleware(
  handler: (context: any, middlewareResults: any) => Promise<Response>,
  middlewares: ((request: Request) => any)[]
): APIRoute {
  return async ({ request, ...context }) => {
    const middlewareResults: any = {};

    for (const middleware of middlewares) {
      const result = middleware(request);
      if (result.error || (result.response && result.allowed === false)) {
        return result.response || createErrorResponse(result.error, result.status);
      }
      Object.assign(middlewareResults, result);
    }

    return handler({ request, ...context }, middlewareResults);
  };
}
