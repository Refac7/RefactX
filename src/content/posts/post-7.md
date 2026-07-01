---
title: 'RefactX Project v1.6 更新日志'
description: '本次更新重点优化了项目结构及资源，提升访问速度和安全性，优化排版并新增文章内图片对外部 S3 对象存储的支持，以及其他若干漏洞修复。'
pubDate: 2025-12-24
author: 'Refac7'
heroImage: 'https://img.refact.cc/base/UpdateLog.webp'
heroImageAspectRatio: '16/9'
tags: ['更新日志','笔记']
---

## S3 对象存储支持

在之前的版本中，文章中嵌入的图片需要放置在 `/public` 文件夹中以便引用，或者依赖外部图床（数据安全性无法保证）。本次更新引入了 S3 对象存储支持，推荐使用 Cloudflare R2 对象存储（提供 10GB 存储空间，每月高达十万次 A/B 类操作，且存取免费），并可结合 Cloudflare Worker 进行接口编写和定制化处理。

由于此功能涉及敏感配置，未来将发布详细的配置文章。当前模板版本仅包含基础框架。

https://www.refact.cc/posts/post-9

此外，如果已配置 Waline 评论系统，还可以启用图片上传功能，将评论者的图片压缩后上传至 S3 对象存储（一般数据库如 PostgreSQL 有 64KiB 上传限制，难以处理大图片）。

## 速度和安全性

将 React 和 React DOM 更新至 19.2.1。优化了 Katex 公式的加载策略，并将 Waline 评论系统的 CSS 和 JS 文件移至本地，不再依赖 unpkg，从而提升加载速度。

此外，本次更新还优化了网络依赖树，进一步确保网页的加载速度和高性能。

根据实际测试，在 InPrivate 窗口清除缓存并进行硬刷新后，Lighthouse 测试的四项指标均能达到 100 分（结果受多种因素影响，仅供参考）。

:::image-figure[lighthouse]
![](https://img.refact.cc/lighthouse.png)(style: width:600px;)
:::

## 外观优化

本次更新显著提升了视觉效果，具体改进如下：

### RSS 页面

页面通过 XSLT 重新设计，提升了风格一致性。但由于 Chromium 内核即将停止对 XSLT 渲染的支持，此功能将在未来移除以提高安全性。

### 主页

主页删除了一些无用元素，重点优化了移动端显示效果，并对部分容器进行了微调，提升了视觉观感和设计一致性。

### 文章阅读页

隐藏移动端文章列表的图片显示。

删除了文章页的图片显示，简化了内容呈现，避免重复阅读导致疲劳；同时优化了段落跳转抽屉的性能和可用性。

## 错误修复

修复了在 `pnpm build` 构建生产版本时终端抛出的所有警告。

以及其他错误修复。

## 参考文献

[TuBaiBai's Blog](https://tbbbk.com/archives/cloudflare-r2-imgbed)

12月23日 初稿

12月24日 第一次修改
