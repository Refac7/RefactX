import type {
  GithubConfig,
  Link,
  PostConfig,
  ProjectConfig,
  DynamicConfig,
  Site,
  SkillsShowcaseConfig,
  SocialLink,
  TagsConfig,
  AuthorsConfig,
} from '~/types'

// 站点全局配置
export const SITE: Site = {
  title: 'RefactX Project',
  description: '又是又是……又是借口 / Another another... Another excuse.',
  website: 'https://www.refact.cc/',
  base: '/',
  author: 'Refact',
  ogImage: '/og-image.webp',
  version: '1.8',
  footerText: 'Designed and engineered for the digital void.',
  footerText2: 'Minimalist layout, maximum focus. Data persistence guaranteed.',
}

// 顶部导航菜单
export const HEADER_LINKS: Link[] = [
  { name: '文章', url: '/posts' },
  { name: '动态', url: '/dynamic' },
  { name: '项目', url: '/projects' },
  { name: '关于', url: '/about' },
]

// 底部导航菜单
export const FOOTER_LINKS: Link[] = [
  { name: '主页', url: '/' },
  { name: '文章', url: '/posts' },
  { name: '动态', url: '/dynamic' },
  { name: '项目', url: '/projects' },
  { name: '标签', url: '/tags' },
  { name: '作者', url: '/authors' },
  { name: '友链', url: '/friends' },
  { name: '关于', url: '/about' },
]

// 社交链接 (图标参考: https://icon-sets.iconify.design/)
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'GitHub',
    url: 'https://github.com/Refac7',
    icon: 'icon-[ri--github-fill]',
  },
  {
    name: 'BiliBili',
    url: 'https://space.bilibili.com/441325177',
    icon: 'icon-[ri--bilibili-fill]',
  },
]

// 技能展示矩阵配置
export const SKILLSSHOWCASE_CONFIG: SkillsShowcaseConfig = {
  SKILLS_ENABLED: true, // 是否启用主页技能墙
  SKILLS_DATA: [
    {
      direction: 'left',
      skills: [
        { name: 'JavaScript', icon: 'icon-[mdi--language-javascript]' },
        { name: 'CSS', icon: 'icon-[mdi--language-css3]' },
        { name: 'HTML', icon: 'icon-[mdi--language-html5]' },
        { name: 'TypeScript', icon: 'icon-[mdi--language-typescript]' },
      ],
    },
    {
      direction: 'right',
      skills: [
        { name: 'Astro', icon: 'icon-[lineicons--astro]' },
        { name: 'Node.js', icon: 'icon-[mdi--nodejs]' },
        { name: 'React', icon: 'icon-[mdi--react]' },
        { name: 'Next.js', icon: 'icon-[devicon--nextjs]' },
        { name: 'Tailwind CSS', icon: 'icon-[mdi--tailwind]' },
        { name: 'Iconify', icon: 'icon-[line-md--iconify2-static]' },
      ],
    },
    {
      direction: 'left',
      skills: [
        { name: 'Debian', icon: 'icon-[mdi--debian]' },
        { name: 'Git', icon: 'icon-[mdi--git]' },
        { name: 'MongoDB', icon: 'icon-[lineicons--mongodb]' },
        { name: 'Vercel', icon: 'icon-[lineicons--vercel]' },
      ],
    },
  ],
}

// GitHub 贡献图配置
export const GITHUB_CONFIG: GithubConfig = {
  ENABLED: true, // 是否启用贡献图
  GITHUB_USERNAME: 'Refac7', // GitHub 用户名
  TOOLTIP_ENABLED: true, // 是否开启悬浮提示
}

// 文章页面配置
export const POSTS_CONFIG: PostConfig = {
  title: 'Posts',
  description: 'Refact 的文章',
  introduce: '不定时更新维护文章，可订阅 RSS 获取最新更新状态。',
  author: 'Refact',
  homePageConfig: { size: 3, type: 'compact' },
  postPageConfig: { size: 8, type: 'image' },
  tagsPageConfig: { size: 5, type: 'time-line' },
  authorsPageConfig: { size: 8, type: 'image' },
  defaultHeroImage: '/og-image.webp',
  defaultHeroImageAspectRatio: '16/9',
  postType: 'jap',
  imageDarkenInDark: true,
  readMoreText: '阅读全文',
  prevPageText: '上一页',
  nextPageText: '下一页',
  tocText: '目录导航',
  backToPostsText: '返回文章列表',
  nextPostText: '下一篇',
  prevPostText: '上一篇',
}

