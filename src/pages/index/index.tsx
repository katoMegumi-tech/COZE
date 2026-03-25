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
  Play,
} from 'lucide-react-taro'

interface FeatureItem {
  icon: FC<any>
  label: string
  type: 'shop' | 'product' | 'batch' | 'tvc' | 'draft' | 'script'
}

const features: FeatureItem[] = [
  { icon: Store, label: '文案创作', type: 'shop' },
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
    Taro.navigateTo({ url: '/pages/create/index?tab=product' })
  }

  const handleFeatureClick = (type: string) => {
    if (type === 'shop') {
      Taro.navigateTo({ url: '/pages/shop/index' })
    } else if (type === 'product') {
      Taro.navigateTo({ url: '/pages/product/index' })
    } else if (type === 'batch') {
      Taro.navigateTo({ url: '/pages/product/index' })
    } else {
      Taro.showToast({ title: '功能开发中，敬请期待', icon: 'none' })
    }
  }

  const handleTemplateClick = () => {
    Taro.navigateTo({ url: '/pages/create/index?tab=product' })
  }

  return (
    <View className="min-h-screen bg-black">
      {/* 宣传区 - 模拟AI人物背景 */}
      <View 
        className="relative overflow-hidden"
        style={{ height: '380px' }}
      >
        {/* 渐变背景 */}
        <View 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0c29 100%)',
          }}
        />
        
        {/* 装饰性渐变圆 */}
        <View 
          className="absolute"
          style={{
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
            top: '-50px',
            right: '-50px',
          }}
        />
        <View 
          className="absolute"
          style={{
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
            bottom: '20px',
            left: '-80px',
          }}
        />

        {/* 内容 */}
        <View className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <Text 
            className="font-bold mb-2"
            style={{ 
              fontSize: '32px',
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            谁用谁火
          </Text>
          <Text className="text-white text-xl font-semibold mb-3">
            AI视频自动生成器
          </Text>
          <Text className="text-gray-300 text-sm mb-2">
            一张图片+文案
          </Text>
          <Text className="text-gray-300 text-sm mb-6">
            一键创作爆款视频
          </Text>

          {/* 一键创作按钮 */}
          <View
            className="flex flex-row items-center justify-center rounded-xl active:opacity-80"
            style={{
              background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
              width: '160px',
              height: '44px',
            }}
            onClick={handleCreateClick}
          >
            <Sparkles size={18} color="#ffffff" />
            <Text className="text-white font-medium text-base ml-2">一键创作</Text>
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
      <View className="px-4 pb-24">
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold">创意模版</Text>
          <Text className="text-gray-400 text-sm">查看更多</Text>
        </View>

        <ScrollView
          scrollX
          className="w-full"
          style={{ whiteSpace: 'nowrap' }}
        >
          {templates.map((template) => (
            <View
              key={template.id}
              className="inline-block mr-4 w-40 bg-gray-900 rounded-xl overflow-hidden active:opacity-80"
              onClick={() => handleTemplateClick()}
            >
              <View 
                className="aspect-[3/4] bg-gray-800 flex items-center justify-center"
                style={{ position: 'relative' }}
              >
                <Video size={40} color="#6B7280" />
                <View 
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={16} color="#ffffff" />
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
