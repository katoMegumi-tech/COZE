import { View, Text, Image as TaroImage } from '@tarojs/components'
import Taro, { useReachBottom } from '@tarojs/taro'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { Store, Package, Copy, Sparkles, Users, Play, Search } from 'lucide-react-taro'

interface FeatureItem {
  icon: FC<any>
  label: string
  type: 'shop' | 'product' | 'batch' | 'script'
}

const features: FeatureItem[] = [
  { icon: Store, label: '文案创作', type: 'shop' },
  { icon: Package, label: '产品创作', type: 'product' },
  { icon: Copy, label: '批量创作', type: 'batch' },
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

interface WorkItem {
  id: string
  title: string
  viewCount: number
  thumbnail: string
}

const WORKS_PAGE_SIZE = 6
const WORKS_MAX_COUNT = 24

const createWorkItems = (startIndex: number, count: number): WorkItem[] => {
  return Array.from({ length: count }).map((_, idx) => {
    const seed = startIndex + idx
    const template = templates[seed % templates.length]
    return {
      id: `work_${seed}`,
      title: template.title,
      viewCount: template.usageCount + seed * 7,
      thumbnail: `https://picsum.photos/300/400?random=${seed}`,
    }
  })
}

const IndexPage: FC = () => {
  const [works, setWorks] = useState<WorkItem[]>(() =>
    createWorkItems(1, WORKS_PAGE_SIZE),
  )
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const handleSearchClick = () => {
    Taro.showToast({ title: '搜索功能开发中', icon: 'none' })
  }

  const handleWorkClick = () => {
    Taro.navigateTo({ url: '/pages/works/index' })
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

  const loadMoreWorks = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    if (works.length >= WORKS_MAX_COUNT) {
      setHasMore(false)
      return
    }

    setIsLoadingMore(true)
    const nextCount = Math.min(WORKS_PAGE_SIZE, WORKS_MAX_COUNT - works.length)
    const nextStartIndex = works.length + 1
    setWorks((prev) => [...prev, ...createWorkItems(nextStartIndex, nextCount)])
    if (works.length + nextCount >= WORKS_MAX_COUNT) setHasMore(false)
    setIsLoadingMore(false)
  }, [hasMore, isLoadingMore, works.length])

  useReachBottom(() => {
    loadMoreWorks()
  })

  return (
    <View className="min-h-screen bg-[color:var(--background)] overflow-hidden">
      <View className="px-4 pt-4 pb-3 flex flex-row items-center">
        <Text className="text-white text-lg font-semibold">AI电商</Text>
        <View
          className="ml-3 flex-1 bg-gray-900 rounded-full px-4 py-2 flex flex-row items-center active:opacity-80"
          onClick={handleSearchClick}
        >
          <Search size={14} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs ml-2">搜索商品/店铺/文案</Text>
        </View>
      </View>

      <View className="px-4">
        <View className="relative overflow-hidden rounded-2xl" style={{ height: '200px' }}>
          <View
            className="absolute inset-0"
            style={{
              background: 'var(--gradient-surface)',
            }}
          />
          <View
            className="absolute"
            style={{
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, var(--glow-2) 0%, transparent 70%)',
              top: '-80px',
              right: '-80px',
            }}
          />
          <View
            className="absolute"
            style={{
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, var(--glow-1) 0%, transparent 70%)',
              bottom: '-90px',
              left: '-90px',
            }}
          />

          <View className="relative z-10 h-full px-5 py-5 flex flex-col justify-between">
            <View>
              <Text className="text-white text-xl font-semibold">爆款内容一站生成</Text>
              <Text className="text-gray-300 text-xs mt-2">
                文案 · 商品视频 · 详情页素材
              </Text>
            </View>
            <View className="flex flex-row gap-3">
              <View
                className="flex-1 rounded-xl py-3 flex flex-row items-center justify-center active:opacity-80"
                style={{ background: 'rgba(255, 255, 255, 0.12)' }}
                onClick={() => handleFeatureClick('shop')}
              >
                <Text className="text-white text-sm font-medium">文案创作</Text>
              </View>
              <View
                className="flex-1 rounded-xl py-3 flex flex-row items-center justify-center active:opacity-80"
                style={{
                  background: 'var(--gradient-primary)',
                  boxShadow: '0 0 18px rgba(10, 191, 243, 0.35)',
                }}
                onClick={() => handleFeatureClick('product')}
              >
                <Sparkles size={16} color="#ffffff" />
                <Text className="text-white text-sm font-medium ml-2">产品创作</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="px-4 py-5">
        <View className="bg-gray-900 rounded-2xl p-4">
          <View className="flex flex-row items-center justify-between mb-4">
            <Text className="text-white text-base font-semibold">常用入口</Text>
            <Text className="text-gray-400 text-xs">快速开始</Text>
          </View>
          <View className="grid grid-cols-4 gap-3">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <View
                  key={index}
                  className="flex flex-col items-center active:opacity-80"
                  onClick={() => handleFeatureClick(feature.type)}
                >
                  <View className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
                    <IconComponent size={20} color="#ffffff" />
                  </View>
                  <Text className="text-gray-200 text-xs mt-2">{feature.label}</Text>
                </View>
              )
            })}
          </View>
        </View>
      </View>

      <View className="px-4 pb-24">
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold">作品展示</Text>
          <Text className="text-gray-400 text-sm" onClick={handleWorkClick}>
            查看更多
          </Text>
        </View>

        <View className="grid grid-cols-2 gap-3">
          {works.map((work) => (
            <View
              key={work.id}
              className="bg-gray-900 rounded-xl overflow-hidden active:opacity-80"
              onClick={handleWorkClick}
            >
              <View
                className="aspect-[3/4] bg-gray-800 flex items-center justify-center"
                style={{ position: 'relative' }}
              >
                <TaroImage src={work.thumbnail} mode="aspectFill" className="w-full h-full" />
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
                <Text className="text-white text-sm font-medium mb-1">{work.title}</Text>
                <View className="flex flex-row items-center gap-1">
                  <Users size={12} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs">{work.viewCount}次浏览</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className="py-5 flex flex-row items-center justify-center">
          <Text className="text-gray-500 text-xs">
            {isLoadingMore ? '加载中...' : hasMore ? '上拉加载更多' : '没有更多了'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default IndexPage
