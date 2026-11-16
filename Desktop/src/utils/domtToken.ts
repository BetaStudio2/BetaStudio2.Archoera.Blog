// 文档 API 隐藏令牌
// 与 server/index.cjs 中的 DOMT_API_TOKEN 保持一致；令牌随前端分发，仅防随手 curl
export const DOMT_API_TOKEN = 'bs2-domt-2026-x7k9'

export function domtHeaders(): Record<string, string> {
  return { 'X-Domt-Token': DOMT_API_TOKEN }
}
