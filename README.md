# 🎵 乐谱搜索

面向钢琴教师的乐谱搜索 PWA 应用，聚合多个外部数据源，提供高质量曲谱搜索、预览和下载服务。

## 功能特性

- **多源聚合搜索** — 同时查询多个乐谱网站，按数据源质量优先级排序
- **图片预览** — 全屏查看高清乐谱，支持双指缩放、拖动、多页翻页
- **一键下载** — 单页直接下载，多页自动打包为 ZIP
- **PWA 支持** — iPhone 添加到主屏幕，全屏独立运行，离线显示应用外壳
- **移动优先** — 针对 320px-430px 屏幕优化，适配 iPhone 安全区域

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS |
| 构建 | Vite + vite-plugin-pwa |
| 后端 | Vercel Serverless Functions |
| 测试 | Vitest + fast-check |
| 下载 | JSZip（多页打包） |

## 项目结构

```
├── api/                    # Vercel Serverless Functions
│   ├── adapters/           # 数据源适配器（高/中/低优先级）
│   ├── config/             # 数据源配置
│   ├── utils/              # 匹配度计算、排序、去重
│   ├── search.ts           # POST /api/search 端点
│   ├── images.ts           # GET /api/images 图片代理
│   └── searchEngine.ts     # 搜索引擎聚合模块
├── src/
│   ├── components/         # React 组件
│   ├── context/            # 全局状态管理（Search/Download/Toast）
│   ├── hooks/              # 自定义 Hooks
│   ├── services/           # API 调用服务
│   └── types/              # TypeScript 类型定义
└── public/                 # 静态资源和 PWA 图标
```

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发（仅前端）
npm run dev

# 本地完整开发（含 Serverless Functions）
npx vercel dev

# 运行测试
npm test

# 生产构建
npm run build
```

## 部署

项目使用 Cloudflare Pages 部署（免费，国内可访问）：

1. 将代码推送到 GitHub
2. 打开 [dash.cloudflare.com](https://dash.cloudflare.com)，注册/登录
3. 进入 Workers & Pages → Create → Pages → Connect to Git
4. 选择你的 GitHub 仓库
5. 构建设置：
   - 构建命令：`npm run build`
   - 输出目录：`dist`
6. 点击 Deploy

部署完成后获得 `xxx.pages.dev` 域名，国内可直接访问。

也可以用命令行部署：

```bash
npm run pages:deploy
```

## 接入真实数据源

当前数据源适配器为占位实现。接入真实网站需修改 `api/adapters/` 下对应适配器的 `search` 方法。数据源优先级可在 `api/config/sources.json` 中直接调整，无需改代码。

## 许可证

MIT
