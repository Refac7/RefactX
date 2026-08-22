/**
 * 站点基础信息类型 / Site basic information type
 */
export type Site = {
  title: string
  base: string
  description: string
  author: string
  website: string
  ogImage: string
  version: string
  footerText: string
  footerText2?: string
}

export type HeroImageAspectRatio = '16/9' | '3/4'
export type HeroImageLayout = 'left' | 'right'
export type PostCardType = 'compact' | 'image' | 'time-line'

/** Shared props for all post-card variants. Kept outside List.astro to avoid a circular type dependency. */
export type PostCardProps = {
  post: import('astro:content').CollectionEntry<'posts'>
  heroImageLayout?: HeroImageLayout
  showImage?: boolean
}

export interface PostCardPageConfig {
  type: PostCardType
  size: number
  heroImageLayout?: HeroImageLayout
}

export type PostType = 'jap'

export interface PostConfig {
  title: string
  description: string
  introduce: string
  author: string
  homePageConfig: PostCardPageConfig
  postPageConfig: PostCardPageConfig
  tagsPageConfig: PostCardPageConfig
  authorsPageConfig: PostCardPageConfig
  defaultHeroImage: string
  defaultHeroImageAspectRatio: HeroImageAspectRatio
  postType: PostType
  imageDarkenInDark: boolean
  readMoreText: string
  prevPageText: string
  nextPageText: string
  tocText: string
  backToPostsText: string
  nextPostText: string
  prevPostText: string
}

export interface TagsConfig {
  title: string
  description: string
  introduce: string
}

export interface AuthorsConfig {
  title: string
  description: string
  introduce: string
}

export interface DynamicConfig {
  title: string
  description: string
  introduce: string
}

export interface Skill {
  icon: string
  name: string
}

export interface SkillData {
  direction: 'left' | 'right'
  skills: Skill[]
}

export interface SkillsShowcaseConfig {
  SKILLS_ENABLED: boolean
  SKILLS_DATA: SkillData[]
}

export type GithubConfig = {
  ENABLED: boolean
  GITHUB_USERNAME: string
  TOOLTIP_ENABLED: boolean
}

export type Link = {
  name: string
  url: string
}

export type SocialLink = {
  name: string
  url: string
  icon: string
  count?: number
}

export interface ProjectConfig {
  title: string
  description: string
  introduce: string
}

export type IconType = 'icon' | 'image'

export interface Project {
  name: string
  description: string
  website?: string
  githubUrl?: string
  type: IconType
  icon: string
  imageClass?: string
  star?: number
  fork?: number
}
