// 频率限制配置
export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,              // 最大尝试次数
  LOCK_TIME: 15 * 60 * 1000,    // 锁定时间（15分钟）
  RESET_TIME: 60 * 60 * 1000,   // 记录重置时间（1小时）
};

// 内存存储：记录每个 IP 的失败次数和时间戳
export interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

export const rateLimitMap = new Map<string, RateLimitRecord>();

// 清理过期的记录
export function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.firstAttempt > RATE_LIMIT_CONFIG.RESET_TIME) {
      rateLimitMap.delete(ip);
    }
  }
}

// 获取客户端 IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('cf-connecting-ip') || '127.0.0.1';
}

// 检查频率限制
export function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    return { allowed: true };
  }

  // 检查是否被锁定
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingTime = Math.ceil((record.lockedUntil - now) / 1000 / 60);
    return {
      allowed: false,
      message: `Too many attempts. Please try again in ${remainingTime} minutes.`
    };
  }

  // 检查是否超过时间窗口
  if (now - record.firstAttempt > RATE_LIMIT_CONFIG.RESET_TIME) {
    rateLimitMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

// 记录失败尝试
export function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || {
    attempts: 0,
    firstAttempt: now
  };

  record.attempts += 1;

  // 如果超过最大尝试次数，锁定 IP
  if (record.attempts >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
    record.lockedUntil = now + RATE_LIMIT_CONFIG.LOCK_TIME;
  }

  rateLimitMap.set(ip, record);
}

// 成功则清除记录
export function clearRecord(ip: string) {
  rateLimitMap.delete(ip);
}
