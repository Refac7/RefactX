// src/pages/api/repo-stats.ts
export const prerender = false

import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const repo = url.searchParams.get('repo') // 例如: Refac7/RefactX_Template

  if (!repo) {
    return new Response(JSON.stringify({ error: 'Missing repo param' }), { status: 400 })
  }

  const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN

  try {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Astro-Blog-Client',
    }

    // 只有在配置了 Token 时才带上，避免 Token 失效导致报错
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`
    }

    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers })

    if (!res.ok) {
      // 如果 GitHub 返回错误 (404 或 403)，透传状态码
      return new Response(JSON.stringify({ error: 'GitHub API Error' }), { status: res.status })
    }

    const data = await res.json()

    // 只返回我们需要的数据，减少传输量
    return new Response(
      JSON.stringify({
        stars: data.stargazers_count,
        forks: data.forks_count,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // 让浏览器缓存 API 响应 1 小时，进一步减少请求
          'Cache-Control': 'public, max-age=3600',
        },
      }
    )
  } catch (error) {
    console.error('Repo Stats Error:', error)
    return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 })
  }
}
