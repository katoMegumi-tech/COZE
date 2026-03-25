# AI视频生成器小程序

一款基于 AI 的视频生成器微信小程序，支持文字生成视频、图片生成视频功能，面向 C 端用户（商家、创作者）。

## 项目概述

本项目是一个完整的 AI 视频生成解决方案，用户可以通过简单的文字描述或上传图片，快速生成专业级别的营销视频。项目采用前后端分离架构，前端使用 Taro 框架实现跨端兼容，后端使用 NestJS 提供稳定的 API 服务。

### 核心功能

- 🎬 **视频生成**：支持文字转视频、图片转视频
- 📝 **多种创作模式**：自定义创作、店铺创作、产品创作
- 🤖 **AI 提示词优化**：智能润色和优化用户输入的描述
- 📱 **平台支持**：主要面向微信小程序（保留 H5 构建能力）
- 🎨 **视频参数定制**：分辨率、时长、比例、风格等可配置

---

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Taro | 4.1.9 |
| UI 框架 | React | 18.0.0 |
| 开发语言 | TypeScript | 5.4.5 |
| 样式方案 | TailwindCSS | 4.1.18 |
| 小程序适配 | weapp-tailwindcss | 4.9.2 |
| 图标库 | lucide-react-taro | latest |
| 后端框架 | NestJS | 10.4.15 |
| HTTP 客户端 | Axios + @nestjs/axios | latest |
| 包管理器 | pnpm | - |
| 运行时 | Node.js | >= 18 |

---

## 项目结构

```
├── config/                        # Taro 构建配置
│   ├── index.ts                   # 主配置文件（含 Vite 代理配置）
│   ├── dev.ts                     # 开发环境配置
│   └── prod.ts                    # 生产环境配置
│
├── server/                        # NestJS 后端服务
│   └── src/
│       ├── main.ts                # 服务入口（端口 3000）
│       ├── app.module.ts          # 根模块
│       ├── app.controller.ts      # 健康检查接口
│       ├── app.service.ts         # 基础服务
│       ├── interceptors/          # 拦截器
│       │   └── http-status.interceptor.ts
│       └── modules/               # 业务模块
│           ├── ai/                # AI 服务模块
│           │   ├── ai.controller.ts
│           │   ├── ai.service.ts
│           │   └── ai.module.ts
│           ├── coze/              # Coze 工作流代理模块 ⭐
│           │   ├── coze.controller.ts
│           │   ├── coze.service.ts
│           │   └── coze.module.ts
│           ├── template/          # 模板模块
│           ├── upload/            # 上传模块
│           └── video/             # 视频模块
│
├── src/                           # Taro 前端源码
│   ├── app.tsx                    # 应用入口
│   ├── app.config.ts              # 应用配置（TabBar、页面路由）
│   ├── app.css                    # 全局样式
│   │
│   ├── pages/                     # 页面组件
│   │   ├── index/                 # 首页（创作入口）
│   │   ├── create/                # 创作页面（选择创作类型）
│   │   ├── custom/                # 自定义创作
│   │   ├── shop/                  # 店铺创作
│   │   ├── product/               # 产品创作
│   │   ├── result/                # 生成结果展示 ⭐
│   │   ├── material/              # 素材库
│   │   ├── character/             # 角色管理
│   │   ├── works/                 # 作品列表
│   │   └── profile/               # 个人中心
│   │
│   ├── components/                # 组件库
│   │   └── ui/                    # shadcn/ui 组件（50+）
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   │
│   ├── utils/                     # 工具函数
│   │   └── coze-workflow.ts       # Coze 工作流调用工具 ⭐
│   │
│   ├── lib/                       # 工具库
│   │   ├── utils.ts
│   │   ├── platform.ts
│   │   └── hooks/
│   │
│   ├── network.ts                 # 网络请求封装
│   └── assets/                    # 静态资源
│       └── tabbar/                # TabBar 图标
│
├── types/                         # TypeScript 类型定义
├── key/                           # 小程序密钥（CI 上传）
├── .env.local                     # 环境变量
├── project.config.json            # 微信小程序配置
└── design_guidelines.md           # 设计规范文档
```

