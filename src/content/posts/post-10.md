---
title: '从 JavaScript 前端开发到 Electron 框架跨平台开发'
description: '本文主要描述了 JavaScript 和 Electron 的发展，关系，以及对于软件开发和原生开发可能存在的影响进行了分析。'
pubDate: 2026-01-02
author: 'Refact'
tags: ['笔记']
recommend: true
heroImage: none
heroImageAspectRatio: '16/9'
---

**关键词**：全栈开发、JavaScript、Electron等。

**引言** ：要说互联网网页的三大基石，那毋庸置疑是HTML、CSS、JavaScript。其中控制整个页面逻辑的就是JavaScript，是进行人机交互不可或缺的接口。而最初的JavaScript只能在浏览器中运行，也就是说，那时的JavaScript只能作为一个前端语言来使用。而之后，Node.js 横空出世，使得JavaScript可以作为一门后端语言来使用。此外，使用Electron 框架可以通过前端语言来创建跨平台应用，囊括了 Windows、macOS、Linux。

## **什么是JavaScript？(1)**

实际上，JavaScript 和 Java 没有实质上的关系，甚至可以说是毫不相干的。

当时，主流的浏览器之一是网景浏览器（Netscape Navigator），网页主要由超文本标记语言（HTML）构成，交互能力非常有限。用户在浏览网页时大多只能被动查看，主要的交互操作仅能通过点击超链接实现，这显然有很大的局限性。

因此，在 1995 年 9 月，JavaScript（最初称为 Mocha，后改名 LiveScript，最终定为 JavaScript）被引入，它提供了一系列可在页面内执行的脚本功能。这些脚本通过 `<script>` 标签嵌入 HTML，能够在页面加载或用户交互时运行。其核心思想是实现动态的页面行为，类似于如今局部刷新的交互模式，例如：通过浏览器 API 弹出对话框、控制页面滚动，或是读取浏览器提供的部分信息（如用户代理、操作系统等），并基于这些信息执行相应逻辑。

当然，早期的 JavaScript 并不完善，存在诸多兼容性与功能上的问题，需要各个浏览器厂商逐步实现统一的标准支持。

JavaScript 的标准化进程由 ECMA International 组织推进，1997 年首次发布 ECMAScript 标准。2009 年发布的 ES5 是重要的里程碑，提升了语言稳定性与功能性。与此同时，2008 年 Google 发布的 Chrome 浏览器搭载了 V8 引擎，极大提高了 JavaScript 的执行性能。随着现代浏览器对标准更加一致的支持，基于 JavaScript 的生态系统迅速发展壮大，其中包括服务器端的 Node.js（2009 年发布）以及桌面应用框架 Electron（2013 年发布）等，进一步拓展了 JavaScript 的应用领域与社区影响力。

## **什么是Electron框架？(2)**

Electron 最初由 GitHub（在微软收购之前）开发，是一个基于 Node.js 和 Chromium 的开源应用程序框架。该框架本身主要由 C++ 编写，其核心原理是将网页（前端技术）与 Node.js 后端能力结合，封装成一个独立的桌面应用程序。Electron 本身提供了一系列原生 API，使开发者能够与操作系统进行交互和调用系统功能。

这一点与 Windows 10 时期引入的 Web UI（如 UWP (4)中使用 WebView 的界面）不同，因为两者所处的架构层次和权限级别存在差异。Windows 系统自身的 UI 组件是在系统层面统一实现和管理的，同一组件在不同应用间行为一致，且通常由操作系统直接调度与绘制。而 Electron 则允许通过其底层接口调用操作系统提供的原生 UI 元素，例如窗口、对话框、菜单等，并可以深入访问系统级功能。

Chromium 在 Electron 中主要负责网页的渲染、网络请求的处理（如解析与发送数据包），以及提供现代的浏览器能力。其底层通过 C++ 实现，使得 Electron 应用能获得比一般 Web 应用（如运行在浏览器沙盒环境中的 Web UI）更高的系统资源访问权限。

