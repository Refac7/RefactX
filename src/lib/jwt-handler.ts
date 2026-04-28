// JWT 处理工具库 - 统一管理 JWT 的导入和操作

interface JWTPayload {
  ip: string;
  ts: number;
  exp?: number;
}

// 动态导入 JWT 模块，处理 TypeScript 类型问题
async function importJWT() {
  const imported = await import('jsonwebtoken');
  return imported.default || imported;
}

/**
 * 生成 JWT 令牌
 * @param payload - JWT 载荷对象
 * @param secret - 签名密钥
 * @param expiresIn - 过期时间
 * @returns JWT 令牌字符串
 */
export async function signJWT(payload: JWTPayload, secret: string, expiresIn: string = '2h'): Promise<string> {
  const jwt = await importJWT();
  return jwt.sign(payload, secret, { expiresIn } as any);
}

/**
 * 验证 JWT 令牌
 * @param token - JWT 令牌
 * @param secret - 签名密钥
 * @returns 解析后的载荷对象
 * @throws JWT 验证失败时抛出错误
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const jwt = await importJWT();
  return jwt.verify(token, secret) as JWTPayload;
}

/**
 * 从客户端令牌字符串中提取并验证有效性
 * @param token - JWT 令牌
 * @returns 如果令牌有效返回 true
 */
export function isTokenValid(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return !(payload.exp && payload.exp < Date.now() / 1000);
  } catch {
    return false;
  }
}
