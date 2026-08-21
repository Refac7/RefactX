---
title: 'RefactX Project v1.7 更新日志'
description: '本次更新重点新增了内容管理系统的支持，更新全局设计，以及其他若干漏洞修复。'
pubDate: 2026-02-07
author: 'refac7'
tags: ['更新日志', '笔记']
recommend: false
heroImage: 'https://img.refact.cc/base/UpdateLog.webp'
heroImageAspectRatio: '16/9'
---

## 新增内容管理系统（CMS）

本次更新带来了管理员控制台，可以在浏览器中实现发布、修改或删除文章，增删友链，修改项目和图库内容等，通过./src/content/data下的json文件统一写入和读取，配合内置的暂存区功能，将多个更改一次性提交，也包含从暂存区回读内容以进行下一步修改的功能。通过GitHub API提交后，触发vercel或者netlify 重新构建。

该功能类似于Wordpress的内容管理，大大提升了用户体验。

### 配置方法

1. 到 https://github.com/settings/tokens 创建新的Token，根据最小权限原则，仅包含该仓库的读写权限即可。
2. 把项目git clone 到本地，使用 `node scripts/gen-hash.js 你的明文内容`来加密你的密码
3. 在config.ts完成基本字段配置
4. 在vercel或其他部署平台配置GITHUB_TOKEN=你的GitHub Token；以及ADMIN_PASSWORD=加密后的密码，以及配置ADMIN_JWT_SECRET=你的JWT密码字符串。这些内容不会暴露到前端，仅在nodejs服务器中流转。

> [!NOTE]
>
> WALINE_CONFIG中的enableImgUpload的值也控制着CMS的图片上传，你需要提前完成图床配置才可启用。还有其他提醒，请查阅代码中的注释。

> [!WARNING]
>
> 如果你需要从低版本（^1.6.1）迁移而来，无论是否启用CMS，都需要把config.ts中的友链信息，项目信息，照片列表改为json文件存储在content目录下，否则会导致友链，项目，照片页面报错，当然你也可以自行修改代码以适配新的配置方式。

## 外观优化

本次更新显著提升了视觉效果，具体改进如下：

### RSS 页面

页面通过 XSLT 重新设计，提升了风格一致性。但由于 Chromium 内核即将停止对 XSLT 渲染的支持，此功能将在未来移除以提高安全性。

### 整体风格

优化全局整体风格统一，全面引入网格布局，重点优化了在宽屏设备上的显示效果。

## 错误修复

修复了部分硬编码代码导致的配置项失效的错误。修复了pagefind语言配置错误导致无法进行中文检索的错误

以及其他错误修复。

## 参考文献

https://www.996icu.eu.org/blog/%E4%BC%98%E5%8C%96%E4%BA%86%E7%BD%91%E7%AB%99%E7%9A%84%E4%B8%80%E4%BA%9B%E5%8A%9F%E8%83%BD

2月7日 初稿

2月12日 第一次修改