---

## 核心模块说明

### 1. 前端页面流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    首页     │────►│   创作页    │────►│  具体创作   │────►│   结果页    │
│  (index)    │     │  (create)   │     │(shop/product│     │  (result)   │
└─────────────┘     └─────────────┘     │  /custom)   │     └─────────────┘
                                        └─────────────┘
```

**页面职责：**

| 页面 | 路由 | 功能 |
|------|------|------|
| 首页 | `/pages/index/index` | 应用入口，展示 TabBar |
| 创作页 | `/pages/create/index` | 选择创作类型（自定义/店铺/产品） |
| 自定义创作 | `/pages/custom/index` | 自由输入描述，生成视频 |
| 店铺创作 | `/pages/shop/index` | 输入店铺信息，生成店铺宣传视频 |
| 产品创作 | `/pages/product/index` | 上传产品图片，生成产品展示视频 |
| 结果页 | `/pages/result/index` | 展示生成的视频，支持下载分享 |
| 素材库 | `/pages/material/index` | 管理图片素材 |
| 作品 | `/pages/works/index` | 查看历史生成记录 |
| 我的 | `/pages/profile/index` | 个人中心 |

### 2. 视频生成流程（异步任务 + 轮询）

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              视频生成流程                                 │
└──────────────────────────────────────────────────────────────────────────┘

用户操作                     前端处理                      后端处理
   │                           │                            │
   │  1. 选择图片              │                            │
   ├──────────────────────────►│                            │
   │                           │ 2. 图片转 Base64           │
   │                           ├───────────────────────────►│
   │                           │                            │
   │  3. 填写描述信息          │                            │
   ├──────────────────────────►│                            │
   │                           │                            │
   │  4. 点击"生成视频"        │                            │
   ├──────────────────────────►│                            │
   │                           │ 5. 存储参数到 Storage      │
   │                           ├───────────────────────────►│
   │                           │                            │
   │                           │ 6. 跳转结果页              │
   │                           ├───────────────────────────►│
   │                           │                            │
   │                           │ 7. POST /api/upload/coze   │
   │                           ├───────────────────────────►│
   │                           │                            │
   │                           │ 8. POST /api/coze/workflow/async
   │                           ├───────────────────────────►│
   │                           │                            │
   │                           │              后端异步调用 Coze 工作流
   │                           │                            │
   │                           │ 9. 周期性 GET /api/coze/workflow/status/{taskId}
   │                           ├◄───────────────────────────┤
   │                           │                            │
   │  10. 拿到 videoUrls 并展示视频                         │
   │◄──────────────────────────┤                            │
   │                           │                            │
```

### 3. 后端 API 接口

**所有接口前缀：`/api`**

