import { View, Text, Textarea, ScrollView, Image as TaroImage } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import {
  Upload,
  Camera,
  Image,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react-taro'

type CreationTab = 'custom' | 'shop' | 'product'
type Mode = 'simple' | 'creative'

const ProductCreatePage: FC = () => {
  const activeTab: CreationTab = 'product'
  const [mode, setMode] = useState<Mode>('creative')
  const [formData, setFormData] = useState({
    image: '',
    prompt: '',
    generationCount: 1,
    channel: 'VED3.1',
    videoLength: 8,
    resolution: '720P',
    videoFormat: 'vertical' as 'vertical' | 'horizontal',
    subtitleOption: 'hide' as 'hide' | 'show',
  })

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleTabChange = (tab: CreationTab) => {
    if (tab === 'custom') {
      Taro.redirectTo({ url: '/pages/custom/index' })
    } else if (tab === 'shop') {
      Taro.redirectTo({ url: '/pages/shop/index' })
    }
  }

  const handleChooseImage = async () => {
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      setFormData({ ...formData, image: result.tempFilePaths[0] })
    } catch (error) {
      console.error('选择图片失败', error)
    }
  }

  const handleGenerate = async () => {
    if (!formData.image) {
      Taro.showToast({ title: '请先上传图片', icon: 'none' })
      return
    }
    Taro.showToast({ title: '视频生成中...', icon: 'loading' })
  }

  const handleOptimizePrompt = () => {
    Taro.showToast({ title: 'AI润色功能开发中', icon: 'none' })
  }

  const tabs = [
    { key: 'custom' as const, label: '自定义' },
    { key: 'shop' as const, label: '店铺创作' },
    { key: 'product' as const, label: '产品创作' },
  ]

  return (
    <View className="min-h-screen bg-black">
      {/* 顶部导航 */}
      <View className="flex flex-row items-center px-4 py-3 border-b border-gray-800">
        <View className="flex flex-row items-center" onClick={handleBack}>
          <ArrowLeft size={20} color="#ffffff" />
          <Text className="text-white text-base ml-1">产品创作</Text>
        </View>
      </View>

      {/* 标签切换栏 */}
      <View className="flex flex-row px-4 py-3 gap-2">
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className="rounded-full px-4 py-2"
            style={{
              background: activeTab === tab.key
                ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                : '#1f2937',
              borderWidth: activeTab === tab.key ? 0 : 1,
              borderColor: '#a855f7',
            }}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text className="text-white text-sm">{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY className="px-4" style={{ height: 'calc(100vh - 180px)' }}>
        {/* 图片上传区 */}
        <View className="mb-4">
          <Text className="text-gray-400 text-xs mb-2">参考图片/图片中不得有任何人物</Text>
          <View className="bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center">
            {formData.image ? (
              <View className="w-full aspect-video relative rounded-lg overflow-hidden">
                <TaroImage src={formData.image} mode="aspectFill" className="w-full h-full" />
                <View
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full px-3 py-1"
                  onClick={() => setFormData({ ...formData, image: '' })}
                >
                  <Text className="text-white text-xs">更换</Text>
                </View>
              </View>
            ) : (
              <>
                <View className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                  <Upload size={24} color="#9CA3AF" />
                </View>
                <Text className="text-gray-400 text-sm mb-3">点击上传产品图片</Text>
                <View className="w-full flex flex-row items-center justify-center">
                  <Text className="text-gray-500 text-xs">—— 或者 ——</Text>
                </View>
                <View className="w-full flex flex-row items-center justify-center gap-4 mt-3">
                  <View
                    className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2"
                    onClick={handleChooseImage}
                  >
                    <Image size={14} color="#ffffff" />
                    <Text className="text-white text-xs">素材库</Text>
                  </View>
                  <View
                    className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2"
                    onClick={handleChooseImage}
                  >
                    <Camera size={14} color="#ffffff" />
                    <Text className="text-white text-xs">直接拍</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* 模式切换 */}
        <View className="flex flex-row gap-2 mb-4">
          <View
            className="rounded-full px-4 py-2"
            style={{
              background: mode === 'simple'
                ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                : '#1f2937',
            }}
            onClick={() => setMode('simple')}
          >
            <Text className="text-white text-sm">小白模式</Text>
          </View>
          <View
            className="rounded-full px-4 py-2"
            style={{
              background: mode === 'creative'
                ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                : '#1f2937',
            }}
            onClick={() => setMode('creative')}
          >
            <Text className="text-white text-sm">创意模式</Text>
          </View>
        </View>

        {/* 描述提示词 */}
        <View className="mb-4">
          <Text className="text-white text-sm font-medium mb-2">描述提示词</Text>
          <View className="bg-gray-800 rounded-xl p-4 mb-2">
            <Textarea
              style={{
                width: '100%',
                minHeight: '100px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontSize: '14px',
              }}
              placeholder="请输入描述提示词"
              maxlength={2000}
              value={formData.prompt}
              onInput={(e) => setFormData({ ...formData, prompt: e.detail.value })}
            />
            <View className="flex flex-row items-center justify-between mt-2">
              <Text className="text-gray-500 text-xs">{formData.prompt.length}/2000</Text>
              <View className="flex flex-row gap-2">
                <View
                  className="flex flex-row items-center gap-1 bg-gray-700 rounded-lg px-3 py-1"
                  onClick={handleOptimizePrompt}
                >
                  <Sparkles size={12} color="#ec4899" />
                  <Text className="text-pink-400 text-xs">AI润色</Text>
                </View>
                <View
                  className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-3 py-1"
                  onClick={handleOptimizePrompt}
                >
                  <Text className="text-white text-xs">优化提示词</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 广告栏 */}
        <View className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-4 mb-4 flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-3">
            <View className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Text className="text-purple-600 font-bold text-xs">千问</Text>
            </View>
            <View className="flex flex-col">
              <Text className="text-white text-xs font-medium">千问APP</Text>
              <Text className="text-gray-300 text-xs">拍照问答，生活常识科普，一拍全知</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#9CA3AF" />
        </View>

        {/* 视频参数 */}
        <View className="mb-4">
          <Text className="text-white text-sm font-medium mb-2">生成数量</Text>
          <View className="flex flex-row gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((count) => (
              <View
                key={count}
                className="rounded-lg px-4 py-2"
                style={{
                  background: formData.generationCount === count
                    ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                    : '#1f2937',
                }}
                onClick={() => setFormData({ ...formData, generationCount: count })}
              >
                <Text className="text-white text-sm">{count}</Text>
              </View>
            ))}
          </View>

          <Text className="text-white text-sm font-medium mb-2">选择渠道</Text>
          <View className="flex flex-row gap-2 mb-4">
            <View
              className="rounded-lg px-4 py-2"
              style={{ background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' }}
            >
              <Text className="text-white text-sm">VED3.1</Text>
            </View>
          </View>

          <Text className="text-white text-sm font-medium mb-2">视频长度</Text>
          <View className="flex flex-row gap-2 mb-4">
            {[5, 8, 10, 12].map((length) => (
              <View
                key={length}
                className="rounded-lg px-4 py-2"
                style={{
                  background: formData.videoLength === length
                    ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                    : '#1f2937',
                }}
                onClick={() => setFormData({ ...formData, videoLength: length })}
              >
                <Text className="text-white text-sm">{length}s</Text>
              </View>
            ))}
          </View>

          <Text className="text-white text-sm font-medium mb-2">视频清晰度</Text>
          <View className="flex flex-row gap-2 mb-4">
            {['480P', '720P', '1080P'].map((res) => (
              <View
                key={res}
                className="rounded-lg px-4 py-2"
                style={{
                  background: formData.resolution === res
                    ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                    : '#1f2937',
                }}
                onClick={() => setFormData({ ...formData, resolution: res })}
              >
                <Text className="text-white text-sm">{res}</Text>
              </View>
            ))}
          </View>

          <Text className="text-white text-sm font-medium mb-2">视频形式</Text>
          <View className="flex flex-row gap-2 mb-4">
            <View
              className="rounded-lg px-4 py-2"
              style={{
                background: formData.videoFormat === 'vertical'
                  ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                  : '#1f2937',
              }}
              onClick={() => setFormData({ ...formData, videoFormat: 'vertical' })}
            >
              <Text className="text-white text-sm">竖屏</Text>
            </View>
            <View
              className="rounded-lg px-4 py-2"
              style={{
                background: formData.videoFormat === 'horizontal'
                  ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                  : '#1f2937',
              }}
              onClick={() => setFormData({ ...formData, videoFormat: 'horizontal' })}
            >
              <Text className="text-white text-sm">横屏</Text>
            </View>
          </View>

          <Text className="text-white text-sm font-medium mb-2">屏蔽字幕</Text>
          <View className="flex flex-row gap-2">
            <View
              className="rounded-lg px-4 py-2"
              style={{
                background: formData.subtitleOption === 'hide'
                  ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                  : '#1f2937',
              }}
              onClick={() => setFormData({ ...formData, subtitleOption: 'hide' })}
            >
              <Text className="text-white text-sm">屏蔽</Text>
            </View>
            <View
              className="rounded-lg px-4 py-2"
              style={{
                background: formData.subtitleOption === 'show'
                  ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                  : '#1f2937',
              }}
              onClick={() => setFormData({ ...formData, subtitleOption: 'show' })}
            >
              <Text className="text-white text-sm">不屏蔽</Text>
            </View>
          </View>
        </View>

        <Text className="text-gray-500 text-xs mb-2">内容涉及AI人工智能</Text>
      </ScrollView>

      {/* 底部生成按钮 */}
      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          backgroundColor: '#000000',
          borderTop: '1px solid #374151',
        }}
      >
        <View
          className="rounded-xl py-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' }}
          onClick={handleGenerate}
        >
          <Text className="text-white font-medium text-base">立即生成视频（50点）</Text>
        </View>
      </View>
    </View>
  )
}

export default ProductCreatePage
