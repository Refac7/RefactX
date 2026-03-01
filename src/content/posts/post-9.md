---
title: '图床配置指南'
description: '如何在 RefactX v1.6中使用图床以及在Waline 评论系统中启用图片上传'
pubDate: 2025-12-30
author: 'Refact'
tags: ['笔记']
recommend: false
heroImage: none
heroImageAspectRatio: '16/9'
---

注意：启用图床将会禁用图片优化功能。如果你强制在`./astro.config.mjs`的52行处修改为你的图床地址，那大概会被防盗链功能拦截，所以图片优化仅限静态资源。

首先需要的是S3对象存储，任何提供商理论上都支持，由于涉及到接口的编写，所以以CF R2和Worker举例。

本方法来自 https://tbbbk.com/archives/cloudflare-r2-imgbed 但其中的内容稍有纰漏，所以我决定重写这一部分。

## 开通对象存储

CF主页 > 存储和数据库 > R2对象存储 > 概述 > 创建储存桶

名称为 imgs ，位置选亚太地区，标准类型。

## 配置Worker

CF主页 > 计算和AI > Workers 和 Pages > 创建应用程序

选择从 Hello World! 开始，Worker name填 imgctl ，然后部署。

进入创建好的 Worker ，编辑代码。

Cloudflare worker 配置如下：

你需要在allowedDomains块中引入你的源域名，也就是你需要从哪里访问这些资源。

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const referer = request.headers.get('Referer') || '';
    const allowedDomains = ['localhost'];

    // -----------------------------
    // ✅ CORS 预检
    // -----------------------------
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // -----------------------------
    // ✅ POST 上传（使用 Token 校验）
    // -----------------------------
    if (request.method === 'POST' && pathname === '/upload') {
      try {
        const auth = request.headers.get('Authorization');
        if (!auth || auth !== `Bearer ${env.UPLOAD_TOKEN}`) {
          return new Response(
            JSON.stringify({ error: 'Invalid upload token' }),
            { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
          return new Response(
            JSON.stringify({ error: 'No file uploaded' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // ✅ 清理文件名
        const ext = file.name.substring(file.name.lastIndexOf('.')) || '';
        const filename = `comment/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

        const buffer = await file.arrayBuffer();

        await env.MY_BUCKET.put(filename, buffer, {
          httpMetadata: { contentType: file.type }
        });

        return new Response(
          JSON.stringify({ url: `https://img.refact.cc/${filename}` }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    // -----------------------------
    // ✅ GET 图片（Referer 防盗链）
    // -----------------------------
    if (request.method === 'GET') {
      // 只对 GET 做防盗链
      let allowed = false;
      for (const domain of allowedDomains) {
        if (referer.includes(domain)) {
          allowed = true;
          break;
        }
      }

      if (!allowed) {
        const warning = await env.MY_BUCKET.get('hotlink-warning.png');
        if (warning) {
          return new Response(warning.body, {
            status: 200,
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=3600',
              'X-Robots-Tag': 'noindex'
            }
          });
        }
        return new Response('Hotlinking not allowed', {
          status: 403,
          headers: { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex' }
        });
      }

      const key = pathname.slice(1);
      if (!key) return new Response('Bad Request', { status: 400 });

      const object = await env.MY_BUCKET.get(key);
      if (!object) return new Response('Not Found', { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(object.body, { status: 200, headers });
    }

    return new Response('Method Not Allowed', { status: 405 });
  }
};

```

接下来绑定储存桶，添加绑定。选择R2 储存桶。变量名称必须填 MY_BUCKET 。R2 储存桶选imgs 。

下一步绑定域名，设置 > 域和路由，你需要添加一个自定义域，方便在文章中引入。

转到设置 > 变量和机密，你还需要加入一个名为UPLOAD_TOKEN的环境变量

| 变量名 | `UPLOAD_TOKEN`                                               |
| ------ | ------------------------------------------------------------ |
| 值     | 自行设置，复杂一些，如果不使用Waline图片上传，可以忽略这一步。 |

### 配置PicGo或PicList

在这两款软件中，驱动选S3对象存储就可以。

CF主页 > 计算和AI > Workers 和 Pages > 概述

在Account detials 中 API Token栏右侧的 Manage按钮，创建 Account API 令牌，名称自拟，权限是对象读和写，其他保持默认。

复制Access Key ID 和 Secret Access Key（只显示一次），桶名就填imgs, 设定自定义节点，就填创建令牌时显示的S3 API。概述页最底部显示的内容。你还可以自定义上传路径。其他配置保持不变。

本文描述相对简洁，如果有疑问可以去看原文，如果问题是由本项目导致的，请提交issues。

## 在Waline 评论系统中启用图片上传

在./src/config.ts 配置文件的末尾，是有关waline评论系统的配置项，其中新增了三个配置项：是否启用图片上传功能、Waline 图片上传地址和Waline 上传 Token。这三个选项必须同时设置。

Waline评论上传的图片默认统一保存在comment文件夹下。

根据Worker的默认配置，图片上传地址应为https://img.example.com/upload 注意不要填错了。至此，配置完成，你在写文章时，通过PicGo/PicList上传至数据库，然后在Markdown文件中按照和以前一样的格式从图床引用就好。

```markdown
// 带描述的图片
:::image-figure[lighthouse]
![](https://img.refact.cc/lighthouse.png)(style: width:600px;)
:::
```

更多用法，请到 https://refact-x-template-git-galaxy-msrefs-projects.vercel.app/posts/markdown-extension-syntax 学习。

## 外部访问提示

你可以在存储桶的根目录放置一张提示图,命名为`hotlink-warning.png`，大概就是提示禁止从外部访问，不放也会有相应的文字提示。

12月26日 起稿

12月30日 初稿

1月4日 第一次修改

2月12日 第二次修改