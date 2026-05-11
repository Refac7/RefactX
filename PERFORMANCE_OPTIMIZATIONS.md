# 页面切换性能优化记录

## 问题诊断
用户反馈页面切换迟缓，点击后等一会才能切换页面，即使在本地开发服务器也有此问题。

## 根本原因分析

1. **事件监听器泄漏** - Header 组件中的移动菜单事件监听器在 ViewTransitions 时没有正确清理，导致累积多个监听器
2. **重复数据加载** - GithubContributions 组件在每次页面切换时都重新加载数据，阻塞主线程
3. **同步 localStorage 访问** - DynamicFeed 在页面转换时进行同步 localStorage 操作
4. **不优化的 RAF 和转换动画** - SearchSwitch 的页面转换逻辑不匹配 Astro 的转换事件周期
5. **预加载策略不当** - 使用 'viewport' 策略导致链接预加载延迟

## 实施的优化

### 1. Header.astro - 事件委托优化
- 使用作用域变量替代全局监听器
- 使用 `astro:after-swap` 替代 `astro:page-load` 以更快响应
- 正确清理旧的事件监听器，避免泄漏

### 2. GithubContributions.tsx - 智能数据加载
- 添加数据存在性检查，避免重复加载
- 使用 `requestIdleCallback` 推迟非关键的滚动操作
- 优化了依赖数组以减少不必要的重新渲染

### 3. DynamicFeed.tsx - 异步 localStorage 操作
- 使用 `requestIdleCallback` 将 localStorage 操作推迟到空闲时间
- 添加 try-catch 错误处理
- 避免在初始化时阻塞主线程

### 4. SearchSwitch.astro - 事件生命周期优化
- 统一使用 `astro:after-swap` 事件管理
- 正确清理和重新绑定键盘事件监听器
- 避免在页面转换时产生事件监听器重复

### 5. Layout.astro - 转换动画和样式优化
- 移除 `transition-all duration-500`，改为 `transition:animate="fade"`（更轻）
- 添加背景色预设脚本，避免白闪
- 在 `astro:after-swap` 时同步重置滚动位置
- 添加性能监测点

### 6. astro.config.mjs - 预加载策略
- 从 `'viewport'` 改为 `'load'`，提前预加载所有链接资源
- 这确保了下一页的 HTML、JS、CSS 已经提前加载

## 预期改进

- ✅ 页面切换响应时间快 200-400ms
- ✅ 减少主线程阻塞
- ✅ 更平滑的转换动画
- ✅ 避免事件监听器泄漏导致的长期性能衰减
- ✅ 更好的 FID (First Input Delay) 和 INP (Interaction to Next Paint)

## 性能最佳实践应用

1. **事件委托** - 减少监听器数量
2. **requestIdleCallback** - 推迟非关键操作
3. **requestAnimationFrame** - 同步 DOM 读写
4. **异步加载** - 不阻塞主线程
5. **资源预加载** - 提前加载关键资源
6. **事件生命周期** - 使用适当的 Astro 事件钩子

## 测试建议

- 使用 Chrome DevTools Performance 标签录制页面转换
- 观察 LCP、FID、CLS 指标
- 检查 FPS 是否平稳（应该是 60fps）
- 验证页面切换时是否有白闪（应该消除）
