import type {
  GithubConfig,
  Link,
  PostConfig,
  ProjectConfig,
  Site,
  SkillsShowcaseConfig,
  SocialLink,
  TagsConfig,
} from '~/types'

// 站点全局配置
export const SITE: Site = {
  title: 'RefactX Project',
  description: '如风般轻盈，如光般纯粹。',
  indexIntro1: '你好，我是 Refact 。一名时空修剪者。',
  indexIntro2: '记录技术与生活的点滴，保持简单与专注。',
  website: 'https://www.refact.cc/',
  base: '/',
  author: 'Refact',
  ogImage: '/og-image.webp',
  version: '1.8',
}

// 顶部导航菜单
export const HEADER_LINKS: Link[] = [
  { name: '文章', url: '/posts' },
  { name: '项目', url: '/projects' },
  { name: '图库', url: '/photos' },
  { name: '关于', url: '/about' },
]

// 底部导航菜单
export const FOOTER_LINKS: Link[] = [
  { name: '主页', url: '/' },
  { name: '文章', url: '/posts' },
  { name: '项目', url: '/projects' },
  { name: '标签', url: '/tags' },
  { name: '图库', url: '/photos' },
  { name: '友链', url: '/friends' },
  { name: '关于', url: '/about' },
]

// 社交链接 (图标参考: https://icon-sets.iconify.design/)
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'github',
    url: 'https://github.com/Refac7',
    icon: 'icon-[ri--github-fill]',
  },
  {
    name: 'bilibili',
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
  ENABLED: true,           // 是否启用贡献图
  GITHUB_USERNAME: 'Refac7', // GitHub 用户名
  TOOLTIP_ENABLED: true    // 是否开启悬浮提示
}

// 文章页面配置
export const POSTS_CONFIG: PostConfig = {
  title: 'Posts',
  description: 'Refact 的文章',
  introduce: '不定时更新维护文章，可订阅 RSS 获取最新更新状态。',
  author: 'Refact',
  homePageConfig: { size: 3, type: 'compact' },
  postPageConfig: { size: 5, type: 'image' },
  tagsPageConfig: { size: 5, type: 'time-line' },
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
  prevPostText: '上一篇'
}

// 标签页面配置
export const TAGS_CONFIG: TagsConfig = {
  title: 'Tags',
  description: '所有文章标签',
  introduce: '所有文章标签均在此处，点击即可筛选。'
}

// 项目页面配置
export const PROJECTS_CONFIG: ProjectConfig = {
  title: 'Projs',
  description: '我的项目案例',
  introduce: '以下是我的项目案例展示，不定期维护项目。'
}

