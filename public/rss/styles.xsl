<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html>
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> :: RSS_FEED</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          :root {
            /* 基础字重与字体 */
            --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            --font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            
            /* 亮色模式变量 */
            --bg: #ffffff;
            --fg: #09090b;
            --muted: #71717a;
            --muted-light: #e4e4e7;
            --border: #e4e4e7;
            --primary: #000000; /* 或跟随你网站的主色 */
            --accent: #ff3b30;
            
            /* 网格背景颜色 */
            --grid-color: rgba(0, 0, 0, 0.04);
          }

          @media (prefers-color-scheme: dark) {
            :root {
              /* 深色模式变量 */
              --bg: #09090b;
              --fg: #fafafa;
              --muted: #a1a1aa;
              --muted-light: #27272a;
              --border: #27272a;
              --primary: #ffffff;
              --grid-color: rgba(255, 255, 255, 0.05);
            }
          }

          /* 全局重置 */
          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: var(--font-sans);
            background-color: var(--bg);
            color: var(--fg);
            line-height: 1.6;
            font-size: 16px;
            /* 背景网格 */
            background-image: 
              linear-gradient(to right, var(--grid-color) 1px, transparent 1px), 
              linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
            background-size: 40px 40px;
            min-height: 100vh;
          }

          /* 链接样式 */
          a { text-decoration: none; color: inherit; transition: all 0.2s; }
          a:hover { color: var(--accent); }

          /* 容器 */
          .layout {
            max-width: 1200px;
            margin: 0 auto;
            border-left: 1px solid var(--border);
            border-right: 1px solid var(--border);
            min-height: 100vh;
            background-color: var(--bg);
            position: relative;
          }

          /* 顶部状态栏 HUD */
          .hud {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 2rem;
            border-bottom: 1px solid var(--border);
            font-family: var(--font-mono);
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--muted);
            user-select: none;
          }
          .hud-status::before {
            content: '';
            display: inline-block;
            width: 6px;
            height: 6px;
            background-color: #10b981; /* Green status */
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
          }

          /* 头部 Header */
          .header {
            padding: 4rem 2rem 2rem;
            border-bottom: 4px solid var(--fg);
          }
          
          h1 {
            font-size: 4rem;
            font-weight: 900;
            letter-spacing: -0.05em;
            line-height: 0.9;
            margin-bottom: 1rem;
            text-transform: uppercase;
          }
          
          .channel-desc {
            font-family: var(--font-mono);
            color: var(--muted);
            font-size: 0.875rem;
            max-width: 600px;
            border-left: 2px solid var(--border);
            padding-left: 1rem;
          }

          /* 返回按钮 (模拟功能块) */
          .btn-back {
            display: inline-flex;
            align-items: center;
            margin-top: 2rem;
            padding: 0.5rem 1rem;
            border: 1px solid var(--border);
            font-family: var(--font-mono);
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: var(--muted-light);
          }
          .btn-back:hover {
            background: var(--fg);
            color: var(--bg);
            border-color: var(--fg);
          }

          /* 列表区域 */
          .feed-list {
            list-style: none;
          }

          .item {
            position: relative;
            padding: 3rem 2rem;
            border-bottom: 1px solid var(--border);
            transition: background-color 0.2s;
          }
          
          .item:hover {
            background-color: rgba(125, 125, 125, 0.03);
          }

          /* 序列号 */
          .item-index {
            position: absolute;
            top: 3.2rem;
            left: 0.5rem;
            font-family: var(--font-mono);
            font-size: 10px;
            color: var(--muted);
            opacity: 0.5;
            writing-mode: vertical-lr;
            transform: rotate(180deg);
          }

          /* 文章元数据 */
          .item-meta {
            font-family: var(--font-mono);
            font-size: 10px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .item-meta span::before { content: '['; margin-right: 4px; opacity: 0.5; }
          .item-meta span::after { content: ']'; margin-left: 4px; opacity: 0.5; }

          /* 文章标题 */
          .item-title {
            font-size: 1.75rem;
            font-weight: 700;
            line-height: 1.2;
            letter-spacing: -0.03em;
            margin-bottom: 1rem;
          }
          .item-title a {
            background-image: linear-gradient(to right, var(--fg), var(--fg));
            background-size: 0% 2px;
            background-repeat: no-repeat;
            background-position: left bottom;
            transition: background-size 0.3s ease;
          }
          .item-title a:hover {
            background-size: 100% 2px;
            color: var(--fg);
          }

          /* 文章描述 */
          .item-desc {
            font-size: 1rem;
            color: var(--muted);
            max-width: 65ch;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* 底部 */
          .footer {
            padding: 3rem 2rem;
            font-family: var(--font-mono);
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--muted);
            border-top: 4px solid var(--fg);
            background-color: var(--muted-light);
          }

          /* 动画 */
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }

          /* 响应式 */
          @media (max-width: 600px) {
            .layout { border: none; }
            h1 { font-size: 2.5rem; }
            .item-title { font-size: 1.4rem; }
            .item-index { display: none; }
            .header { padding-top: 2rem; }
          }
        </style>
      </head>
      <body>
        <div class="layout">
          
          <div class="hud">
            <span class="hud-status">SYS.RSS.FEED // ONLINE</span>
            <span>V.1.0</span>
          </div>

          
          <div class="header">
            <h1><a href="{/rss/channel/link}"><xsl:value-of select="/rss/channel/title"/></a></h1>
            <div class="channel-desc">
              <xsl:value-of select="/rss/channel/description"/>
              <br/>
              <span style="opacity:0.5; margin-top:0.5rem; display:block;">>> PROTOCOL: XML/RSS_2.0</span>
            </div>
            
            <a href="{/rss/channel/link}" class="btn-back">
               &lt; RETURN_TO_BASE
            </a>
          </div>

          
          <ul class="feed-list">
            <xsl:for-each select="/rss/channel/item">
              <li class="item">
                
                <div class="item-index">
                  LOG_
                  <xsl:if test="position() &lt; 10">0</xsl:if>
                  <xsl:value-of select="position()" />
                </div>

                <div class="item-meta">
                  <span><xsl:value-of select="substring(pubDate, 0, 17)"/></span>
                  <span>NODE</span>
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
          
          
          <div class="footer">
            <p>GENERATED_BY: ASTRO_RSS_MODULE</p>
            <p style="margin-top: 0.5rem; opacity: 0.6;">/// END_OF_STREAM</p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>