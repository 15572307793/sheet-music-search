# 需求文档

## 简介

乐谱搜索工具是一个面向 iPhone 用户的移动端 Web 应用（PWA），主要服务于钢琴教师为初级学者及考级学生查找钢琴曲谱的场景。用户通过输入曲谱名称，在互联网上搜索并获取多个乐谱查询结果。搜索结果直接展示乐谱缩略图，用户可点击预览高清大图并下载到本地设备。搜索引擎优先从高清、曲谱资源全面的专业网站获取结果，同时也支持流行音乐曲谱的搜索。应用采用 PWA 方案，iPhone 用户可通过 Safari 添加到主屏幕，实现"打开即用"的体验。

## 术语表

- **Search_App**: 乐谱搜索 PWA 应用，运行在移动端浏览器中
- **Search_Engine**: 搜索引擎模块，负责向外部乐谱数据源发起搜索请求并聚合结果
- **Result_List**: 搜索结果列表组件，负责展示多条乐谱搜索结果
- **Search_Input**: 搜索输入组件，负责接收用户输入的曲谱名称
- **Result_Item**: 单条搜索结果条目，包含乐谱缩略图、标题、来源、链接、清晰度标签和来源优先级等信息
- **Thumbnail**: 乐谱缩略图组件，在搜索结果中展示乐谱图片的小尺寸预览
- **Preview_Modal**: 图片预览弹窗组件，以全屏或大尺寸模式展示乐谱图片，支持缩放和翻页浏览
- **Download_Button**: 下载按钮组件，允许用户将乐谱图片保存到本地设备
- **PWA_Shell**: PWA 应用外壳，提供离线缓存、主屏幕图标、全屏启动等能力
- **Source_Priority**: 数据源优先级配置，定义各乐谱网站的搜索优先级和质量等级（高清优先、资源全面优先）
- **Quality_Tag**: 质量标签，标识搜索结果的清晰度和来源质量等级（如"高清"、"推荐"）

## 需求

### 需求 1：搜索输入

**用户故事：** 作为一名钢琴教师，我想要输入曲谱名称进行搜索，以便快速找到适合学生使用的钢琴乐谱。

#### 验收标准

1. THE Search_App SHALL 在页面顶部显示一个搜索输入框和搜索按钮
2. WHEN 用户在 Search_Input 中输入曲谱名称并点击搜索按钮, THE Search_Engine SHALL 发起乐谱搜索请求
3. WHEN 用户在 Search_Input 中输入曲谱名称并按下回车键, THE Search_Engine SHALL 发起乐谱搜索请求
4. IF Search_Input 中的内容为空且用户点击搜索按钮, THEN THE Search_App SHALL 显示提示信息"请输入曲谱名称"
5. WHILE Search_Engine 正在执行搜索请求, THE Search_App SHALL 在搜索按钮上显示加载状态并禁用重复提交

### 需求 2：搜索结果展示

**用户故事：** 作为一名钢琴教师，我想要看到按质量排序的搜索结果，以便快速选择高清且完整的钢琴曲谱。

#### 验收标准

1. WHEN Search_Engine 返回搜索结果, THE Result_List SHALL 以列表形式按优先级从高到低展示所有结果条目
2. THE Result_Item SHALL 包含乐谱 Thumbnail、乐谱标题、来源网站名称、Quality_Tag 和可点击的链接
3. WHEN Search_Engine 返回搜索结果, THE Result_Item SHALL 展示乐谱首页的 Thumbnail（缩略图），尺寸不小于 80x120 像素
4. WHEN 用户点击某个 Result_Item 的 Thumbnail 或标题, THE Search_App SHALL 打开 Preview_Modal 展示该乐谱的大尺寸图片
5. WHEN 用户点击某个 Result_Item 的来源链接, THE Search_App SHALL 在新的浏览器标签页中打开对应的乐谱页面
6. WHEN Search_Engine 返回空结果, THE Search_App SHALL 显示提示信息"未找到相关曲谱，请尝试其他关键词"
7. IF Search_Engine 返回的结果超过 20 条, THEN THE Result_List SHALL 分页展示，每页显示 20 条结果
8. WHEN Result_Item 来自高优先级数据源, THE Result_Item SHALL 显示"高清"或"推荐"Quality_Tag 以帮助用户识别优质结果
9. IF Thumbnail 图片加载失败, THEN THE Result_Item SHALL 显示默认的乐谱占位图标


### 需求 3：数据源优先级与搜索策略

**用户故事：** 作为一名钢琴教师，我想要搜索结果优先来自高清、曲谱资源全面的专业网站，以便获得高质量的教学用谱。

#### 验收标准

1. THE Search_Engine SHALL 维护一份 Source_Priority 配置，将数据源分为高、中、低三个优先级
2. WHEN 收到搜索请求, THE Search_Engine SHALL 优先向高优先级数据源发起查询，再向中、低优先级数据源发起查询
3. WHEN 高优先级数据源在 5 秒内返回足够结果（至少 5 条）, THE Search_Engine SHALL 将高优先级结果排在结果列表最前面
4. WHEN 高优先级数据源返回结果不足 5 条, THE Search_Engine SHALL 继续等待中、低优先级数据源的结果进行补充
5. THE Source_Priority 配置 SHALL 支持通过配置文件调整各数据源的优先级等级，无需修改代码
6. THE Search_Engine SHALL 将提供高清乐谱图片的数据源配置为高优先级
7. THE Search_Engine SHALL 将曲谱资源覆盖面广（包含考级曲目和流行音乐）的数据源配置为高优先级

