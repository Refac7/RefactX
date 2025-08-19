// 🚀 高性能主题切换
;(function () {
  const STORAGE_KEY = 'theme'

  // 🎯 避免重复计算
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
  const root = document.documentElement

  // 立即应用主题，避免闪烁
  function applyTheme(theme, instant = false) {
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark.matches)

    if (instant) root.classList.add('disable-transition')
    root.toggleAttribute('data-theme', isDark ? 'dark' : 'light')
    root.classList.toggle('dark', isDark)
    if (instant) setTimeout(() => root.classList.remove('disable-transition'), 0)
  }

  // 初始化
  const savedTheme = localStorage.getItem(STORAGE_KEY) || 'system'
  applyTheme(savedTheme, true)

  // 🔧 优化系统主题监听
  prefersDark.addEventListener('change', () => {
    if (localStorage.getItem(STORAGE_KEY) === 'system') {
      applyTheme('system')
    }
  })

  // Astro 路由切换时重新应用
  document.addEventListener('astro:after-swap', () => {
    applyTheme(localStorage.getItem(STORAGE_KEY) || 'system')
  })
})()
