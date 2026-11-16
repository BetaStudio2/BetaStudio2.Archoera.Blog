import i18n from '@/i18n'
import { STATIC_MODE, STATIC_DATA_BASE } from '@/utils/siteMode'

// 站点已移除账号与评论体系：本文件只保留公开数据的读取接口
// （壁纸列表、作者信息）。任何登录 / 注册 / 用户管理相关调用都不复存在。
const API_BASE = '/api'

class API {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: (i18n.global as any).t('desktop.api.requestFailed') }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Author endpoint（公开只读，用于显示文章作者昵称与头像）
  async getAuthor(uuid: string) {
    return this.request<{ display_name: string; avatar: string | null }>(`/author/${uuid}`)
  }

  // Backgrounds（只读列表；自定义上传已移除）
  async listBackgrounds() {
    // 静态站点：壁纸列表由构建期导出，图片本身在 public/background
    if (STATIC_MODE) {
      const res = await fetch(`${STATIC_DATA_BASE}backgrounds.json`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as Promise<{ backgrounds: { id: string; filename: string; url: string }[] }>
    }
    return this.request<{ backgrounds: { id: string; filename: string; url: string }[] }>('/backgrounds')
  }
}

export default new API()
