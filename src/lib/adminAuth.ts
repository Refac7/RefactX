/**
 * Admin API helpers — JWT extraction and YAML frontmatter author parsing.
 * Used by API endpoints to enforce author-based access control.
 */

/**
 * Extract and verify the JWT from an Authorization header, returning the username.
 * Returns `null` if the token is missing or invalid.
 */
export async function extractJwtUsername(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  if (!token) return null

  try {
    const jwtImport = await import('jsonwebtoken')
    const jwt = (jwtImport as any).default || jwtImport
    const SECRET = (import.meta as any).env.ADMIN_JWT_SECRET || 'default_secret'
    const payload = jwt.verify(token, SECRET) as { username?: string }
    return payload?.username || null
  } catch {
    return null
  }
}

/**
 * Parse the `author` field from a markdown file's YAML frontmatter.
 * Returns the author string, or `null` if not found.
 */
export function parseAuthorFromContent(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const fm = match[1]
  const authorMatch = fm.match(/^author:\s*'?(.*?)'?\s*$/m)
  if (!authorMatch) return null
  return authorMatch[1].trim() || null
}
