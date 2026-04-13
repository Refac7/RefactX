<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html>
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> - RSS Feed</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          :root {
            /* Vercel Geist 风格字体 */
            --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            
            /* 亮色模式 (Light) */
            --bg: #ffffff;
            --bg-card: #fafafa;
            --bg-icon: #f4f4f5;
            --fg: #09090b;
            --muted: #71717a;
            --border: #e4e4e7;
            --border-hover: #d4d4d8;
            --primary: #18181b;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              /* 深色模式 (Dark) */
              --bg: #09090b;
              --bg-card: #111111;
              --bg-icon: #18181b;
              --fg: #fafafa;
              --muted: #a1a1aa;
              --border: #27272a;
              --border-hover: #3f3f46;
              --primary: #ffffff;
            }
          }

          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: var(--font-sans);
            background-color: var(--bg);
            color: var(--fg);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          a { text-decoration: none; color: inherit; }

          .layout {
            max-width: 1200px;
            margin: 0 auto;
            padding: 4rem 2rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          /* 头部 Header */
          .header {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 2.5rem;
            margin-bottom: 3rem;
          }

          @media (min-width: 768px) {
            .header {
              flex-direction: row;
              justify-content: space-between;
              align-items: flex-start;
            }
          }

          .header-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .header-title {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .rss-badge {
            background-color: var(--fg);
            color: var(--bg);
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          h1 {
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: -0.03em;
            line-height: 1.2;
            color: var(--fg);
          }
          
          .channel-desc {
            color: var(--muted);
            font-size: 0.9375rem;
            max-width: 500px;
          }

          .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background-color: var(--bg-icon);
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--muted);
            transition: all 0.2s;
          }

          .btn-back:hover {
            color: var(--fg);
            border-color: var(--border-hover);
          }

          /* Vercel 风格网格与四角卡片排版 */
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
          }

          .card {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background-color: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            padding: 1.5rem;
            min-height: 200px;
            transition: all 0.3s ease;
          }

          .card:hover {
            border-color: var(--border-hover);
            background-color: var(--bg);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
          }

          /* 卡片顶栏：图标 + 箭头 */
          .card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .card-icon {
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--bg-icon);
            border: 1px solid var(--border);
            border-radius: 0.375rem;
            color: var(--fg);
            opacity: 0.7;
            transition: all 0.3s;
          }

          .card:hover .card-icon {
            border-color: var(--border-hover);
            opacity: 1;
          }

          .card-arrow {
            color: var(--muted);
            opacity: 0.4;
            transition: all 0.3s;
          }

          .card:hover .card-arrow {
            color: var(--fg);
            opacity: 1;
          }

          /* 卡片主体：标题 + 描述 */
          .card-body {
            margin-top: 1.5rem;
            flex: 1;
          }

          .card-title {
            font-size: 1.125rem;
            font-weight: 600;
            line-height: 1.4;
            letter-spacing: -0.02em;
            color: var(--fg);
            margin-bottom: 0.5rem;
          }

          .card-desc {
            font-size: 0.875rem;
            color: var(--muted);
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* 卡片底栏：元数据 */
          .card-bottom {
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: var(--font-mono);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--muted);
          }

          .status-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--muted);
            margin-right: 6px;
            transition: background-color 0.3s;
          }

          .card:hover .status-dot {
            background-color: #10b981; /* Green active status */
          }

          /* 底部信息 */
          .footer {
            margin-top: auto;
            padding-top: 4rem;
            font-size: 0.875rem;
            color: var(--muted);
            text-align: center;
          }

          @media (max-width: 640px) {
            .layout { padding: 2rem 1rem; }
            h1 { font-size: 1.5rem; }
          }
        </style>
      </head>
      <body>
        <div class="layout">
          
          <header class="header">
            <div class="header-info">
              <div class="header-title">
                <span class="rss-badge">RSS</span>
                <h1><xsl:value-of select="/rss/channel/title"/></h1>
              </div>
              <p class="channel-desc">
                <xsl:value-of select="/rss/channel/description"/>
              </p>
            </div>
            
            <a>
              <xsl:attribute name="href">
                <xsl:value-of select="/rss/channel/link"/>
              </xsl:attribute>
              <xsl:attribute name="class">btn-back</xsl:attribute>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Return to Site
            </a>
          </header>

          <main class="grid">
            <xsl:for-each select="/rss/channel/item">
              <!-- 强制使用 xsl:attribute 绑定超链接，杜绝 undefined -->
              <a class="card" target="_blank">
                <xsl:attribute name="href">
                  <xsl:value-of select="link"/>
                </xsl:attribute>
                
                <div class="card-top">
                  <div class="card-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div class="card-arrow">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </div>
                </div>

                <div class="card-body">
                  <h2 class="card-title"><xsl:value-of select="title"/></h2>
                  <div class="card-desc">
                    <xsl:value-of select="description" disable-output-escaping="yes"/>
                  </div>
                </div>

                <div class="card-bottom">
                  <span>
                    <span class="status-dot"></span>
                    LOG ENTRY
                  </span>
                  <time><xsl:value-of select="substring(pubDate, 0, 17)"/></time>
                </div>
              </a>
            </xsl:for-each>
          </main>
          
          <footer class="footer">
            <p>Generated by Astro RSS Engine</p>
          </footer>
          
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>