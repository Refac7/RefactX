export const prerender = false;
import type { APIRoute } from 'astro';
import { Octokit } from '@octokit/rest';
import { cleanupExpiredRecords, getClientIP, checkRateLimit } from '~/lib/rateLimit';

export const POST: APIRoute = async ({ request }) => {
  try {
    cleanupExpiredRecords();
    const clientIP = getClientIP(request);
    const limitCheck = checkRateLimit(clientIP);
    if (!limitCheck.allowed) return new Response(JSON.stringify({ error: limitCheck.message }), { status: 429 });

    const body = await request.json();
    const { filename, content, config, action = 'write', sha, isAbsolutePath } = body;

    // --- 替换为 JWT 验证 ---
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });
    const token = authHeader.split(' ')[1];
    const jwtImport = await import('jsonwebtoken');
    // @ts-ignore
    const jwt = jwtImport.default || jwtImport;
    const SECRET = import.meta.env.ADMIN_JWT_SECRET || 'default_secret';
    try { jwt.verify(token, SECRET); } 
    catch { return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 }); }
    // -----------------------

    const octokit = new Octokit({ auth: import.meta.env.GITHUB_TOKEN });
    const fullPath = isAbsolutePath ? filename : `${config.pathPrefix}${filename}`;

    if (action === 'delete') {
      let fileSha = sha;
      if (!fileSha) {
        try {
          const { data } = await octokit.repos.getContent({
            owner: config.owner, repo: config.repo, path: fullPath,
          });
          // @ts-ignore
          fileSha = data.sha;
        } catch (e) { return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 }); }
      }
      await octokit.repos.deleteFile({
        owner: config.owner, repo: config.repo, path: fullPath,
        message: `chore(cms): delete ${filename}`,
        sha: fileSha, branch: config.branch
      });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Write Logic
    let currentSha = sha;
    if (!currentSha) {
       try {
        const { data } = await octokit.repos.getContent({
            owner: config.owner, repo: config.repo, path: fullPath,
        });
        // @ts-ignore
        currentSha = data.sha;
       } catch(e) {}
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: config.owner, repo: config.repo, path: fullPath,
      message: `feat(cms): update ${filename}`,
      content: Buffer.from(content).toString('base64'),
      sha: currentSha, branch: config.branch
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}