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
            --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            
            --bg: #ffffff;
            --bg-subtle: #f4f4f5;
            --fg: #09090b;
            --muted: #71717a;
            --border: #e4e4e7;
            --border-hover: #d4d4d8;
            --primary: #18181b;
            --link: #2563eb;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #09090b;
              --bg-subtle: #18181b;
              --fg: #fafafa;
              --muted: #a1a1aa;
              --border: #27272a;
              --border-hover: #3f3f46;
              --primary: #ffffff;
              --link: #3b82f6;
            }
          }

          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: var(--font-sans);
            background-color: var(--bg);
            color: var(--fg);
            line-height: 1.6;
            font-size: 16px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          a { 
            text-decoration: none; 
            color: inherit; 
            transition: color 0.2s, border-color 0.2s; 
          }

          .layout {
            max-width: 768px;
            margin: 0 auto;
            padding: 4rem 1.5rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          /* Header */
          .header {
            margin-bottom: 4rem;
          }
          
          .header-meta {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }

          .rss-badge {
            background-color: var(--link);
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .btn-back {
            font-size: 0.875rem;
            color: var(--muted);
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
          }

          .btn-back:hover {
            color: var(--fg);
          }

          h1 {
            font-size: 2.25rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.2;
            margin-bottom: 0.75rem;
            color: var(--fg);
          }
          
          .channel-desc {
            color: var(--muted);
            font-size: 1rem;
            max-width: 600px;
            line-height: 1.6;
          }

          /* List */
          .feed-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }

          .item {
            padding: 1.5rem;
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            background-color: var(--bg-subtle);
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          
          .item:hover {
            border-color: var(--border-hover);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          }

          .item-meta {
            font-size: 0.875rem;
            color: var(--muted);
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .item-title {
            font-size: 1.25rem;
            font-weight: 600;
            line-height: 1.4;
            letter-spacing: -0.01em;
            margin-bottom: 0.75rem;
          }

          .item-title a:hover {
            color: var(--link);
          }

          .item-desc {
            font-size: 0.9375rem;
            color: var(--muted);
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* Footer */
          .footer {
            margin-top: auto;
            padding-top: 4rem;
            padding-bottom: 2rem;
            font-size: 0.875rem;
            color: var(--muted);
            text-align: center;
          }

          /* Mobile */
          @media (max-width: 640px) {
            .layout { padding: 2rem 1rem; }
            h1 { font-size: 1.875rem; }
            .item { padding: 1.25rem; }
            .item-title { font-size: 1.125rem; }
          }
        </style>
      </head>
      <body>
        <div class="layout">
          
          <header class="header">
            <div class="header-meta">
              <span class="rss-badge">RSS</span>
              <a href="{/rss/channel/link}" class="btn-back">
                Back to site
              </a>
            </div>
            
            <h1><xsl:value-of select="/rss/channel/title"/></h1>
            <p class="channel-desc">
              <xsl:value-of select="/rss/channel/description"/>
            </p>
          </header>

          <main>
            <ul class="feed-list">
              <xsl:for-each select="/rss/channel/item">
                <li class="item">
                  <div class="item-meta">
                    <time><xsl:value-of select="substring(pubDate, 0, 17)"/></time>
                  </div>

                  <h2 class="item-title">
                    <a href="{link}" target="_blank">
                      <xsl:value-of select="title"/>
                    </a>
                  </h2>

                  <div class="item-desc">
                    <xsl:value-of select="description" disable-output-escaping="yes"/>
                  </div>
                </li>
              </xsl:for-each>
            </ul>
          </main>
          
          <footer class="footer">
            <p>Generated by Astro RSS</p>
          </footer>
          
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>