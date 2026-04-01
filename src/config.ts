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

// 站点信息
export const SITE: Site = {
  title: 'RefactX Project',
  description: '如风般轻盈，如光般纯粹。',
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
  }
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
  GITHUB_USERNAME: 'Refac7',
  TOOLTIP_ENABLED: true
}

// 文章配置
export const POSTS_CONFIG: PostConfig = {
  title: 'Posts',
  description: 'Refact 的文章',
  introduce: '不定时更新维护文章，可订阅 RSS 获取最新更新状态。',
  author: 'Refact',
  homePageConfig: {
    size: 3,
    type: 'compact'
  },
  postPageConfig: {
    size: 5,
    type: 'image'
  },
  tagsPageConfig: {
    size: 5,
    type: 'time-line'
  },
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

// 标签配置
export const TAGS_CONFIG: TagsConfig = {
  title: 'Tags',
  description: '所有文章标签',
  introduce: '所有文章标签均在此处，点击即可筛选。'
}

// 项目配置
export const PROJECTS_CONFIG: ProjectConfig = {
  title: 'Projs',
  description: '我的项目案例',
  introduce: '以下是我的项目案例展示，不定期维护项目。'
}

// 友链配置
export const FRIENDS_CONFIG = {
  title: 'Friends',
  description: '我的朋友们都在这里，欢迎互访～',
  introduce: '已获取星图定位，正在前往友链星系的路上……',
  enableAdd: false,
}

// 我的友链信息
export const FRIENDS_CONTACT = {
  sitename: 'RefactX Project',
  email: 'refs@aliyun.com',
  author: 'Refac7',
  sitelink: 'https://www.refact.cc',
  siteavatar: 'https://img.refact.cc/base/avatar.jpg',
  description: '形体是简单而纯粹的，它不是完整的群体，每个形体都指向其复杂性，并最终被复杂性联系在一起。', 
}

// waline 配置
export const WALINE_CONFIG = {
  enableComment: true, // 设置为 false 可禁用评论组件
  serverURL: import.meta.env.PUBLIC_WALINE_SERVER_URL || "https://waline.refact.cc", // Waline 服务器地址
  uploadToken: import.meta.env.PUBLIC_UPLOAD_TOKEN, // Waline 上传 Token
  imgbedURL: import.meta.env.PUBLIC_IMG_BED_URL || "https://img.refact.cc/upload", // Waline 图片上传地址（需要包含接口地址）
  enableImgUpload: true, // Waline 是否启用S3图片上传,默认关闭,false状态下图片上传到数据库（限制128KiB）
};

// 内容管理系统（CMS）配置，需要在vercel或其他部署平台设置环境变量 PUBLIC_UPLOAD_TOKEN, (GITHUB_TOKEN, ADMIN_PASSWORD).括号内的内容不会暴露在前端

// 如果你需要从低版本（^1.6.1）迁移而来，无论是否启用CMS，都需要把config.ts中的友链信息，项目信息，照片列表改为json文件存储在content目录下，否则会导致友链，项目，照片页面报错，当然你也可以自行修改代码以适配新的配置方式。

export const CMS_CONFIG = {
  enableCMS: true, // 设置为 false 可禁用内容管理系统
  owner: 'Refac7', // GitHub 仓库所有者
  repo: 'RefactX', // GitHub 仓库名称
  branch: 'main', // 分支名称
  pathPrefix: 'src/content/posts/' // 内容在仓库中的路径前缀
};