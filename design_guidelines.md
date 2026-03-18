# AI视频生成器 - 设计指南

## 1. 品牌定位

**应用定位**：面向C端用户（商家、创作者）的AI视频生成工具
**设计风格**：科技感、创意感、专业感
**目标用户**：商家、创作者、营销人员
**核心价值**：简单图文输入，自动生成营销或创意短视频

---

## 2. 配色方案

### 主色调
- **紫粉渐变**：`from-purple-500 to-pink-500` / `bg-gradient-to-r from-purple-600 to-pink-600`
  - 用于：核心按钮、选中状态、强调元素
  - Tailwind 类名：`bg-gradient-to-r from-purple-600 to-pink-600`

### 辅助色
- **黄色**：`text-yellow-400`
  - 用于：宣传语、重点文字
- **白色**：`text-white`
  - 用于：按钮文字、功能入口文字

### 背景色
- **深黑色**：`bg-black` / `bg-gray-900`
  - 用于：页面主背景
- **深灰色**：`bg-gray-800` / `bg-gray-700`
  - 用于：输入框背景、未选中按钮

### 语义色
- **成功**：`text-green-500`
- **错误**：`text-red-500`
- **警告**：`text-orange-500`

---

## 3. 字体规范

### 标题层级
- **H1 - 主标题**：`text-2xl font-bold text-white`
- **H2 - 副标题**：`text-xl font-semibold text-white`
- **H3 - 小标题**：`text-lg font-medium text-white`
- **Body - 正文**：`text-sm text-gray-300`
- **Caption - 说明文字**：`text-xs text-gray-400`

### 特殊文字
- **宣传语**：`text-xl font-bold text-yellow-400`
- **功能入口文字**：`text-xs text-white`

---

## 4. 间距系统

### 页面边距
- 水平边距：`px-4` (16px)
- 垂直边距：`py-4` (16px)

### 组件间距
- 卡片间距：`gap-4` (16px)
- 元素间距：`gap-2` (8px)
- 紧凑间距：`gap-1` (4px)

### 卡片内边距
- 标准内边距：`p-4` (16px)
- 紧凑内边距：`p-3` (12px)
- 宽松内边距：`p-6` (24px)

---

## 5. 组件规范

### 按钮样式

#### 主按钮（紫粉渐变）
```tsx
import { Button } from '@/components/ui/button'

<Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg px-6 py-3 font-medium">
  立即生成视频（50点）
</Button>
```

#### 次按钮（深灰色）
```tsx
<Button className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm">
  取消
</Button>
```

#### 小按钮（标签样式）
```tsx
<Button className="bg-gray-800 text-white rounded-full px-3 py-1 text-xs">
  小白模式
</Button>
```

### 卡片/容器

#### 标准卡片
```tsx
<View className="bg-gray-900 rounded-xl p-4">
  {/* 卡片内容 */}
</View>
```

#### 输入框容器
```tsx
<View className="bg-gray-800 rounded-lg px-4 py-3">
  <Input className="w-full bg-transparent text-white placeholder-gray-400" />
</View>
```

### 输入框

```tsx
<View className="bg-gray-800 rounded-lg px-4 py-3 mb-4">
  <Input 
    className="w-full bg-transparent text-white placeholder-gray-400"
    placeholder="请输入店铺名称"
  />
</View>
```

### 标签切换

```tsx
<View className="flex flex-row gap-2 mb-4">
  <View className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-4 py-2">
    <Text className="text-white text-sm">店铺创作</Text>
  </View>
  <View className="bg-gray-800 border border-purple-500 rounded-full px-4 py-2">
    <Text className="text-white text-sm">产品创作</Text>
  </View>
</View>
```

### 空状态

```tsx
<View className="flex flex-col items-center justify-center py-12">
  <Text className="text-gray-400 text-sm mb-2">暂无数据</Text>
  <Text className="text-gray-500 text-xs">点击上方按钮开始创作</Text>
</View>
```

---

## 6. 导航结构

### TabBar 配置

