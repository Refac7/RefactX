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
          /* ===== Nothing Design · 红白黑 ===== */
          :root {
            --font-serif: 'Lexend', 'CJKEmDash', 'Numbers', ui-sans-serif, system-ui, sans-serif;
            --font-sans: 'CJKEmDash', 'Numbers', ui-sans-serif, system-ui, sans-serif;
            --font-mono: 'GeistMono', 'Input Mono', 'Fira Code', ui-monospace, monospace;

            --background: hsl(0 0% 99.5%);
            --foreground: hsl(0 0% 6%);
            --accent: hsl(0 0% 95%);
            --accent-foreground: hsl(0 0% 6%);
            --primary: hsl(3 72% 40%);
            --muted: hsl(0 0% 93%);
            --muted-foreground: hsl(0 0% 42%);
            --border: hsl(0 0% 88%);
            --bg-h: 0; --bg-s: 0%; --bg-l: 99.5%;
            --muted-h: 0; --muted-s: 0%; --muted-l: 93%;
            --primary-h: 3; --primary-s: 72%; --primary-l: 40%;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --background: hsl(0 0% 4%);
              --foreground: hsl(0 0% 97%);
              --accent: hsl(0 0% 13%);
              --accent-foreground: hsl(0 0% 97%);
              --primary: hsl(3 78% 48%);
              --muted: hsl(0 0% 13%);
              --muted-foreground: hsl(0 0% 55%);
              --border: hsl(0 0% 18%);
              --bg-h: 0; --bg-s: 0%; --bg-l: 4%;
              --muted-h: 0; --muted-s: 0%; --muted-l: 13%;
              --primary-h: 3; --primary-s: 78%; --primary-l: 48%;
            }
          }

          * { margin: 0; padding: 0; box-sizing: border-box; }

          html {
            background-color: var(--background);
            font-family: var(--font-sans);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          body {
            color: var(--foreground);
            min-height: 100vh;
            line-height: 1.6;
          }

          a {
            text-decoration: none;
            color: inherit;
          }

          /* Nothing 点阵底纹 */
          .hatch {
            background-image: radial-gradient(hsl(0 0% 0% / 0.05) 1px, transparent 1px);
            background-size: 18px 18px;
          }
          @media (prefers-color-scheme: dark) {
            .hatch {
              background-image: radial-gradient(hsl(0 0% 100% / 0.05) 1px, transparent 1px);
            }
          }

          .layout {
            max-width: 1200px;
            margin: 0 auto;
            padding: 6rem 2rem 3rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            gap: 4rem;
          }

          @media (max-width: 640px) {
            .layout { padding: 3rem 1rem 2rem; }
          }

          /* ===== 头部 ===== */
          .header {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding-bottom: 1.25rem;
            border-bottom: 1px solid var(--border);
          }

          .header-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            background-color: hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.1);
            color: var(--primary);
            font-family: var(--font-mono);
            font-size: 0.75rem;
            font-weight: 700;
          }

          h1 {
            font-family: var(--font-serif);
            font-size: 2rem;
            font-weight: 500;
            letter-spacing: -0.03em;
            line-height: 1.2;
            color: var(--foreground);
          }

          @media (max-width: 640px) {
            h1 { font-size: 1.5rem; }
          }

          .header-top {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .header-title-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
            flex: 1;
            min-width: 0;
          }

          .channel-title {
            font-family: var(--font-serif);
            font-size: 1.5rem;
            font-weight: 500;
            letter-spacing: -0.02em;
          }

          .channel-desc {
            color: var(--muted-foreground);
            font-size: 0.9375rem;
            max-width: 560px;
            margin-top: 0.75rem;
          }

          .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background-color: var(--muted);
            border: 1px solid var(--border);
            color: var(--muted-foreground);
            font-family: var(--font-mono);
            font-size: 0.625rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            transition: all 0.2s;
          }

          .btn-back:hover {
            color: var(--accent-foreground);
            border-color: var(--primary);
            background-color: hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.1);
          }

          /* ===== 内容区小标题 ===== */
          .section-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border);
            margin-bottom: 1.5rem;
          }

          .section-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .section-num {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.75rem;
            height: 1.75rem;
            background-color: hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.1);
            color: var(--primary);
            font-family: var(--font-mono);
            font-size: 0.75rem;
            font-weight: 700;
          }

          .section-name {
            font-family: var(--font-serif);
            font-size: 1.25rem;
            font-weight: 500;
            color: var(--foreground);
            letter-spacing: -0.02em;
          }

          .section-meta {
            font-family: var(--font-mono);
            font-size: 0.625rem;
            color: var(--muted-foreground);
            text-transform: uppercase;
            letter-spacing: 0.15em;
            opacity: 0.7;
            white-space: nowrap;
          }

          /* ===== 卡片网格 ===== */
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
          }

          .card {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            background-color: hsl(var(--bg-h) var(--bg-s) var(--bg-l) / 0.5);
            border: 1px solid var(--border);
            padding: 1.5rem;
            min-height: 200px;
            transition: all 0.3s ease;
          }

          .card:hover {
            border-color: hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.3);
            background-color: hsl(var(--muted-h) var(--muted-s) var(--muted-l) / 0.2);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          }

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
            background-color: hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.05);
            border: 1px solid hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.1);
            color: var(--primary);
            opacity: 0.8;
            transition: all 0.3s;
          }

          .card:hover .card-icon {
            transform: scale(1.1);
            background-color: hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.1);
          }

          .card-arrow {
            color: var(--muted-foreground);
            opacity: 0.3;
            transition: all 0.3s;
          }

          .card:hover .card-arrow {
            color: var(--primary);
            opacity: 1;
            transform: translate(2px, -2px);
          }

          .card-body {
            flex: 1;
          }

          .card-title {
            font-family: var(--font-serif);
            font-size: 1rem;
            font-weight: 500;
            line-height: 1.4;
            letter-spacing: -0.01em;
            color: var(--foreground);
            margin-bottom: 0.5rem;
          }

          .card-desc {
            font-size: 0.875rem;
            color: var(--muted-foreground);
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .card-bottom {
            margin-top: auto;
            padding-top: 0.75rem;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            font-family: var(--font-mono);
            font-size: 0.625rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--muted-foreground);
          }

          .status { display: inline-flex; align-items: center; gap: 0.5rem; }

          .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--muted-foreground);
            opacity: 0.6;
            transition: background-color 0.3s;
          }

          .card:hover .status-dot {
            background-color: var(--primary);
            opacity: 1;
          }

          .card-media {
            font-family: var(--font-mono);
            font-size: 0.625rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--primary);
          }

          .card-time { white-space: nowrap; text-align: right; }

          /* ===== 底部 ===== */
          .footer {
            margin-top: auto;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
            font-family: var(--font-mono);
            font-size: 0.625rem;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: var(--muted-foreground);
          }

          .footer-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--primary);
            display: inline-block;
            margin-bottom: 0.1em;
          }
        </style>
      </head>
      <body>
        <div class="layout">
          <header class="header">
            <div class="header-top">
              <div class="header-title-row">
                <span class="header-badge">RSS</span>
                <span class="channel-title"><xsl:value-of select="/rss/channel/title"/></span>
              </div>
              <a href="{/rss/channel/link}" class="btn-back">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Return to Site
              </a>
            </div>
            <p class="channel-desc">
              <xsl:value-of select="/rss/channel/description"/>
            </p>
          </header>

          <main class="hatch">
            <div class="section-head">
              <div class="section-title">
                <span class="section-num">01</span>
                <span class="section-name">Latest Signals</span>
              </div>
              <span class="section-meta">// System_Feed</span>
            </div>

            <div class="grid">
              <xsl:for-each select="/rss/channel/item">
                <a class="card" target="_blank" href="{link}">
                  <div class="card-top">
                    <div class="card-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <svg class="card-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </div>

                  <div class="card-body">
                    <h2 class="card-title"><xsl:value-of select="title"/></h2>
                    <div class="card-desc">
                      <xsl:value-of select="description" disable-output-escaping="yes"/>
                    </div>
                  </div>

                  <div class="card-bottom">
                    <span class="status">
                      <span class="status-dot"></span>
                      Log Entry
                    </span>
                    <span class="card-time"><xsl:value-of select="substring(pubDate, 0, 17)"/></span>
                  </div>
                </a>
              </xsl:for-each>
            </div>
          </main>

          <footer class="footer">
            <p>
              <span class="footer-dot"></span>Generated by Astro RSS Engine
            </p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>