// 标签页面配置
export const TAGS_CONFIG: TagsConfig = {
  title: 'Tags',
  description: '所有文章标签',
  introduce: '所有文章标签均在此处，点击即可筛选。',
}

// 作者页面配置
export const AUTHORS_CONFIG: AuthorsConfig = {
  title: 'Authors',
  description: '所有文章作者',
  introduce: '浏览不同作者的文章，点击作者名即可筛选其撰写的所有文章。',
}

// 项目页面配置
export const PROJECTS_CONFIG: ProjectConfig = {
  title: 'Projs',
  description: '我的项目案例',
  introduce: '以下是我的项目案例展示，不定期维护项目。',
}

// 动态页面配置
export const DYNAMIC_CONFIG: DynamicConfig = {
  title: 'Dynamic',
  description: '我的动态',
  introduce: '实时信号、简短想法和开发更新，直接从 Notion 工作区同步。',
}

// 友链页面配置
export const FRIENDS_CONFIG = {
  title: 'Friends',
  description: '我的朋友们都在这里，欢迎互访～',
  introduce: '已获取星图定位，正在前往友链星系的路上……',
  enableAdd: false,
}

// 博主专属友链卡片信息
export const FRIENDS_CONTACT = {
  sitename: 'RefactX Project',
  email: 'i@refact.cc',
  author: 'Refac7',
  sitelink: 'https://www.refact.cc',
  siteavatar: 'https://img.refact.cc/base/avatar.jpg',
  description: 'Another, another… another excuse.',
}

// Waline 评论系统配置
export const WALINE_CONFIG = {
  enableComment: true,
  serverURL: import.meta.env.PUBLIC_WALINE_SERVER_URL || 'https://waline.refact.cc',
  uploadToken: import.meta.env.PUBLIC_UPLOAD_TOKEN,
  imgbedURL: import.meta.env.PUBLIC_IMG_BED_URL || 'https://img.refact.cc/upload',
  enableImgUpload: true, // true: 上传至图片服务器 / false: 存入数据库(限 128KiB)
}

// CMS 内容管理配置
// 需在部署平台设置环境变量: PUBLIC_UPLOAD_TOKEN (如需管理后台则添加 GITHUB_TOKEN, ADMIN_PASSWORD)
// 数据源提醒: v1.6.1 及之后版本，友链/项目/照片数据须转为 JSON 存放在 content/data 目录下
export const CMS_CONFIG = {
  enableCMS: true,
  owner: 'Refac7', // GitHub 仓库所有者
  repo: 'RefactX', // GitHub 仓库名称
  branch: 'main', // 目标分支
  pathPrefix: 'src/content/posts/', // 相对路径前缀
}

// 节日特效配置
// 样式修改: src/components/base/HolidayTheme.astro & global.css
export const HOLIDAY_EFFECTS = {
  enableHolidayEffects: true,
}

// src/config.ts