### 需求 4：搜索结果排序

**用户故事：** 作为一名钢琴教师，我想要搜索结果按照质量和相关性排序，以便第一时间看到最适合教学使用的曲谱。

#### 验收标准

1. WHEN Search_Engine 返回聚合结果, THE Search_Engine SHALL 按以下规则排序：数据源优先级高的排在前面，同一优先级内按标题与搜索关键词的匹配度排序
2. WHEN 多个 Result_Item 来自相同优先级的数据源, THE Search_Engine SHALL 将标题完全匹配搜索关键词的结果排在部分匹配的结果前面
3. WHEN 存在重复结果（相同乐谱来自不同数据源）, THE Search_Engine SHALL 保留来自最高优先级数据源的结果并去除重复条目
4. THE Search_Engine SHALL 在合并结果时为每个 Result_Item 附加其来源数据源的优先级信息

### 需求 5：搜索引擎聚合

**用户故事：** 作为一名钢琴教师，我想要从多个来源获取曲谱搜索结果，以便获得更全面的搜索覆盖，满足考级和流行音乐的多样化需求。

#### 验收标准

1. WHEN 收到搜索请求, THE Search_Engine SHALL 向至少三个外部乐谱数据源发起并行查询
2. WHEN 所有数据源返回结果, THE Search_Engine SHALL 将结果合并去重后按 Source_Priority 排序返回给 Result_List
3. IF 某个数据源请求超时（超过 10 秒）, THEN THE Search_Engine SHALL 忽略该数据源并返回其他数据源的结果
4. IF 所有数据源均请求失败, THEN THE Search_App SHALL 显示错误提示"搜索服务暂时不可用，请稍后重试"
5. THE Search_Engine SHALL 支持的数据源类型包括：钢琴考级曲谱网站、综合乐谱网站和流行音乐曲谱网站

### 需求 6：PWA 支持

**用户故事：** 作为一名 iPhone 用户，我想要将应用添加到主屏幕直接使用，以便获得类似原生应用的体验。

#### 验收标准

1. THE PWA_Shell SHALL 提供有效的 Web App Manifest 文件，包含应用名称、图标和主题色
2. THE PWA_Shell SHALL 注册 Service Worker 以缓存应用静态资源
3. WHEN 用户通过主屏幕图标启动应用, THE Search_App SHALL 以全屏模式（standalone）运行，隐藏浏览器地址栏
4. WHILE 设备处于离线状态, THE PWA_Shell SHALL 显示应用外壳界面并提示"当前无网络连接，请检查网络后重试"
5. THE Search_App SHALL 适配 iPhone 各尺寸屏幕，包括安全区域（Safe Area）适配

### 需求 7：移动端交互体验

**用户故事：** 作为一名手机用户，我想要流畅的移动端操作体验，以便高效地搜索乐谱。

#### 验收标准

1. THE Search_App SHALL 采用响应式布局，适配 320px 至 430px 宽度的移动端屏幕
2. WHEN 页面加载完成, THE Search_Input SHALL 自动获取焦点并弹出键盘
3. THE Search_App SHALL 支持触摸滚动浏览搜索结果列表
4. WHEN 用户下拉 Result_List 至顶部, THE Search_App SHALL 触发刷新操作重新执行当前搜索
5. THE Search_App SHALL 在首次加载时在 3 秒内完成页面渲染（基于 4G 网络环境）

### 需求 8：乐谱图片预览

**用户故事：** 作为一名钢琴教师，我想要在搜索结果中直接预览乐谱图片，以便快速判断曲谱是否适合学生使用，无需跳转到外部网站。

#### 验收标准

1. WHEN 用户点击 Result_Item 的 Thumbnail 或标题, THE Preview_Modal SHALL 以全屏覆盖方式展示该乐谱的高清图片
2. WHILE Preview_Modal 处于打开状态, THE Preview_Modal SHALL 支持双指缩放和单指拖动查看图片细节
3. WHEN 乐谱包含多页图片, THE Preview_Modal SHALL 支持左右滑动切换页面，并显示当前页码和总页数
4. WHEN 用户点击 Preview_Modal 的关闭按钮或向下滑动, THE Preview_Modal SHALL 关闭并返回搜索结果列表
5. WHILE Preview_Modal 正在加载高清图片, THE Preview_Modal SHALL 显示加载进度指示器
6. IF 高清图片加载失败, THEN THE Preview_Modal SHALL 显示提示信息"图片加载失败，请检查网络后重试"并提供重试按钮

### 需求 9：乐谱下载

**用户故事：** 作为一名钢琴教师，我想要将乐谱图片下载到手机上，以便在没有网络的环境下也能查看和使用曲谱进行教学。

#### 验收标准

1. THE Result_Item SHALL 在每条搜索结果中显示一个 Download_Button
2. WHILE Preview_Modal 处于打开状态, THE Preview_Modal SHALL 在顶部工具栏显示一个 Download_Button
3. WHEN 用户点击 Download_Button, THE Search_App SHALL 将当前乐谱的图片文件保存到用户设备的本地存储
4. WHEN 乐谱包含多页图片且用户点击 Download_Button, THE Search_App SHALL 将所有页面图片打包下载
5. WHILE 下载任务正在执行, THE Search_App SHALL 显示下载进度并禁用该条目的 Download_Button 防止重复下载
6. WHEN 下载完成, THE Search_App SHALL 显示提示信息"下载完成"并提供查看文件的入口
7. IF 下载过程中发生网络错误, THEN THE Search_App SHALL 显示提示信息"下载失败，请检查网络后重试"并提供重试按钮