# 实现计划：乐谱搜索 PWA 应用

## 概述

基于 React 18 + TypeScript + Vite + Tailwind CSS 技术栈，按照前端基础设施 → 核心数据模型与算法 → 后端代理层 → 前端组件 → PWA 支持 → 集成联调的顺序，逐步实现乐谱搜索 PWA 应用。

## 任务

- [x] 1. 项目初始化与基础设施搭建
  - [x] 1.1 使用 Vite 创建 React + TypeScript 项目，安装 Tailwind CSS、vite-plugin-pwa、jszip、fast-check、vitest 等依赖
    - 初始化项目结构，配置 `vite.config.ts`、`tailwind.config.ts`、`tsconfig.json`
    - 配置 Tailwind CSS 移动优先响应式断点（320px-430px）
    - 配置 Vitest 测试环境
    - _需求: 6.1, 7.1_

  - [x] 1.2 定义核心 TypeScript 类型与接口
    - 创建 `src/types/index.ts`，定义 `SearchResult`、`RawSearchResult`、`SourceConfig`、`SourcePriority`、`QualityTag`、`DownloadTask`、`SearchRequest`、`SearchResponse` 等类型
    - 创建 `src/types/components.ts`，定义 `SearchBarProps`、`ResultListProps`、`ResultItemProps`、`PreviewModalProps`、`DownloadButtonProps` 等组件接口
    - _需求: 2.2, 2.8, 3.1, 4.4, 9.5_

- [x] 2. 搜索引擎核心算法（后端）
  - [x] 2.1 实现匹配度计算函数 `calculateMatchScore`
    - 创建 `api/utils/matchScore.ts`，实现完全匹配(1.0)、包含匹配(0.8)、部分词匹配(0-0.6) 三级匹配逻辑
    - _需求: 4.1, 4.2_

  - [ ]* 2.2 编写属性测试：匹配度计算一致性
    - **Property 13: 匹配度计算一致性**
    - **验证: 需求 4.1, 4.2**

  - [x] 2.3 实现搜索结果排序函数 `compareResults`
    - 创建 `api/utils/sortResults.ts`，按数据源优先级（high > medium > low）排序，同优先级内按 matchScore 降序排序
    - _需求: 4.1, 4.2_

  - [x] 2.4 实现去重函数 `deduplicateResults`
    - 创建 `api/utils/deduplicateResults.ts`，基于标题（忽略大小写和首尾空白）去重，保留最高优先级数据源的条目
    - _需求: 4.3_

  - [ ]* 2.5 编写属性测试：排序正确性
    - **Property 4: 搜索结果按优先级和匹配度排序**
    - **验证: 需求 2.1, 4.1, 4.2, 5.2**

  - [ ]* 2.6 编写属性测试：去重保留最高优先级
    - **Property 8: 去重保留最高优先级**
    - **验证: 需求 4.3**

- [x] 3. 检查点 - 确保核心算法测试通过
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 4. 后端代理层实现
  - [x] 4.1 创建数据源优先级配置文件
    - 创建 `api/config/sources.json`，定义至少三个数据源（高/中/低优先级），包含 name、priority、baseUrl、enabled、timeout 字段
    - _需求: 3.1, 3.5, 3.6, 3.7_

  - [x] 4.2 实现数据源适配器接口与基础适配器
    - 创建 `api/adapters/SourceAdapter.ts`，定义 `SourceAdapter` 接口
    - 创建至少三个适配器实现（高/中/低优先级各一个），每个适配器实现 `search` 方法
    - 实现带超时和错误处理的 `fetchWithTimeout` 包装函数
    - _需求: 5.1, 5.3, 5.5_

  - [x] 4.3 实现搜索引擎聚合模块
    - 创建 `api/searchEngine.ts`，实现并行查询所有启用的数据源、聚合结果、调用排序和去重函数、分页返回
    - 高优先级数据源 5 秒内返回足够结果（≥5 条）时优先展示
    - 单个数据源超时（10 秒）时静默忽略
    - 所有数据源失败时返回错误状态
    - _需求: 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 4.4 编写属性测试：超时处理返回部分结果
    - **Property 9: 超时处理返回部分结果**
    - **验证: 需求 5.3**

  - [ ]* 4.5 编写属性测试：分页限制
    - **Property 7: 分页限制**
    - **验证: 需求 2.7**

  - [x] 4.6 实现搜索 API 端点
    - 创建 `api/search.ts`，实现 `POST /api/search` 端点，接收 `{ query, page, pageSize }` 参数，调用搜索引擎模块返回结果
    - _需求: 1.2, 1.3_

  - [x] 4.7 实现图片代理 API 端点
    - 创建 `api/images.ts`，实现 `GET /api/images?url={encodedUrl}` 端点，代理外部图片请求解决跨域问题
    - _需求: 2.3, 8.1_

