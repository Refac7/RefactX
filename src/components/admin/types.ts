import { CMS_CONFIG, WALINE_CONFIG } from '~/config'

// --- Configuration ---
export const REPO_CONFIG = {
  owner: CMS_CONFIG.owner,
  repo: CMS_CONFIG.repo,
  branch: CMS_CONFIG.branch,
  pathPrefix: CMS_CONFIG.pathPrefix,
}

export const UPLOAD_CONFIG = {
  url: WALINE_CONFIG.imgbedURL,
  token: WALINE_CONFIG.uploadToken,
}

export const DATA_FILES = [
  { name: 'projects.json', path: 'src/content/data/projects.json', label: 'PROJECTS' },
  { name: 'friends.json', path: 'src/content/data/friends.json', label: 'FRIENDS' },
  { name: 'about.json', path: 'src/content/data/about.json', label: 'ABOUT' },
]

export type SchemaField = {
  key: string
  label: string
  type: 'text' | 'image' | 'textarea' | 'json'
  valueType?: 'string' | 'number' | 'boolean' | 'json'
}

export const SCHEMAS: Record<string, SchemaField[]> = {
  'friends.json': [
    { key: 'name', label: 'Site Name', type: 'text' },
    { key: 'author', label: 'Author', type: 'text' },
    { key: 'url', label: 'Link', type: 'text' },
    { key: 'avatar', label: 'Avatar URL', type: 'image' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  'projects.json': [
    { key: 'name', label: 'Project Name', type: 'text' },
    { key: 'description', label: 'Desc', type: 'textarea' },
    { key: 'website', label: 'Website', type: 'text' },
    { key: 'githubUrl', label: 'GitHub', type: 'text' },
    { key: 'type', label: 'Type (icon/image)', type: 'text' },
    { key: 'icon', label: 'Icon Class / Image URL', type: 'text' },
    { key: 'star', label: 'Stars', type: 'text', valueType: 'number' },
    { key: 'fork', label: 'Forks', type: 'text', valueType: 'number' },
  ],
  'about.json': [
    { key: 'title', label: 'Page Title', type: 'text' },
    { key: 'description', label: 'Meta Description', type: 'text' },
    { key: 'introduce', label: 'Introduce', type: 'textarea' },
    { key: 'profileName', label: 'Profile Name', type: 'text' },
    { key: 'profileAvatar', label: 'Profile Avatar', type: 'text' },
    { key: 'profileRole', label: 'Profile Role', type: 'text' },
    { key: 'profileBio', label: 'Profile Bio', type: 'textarea' },
    { key: 'physicalAttributes', label: 'Physical Attributes (JSON)', type: 'json' },
    { key: 'skills', label: 'Skills (JSON)', type: 'json' },
    { key: 'equipment', label: 'Equipment (JSON)', type: 'json' },
    { key: 'games', label: 'Games (JSON)', type: 'json' },
    { key: 'courseSchedule', label: 'Course Schedule (JSON)', type: 'json' },
    { key: 'todos', label: 'Todos (JSON)', type: 'json' },
  ],
}

export const DEFAULT_META = {
  title: '',
  description: '',
  pubDate: new Date().toISOString().split('T')[0],
  author: CMS_CONFIG.owner,
  tags: '',
  recommend: false,
  heroImage: '',
  ogImage: '',
  heroImageAspectRatio: '16/9',
}

// --- Types ---
export type FileType = 'post' | 'data'
export type MobileView = 'files' | 'editor' | 'queue'
export type EditorMode = 'visual' | 'raw'

export type QueueItem = {
  id: string
  type: 'write' | 'delete'
  filename: string
  content?: string
  sha?: string
  status: 'pending' | 'processing' | 'done' | 'error'
  isDataFile?: boolean
}

export type RemoteFile = { name: string; sha: string; path: string }

export interface MetaType {
  title: string
  description: string
  pubDate: string
  author: string
  tags: string
  recommend: boolean
  heroImage: string
  ogImage: string
  heroImageAspectRatio: string
}
