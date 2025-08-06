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
]

// get icon https://icon-sets.iconify.design/
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'github',
    url: 'https://github.com/msrefs',
    icon: 'icon-[ri--github-fill]',
    count: 1,
  },
  {
    name: 'twitter',
    url: 'https://x.com/MSReFS',
    icon: 'icon-[ri--twitter-x-fill]',
  },
  {
    name: 'bilibili',
    url: 'https://space.bilibili.com/441325177',
    icon: 'icon-[ri--bilibili-fill]',
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
  GITHUB_USERNAME: 'msrefs',
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
  title: '标签',
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
    githubUrl: 'https://github.com/msrefs/RefactX',
    website: '/',
    type: 'icon',
    icon: 'icon-[ri--xing-fill]',
    star: 1,
    fork: 1
  },
  {
    name: 'RefactX-DEV',
    description: '基于Astro的简洁现代博客(开发版)',
    githubUrl: 'https://github.com/msrefs/RefactXDEV',
    website: 'https://dev.refact.cc/',
    type: 'icon',
    icon: 'icon-[ri--xing-line]',
    star: 4,
    fork: 5
  },
  {
    name: 'MC服务器状态嵌入式组件',
    description: '基于 React 开发了独立的 Vercel 应用，通过 URL 嵌入状态页面，无需修改网站源码。',
    githubUrl: 'https://github.com/msrefs/minecraft-status-widget',
    website: 'https://www.neotec.uk/serverstatus.html',
    type: 'icon',
    icon: 'icon-[ri--puzzle-line]',
    star: 1,
    fork: 4
  },
  {
    name: 'NotionNext主题 - Neo',
    description: '基于内置的 Heo 主题进行了大量修改，是现代化的博客设计方案（项目已归档)',
    githubUrl: 'https://github.com/msrefs/WebsiteKit/',
    type: 'icon',
    icon: 'icon-[ri--terminal-box-line]',
    star: 1,
    fork: 9
  },
  {
    name: 'Neotec. 主站',
    description: '基于 Vitepress 构建，储存官方文档',
    githubUrl: 'https://github.com/msrefs/VitePress/',
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
  description: 'Here I will record some photos taken in daily life.',
  introduce: 'Here I will record some photos taken in daily life.',
}

export const PhotosList: PhotoData[] = [
  {
    title: "Friend's Adorable Cat",
    icon: {
      type: 'emoji',
      value: '🌠',
    },
    description: 'So kawaii (*^ω^*)',
    date: '2025-06-21',
    travel: '',
    photos: [
      {
        src: '/photos/cat1.webp',
        alt: "Friend's Adorable Cat",
        width: 1080,
        height: 810,
        variant: '4x3',
      },
      {
        src: '/photos/cat2.webp',
        alt: "Friend's Adorable Cat",
        width: 1080,
        height: 810,
        variant: '4x3',
      },
      {
        src: '/photos/cat3.webp',
        alt: "Friend's Adorable Cat",
        width: 1080,
        height: 810,
        variant: '4x3',
      },
      {
        src: '/photos/cat4.webp',
        alt: "Friend's Adorable Cat",
        width: 1080,
        height: 810,
        variant: '4x3',
      },
    ],
  },
  {
    title: 'Ningbo · Dongqian Lake',
    icon: {
      type: 'emoji',
      value: '🌅',
    },
    description: 'Cycling around Dongqian Lake. Although I got leg cramps a few times, the scenery was beautiful.',
    date: '2025-03-01',
    travel: '',
    photos: [
      {
        src: '/photos/dqh1.webp',
        alt: 'Ningbo · Dongqian Lake',
        width: 1080,
        height: 1358,
        variant: '4x5',
      },
      {
        src: '/photos/dqh2.jpg',
        alt: 'Ningbo · Dongqian Lake',
        width: 1080,
        height: 1080,
        variant: '1x1',
      },
      {
        src: '/photos/dqh3.jpg',
        alt: 'Ningbo · Dongqian Lake',
        width: 1440,
        height: 1080,
        variant: '4x3',
      },
    ],
  },
  {
    title: 'Ningbo · Zhoushan',
    icon: {
      type: 'emoji',
      value: '🌉',
    },
    description: '',
    date: '2024-09-07',
    travel: '',
    photos: [
      {
        src: '/photos/zs1.webp',
        alt: 'Ningbo · Zhoushan',
        width: 1210,
        height: 908,
        variant: '4x3',
      },
      {
        src: '/photos/zs2.webp',
        alt: 'Ningbo · Zhoushan',
        width: 1080,
        height: 810,
        variant: '4x3',
      },
    ],
  },
]
