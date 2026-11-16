# BetaStudio2 Blog

以「桌面系统」为外壳的个人站点：桌面 → 博客 / WebWord 文档编辑器。
Vue 3 + Vite；站点没有账号与评论体系，线上以纯静态形式部署在 GitHub Pages。

## 开发

```bash
pnpm install
pnpm dev          # Express :3001 + Vite :3000
```

- 桌面 http://localhost:3000/
- 博客 http://localhost:3000/blog
- WebWord http://localhost:3000/webword

## 部署

线上是构建期导出的静态站，Pages 上没有 Node 进程：

```bash
pnpm export                              # 文章 → Desktop/public/static
BASE_PATH=/<repo>/ pnpm build:static     # 产物 → Desktop/dist
pnpm preview:static                      # 按 Pages 规则本地预览
```

推送 `main` 后由 `.github/workflows/deploy.yml` 自动构建发布。
首次需在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

## 更新文章

1. 编辑 `data/documents/main/.../*.domt`
2. `pnpm export`
3. 提交 `data/documents/main/` 与 `Desktop/public/static/`，push

## 目录

```
Desktop/            前端（Vue 3 + Vite）
  public/static/    导出快照（需提交）
  src/blog/         博客
  src/webword/      WebWord
  src/components/   桌面外壳与窗口
server/             本地开发用的 Express
scripts/            export / build:static / preview:static
data/               文章源文件（提交）；数据库与加载项（不提交）
```

## 许可证

保留所有权利（All Rights Reserved），详见 [`LICENSE`](LICENSE)。
仓库内第三方组件（Live2D Cubism SDK、字体、加载项、词库等）遵循各自许可证。
