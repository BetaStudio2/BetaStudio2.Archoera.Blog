export interface CategoryNode {
  name: string
  path: string
  type: 'folder' | 'document'
  title?: string
  description?: string
  cover?: string | null
  category?: string
  tags?: string[]
  created?: string
  filename?: string | null
  children?: CategoryNode[]
}

export interface ArticleMeta {
  id?: string
  title: string
  subtitle?: string
  category: string
  tags?: string[]
  author?: string
  author_uuid?: string
  version?: string
  status?: string
  format?: string
  filename?: string
  language?: string
  created?: string
  updated?: string
  published_at?: string
  description?: string
  summary?: string
  cover?: string | null
  assets?: Asset[]
  featured?: boolean
  reading_time_minutes?: number
  word_count_estimate?: number
  sections?: Section[]
  references?: Reference[]
}

export interface Asset {
  id: string
  type: string
  format: string
  path: string
  title?: string
  caption?: string
  description?: string
}

export interface Section {
  id: string
  title: string
}

export interface Reference {
  title: string
  publisher?: string
  url: string
}

export interface ArticleResponse {
  content: string
  meta: ArticleMeta
  comments_mode: string
  title: string
  author: AuthorInfo | null
}

export interface AuthorInfo {
  display_name: string
  avatar: string | null
}

export interface Comment {
  id: string
  author: string
  content: string
  created: string
  uuid?: string | null
  avatar?: string | null
  status?: string
}