export const HOLIDAY_THEMES = {
  // ====== 哀悼日 ======
  '2026-04-04': {
    theme: 'theme-mourning',
    message: '今日是特殊纪念日，全站已开启哀悼模式。',
  },
  '2026-04-05': {
    theme: 'theme-mourning',
    message: '今日是特殊纪念日，全站已开启哀悼模式。',
  },
  '2026-04-06': {
    theme: 'theme-mourning',
    message: '今日是特殊纪念日，全站已开启哀悼模式。',
  },
  '2026-12-13': {
    theme: 'theme-mourning',
    message: '国家公祭日，全站已开启哀悼模式。',
  },

  '2027-04-04': {
    theme: 'theme-mourning',
    message: '今日是特殊纪念日，全站已开启哀悼模式。',
  },
  '2027-04-05': {
    theme: 'theme-mourning',
    message: '今日是特殊纪念日，全站已开启哀悼模式。',
  },
  '2027-04-06': {
    theme: 'theme-mourning',
    message: '今日是特殊纪念日，全站已开启哀悼模式。',
  },
  '2027-12-13': {
    theme: 'theme-mourning',
    message: '国家公祭日，全站已开启哀悼模式。',
  },

  // ====== 元旦 ======
  '2026-01-01': {
    theme: 'theme-red',
    message: '新年快乐，全站已切换至节日主题。',
  },
  '2027-01-01': {
    theme: 'theme-red',
    message: '新年快乐，全站已切换至节日主题。',
  },
  '2028-01-01': {
    theme: 'theme-red',
    message: '新年快乐，全站已切换至节日主题。',
  },

  // ====== 春节 ======
  '2026-02-17': {
    theme: 'theme-red',
    message: '春节快乐，全站已切换至节日主题。',
  },
  '2026-02-18': {
    theme: 'theme-red',
    message: '春节快乐，全站已切换至节日主题。',
  },
  '2026-02-19': {
    theme: 'theme-red',
    message: '春节快乐，全站已切换至节日主题。',
  },

  '2027-02-06': {
    theme: 'theme-red',
    message: '春节快乐，全站已切换至节日主题。',
  },
  '2027-02-07': {
    theme: 'theme-red',
    message: '春节快乐，全站已切换至节日主题。',
  },
  '2027-02-08': {
    theme: 'theme-red',
    message: '春节快乐，全站已切换至节日主题。',
  },

  '2028-01-26': {
    theme: 'theme-red',
    message: '春节快乐，全站已切换至节日主题。',
  },
  '2028-01-27': {
    theme: 'theme-red',
    message: '春节快乐，全站已切换至节日主题。',
  },
  '2028-01-28': {
    theme: 'theme-red',
    message: '春节快乐，全站已切换至节日主题。',
  },

  // ====== 端午 ======
  '2026-06-19': {
    theme: 'theme-green',
    message: '端午安康，全站已切换至粽叶绿主题。',
  },
  '2026-06-20': {
    theme: 'theme-green',
    message: '端午安康，全站已切换至粽叶绿主题。',
  },
  '2026-06-21': {
    theme: 'theme-green',
    message: '端午安康，全站已切换至粽叶绿主题。',
  },

  '2027-06-09': {
    theme: 'theme-green',
    message: '端午安康，全站已切换至粽叶绿主题。',
  },
  '2027-06-10': {
    theme: 'theme-green',
    message: '端午安康，全站已切换至粽叶绿主题。',
  },
  '2027-06-11': {
    theme: 'theme-green',
    message: '端午安康，全站已切换至粽叶绿主题。',
  },

  // ====== 中秋 ======
  '2026-09-25': {
    theme: 'theme-gold',
    message: '中秋快乐，全站已切换至月华金主题。',
  },
  '2026-09-26': {
    theme: 'theme-gold',
    message: '中秋快乐，全站已切换至月华金主题。',
  },
  '2026-09-27': {
    theme: 'theme-gold',
    message: '中秋快乐，全站已切换至月华金主题。',
  },

  '2027-09-15': {
    theme: 'theme-gold',
    message: '中秋快乐，全站已切换至月华金主题。',
  },
  '2027-09-16': {
    theme: 'theme-gold',
    message: '中秋快乐，全站已切换至月华金主题。',
  },
  '2027-09-17': {
    theme: 'theme-gold',
    message: '中秋快乐，全站已切换至月华金主题。',
  },

  // ====== 国庆 ======
  '2026-10-01': {
    theme: 'theme-red',
    message: '欢度国庆，全站已切换至节日主题。',
  },
  '2026-10-02': {
    theme: 'theme-red',
    message: '欢度国庆，全站已切换至节日主题。',
  },
  '2026-10-03': {
    theme: 'theme-red',
    message: '欢度国庆，全站已切换至节日主题。',
  },

  '2027-10-01': {
    theme: 'theme-red',
    message: '欢度国庆，全站已切换至节日主题。',
  },
  '2027-10-02': {
    theme: 'theme-red',
    message: '欢度国庆，全站已切换至节日主题。',
  },
  '2027-10-03': {
    theme: 'theme-red',
    message: '欢度国庆，全站已切换至节日主题。',
  },

  '2028-10-01': {
    theme: 'theme-red',
    message: '欢度国庆，全站已切换至节日主题。',
  },
  '2028-10-02': {
    theme: 'theme-red',
    message: '欢度国庆，全站已切换至节日主题。',
  },
  '2028-10-03': {
    theme: 'theme-red',
    message: '欢度国庆，全站已切换至节日主题。',
  },
} as const
