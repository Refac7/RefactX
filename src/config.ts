import type {
  GithubConfig,
  Link,
  PhotoData,
  PhotosConfig,
  PostConfig,
  Project,
  ProjectConfig,
  Site,
  SkillsShowcaseConfig,
  SocialLink,
  TagsConfig,
} from '~/types'

export const SITE: Site = {
  title: 'RefactX Project',
  description: 'RefactX 是一个基于 Astro 构建的现代化高性能博客',
  website: 'https://www.refact.cc/',
  base: '/',
  author: 'Refact',
  ogImage: '/og-image.webp',
}

export const HEADER_LINKS: Link[] = [
  {
    name: '文章',
    url: '/posts',
  },
  {
    name: '项目',
    url: '/projects',
  },
  {
    name: '图库',
    url: '/photos',
  },
]

export const FOOTER_LINKS: Link[] = [
  {
    name: '主页',
    url: '/', 
  },
  {
    name: '文章',
    url: '/posts',
  },
  {
    name: '项目',
    url: '/projects',
  },
  {
    name: '标签',
    url: '/tags',
  },
  {
    name: '图库',
    url: '/photos',
  },
  {
    name: '友链',
    url: '/friends',
  }
]

// get icon https://icon-sets.iconify.design/
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'github',
    url: 'https://github.com/Refac7',
    icon: 'icon-[ri--github-fill]',
    count: 1,
  },
  {
    name: 'bilibili',
    url: 'https://space.bilibili.com/441325177',
    icon: 'icon-[ri--bilibili-fill]',
    count: 77,
  },
]

/**
 * SkillsShowcase 配置接口 / SkillsShowcase configuration type
 * @property {boolean} SKILLS_ENABLED  - 是否启用SkillsShowcase功能 / Whether to enable SkillsShowcase features
 * @property {Object} SKILLS_DATA - 技能展示数据 / Skills showcase data
 * @property {string} SKILLS_DATA.direction - 技能展示方向 / Skills showcase direction
 * @property {Object} SKILLS_DATA.skills - 技能展示数据 / Skills showcase data
 * @property {string} SKILLS_DATA.skills.icon - 技能图标 / Skills icon
 * @property {string} SKILLS_DATA.skills.name - 技能名称 / Skills name
 * get icon https://icon-sets.iconify.design/
 */
export const SKILLSSHOWCASE_CONFIG: SkillsShowcaseConfig = {
  SKILLS_ENABLED: true,
  SKILLS_DATA: [
    {
      direction: 'left',
      skills: [
        {
          name: 'JavaScript',
          icon: 'icon-[mdi--language-javascript]',
        },
        {
          name: 'CSS',
          icon: 'icon-[mdi--language-css3]',
        },
        {
          name: 'HTML',
          icon: 'icon-[mdi--language-html5]',
        },
        {
          name: 'TypeScript',
          icon: 'icon-[mdi--language-typescript]',
        },
      ],
    },
    {
      direction: 'right',
      skills: [
        {
          name: 'Astro',
          icon: 'icon-[lineicons--astro]',
        },
        {
          name: 'Node.js',
          icon: 'icon-[mdi--nodejs]',
        },
        {
          name: 'React',
          icon: 'icon-[mdi--react]',
        },
        {
          name: 'Next.js',
          icon: 'icon-[devicon--nextjs]',
        },
        {
          name: 'Tailwind CSS',
          icon: 'icon-[mdi--tailwind]',
        },
        {
          name: 'Iconify',
          icon: 'icon-[line-md--iconify2-static]',
        },
      ],
    },
    {
      direction: 'left',
      skills: [
        {
          name: 'Ubuntu',
          icon: 'icon-[mdi--ubuntu]',
        },
        {
          name: 'Git',
          icon: 'icon-[mdi--git]',
        },
        {
          name: 'MongoDB',
          icon: 'icon-[lineicons--mongodb]',
        },
        {
          name: 'Vercel',
          icon: 'icon-[lineicons--vercel]',
        },
      ],
    },
  ],
}

/**
 * GitHub配置 / GitHub configuration
 *
 * @property {boolean} ENABLED - 是否启用GitHub功能 / Whether to enable GitHub features
 * @property {string} GITHUB_USERNAME - GITHUB用户名 / GitHub username
 * @property {boolean} TOOLTIP_ENABLED - 是否开启Tooltip功能 / Whether to enable Github Tooltip features
 */

export const GITHUB_CONFIG: GithubConfig = {
  ENABLED: true,
  GITHUB_USERNAME: 'Refac7',
  TOOLTIP_ENABLED: true
}