当然，这种架构也存在一些不足。由于每个 Electron 应用都内置了完整的 Chromium 渲染引擎和 Node.js 运行时，其内存占用通常比纯粹的原生应用更高，这也是其常见的性能权衡之一。

目前，已经有不少知名软件采用 Electron 来实现跨平台开发，例如微软的 Visual Studio Code、腾讯的 QQ NT 以及 Discord 等。这些应用在保持良好跨平台兼容性的同时，也提供了丰富的现代交互体验。

## **这是如何实现的？(5)**

·   **Chromium**：用于渲染用户界面，每个窗口都是一个独立的 Chromium 渲染进程，支持现代 Web 标准。

·   **Node.js**：在主进程中运行，提供文件系统、网络等操作系统 API 的访问能力。

而Electron 框架就是起到了一个桥接的作用，将Web层面的操作翻译给后端处理，再将处理后的结果传给前端。

而对于系统API的调用，内存管理，文件操作等大多是由后端的Node.js处理的。在实际软件开发中，需要用类似 Electron Forge 的工具，将软件打包为 tar.gz(Linux)/dmg(macOS)/exe(Windows)来进行后续的分发操作。

| Web 技术层 (HTML/CSS/JS)        |
| ------------------------------- |
| `Electron 桥接层`               |
| `Chromium + Node.js 运行时环境` |

我们知道，不同的操作系统的操作有所差异比如Windows上的Alt键对应着macOS的Option键，文件系统目录`/Macintosh HD/Application Supports`（macOS）对应了`C:\Program Files`(Windows)，所以Electron程序会根据所打包的程序类型转换按键绑定和文件系统定位等，而开发者也需要在各个平台进行充分测试和调试。

## **对于软件开发的影响力**

为什么选择 Electron？在进行软件开发时，开发者必须考虑其多平台兼容性，如果应用程序不支持目标用户的操作系统，会直接导致客户的流失。而对于主流平台独占的软件开发框架，如dotnet(Windows)、Swift（macOS）、GTK（Linux）。这种专业性要求和学习成本极高的软件开发策略显然不是最优解。

而HTML、CSS、JavaScript作为前端开发工程师必备的技能，只需要相对较低的学习成本就可以开发三端互通的应用程序。所以近年来，使用Electron 框架的公司数量也在稳步增长。

## **那原生开发怎么办？**

我们一开始就提到了，相比于原生开发，Electron也是存在弊端的，这点在官方文档（5）也有提及。

首先是在资源受限的环境，我们之前提到了，由于软件的运行需要多一层翻译，所以转换效率肯定不如原生语言直接输出到显示器。也包括内存资源的占用。这在类似物联网设备上是绝对的红线。

其次，Electron 通过将最新版本的 Chromium、V8 和 Node.js 直接与应用程序二进制文件打包在一起，安装包自带浏览器内核。所以，打包后的包体一般不会小于100MiB。即使在操作系统有内嵌浏览器的情况下，据开发者所述（4），这是为了稳定性、安全性和性能。因此，对于一些磁盘占用敏感的情况下，我们不得不选择原生开发，因为可以调用系统自带的API。

再者，显而易见，Web技术并不适合用于编写游戏。因为往往Unity、虚幻引擎、DirectX/OpenGL 等原生框架可以提供更出色的性能，并能更直接地访问图形硬件。

## **参考文献**

1.维基百科 - https://zh.wikipedia.org/wiki/JavaScript

2.维基百科 - https://zh.wikipedia.org/wiki/Electron

3.Electron 官方文档 - https://www.electronjs.org/zh/docs/latest

4.WIKIPEDIA - https://en.wikipedia.org/wiki/Universal_Windows_Platform

5.Electron 官方文档 - https://www.electronjs.org/zh/docs/latest/why-electon

12月19日 起稿

1月2日 初稿

1月3日 第一次修改