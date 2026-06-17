import { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { useStore } from '@nanostores/react'
import { themeStore } from '~/stores/theme'

const iconVariants = {
  visible: { rotate: 0, scale: 1, opacity: 1 },
  hidden: { scale: 0, opacity: 0, rotate: 180 },
}

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const theme = useStore(themeStore)
  const controlsSun = useAnimation()
  const controlsMoon = useAnimation()
  const controlsSystem = useAnimation()

  // 1. 初始化时仅同步 Store 状态，不做任何 DOM 操作
  // DOM 的初次变色已经在 Astro 头部的内联 JS 中完成了（极速零阻塞）
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system'
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        themeStore.set(savedTheme)
      }
    } catch (e) {
      themeStore.set('system')
    }
    setMounted(true)
  }, [])

  // 2. 状态改变时，执行动画与页面切换
  useEffect(() => {
    if (!mounted) return

    // 动画控制
    if (theme === 'system') {
      controlsSun.start('hidden')
      controlsSystem.start('visible')
      controlsMoon.start('hidden')
    } else {
      controlsSun.start(theme === 'light' ? 'visible' : 'hidden')
      controlsMoon.start(theme === 'dark' ? 'visible' : 'hidden')
      controlsSystem.start('hidden')
    }

    try {
      localStorage.setItem('theme', theme)
    } catch (e) {}

    // 执行变色，并短暂禁用原生过渡以防全局闪烁
    const root = document.documentElement
    root.classList.add('disable-transition')

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', isDark)

    // 使用 requestAnimationFrame 保证样式应用完毕后再恢复过渡
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('disable-transition')
      })
    })
  }, [theme, mounted, controlsSun, controlsMoon, controlsSystem])

  const handleClick = () => {
    const themeMap = { light: 'dark', dark: 'system', system: 'light' }
    themeStore.set(themeMap[theme] as 'light' | 'dark' | 'system')
  }

  // 未挂载前渲染幽灵图标占位，防止排版抖动
  if (!mounted) {
    return (
      <button className="relative size-5 flex items-center justify-center cursor-pointer" aria-label="Toggle Theme">
        <div className="relative size-5 flex items-center justify-center opacity-0">
          <span className="icon-[tabler--device-desktop-question] size-5"></span>
        </div>
      </button>
    )
  }

  return (
    <button onClick={handleClick} className="relative size-5 flex items-center justify-center cursor-pointer" aria-label="Toggle Theme">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className="relative size-5 flex items-center justify-center">
        <motion.div
          className="absolute inset-0"
          variants={iconVariants}
          initial="hidden"
          animate={controlsSun}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <span className="icon-[tabler--sun-filled] size-5 text-foreground hover:text-foreground transition-colors"></span>
        </motion.div>
        <motion.div
          className="absolute inset-0"
          variants={iconVariants}
          initial="hidden"
          animate={controlsSystem}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <span className="icon-[tabler--device-desktop-question] size-5 text-foreground hover:text-foreground transition-colors"></span>
        </motion.div>
        <motion.div
          className="absolute inset-0"
          variants={iconVariants}
          initial="hidden"
          animate={controlsMoon}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <span className="icon-[tabler--moon-filled] size-5 text-foreground hover:text-foreground transition-colors"></span>
        </motion.div>
      </motion.div>
    </button>
  )
}

export default ThemeToggle