- [x] 5. 检查点 - 确保后端代理层测试通过
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 6. 前端状态管理
  - [x] 6.1 实现全局状态管理（React Context + useReducer）
    - 创建 `src/context/SearchContext.tsx`，管理搜索状态（query、results、isLoading、error、currentPage、totalPages）
    - 创建 `src/context/DownloadContext.tsx`，管理下载任务状态（downloadTasks Map）
    - 提供 `useSearch` 和 `useDownload` 自定义 hooks
    - _需求: 1.5, 9.5_

  - [x] 6.2 实现搜索 API 调用服务
    - 创建 `src/services/searchService.ts`，封装 `POST /api/search` 请求
    - 创建 `src/services/downloadService.ts`，封装图片下载逻辑（单页直接下载，多页 JSZip 打包）
    - _需求: 1.2, 9.3, 9.4_

- [x] 7. 前端核心组件实现
  - [x] 7.1 实现 SearchBar 组件
    - 创建 `src/components/SearchBar.tsx`，包含搜索输入框和搜索按钮
    - 支持点击搜索按钮和回车键触发搜索
    - 空输入时显示提示信息"请输入曲谱名称"
    - 搜索中显示加载状态并禁用按钮
    - 页面加载完成后自动聚焦输入框
    - _需求: 1.1, 1.2, 1.3, 1.4, 1.5, 7.2_

  - [ ]* 7.2 编写属性测试：有效输入触发搜索 & 空输入拒绝 & 加载状态禁用
    - **Property 1: 有效输入触发搜索**
    - **Property 2: 空输入拒绝**
    - **Property 3: 加载状态禁用重复提交**
    - **验证: 需求 1.2, 1.3, 1.4, 1.5**

  - [x] 7.3 实现 QualityTag 组件
    - 创建 `src/components/QualityTag.tsx`，渲染"高清"或"推荐"标签
    - _需求: 2.8_

  - [x] 7.4 实现 Thumbnail 组件
    - 创建 `src/components/Thumbnail.tsx`，展示乐谱缩略图（最小 80x120 像素）
    - 图片加载失败时显示默认乐谱占位图标
    - _需求: 2.3, 2.9_

  - [x] 7.5 实现 DownloadButton 组件
    - 创建 `src/components/DownloadButton.tsx`，显示下载按钮
    - 下载中显示进度并禁用按钮防止重复下载
    - 下载完成显示"下载完成"提示
    - 下载失败显示错误提示和重试按钮
    - _需求: 9.1, 9.2, 9.5, 9.6, 9.7_

  - [ ]* 7.6 编写属性测试：下载进行中禁用重复下载
    - **Property 12: 下载进行中禁用重复下载**
    - **验证: 需求 9.5**

  - [x] 7.7 实现 ResultItem 组件
    - 创建 `src/components/ResultItem.tsx`，组合 Thumbnail、QualityTag、DownloadButton
    - 包含乐谱标题、来源网站名称、可点击的来源链接（新标签页打开）
    - 高优先级来源显示质量标签
    - 点击缩略图或标题触发预览
    - _需求: 2.2, 2.4, 2.5, 2.8, 9.1_

  - [ ]* 7.8 编写属性测试：结果条目字段完整性 & 高优先级质量标签
    - **Property 5: 搜索结果条目包含所有必要字段**
    - **Property 6: 高优先级来源结果显示质量标签**
    - **验证: 需求 2.2, 2.8, 4.4, 9.1**

  - [x] 7.9 实现 ResultList 组件
    - 创建 `src/components/ResultList.tsx`，列表展示搜索结果
    - 支持分页（每页 20 条）
    - 空结果显示"未找到相关曲谱，请尝试其他关键词"
    - 支持触摸滚动和下拉刷新
    - _需求: 2.1, 2.6, 2.7, 7.3, 7.4_

