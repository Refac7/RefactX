export const prerender = false

import type { APIRoute } from 'astro'
import bcrypt from 'bcryptjs'
import { cleanupExpiredRecords, getClientIP, checkRateLimit, recordFailedAttempt, clearRecord } from '~/lib/rateLimit'

async function getJwt() {
  const imported = await import('jsonwebtoken')
  return imported.default || imported
}

/** Parse ADMIN_USERS env var (JSON) or fall back to single ADMIN_PASSWORD */
function getUserMap(): Map<string, string> | null {
  const usersJson = import.meta.env.ADMIN_USERS
  if (usersJson) {
    try {
      const parsed = JSON.parse(usersJson)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return new Map(Object.entries(parsed as Record<string, string>))
      }
    } catch {
      // fall through
    }
  }
  // Backward compatibility: single ADMIN_PASSWORD → default "admin" user
  const legacyHash = import.meta.env.ADMIN_PASSWORD
  if (legacyHash) {
    return new Map([['admin', legacyHash]])
  }
  return null
}

export const POST: APIRoute = async ({ request }) => {
  try {
    cleanupExpiredRecords()
    const clientIP = getClientIP(request)

    const limitCheck = checkRateLimit(clientIP)
    if (!limitCheck.allowed) {
      return new Response(JSON.stringify({ error: limitCheck.message || 'Rate limit exceeded' }), { status: 429 })
    }

    const body = await request.json()
    const { username, password, captchaToken } = body

    // CAPTCHA 令牌非空检查
    if (!captchaToken) {
      return new Response(JSON.stringify({ error: 'Missing CAPTCHA verification' }), { status: 403 })
    }

    // Username 非空检查
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Username is required' }), { status: 400 })
    }

    // 验证 CAPTCHA 令牌合法性与时效性
    try {
      const [signatureBase64, timestampStr] = captchaToken.split('.')
      const timestamp = parseInt(timestampStr, 10)

      // 验证时间戳 (5分钟有效期，防重放攻击)
      if (Date.now() - timestamp > 5 * 60 * 1000) throw new Error('Expired')

      const encoder = new TextEncoder()
      const secret = encoder.encode(import.meta.env.CAPTCHA_SECRET || 'refactx-edge-secret')
      const tokenData = encoder.encode(`verified:${timestamp}`)
      const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])

      const binaryString = atob(signatureBase64)
      const signatureBytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) signatureBytes[i] = binaryString.charCodeAt(i)

      const isValidToken = await crypto.subtle.verify('HMAC', key, signatureBytes, tokenData)
      if (!isValidToken) throw new Error('Invalid signature')
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid or expired CAPTCHA' }), { status: 403 })
    }

    // 加载用户映射表
    const userMap = getUserMap()
    if (!userMap) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: ADMIN_USERS or ADMIN_PASSWORD missing' }), { status: 500 })
    }

    // 查找用户
    const trimmedUsername = username.trim().toLowerCase()
    const hashedPassword = userMap.get(trimmedUsername)

    if (!hashedPassword) {
      recordFailedAttempt(clientIP)
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 401 })
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, hashedPassword)

    if (isMatch) {
      clearRecord(clientIP)
      const jwt = await getJwt()
      const SECRET = import.meta.env.ADMIN_JWT_SECRET || 'default_secret'
      const token = jwt.sign({ username: trimmedUsername, ip: clientIP, ts: Date.now() }, SECRET, { expiresIn: '2h' })
      return new Response(JSON.stringify({ success: true, token, username: trimmedUsername }), { status: 200 })
    } else {
      recordFailedAttempt(clientIP)
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 401 })
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: 'Invalid request', detail: errorMessage }), { status: 400 })
  }
}
