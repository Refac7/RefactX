export const prerender = false

import type { APIRoute } from 'astro'
import { Octokit } from '@octokit/rest'
import { cleanupExpiredRecords, getClientIP, checkRateLimit } from '~/lib/rateLimit'
import { extractJwtUsername, parseAuthorFromContent } from '~/lib/adminAuth'

export const POST: APIRoute = async ({ request }) => {
  try {
    // 速率限制检查
    cleanupExpiredRecords()
    const clientIP = getClientIP(request)
    const limitCheck = checkRateLimit(clientIP)

    if (!limitCheck.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })
    }

    const body = await request.json()
    const { config, filename, absolutePath } = body

    // 身份验证 + 提取用户名
    const authHeader = request.headers.get('authorization')
    const username = await extractJwtUsername(authHeader)
    if (!username) {
      return new Response(JSON.stringify({ error: 'Invalid or missing token' }), { status: 401 })
    }

    // GitHub API 调用
    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN
    if (!GITHUB_TOKEN) {
      console.error('[Config Error] GITHUB_TOKEN is missing')
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN })
    const fullPath = absolutePath || `${config.pathPrefix}${filename}`

    try {
      const { data } = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: fullPath,
      })

      if ('content' in data && !Array.isArray(data)) {
        const fileContent = Buffer.from(data.content, 'base64').toString('utf-8')

        // 作者权限检查：仅允许加载自己的文章
        const fileAuthor = parseAuthorFromContent(fileContent)
        if (fileAuthor && fileAuthor.toLowerCase() !== username.toLowerCase()) {
          return new Response(JSON.stringify({ error: `You can only access your own posts. This post is authored by "${fileAuthor}".` }), {
            status: 403,
          })
        }

        return new Response(
          JSON.stringify({
            content: fileContent,
            sha: data.sha,
          }),
          { status: 200 }
        )
      }

      return new Response(JSON.stringify({ error: 'Target is not a file' }), { status: 400 })
    } catch (githubError: any) {
      if (githubError.status === 404) {
        return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 })
      }
      throw githubError
    }
  } catch (error) {
    console.error('[API Critical Error]', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
}