export const POSTS_CONFIG: PostConfig = {
  title: 'Posts',
  description: 'Refact 的文章',
  introduce: '不定时更新维护文章，可订阅 RSS 获取最新更新状态。',
  author: 'Refact',
  homePageConfig: {
    size: 5,
    type: 'compact'
  },
  postPageConfig: {
    size: 10,
    type: 'image'
  },
  tagsPageConfig: {
    size: 10,
    type: 'time-line'
  },
  defaultHeroImage: '/og-image.webp',
  defaultHeroImageAspectRatio: '16/9',
  postType: 'horizontal',
  imageDarkenInDark: true,
  readMoreText: '阅读全文',
  prevPageText: '上一页',
  nextPageText: '下一页',
  tocText: '目录导航',
  backToPostsText: '返回文章列表',
  nextPostText: '下一篇',
  prevPostText: '上一篇'
}

export const TAGS_CONFIG: TagsConfig = {
  title: 'Tags',
  description: '所有文章标签',
  introduce: '所有文章标签均在此处，点击即可筛选。'
}

export const PROJECTS_CONFIG: ProjectConfig = {
  title: 'Projects',
  description: '我的项目案例',
  introduce: '以下是我的项目案例展示。'
}

export const ProjectList: Project[] = [
  {
    name: 'RefactX',
    description: '基于Astro的简洁现代博客',
    githubUrl: 'https://github.com/Refac7/RefactX',
    website: '/',
    type: 'icon',
    icon: 'icon-[ri--xing-fill]',
    star: 1,
    fork: 1
  },
  {
    name: 'RefactX-DEV',
    description: '基于Astro的简洁现代博客(开发版)',
    githubUrl: 'https://github.com/Refac7/RefactXDEV',
    website: 'https://dev.refact.cc/',
    type: 'icon',
    icon: 'icon-[ri--xing-line]',
    star: 4,
    fork: 5
  },
  {
    name: 'MC服务器状态嵌入式组件',
    description: '基于 React 开发了独立的 Vercel 应用，通过 URL 嵌入状态页面，无需修改网站源码。',
    githubUrl: 'https://github.com/Refac7/minecraft-status-widget',
    website: 'https://www.neotec.uk/serverstatus.html',
    type: 'icon',
    icon: 'icon-[ri--puzzle-line]',
    star: 1,
    fork: 4
  },
  {
    name: 'NotionNext主题 - Neo',
    description: '基于内置的 Heo 主题进行了大量修改，是现代化的博客设计方案（项目已归档)',
    githubUrl: 'https://github.com/Refac7/WebsiteKit/',
    type: 'icon',
    icon: 'icon-[ri--terminal-box-line]',
    star: 1,
    fork: 9
  },
  {
    name: 'Neotec. 主站',
    description: '基于 Vitepress 构建，储存官方文档',
    githubUrl: 'https://github.com/Refac7/VitePress/',
    website: 'https://www.neotec.uk/',
    type: 'icon',
    icon: 'icon-[ri--terminal-box-line]',
    star: 1,
    fork: 9
  },
  {
    name: 'Neotec. 整合包',
    description: 'Neotec整合包平台是一个以开源、自由、社区驱动为核心的Minecraft模组整合服务。',
    website: 'https://www.neotec.uk/modpacks.html',
    type: 'icon',
    icon: 'icon-[ri--archive-line]',
    star: 8,
    fork: 1
  },
]

export const PHOTOS_CONFIG: PhotosConfig = {
  title: 'Photos',
  description: '浮光掠影处，皆是生活馈赠的吉光片羽',
  introduce: '方寸镜头间，镌刻着时光走过的痕迹',
}