| 接口 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/hello` | GET | 测试接口 | ✅ |
| `/health` | GET | 健康检查 | ✅ |
| `/ai/optimize-prompt` | POST | AI 优化提示词 | ✅ |
| `/ai/polish-prompt` | POST | AI 润色提示词 | ✅ |
| `/upload/image` | POST | 上传图片（通用） | ✅ |
| `/upload/coze` | POST | 上传文件到 Coze（返回 fileId）⭐ | ✅ |
| `/coze/workflow` | POST | 同步工作流（兼容模式） | ✅ |
| `/coze/workflow/async` | POST | 异步生成视频（返回 taskId）⭐ | ✅ |
| `/coze/workflow/status/:taskId` | GET | 查询异步任务状态 ⭐ | ✅ |
| `/template/list` | GET | 获取模板列表 | ✅ |
| `/template/categories` | GET | 获取模板分类 | ✅ |
| `/template/:id` | GET | 获取模板详情 | ✅ |
| `/video/generate` | POST | 生成视频 | ⚠️ 未使用 |

### 4. 前端与 Coze 工作流接口对接说明

前端通过 `src/utils/coze-workflow.ts` 封装了三个核心接口的调用：

- `POST /api/upload/coze`
  - 调用函数：`uploadFileToCoze(filePath)`
  - 实现：`Network.uploadFile({ url: '/api/upload/coze', name: 'file', filePath })`
  - 响应结构（与后端文档一致）：
    - `code: 0` 表示成功
    - `message`: 提示信息
    - `data`:
      - `id`: 作为后续 `fileId` 使用
      - `bytes`: 文件大小
      - `fileName`: 原始文件名
      - `createdAt`: 上传时间戳

- `POST /api/coze/workflow/async`
  - 调用函数：`startAsyncWorkflow(body)`
  - 实现：`Network.request({ url: '/api/coze/workflow/async', method: 'POST', data: body })`
  - 请求体字段与后端文档字段一一对应：
    - `fileId` ← `uploadToCoze` 返回的 `data.id`
    - `productName` ← 业务层中的商品/店铺名称
    - `productDesc` ← 业务层中的描述文案（如 prompt、businessScope）
    - `productFeatures` ← 业务层中的卖点
    - `productPrice` ← 业务层中的价格
    - `videoAspectRatio` ← `video_aspect_ratio`
    - `videoLength` ← `video_length`
    - `videoNum` ← `video_num`
    - `videoResolution` ← `video_resolution`
    - `videoScene` ← `video_scene`
    - `videoStyle` ← `video_style`
    - `videoSubtitle` ← `video_subtitle`
  - 成功返回：`{ code: 0, message, data: { taskId } }`

- `GET /api/coze/workflow/status/{taskId}`
  - 调用函数：`getWorkflowStatus(taskId)`（内部被 `pollWorkflowResult` 使用）
  - 实现：`Network.request({ url: \`/api/coze/workflow/status/${taskId}\`, method: 'GET' })`
  - 响应结构：
    - `code: 0` 表示成功
    - `data`:
      - `taskId`
      - `status`
      - `progress`
      - `message`
      - `videoUrls`
      - `errorMessage?`

前端结果页 `/pages/result/index` 中的 `runCozeWorkflow` 会依次：

1. 读取本地存储的图片 Base64 和业务参数；
2. 上传图片到 `/api/upload/coze` 获取 `fileId`；
3. 通过 `/api/coze/workflow/async` 创建任务；
4. 轮询 `/api/coze/workflow/status/{taskId}` 直到拿到 `videoUrls`；
5. 将第一个视频 URL 展示给用户。

---

### 5. 网络请求架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           网络请求架构                                   │
└─────────────────────────────────────────────────────────────────────────┘

                              H5 环境
┌─────────────┐     /api/coze/workflow     ┌─────────────┐
│   H5 页面   │ ──────────────────────────►│  NestJS     │
│  (fetch)    │                            │  后端代理   │
└─────────────┘                            └──────┬──────┘
                                                  │
                                                  │ http://192.168.146.161:8080/coze/workflow/
                                                  ▼
                                           ┌─────────────┐
                                           │  用户后端   │
                                           │ (视频生成)  │
                                           └─────────────┘

                            小程序环境
┌─────────────┐     /api/coze/workflow     ┌─────────────┐
│   小程序    │ ──────────────────────────►│  NestJS     │
│(Taro.request)│                           │  后端代理   │
└─────────────┘                            └──────┬──────┘
                                                  │
                                                  │ http://192.168.146.161:8080/coze/workflow/
                                                  ▼
                                           ┌─────────────┐
                                           │  用户后端   │
                                           │ (视频生成)  │
                                           └─────────────┘
```

**为什么需要后端代理？**

| 问题 | 解决方案 |
|------|---------|
| 小程序必须 HTTPS | ✅ 项目后端与小程序同域，无跨域问题 |
| 小程序域名白名单 | ✅ 只需配置项目域名，无需配置用户后端 |
| 局域网 IP 限制 | ✅ 项目后端可以访问局域网 |
| CORS 问题 | ✅ 同域请求，无 CORS |

---

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- 微信开发者工具（小程序开发）

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
# 同时启动前端和后端
pnpm dev
```

- **前端地址**：http://localhost:5000
- **后端地址**：http://localhost:3000

### 单独启动

```bash
pnpm dev:web      # 仅 H5 前端
pnpm dev:weapp    # 仅微信小程序
pnpm dev:server   # 仅后端服务
```

### 构建

```bash
pnpm build        # 构建所有（H5 + 小程序 + 后端）
pnpm build:web    # 仅构建 H5，输出到 dist-web
pnpm build:weapp  # 仅构建微信小程序，输出到 dist-weapp
pnpm build:server # 仅构建后端
```

### 预览小程序

```bash
pnpm preview:weapp # 构建并生成预览二维码
```

---

## 核心开发规范

### 网络请求

**IMPORTANT**: 使用 `Network.request` 替代 `Taro.request`

```typescript
import { Network } from '@/network'

// GET 请求
const data = await Network.request({
  url: '/api/hello'
})

// POST 请求
const result = await Network.request({
  url: '/api/coze/workflow',
  method: 'POST',
  data: { 
    images: ['base64...'],
    product_desc: '产品描述'
  }
})
```

### 组件使用

优先使用 `@/components/ui` 中的组件：

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
```

### 图标使用

```typescript
import { House, Settings, Camera } from 'lucide-react-taro'

<House size={24} color="#1890ff" />
<Settings size={32} />
<Camera strokeWidth={1.5} />
```

### 样式开发

使用 Tailwind CSS：

```tsx
<View className="flex flex-col items-center min-h-screen bg-gray-100">
  <Text className="text-2xl font-bold text-blue-600 mb-4">标题</Text>
</View>
```

### 路由导航

```typescript
import Taro from '@tarojs/taro'

// 跳转页面
Taro.navigateTo({ url: '/pages/result/index?from=shop' })

// TabBar 页面
Taro.switchTab({ url: '/pages/index/index' })

// 返回
Taro.navigateBack()
```

---

## 配置说明

### 后端代理配置

修改 `server/src/modules/coze/coze.service.ts`：

```typescript
const USER_BACKEND = {
  baseUrl: 'http://192.168.146.161:8080',  // 用户后端地址
  workflowEndpoint: '/coze/workflow/',
};
```

### Vite 代理配置（H5 开发）

修改 `config/index.ts`：

```typescript
h5: {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
}
```

### 小程序配置

修改 `project.config.json`：

```json
{
  "appid": "your-app-id",
  "setting": {
    "urlCheck": false  // 开发环境关闭域名校验
  }
}
```

---

## API 文档

### Coze 工作流接口

**请求：**
```http
POST /api/coze/workflow
Content-Type: application/json

{
  "images": ["data:image/jpeg;base64,..."],
  "product_desc": "产品描述",
  "product_name": "产品名称",
  "video_length": 10,
  "video_resolution": "720P",
  "video_aspect_ratio": "9:16"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "workflow-xxx",
    "status": "completed",
    "firstVideoUrl": "https://xxx.mp4",
    "videoUrls": ["https://xxx.mp4"]
  }
}
```

---

## 常见问题

### 1. 小程序无法请求接口？

检查以下配置：
- `project.config.json` 中 `urlCheck` 是否为 `false`
- 是否通过后端代理（`/api/coze/workflow`）而非直接请求

### 2. H5 跨域问题？

确保：
- 开发环境使用 Vite 代理
- 生产环境后端配置 CORS

### 3. 图片转 Base64 失败？

- H5：确保图片 URL 可访问
- 小程序：确保使用 `Taro.getFileSystemManager()`

---

## 部署指南

### 生产环境部署

1. **后端部署**
   ```bash
   cd server
   pnpm build
   pnpm start:prod
   ```

2. **前端构建**
   ```bash
   pnpm build:web     # H5
   pnpm build:weapp   # 小程序
   ```

3. **小程序上传**
   - 在微信开发者工具中上传代码
   - 或使用 CI 工具：`pnpm preview:weapp`

### 环境变量

创建 `.env.local`：

```env
# 项目域名（生产环境）
PROJECT_DOMAIN=https://your-domain.com

# 微信小程序
TARO_APP_WEAPP_APPID=your-app-id

# 其他配置
...
```

---

## 更新日志

### v1.0.0
- ✅ 完成基础架构搭建
- ✅ 实现视频生成核心功能
- ✅ 支持 H5 和小程序双端
- ✅ 配置后端代理解决网络限制

---

## 许可证

MIT License
