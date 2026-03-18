import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { FC } from 'react'
import {
  Store,
  Package,
  Copy,
  Tv,
  FileText,
  Sparkles,
  Video,
  Users,
} from 'lucide-react-taro'

interface FeatureItem {
  icon: FC<any>
  label: string
  type: 'shop' | 'product' | 'batch' | 'tvc' | 'draft' | 'script'
}

const features: FeatureItem[] = [
  { icon: Store, label: '店铺创作', type: 'shop' },
  { icon: Package, label: '产品创作', type: 'product' },
  { icon: Copy, label: '批量创作', type: 'batch' },
  { icon: Tv, label: 'TVC广告', type: 'tvc' },
  { icon: FileText, label: '创意手稿', type: 'draft' },
  { icon: Sparkles, label: 'AI脚本', type: 'script' },
]

interface TemplateItem {
  id: string
  title: string
  usageCount: number
  thumbnail: string
}

const templates: TemplateItem[] = [
  {
    id: '1',
    title: '产品展示模版',
    usageCount: 8327,
    thumbnail: 'https://picsum.photos/200/300?random=1',
  },
  {
    id: '2',
    title: '店铺宣传模版',
    usageCount: 3232,
    thumbnail: 'https://picsum.photos/200/300?random=2',
  },
  {
    id: '3',
    title: '节日促销模版',
    usageCount: 5641,
    thumbnail: 'https://picsum.photos/200/300?random=3',
  },
  {
    id: '4',
    title: '新品发布模版',
    usageCount: 2156,
    thumbnail: 'https://picsum.photos/200/300?random=4',
  },
]

const IndexPage: FC = () => {
  const handleCreateClick = () => {
    Taro.navigateTo({ url: '/pages/create/index?type=custom' })
  }

  const handleFeatureClick = (type: string) => {
    Taro.navigateTo({ url: `/pages/create/index?type=${type}` })
  }

  const handleTemplateClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/create/index?templateId=${id}` })
  }

  return (
    <View className="min-h-screen bg-black">
      {/* 宣传区 */}
      <View
        className="relative h-80 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* 背景装饰 */}
        <View
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 20% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)',
          }}
        />

        {/* 内容 */}
        <View className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <Text className="text-yellow-400 text-3xl font-bold mb-2">
            谁用谁火
          </Text>
          <Text className="text-white text-xl font-semibold mb-4">
            AI视频自动生成器
          </Text>
          <Text className="text-gray-200 text-sm mb-6">
            一张图片 + 文案，一键创作爆款视频
          </Text>

          {/* 一键创作按钮 */}
          <View
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl px-8 py-3 flex flex-row items-center gap-2 active:opacity-80"
            onClick={handleCreateClick}
          >
            <Sparkles size={20} color="#ffffff" />
            <Text className="text-white font-medium text-base">一键创作</Text>
          </View>
        </View>
      </View>

      {/* 功能入口 */}
      <View className="px-4 py-6">
        <View className="grid grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <View
                key={index}
                className="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-2 active:opacity-80"
                onClick={() => handleFeatureClick(feature.type)}
              >
                <IconComponent size={24} color="#ffffff" />
                <Text className="text-white text-xs">{feature.label}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* 创意模版 */}
      <View className="px-4 pb-20">
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold">创意模版</Text>
          <Text className="text-gray-400 text-sm">查看更多</Text>
        </View>

        <ScrollView
          scrollX
          className="flex flex-row gap-4"
          style={{ width: '100%' }}
        >
          {templates.map((template) => (
            <View
              key={template.id}
              className="flex-shrink-0 w-40 bg-gray-900 rounded-xl overflow-hidden active:opacity-80"
              onClick={() => handleTemplateClick(template.id)}
            >
              <View className="aspect-[3/4] bg-gray-800">
                <View className="w-full h-full flex items-center justify-center">
                  <Video size={40} color="#6B7280" />
                </View>
              </View>
              <View className="p-3">
                <Text className="text-white text-sm font-medium mb-1">
                  {template.title}
                </Text>
                <View className="flex flex-row items-center gap-1">
                  <Users size={12} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs">
                    {template.usageCount}人使用
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

export default IndexPage