export const PhotosList: PhotoData[] = [
  {
    title: "长安夜未央·西安",
    icon: {
      type: 'emoji',
      value: '🌠',
    },
    description: '三秦大地的夜色，盛唐气象在霓虹中流转',
    date: '2025-07-11',
    photos: [
      {
        src: '/photos/250711-1.webp',
        width: 1512,
        height: 2016,
        variant: '4x5',
      },
      {
        src: '/photos/250711-2.webp',
        width: 2016,
        height: 1512,
        variant: '4x3',
      },
      {
        src: '/photos/250711-3.webp',
        width: 2016,
        height: 1512,
        variant: '4x3',
      },
      {
        src: '/photos/250711-4.webp',
        width: 2016,
        height: 1512,
        variant: '4x3',
      },
      {
        src: '/photos/250711-5.webp',
        width: 1512,
        height: 2016,
        variant: '4x5',
      },
    ],
  },
  {
  title: "试卷焚尸炉·孟津停尸间",
  icon: {
    type: "emoji",
    value: "🔪",
  },
  description: "笔杆捅穿黄河·答题卡褶皱里爬出蛆虫状元",
  date: '2025-05-24',
  photos: [
    {
      src: '/photos/250524-1.webp',
      width: 2016,
      height: 1512,
      variant: '4x3',
    },
    {
      src: '/photos/250524-2.webp',
      width: 1512,
      height: 2016,
      variant: '4x5',
    },
    {
      src: '/photos/250524-3.webp',
      width: 2016,
      height: 1512,
      variant: '4x5',
    },
  ],
  },
  {
    title: '河洛暮色·孟津',
    icon: {
      type: 'emoji',
      value: '🌅',
    },
    description: '邙山晚照染黄河，千年帝都的黄昏剪影',
    date: '2024-08-09',
    photos: [
      {
        src: '/photos/240809-1.webp',
        width: 2016,
        height: 1512,
        variant: '4x3',
      },
      {
        src: '/photos/240809-2.webp',
        width: 2016,
        height: 1512,
        variant: '4x3',
      },
      {
        src: '/photos/240809-3.webp',
        width: 2016,
        height: 1512,
        variant: '4x3',
      },
    ],
  },
  {
    title: '雾锁津渡·孟津',
    icon: {
      type: 'emoji',
      value: '🌉',
    },
    description: '烟霭迷蒙中的工业剪影，别样城郭印记',
    date: '2024-02-20',
    photos: [
      {
        src: '/photos/240220-1.webp',
        width: 2016,
        height: 1512,
        variant: '4x3',
      },
      {
        src: '/photos/240220-2.webp',
        width: 2016,
        height: 1512,
        variant: '4x3',
      },
     {
        src: '/photos/240220-3.webp',
        width: 2016,
        height: 1512,
        variant: '4x3',
      },
    ],
  },
]

// 友链配置
// src/config.ts
export const FRIENDS_CONFIG = {
  title: 'Friends',
  description: '我的朋友们都在这里，欢迎互访～',
  introduce: '相隔万里遇见你，真的很幸运！',
}

export const FRIENDS_LIST = [
  {
    name: 'ATao-Blog',
    url: 'https://blog.atao.cyou',
    author: 'ATao',
    description: '做自己喜欢的事',
    avatar: 'https://cdn.atao.cyou/Web/Avatar.png',
  },
  {
    name: '酥米的小站',
    url: 'https://www.sumi233.top/',
    author: '酥米',
    description: '终有一日，寻梦中人',
    avatar: 'https://cdn.sumi233.top/gh/huang233893/blog-image-bed/top/huang233893/imgs/blog/userfb6a1018b84ce485.jpg',
  },
  {
    name: '纸鹿摸鱼处',
    url: 'https://blog.zhilu.site/',
    author: '纸鹿本鹿',
    description: '纸鹿至麓不知路，支炉制露不止漉',
    avatar: 'https://www.zhilu.site/api/avatar.png',
  },
  {
    name: '鈴奈咲桜のBlog',
    url: 'https://blog.sakura.ink',
    author: '鈴奈咲桜',
    description: '愛することを忘れないで',
    avatar: 'https://q2.qlogo.cn/headimg_dl?dst_uin=2731443459&spec=5',
  },
  {
    name: 'LYEy_isine个人博客',
    url: 'https://caiyifeng.top',
    author: 'LYEy_isine',
    description: '花海无一日,少年踏自来',
    avatar: 'https://tc-new.z.wiki/autoupload/f/UdxyOKhNTtcbZB7VCT3UgfISxQjrFcHo0MYIVlLsrJSyl5f0KlZfm6UsKj-HyTuv/20250906/NGik/460X460/103258286.png',
  },
  {
    name: '枫落丰源',
    url: 'https://blog.feng1026.top/',
    author: '枫落丰源',
    description: '和你的日常，就是奇迹',
    avatar: 'https://blog.feng1026.top/avatar.jpg',
  },
  {
    name: '森语 - SENblog',
    url: 'https://blog.sakurasen.cn',
    author: 'SEN',
    description: '无限进步',
    avatar: 'https://sakurasen.cn/icon',
  },
  {
    name: "kzhik's website",
    url: 'https://www.kzhik.cn',
    author: 'kzhik',
    description: 'EXPLORE THE WORLD!',
    avatar: 'https://www.kzhik.cn/avatar.webp',
  },
]