- [x] 8. 检查点 - 确保前端核心组件测试通过
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 9. 图片预览与下载功能
  - [x] 9.1 实现 ImageViewer 组件（缩放/拖动）
    - 创建 `src/components/ImageViewer.tsx`，基于 touch events 实现双指缩放和单指拖动
    - _需求: 8.2_

  - [x] 9.2 实现 PageNavigator 组件（翻页）
    - 创建 `src/components/PageNavigator.tsx`，支持左右滑动切换页面，显示"当前页/总页数"
    - _需求: 8.3_

  - [ ]* 9.3 编写属性测试：预览模态框页码指示器正确性
    - **Property 10: 预览模态框页码指示器正确性**
    - **验证: 需求 8.3**

  - [x] 9.4 实现 PreviewModal 组件
    - 创建 `src/components/PreviewModal.tsx`，全屏覆盖展示高清乐谱图片
    - 组合 ImageViewer、PageNavigator、DownloadButton
    - 支持关闭按钮和向下滑动关闭
    - 加载中显示进度指示器
    - 图片加载失败显示错误提示和重试按钮
    - _需求: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.2_

  - [x] 9.5 实现下载功能集成
    - 在 `src/services/downloadService.ts` 中实现单页直接下载和多页 JSZip 打包下载
    - 下载进度回调更新 DownloadContext 状态
    - _需求: 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 9.6 编写属性测试：多页乐谱下载完整性
    - **Property 11: 多页乐谱下载完整性**
    - **验证: 需求 9.3, 9.4**

- [x] 10. Toast 提示与错误处理
  - [x] 10.1 实现 Toast 提示组件
    - 创建 `src/components/Toast.tsx`，支持成功/错误/信息三种类型的提示
    - 创建 `src/context/ToastContext.tsx`，提供全局 `useToast` hook
    - _需求: 1.4, 2.6, 5.4, 9.6, 9.7_

  - [x] 10.2 实现 React Error Boundary
    - 创建 `src/components/ErrorBoundary.tsx`，包裹 PreviewModal 和 ResultList 等关键组件
    - 防止单个组件渲染错误导致整个应用崩溃
    - _需求: 5.4_

- [x] 11. PWA 配置与离线支持
  - [x] 11.1 配置 Web App Manifest
    - 创建应用图标（多尺寸），配置 `manifest.json`（应用名称、图标、主题色、display: standalone）
    - 配置 vite-plugin-pwa 生成 manifest
    - _需求: 6.1, 6.3_

  - [x] 11.2 配置 Service Worker 与离线缓存
    - 通过 vite-plugin-pwa 配置 Workbox，缓存静态资源
    - 实现离线检测，离线时显示应用外壳和提示"当前无网络连接，请检查网络后重试"
    - _需求: 6.2, 6.4_

  - [x] 11.3 适配 iPhone 安全区域
    - 在 `index.html` 中添加 `viewport-fit=cover` 和 Apple 专用 meta 标签
    - 在 Tailwind CSS 中使用 `env(safe-area-inset-*)` 适配安全区域
    - _需求: 6.5, 7.1_

- [x] 12. 页面组装与集成
  - [x] 12.1 组装 App 主页面
    - 在 `src/App.tsx` 中组合 SearchBar、ResultList、PreviewModal、Toast 组件
    - 用 SearchContext、DownloadContext、ToastContext 包裹应用
    - 用 ErrorBoundary 包裹关键组件
    - _需求: 1.1, 7.1_

  - [x] 12.2 集成前后端联调
    - 确保前端搜索请求正确调用后端 `/api/search` 端点
    - 确保图片代理 `/api/images` 端点正常工作
    - 确保搜索结果展示、预览、下载完整流程可用
    - _需求: 1.2, 2.1, 8.1, 9.3_

- [x] 13. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请向用户确认。

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加速 MVP 交付
- 每个任务引用了具体的需求编号，确保可追溯性
- 检查点任务用于阶段性验证，确保增量开发的正确性
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况
