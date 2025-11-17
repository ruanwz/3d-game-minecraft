# 3D Minecraft - 部署到 Netlify

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE/deploys)

## 🚀 快速部署

### 方法一：通过 Netlify CLI（推荐）

1. **安装 Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **登录 Netlify**
```bash
netlify login
```

3. **初始化并部署**
```bash
# 构建项目
npm run build

# 部署到 Netlify
netlify deploy --prod
```

### 方法二：通过 Git 集成（最简单）

1. 将代码推送到 GitHub
2. 访问 [Netlify](https://app.netlify.com)
3. 点击 "Add new site" → "Import an existing project"
4. 选择你的 GitHub 仓库
5. Netlify 会自动检测配置：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. 点击 "Deploy site"

### 方法三：拖放部署

1. **构建项目**
```bash
npm run build
```

2. 访问 [Netlify Drop](https://app.netlify.com/drop)
3. 将 `dist` 文件夹拖放到页面上

## 📝 配置说明

项目已包含 `netlify.toml` 配置文件：

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

## 🔧 环境要求

- Node.js 20+
- npm 或 yarn

## 📦 构建产物

构建后的文件位于 `dist` 目录：
- 优化的 JavaScript bundle
- 压缩的 HTML/CSS
- Source maps（用于调试）

## 🌐 访问你的站点

部署成功后，Netlify 会提供：
- 免费的 HTTPS 域名：`https://your-site-name.netlify.app`
- 可以绑定自定义域名

## ⚡ 性能优化

已配置的优化：
- ✅ Tree shaking
- ✅ Code splitting
- ✅ Asset minification
- ✅ Gzip compression（Netlify 自动）
- ✅ CDN 分发（Netlify 自动）

## 🐛 故障排查

如果部署失败，检查：

1. **构建日志**
```bash
npm run build
```

2. **依赖安装**
```bash
npm install
```

3. **TypeScript 检查**
```bash
npm run type-check
```

## 📱 移动端支持

游戏在桌面浏览器上效果最佳，移动端支持正在开发中。

## 🔄 持续部署

配置 Git 集成后，每次推送到主分支都会自动触发部署。

## 📊 部署后检查

部署后访问你的站点，确保：
- [ ] 页面正常加载
- [ ] Three.js 场景渲染正常
- [ ] 指针锁定功能正常
- [ ] WASD 移动控制工作
- [ ] FPS 计数器显示
- [ ] 地形正确生成

## 🎮 分享你的游戏

部署成功后，你可以将 URL 分享给朋友体验！

---

**提示**: 首次部署可能需要 2-3 分钟构建时间。
