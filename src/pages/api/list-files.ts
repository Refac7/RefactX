export const prerender = false

import type { APIRoute } from 'astro'
import { Octokit } from '@octokit/rest'
import { cleanupExpiredRecords, getClientIP, checkRateLimit } from '~/lib/rateLimit'
import { extractJwtUsername } from '~/lib/adminAuth'

export const POST: APIRoute = async ({ request }) => {
  try {
    cleanupExpiredRecords()
    const clientIP = getClientIP(request)
    const limitCheck = checkRateLimit(clientIP)
    if (!limitCheck.allowed) {
      return new Response(JSON.stringify({ error: limitCheck.message }), { status: 429 })
    }

    const body = await request.json()
    const { config } = body

    // 身份验证
    const authHeader = request.headers.get('authorization')
    const username = await extractJwtUsername(authHeader)
    if (!username) {
      return new Response(JSON.stringify({ error: 'Invalid or missing token' }), { status: 401 })
    }

    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN
    if (!GITHUB_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server GITHUB_TOKEN missing' }), { status: 500 })
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN })

    // 获取文件列表
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: config.pathPrefix,
    })

    if (!Array.isArray(data)) {
      return new Response(JSON.stringify({ files: [] }), { status: 200 })
    }

    const files = data
      .filter((file) => file.name.endsWith('.md') || file.name.endsWith('.mdx'))
      .map((file) => ({
        name: file.name,
        sha: file.sha,
        path: file.path,
      }))

    return new Response(JSON.stringify({ files }), { status: 200 })
  } catch (error: any) {
    console.error('List files error:', error)
    if (error.status === 404) {
      return new Response(JSON.stringify({ files: [] }), { status: 200 })
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
