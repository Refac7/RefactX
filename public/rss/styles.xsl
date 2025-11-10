<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html>
      <head>
        <title><xsl:value-of select="/rss/channel/title"/></title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          :root {
            --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            --color-bg-light: #ffffff;
            --color-text-light: #000000;
            --color-heading-light: #ff3b30;
            --color-link-light: #000000;
            --color-link-hover-light: #ff3b30;
            --color-border-light: #e0e0e0;
            --color-accent: #ff3b30;
            --color-muted: #666666;

            --color-bg-dark: #000000;
            --color-text-dark: #ffffff;
            --color-heading-dark: #ff3b30;
            --color-link-dark: #ffffff;
            --color-link-hover-dark: #ff3b30;
            --color-border-dark: #333333;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: var(--font-sans);
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: var(--color-bg-light);
            color: var(--color-text-light);
            font-size: 16px;
            font-weight: 400;
            transition: background-color 0.3s ease, color 0.3s ease;
          }

          .container {
            max-width: 100%;
            margin: 0;
            padding: 2rem 1.5rem;
          }

          .header {
            margin-bottom: 3rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid var(--color-border-light);
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .header-content {
            flex: 1;
          }

          h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--color-heading-light);
            letter-spacing: -0.02em;
          }
          
          h1 a {
            color: inherit;
            text-decoration: none;
            transition: color 0.2s ease;
          }
          
          h1 a:hover {
            color: var(--color-accent);
            text-decoration: none;
          }

          .channel-description {
            font-size: 1.125rem;
            color: var(--color-muted);
            margin-bottom: 10rem;
            font-weight: 400;
            line-height: 1.5;
          }

          .back-button {
            background-color: var(--color-text-light);
            color: var(--color-bg-light);
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-left: 1.5rem;
            flex-shrink: 0;
            text-decoration: none;
            font-size: 1.25rem;
            font-weight: 500;
          }

          .back-button:hover {
            background-color: var(--color-accent);
            transform: scale(1.05);
          }

          .back-button:active {
            transform: scale(0.95);
          }

          .items-list {
            list-style: none;
            padding: 0;
          }

          .item {
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--color-border-light);
          }
          
          .item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }

          .item-header {
            margin-bottom: 1rem;
          }

          .item-title {
            font-size: 1.375rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            line-height: 1.3;
          }
          
          .item-title a {
            color: var(--color-link-light);
            text-decoration: none;
            transition: color 0.2s ease;
          }
          
          .item-title a:hover {
            color: var(--color-link-hover-light);
            text-decoration: none;
          }

          .pubDate {
            color: var(--color-muted);
            font-size: 0.875rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }

          .description {
            color: var(--color-text-light);
            font-size: 1rem;
            line-height: 1.6;
          }

          .description a {
            color: var(--color-link-light);
            text-decoration: underline;
            text-decoration-color: var(--color-accent);
            text-underline-offset: 2px;
            transition: color 0.2s ease;
          }
          
          .description a:hover {
            color: var(--color-accent);
            text-decoration-color: currentColor;
          }

          footer {
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 2px solid var(--color-border-light);
            font-size: 0.875rem;
            color: var(--color-muted);
            text-align: left;
            line-height: 1.5;
          }

          footer a {
            color: var(--color-accent);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s ease;
          }
          
          footer a:hover {
            color: var(--color-link-hover-light);
            text-decoration: underline;
          }

          /* 深色模式 */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: var(--color-bg-dark);
              color: var(--color-text-dark);
            }
            
            .header {
              border-bottom: 2px solid var(--color-border-dark);
            }
            
            h1 {
              color: var(--color-heading-dark);
            }
            
            .channel-description {
              color: #aaaaaa;
            }
            
            .back-button {
              background-color: var(--color-text-dark);
              color: var(--color-bg-dark);
            }
            
            .back-button:hover {
              background-color: var(--color-accent);
            }
            
            .item {
              border-bottom: 1px solid var(--color-border-dark);
            }
            
            .item-title a {
              color: var(--color-link-dark);
            }
            
            .item-title a:hover {
              color: var(--color-link-hover-dark);
            }
            
            .pubDate {
              color: #888888;
            }
            
            .description {
              color: var(--color-text-dark);
            }
            
            .description a {
              color: var(--color-link-dark);
            }
            
            .description a:hover {
              color: var(--color-link-hover-dark);
            }
            
            footer {
              border-top: 2px solid var(--color-border-dark);
              color: #888888;
            }
          }

          /* 响应式设计 */
          @media (min-width: 768px) {
            .container {
              padding: 3rem 2rem;
            }
            
            h1 {
              font-size: 3rem;
            }
            
            .item-title {
              font-size: 1.5rem;
            }
            
            .back-button {
              width: 56px;
              height: 56px;
              font-size: 1.5rem;
            }
          }

          @media (min-width: 1024px) {
            .container {
              padding: 4rem 3rem;
              max-width: 800px;
              margin: 0 auto;
            }
          }
          
          @media (max-width: 480px) {
            .header {
              flex-direction: column;
            }
            
            .back-button {
              margin-left: 0;
              margin-top: 1rem;
              align-self: flex-start;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-content">
              <h1><a href="{/rss/channel/link}" target="_blank"><xsl:value-of select="/rss/channel/title"/></a></h1>
              <p class="channel-description"><xsl:value-of select="/rss/channel/description"/></p>
            </div>
            <a href="{/rss/channel/link}" class="back-button" title="返回网站">
              ←
            </a>
          </div>

          <ul class="items-list">
            <xsl:for-each select="/rss/channel/item">
              <li class="item">
                <div class="item-header">
                  <h2 class="item-title">
                    <a href="{link}" target="_blank">
                      <xsl:value-of select="title"/>
                    </a>
                  </h2>
                  <div class="pubDate">
                    <xsl:value-of select="pubDate"/>
                  </div>
                </div>
                <div class="description">
                  <xsl:value-of select="description" disable-output-escaping="yes"/>
                </div>
              </li>
            </xsl:for-each>
          </ul>
          
          <footer>
            Generated by Astro using @astrojs/rss <br /> 
            Powered by <a href="https://github.com/Refac7/RefactX_Template" target="_blank">RefactX Theme</a>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>