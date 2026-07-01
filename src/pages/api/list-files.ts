export const prerender = false

import type { APIRoute } from 'astro'
import { Octokit } from '@octokit/rest'
import { cleanupExpiredRecords, getClientIP, checkRateLimit } from '~/lib/rateLimit'
import { extractJwtUsername, parseAuthorFromContent } from '~/lib/adminAuth'

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

    // 身份验证 + 提取用户名
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

    const mdFiles = data.filter((file) => file.name.endsWith('.md') || file.name.endsWith('.mdx'))

    // 并行获取每个文件的内容以检查作者权限
    const results = await Promise.allSettled(
      mdFiles.map(async (file) => {
        try {
          const { data: fileData } = await octokit.repos.getContent({
            owner: config.owner,
            repo: config.repo,
            path: file.path,
          })
          if ('content' in fileData && !Array.isArray(fileData)) {
            const fileContent = Buffer.from(fileData.content, 'base64').toString('utf-8')
            const fileAuthor = parseAuthorFromContent(fileContent)
            // 仅返回作者匹配的文章（无 author 字段的文章所有用户可见）
            if (!fileAuthor || fileAuthor.toLowerCase() === username.toLowerCase()) {
              return { name: file.name, sha: file.sha, path: file.path }
            }
          }
        } catch {
          // 单个文件获取失败不影响整体
        }
        return null
      })
    )

    // 过滤掉 null 结果
    const files = results
      .filter((r): r is PromiseFulfilledResult<{ name: string; sha: string; path: string } | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((f): f is { name: string; sha: string; path: string } => f !== null)

    return new Response(JSON.stringify({ files }), { status: 200 })
  } catch (error: any) {
    console.error('List files error:', error)
    // 如果是 404 (仓库或路径不存在)，返回空列表而不是报错
    if (error.status === 404) {
      return new Response(JSON.stringify({ files: [] }), { status: 200 })
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