// 关于页面配置
export const ABOUT_CONFIG = {
  title: 'About',
  description: 'Who am I?',
  introduce: ' 我那丑陋的情感，就不要表现出来啊。',
  
  // 个人档案
  profile: {
    name: 'Refac7',
    avatar: '/avatar.png',
    role: 'Creative Developer / UI Designer',
    bio: '又是又是……又是借口 / Another another... Another excuse. \n\n某计科专业在读，高数苦手。喜欢电子音乐，熟悉以下所有技术栈的拼写，熟练使用剪贴板和cmd c和cmd v. 如果你和我有共同爱好，欢迎随时使用你能找到的所有渠道联系我哦～',
  },
  
  // 技能矩阵
  skills: [
    { category: 'Frontend // 前端', items: ['JavaScript', 'React', 'Astro', 'TypeScript', 'Tailwind CSS'] },
    { category: 'Backend // 后端', items: ['Node.js', 'Python', 'PostgreSQL', 'Redis'] },
    { category: 'Design // 设计', items: ['Figma', 'Photoshop', 'AE'] },
    { category: 'Others // 杂项', items: ['VSCode', 'Git', 'Docker', 'Linux'] },
    { category: 'Learning // 学习中', items: ['Java', 'Rust', 'Go'] },
  ],
  
  // 硬件清单
  equipment: [
    { type: 'Workstation', name: 'Mac mini', desc: 'M4 / 16GB / 256GB + Solidigm P44 Pro 1TB' },
    { type: 'Phone', name: 'iPhone 12 mini', desc: 'A14 / 128GB' },
    { type: 'Pad', name: 'iPad', desc: 'A16 / 256GB' },
    { type: 'Monitor', name: 'HKC T2755U', desc: '27" / 4K / Standard Glass' },
    { type: 'Keyboard', name: 'Magic Keyboard', desc: 'White / Short Edition / USB-C' },
    { type: 'Trackpad', name: 'Magic Trackpad', desc: 'White / USB-C' },
    { type: 'Audio', name: 'CMF Buds 2A', desc: '-42dB Noise Cancellation' },
  ],

  // 游戏日志
  games: [
    { title: 'Rhythm Doctor', platform: 'PC / Steam', status: 'Playing', hours: '80h+', color: 'text-yellow-500' },
    { title: 'Muse Dash', platform: 'PC / Steam', status: 'Paused', hours: '20h+', color: 'text-green-500' },
  ],

  // 课程表
  courseSchedule: [
    {
      day: 'MON',
      label: '周一',
      courses: [
        { time: '09:50-12:10 | 2-17周', name: 'Python语言程序设计', location: '土楼328机房' },
        { time: '14:30-16:00 | 1-18周', name: '排球2', location: '场地未排/待定' }
      ]
    },
    {
      day: 'TUE',
      label: '周二',
      courses: [
        { time: '08:00-09:30 | 2-17周', name: '离散数学', location: 'B合四' },
        { time: '09:50-12:10 | 2-17周', name: '线性代数A', location: 'E-318' },
        { time: '14:30-16:00 | 2-17周', name: '面向对象程序设计', location: '信工107' },
        { time: '16:10-17:50 | 2-17周', name: '高等数学A2', location: 'B合十四' }
      ]
    },
    {
      day: 'WED',
      label: '周三',
      courses: [
        { time: '08:00-09:30 | 2-17周', name: '高等数学A2', location: 'B合十四' },
        { time: '09:50-11:20 | 2-17周', name: '大学生心理健康教育', location: 'E-309' },
        { time: '14:30-16:00 | 2-17周', name: '中国近现代史纲要', location: '艺术楼-208' },
        { time: '16:10-17:50 | 2-17周', name: '军事理论', location: 'C-401' }
      ]
    },
    {
      day: 'THU',
      label: '周四',
      courses: [
        { time: '08:00-09:30 | 2-17周', name: '面向对象程序设计', location: '土楼334机房' },
        { time: '09:50-11:20 | 2-17周', name: '大学英语2(非艺体)', location: 'B3-202' },
        { time: '14:30-16:00 | 2-17周', name: '离散数学', location: 'E-404' },
        { time: '16:10-17:50 | 3-06周', name: '形势与政策(二)', location: 'E-304' }
      ]
    },
    {
      day: 'FRI',
      label: '周五',
      courses: [
        { time: '08:00-09:30 | 2-17周', name: '高等数学A2', location: 'B合十四' },
        { time: '09:50-11:20 | 双周 2-16', name: '大学英语2(非艺体)', location: 'D-504 语音室' }
      ]
    }
  ],

  // 待办清单
  todos: [
    { task: '重构个人博客风格 UI', completed: true },
    { task: '活着（到目前为止）', completed: true },
    { task: '重构项目结构，将pages页面统一框架', completed: false },
    { task: '重写博客配置文档', completed: false },
    { task: '完成基于 Astro 的文档系统部署', completed: false },
    { task: '期末不挂科', completed: false },
    { task: '保持项目存活并稳定更新', completed: false },
  ],
}

// 友链页面配置
export const FRIENDS_CONFIG = {
  title: 'Friends',
  description: '我的朋友们都在这里，欢迎互访～',
  introduce: '已获取星图定位，正在前往友链星系的路上……',
  enableAdd: true,
}

// 博主专属友链卡片信息
export const FRIENDS_CONTACT = {
  sitename: 'RefactX Project',
  email: 'i@refact.cc',
  author: 'Refac7',
  sitelink: 'https://www.refact.cc',
  siteavatar: 'https://img.refact.cc/base/avatar.jpg',
  description: '形体是简单而纯粹的，它不是完整的群体，每个形体都指向其复杂性，并最终被复杂性联系在一起。', 
}

// Waline 评论系统配置
export const WALINE_CONFIG = {
  enableComment: true,
  serverURL: import.meta.env.PUBLIC_WALINE_SERVER_URL || "https://waline.refact.cc",
  uploadToken: import.meta.env.PUBLIC_UPLOAD_TOKEN,
  imgbedURL: import.meta.env.PUBLIC_IMG_BED_URL || "https://img.refact.cc/upload",
  enableImgUpload: true, // true: 上传至图片服务器 / false: 存入数据库(限 128KiB)
};

// CMS 内容管理配置
// 需在部署平台设置环境变量: PUBLIC_UPLOAD_TOKEN (如需管理后台则添加 GITHUB_TOKEN, ADMIN_PASSWORD)
// 数据源提醒: v1.6.1 及之后版本，友链/项目/照片数据须转为 JSON 存放在 content/data 目录下
export const CMS_CONFIG = {
  enableCMS: true,
  owner: 'Refac7',   // GitHub 仓库所有者
  repo: 'RefactX',   // GitHub 仓库名称
  branch: 'main',    // 目标分支
  pathPrefix: 'src/content/posts/' // 相对路径前缀
};

// 节日特效配置
// 样式修改: src/components/base/HolidayTheme.astro & global.css
export const Holiday_Effects = {
  enableHolidayEffects: true,
}