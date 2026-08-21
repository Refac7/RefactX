export const prerender = false

import type { APIRoute } from 'astro'
import { Octokit } from '@octokit/rest'
import { cleanupExpiredRecords, getClientIP, checkRateLimit } from '~/lib/rateLimit'
import { extractJwtUsername, parseAuthorFromContent } from '~/lib/adminAuth'

// 定义操作的接口类型
interface FileOperation {
  type: 'update' | 'create' | 'delete'
  filename: string
  content?: string
  isDataFile?: boolean
}

export const POST: APIRoute = async ({ request }) => {
  try {
    cleanupExpiredRecords()
    const clientIP = getClientIP(request)

    const limitCheck = checkRateLimit(clientIP)
    if (!limitCheck.allowed) return new Response(JSON.stringify({ error: limitCheck.message }), { status: 429 })

    const body = await request.json()
    const { config, operations } = body // operations 是原始的操作数组

    const authHeader = request.headers.get('authorization')
    const username = await extractJwtUsername(authHeader)
    if (!username) {
      return new Response(JSON.stringify({ error: 'Invalid or missing token' }), { status: 401 })
    }

    const octokit = new Octokit({ auth: import.meta.env.GITHUB_TOKEN })
    const { owner, repo, branch, pathPrefix } = config

    // 验证每个操作的作者权限
    for (const op of operations as FileOperation[]) {
      const fullPath = op.isDataFile || op.filename.includes('/') ? op.filename : `${pathPrefix}${op.filename}`

      // Data files are shared configuration/content and do not use post author ownership.
      if (op.isDataFile) continue

      if (op.type === 'delete') {
        // 删除操作：获取文件内容，检查作者
        try {
          const { data } = await octokit.repos.getContent({ owner, repo, path: fullPath })
          if ('content' in data && !Array.isArray(data)) {
            const fileContent = Buffer.from(data.content, 'base64').toString('utf-8')
            const fileAuthor = parseAuthorFromContent(fileContent)
            if (fileAuthor && fileAuthor.toLowerCase() !== username.toLowerCase()) {
              return new Response(
                JSON.stringify({ error: `You can only delete your own posts. "${op.filename}" is authored by "${fileAuthor}"` }),
                { status: 403 }
              )
            }
          }
        } catch (e: any) {
          if (e.status === 404) {
            return new Response(JSON.stringify({ error: `File not found: ${op.filename}` }), { status: 404 })
          }
          throw e
        }
      } else {
        // 写入操作：检查提交内容中的 author 是否匹配
        if (op.content) {
          const contentAuthor = parseAuthorFromContent(op.content)
          if (contentAuthor && contentAuthor.toLowerCase() !== username.toLowerCase()) {
            return new Response(
              JSON.stringify({
                error: `You can only write posts as yourself. Content author "${contentAuthor}" does not match "${username}"`,
              }),
              { status: 403 }
            )
          }
          if (!contentAuthor) {
            return new Response(JSON.stringify({ error: `Post content must include an author field.` }), { status: 400 })
          }
        }

        // 对于已有文件的更新操作：额外检查远端文件的作者
        try {
          const { data } = await octokit.repos.getContent({ owner, repo, path: fullPath })
          if ('content' in data && !Array.isArray(data)) {
            const fileContent = Buffer.from(data.content, 'base64').toString('utf-8')
            const fileAuthor = parseAuthorFromContent(fileContent)
            if (fileAuthor && fileAuthor.toLowerCase() !== username.toLowerCase()) {
              return new Response(
                JSON.stringify({ error: `You can only edit your own posts. "${op.filename}" is authored by "${fileAuthor}"` }),
                { status: 403 }
              )
            }
          }
        } catch (e: any) {
          // 404 = 文件不存在，属于新建操作，允许通过
          if (e.status !== 404) throw e
        }
      }
    }

    // 使用 Map，Key 为完整文件路径。后续的操作会直接覆盖前面的操作。
    const uniqueOpsMap = new Map<string, any>()

    ;(operations as FileOperation[]).forEach((op) => {
      const fullPath = op.isDataFile || op.filename.includes('/') ? op.filename : `${pathPrefix}${op.filename}`
      uniqueOpsMap.set(fullPath, { ...op, finalPath: fullPath })
    })

    const distinctOperations = Array.from(uniqueOpsMap.values())

    if (distinctOperations.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No changes to commit' }), { status: 200 })
    }

    // 获取 Base Tree
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    })
    const baseTreeSha = refData.object.sha

    // 构建 Tree (使用去重后的 distinctOperations)
    const tree = await Promise.all(
      distinctOperations.map(async (item: any) => {
        if (item.type === 'delete') {
          return {
            path: item.finalPath,
            mode: '100644',
            type: 'blob',
            sha: null,
          }
        } else {
          const { data: blobData } = await octokit.git.createBlob({
            owner,
            repo,
            content: Buffer.from(item.content || '').toString('base64'),
            encoding: 'base64',
          })
          return {
            path: item.finalPath,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha,
          }
        }
      })
    )

    // 创建 Tree
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: tree as any,
    })

    // 创建 Commit
    const commitMessage = `chore(batch): update ${distinctOperations.length} files`
    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: newTree.sha,
      parents: [baseTreeSha],
    })

    // 更新 Ref
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
      force: false,
    })

    return new Response(JSON.stringify({ success: true, commitSha: commit.sha }), { status: 200 })
  } catch (error: any) {
    console.error('[Batch Error]', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
