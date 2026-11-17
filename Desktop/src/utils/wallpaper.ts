/**
 * 壁纸统一使用 webp。
 * 旧版本 localStorage 里可能存着 /background/1.png、/background/6.jpg，
 * 这里把扩展名迁移成 .webp，避免升级后壁纸 404。
 */
export function migrateWallpaperUrl(url: string): string {
  return String(url || '').replace(/(\/background\/\d+)\.(?:png|jpe?g)(?=$|[?#])/i, '$1.webp')
}
