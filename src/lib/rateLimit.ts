/**
 * 速率限制配置
 */
export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCK_TIME: 15 * 60 * 1000,
  RESET_TIME: 60 * 60 * 1000,
};

export interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

export const rateLimitMap = new Map<string, RateLimitRecord>();

let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * 启动定期清理过期记录的定时任务（防止内存泄漏）
 */
function startCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now - record.firstAttempt > RATE_LIMIT_CONFIG.RESET_TIME) {
        rateLimitMap.delete(ip);
      }
    }
  }, RATE_LIMIT_CONFIG.RESET_TIME);
}

startCleanupTimer();

/**
 * 从请求头中提取客户端 IP 地址
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('cf-connecting-ip') || '127.0.0.1';
}

/**
 * 检查客户端是否超过速率限制
 */
export function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    return { allowed: true };
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingTime = Math.ceil((record.lockedUntil - now) / 1000 / 60);
    return {
      allowed: false,
      message: `Too many attempts. Please try again in ${remainingTime} minutes.`,
    };
  }

  if (now - record.firstAttempt > RATE_LIMIT_CONFIG.RESET_TIME) {
    rateLimitMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * 记录失败的尝试次数，必要时锁定 IP
 */
export function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || {
    attempts: 0,
    firstAttempt: now,
  };

  record.attempts += 1;

  if (record.attempts >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
    record.lockedUntil = now + RATE_LIMIT_CONFIG.LOCK_TIME;
  }

  rateLimitMap.set(ip, record);
}

/**
 * 清除指定 IP 的限制记录（通常在认证成功后调用）
 */
export function clearRecord(ip: string) {
  rateLimitMap.delete(ip);
}

/**
 * 手动清理过期的记录（如果需要）
 */
export function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.firstAttempt > RATE_LIMIT_CONFIG.RESET_TIME) {
      rateLimitMap.delete(ip);
    }
  }
}