**底部导航栏（5个入口）**：
1. 首页 - `pages/index/index`
2. 素材库 - `pages/material/index`
3. 创建角色 - `pages/character/index`
4. 作品 - `pages/works/index`
5. 我的 - `pages/profile/index`

**TabBar 颜色配置**：
```typescript
tabBar: {
  color: '#9CA3AF',           // 未选中文字颜色（灰色）
  selectedColor: '#EC4899',   // 选中文字颜色（粉色）
  backgroundColor: '#000000', // 背景色（黑色）
  borderStyle: 'black'
}
```

### 页面跳转规范
- TabBar 页面跳转：使用 `Taro.switchTab()`
- 普通页面跳转：使用 `Taro.navigateTo()`
- 返回上一页：使用 `Taro.navigateBack()`

---

## 7. 小程序约束

### 包体积限制
- 主包体积：≤ 2MB
- 总包体积：≤ 20MB
- 分包策略：将创作页面放入子包

### 图片策略
- 使用 CDN 加载图片资源
- 图片懒加载：`lazyLoad={true}`
- 图片压缩：上传前进行压缩

### 性能优化
- 列表虚拟化：使用 `VirtualList`
- 按需加载：使用分包加载
- 避免深层嵌套：保持组件层级扁平

---

## 8. 页面结构

### 首页结构
```
┌─────────────────────────────────┐
│     状态栏 + 小程序标题栏         │
├─────────────────────────────────┤
│                                 │
│     核心宣传区（AI人物背景）      │
│     "谁用谁火" + "一键创作"       │
│                                 │
├─────────────────────────────────┤
│   功能入口图标栏（2行3列）        │
│   店铺创作 | 产品创作 | 批量创作   │
│   TVC广告 | 创意手稿 | AI脚本     │
├─────────────────────────────────┤
│   创意模版区（横向滚动卡片）       │
│   模版卡片 | 模版卡片 | ...       │
├─────────────────────────────────┤
│   底部导航栏（5个入口）           │
│   首页 | 素材库 | 角色 | 作品 | 我的│
└─────────────────────────────────┘
```

### 创作页结构
```
┌─────────────────────────────────┐
│   < 返回    标签切换栏    操作    │
│   自定义 | 店铺创作 | 产品创作     │
├─────────────────────────────────┤
│   图片上传区                     │
│   [上传] 或 [素材库] [直接拍]     │
├─────────────────────────────────┤
│   模式切换：小白模式 | 创意模式   │
├─────────────────────────────────┤
│   创作设置区                     │
│   - 生成类型选择                 │
│   - 店铺信息输入                 │
│   - 描述提示词输入               │
├─────────────────────────────────┤
│   视频参数设置                   │
│   - 生成数量、渠道、时长         │
│   - 清晰度、形式、字幕           │
├─────────────────────────────────┤
│   [立即生成视频（50点）]          │
└─────────────────────────────────┘
```

---

## 9. 交互规范

### 点击反馈
- 按钮点击：使用 `active:opacity-80` 提供视觉反馈
- 列表项点击：使用 `hover:bg-gray-800` 提供高亮反馈

### 加载状态
- 按钮加载：显示 loading 动画 + 禁用按钮
- 页面加载：显示骨架屏或 loading 提示

### 错误处理
- 表单错误：在输入框下方显示红色错误提示
- 网络错误：使用 Toast 提示用户

### 成功反馈
- 操作成功：使用 Toast 提示
- 生成完成：自动跳转到结果页面

---

## 10. 图标规范

### 图标库
使用 `lucide-react-taro` 图标库

### 常用图标
- 首页：`House`
- 素材库：`Image`
- 创建角色：`UserPlus`
- 作品：`Video`
- 我的：`User`
- 店铺：`Store`
- 产品：`Package`
- 上传：`Upload`
- 相机：`Camera`
- AI：`Sparkles`

### TabBar 图标生成
```bash
npx taro-lucide-tabbar House Image UserPlus Video User -c "#9CA3AF" -a "#EC4899" -o ./src/assets/tabbar -s 81
```
