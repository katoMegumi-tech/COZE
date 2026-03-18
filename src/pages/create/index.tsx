import { View, Text, Input, Textarea, Image as TaroImage } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import {
  Upload,
  Camera,
  Image,
  Sparkles,
  ArrowLeft,
} from 'lucide-react-taro'

type CreationType = 'custom' | 'shop' | 'product' | 'batch' | 'tvc' | 'draft' | 'script'
type Mode = 'simple' | 'creative'

interface FormData {
  // 店铺创作
  shopName?: string
  shopAddress?: string
  businessScope?: string
  generationType?: 'shop_promotion' | 'model_promotion'
  // 产品创作 & 自定义
  prompt?: string
  // 通用参数
  image?: string
  generationCount: number
  channel: string
  videoLength: number
  resolution: string
  videoFormat: 'vertical' | 'horizontal'
  subtitleOption: 'hide' | 'show'
}

const CreatePage: FC = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<CreationType>('custom')
  const [mode, setMode] = useState<Mode>('simple')
  const [formData, setFormData] = useState<FormData>({
    generationCount: 1,
    channel: 'VED3.1',
    videoLength: 8,
    resolution: '720P',
    videoFormat: 'vertical',
    subtitleOption: 'hide',
  })
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const type = router.params.type as CreationType
    if (type) {
      setActiveTab(type)
    }
  }, [router.params])

  const handleBack = () => {
    Taro.navigateBack()
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

    setIsGenerating(true)
    try {
      // TODO: 调用后端视频生成接口
      await new Promise(resolve => setTimeout(resolve, 2000))
      Taro.showToast({ title: '视频生成成功', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOptimizePrompt = async () => {
    // TODO: 调用AI润色接口
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
      <View className="flex flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <View className="flex flex-row items-center" onClick={handleBack}>
          <ArrowLeft size={20} color="#ffffff" />
          <Text className="text-white text-base ml-2">返回</Text>
        </View>
      </View>

      {/* 标签切换栏 */}
      <View className="flex flex-row gap-2 px-4 py-3">
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={`rounded-full px-4 py-2 ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                : 'bg-gray-800 border border-purple-500'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className="text-white text-sm">{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className="px-4 pb-24">
        {/* 图片上传区 */}
        <View className="mb-4">
          <View className="flex flex-row items-center justify-between mb-2">
            <Text className="text-gray-400 text-xs">参考图片/图片中不得有任何人物</Text>
          </View>
          <View className="bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center">
            {formData.image ? (
              <View className="w-full aspect-video relative rounded-lg overflow-hidden">
                <TaroImage
                  src={formData.image}
                  mode="aspectFill"
                  className="w-full h-full"
                />
                <View
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
                  onClick={() => setFormData({ ...formData, image: undefined })}
                >
                  <Text className="text-white text-xs">更换</Text>
                </View>
              </View>
            ) : (
              <>
                <Upload size={40} color="#6B7280" />
                <Text className="text-gray-400 text-sm mt-2 mb-4">
                  点击上传{activeTab === 'shop' ? '店铺门头/店内照' : activeTab === 'product' ? '产品图片' : '图片'}
                </Text>
                <View className="w-full flex flex-row items-center justify-center gap-4">
                  <View
                    className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2"
                    onClick={handleChooseImage}
                  >
                    <Image size={16} color="#ffffff" />
                    <Text className="text-white text-xs">素材库</Text>
                  </View>
                  <View className="w-px h-6 bg-gray-700" />
                  <View
                    className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2"
                    onClick={handleChooseImage}
                  >
                    <Camera size={16} color="#ffffff" />
                    <Text className="text-white text-xs">直接拍</Text>
                  </View>
                </View>
              </>
            )}
          </View>
          <Text className="text-gray-500 text-xs mt-2">
            玩法解密: 上传产品多角度拼图,生成视频效果更佳
          </Text>
        </View>

        {/* 模式切换 */}
        <View className="flex flex-row gap-2 mb-4">
          <View
            className={`rounded-full px-4 py-2 ${
              mode === 'simple'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                : 'bg-gray-800'
            }`}
            onClick={() => setMode('simple')}
          >
            <Text className="text-white text-sm">小白模式</Text>
          </View>
          <View
            className={`rounded-full px-4 py-2 ${
              mode === 'creative'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                : 'bg-gray-800'
            }`}
            onClick={() => setMode('creative')}
          >
            <Text className="text-white text-sm">创意模式</Text>
          </View>
        </View>

        {/* 店铺创作表单 */}
        {activeTab === 'shop' && (
          <View className="mb-4">
            <Text className="text-white text-sm font-medium mb-2">生成类型</Text>
            <View className="flex flex-row gap-2 mb-4">
              <View
                className={`rounded-lg px-4 py-2 ${
                  formData.generationType === 'shop_promotion'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-800'
                }`}
                onClick={() =>
                  setFormData({ ...formData, generationType: 'shop_promotion' })
                }
              >
                <Text className="text-white text-sm">店铺宣传</Text>
              </View>
              <View
                className={`rounded-lg px-4 py-2 ${
                  formData.generationType === 'model_promotion'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-800'
                }`}
                onClick={() =>
                  setFormData({ ...formData, generationType: 'model_promotion' })
                }
              >
                <Text className="text-white text-sm">模特推店</Text>
              </View>
            </View>

            <Text className="text-white text-sm font-medium mb-2">店铺名称</Text>
            <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4">
              <Input
                className="w-full bg-transparent text-white placeholder-gray-400 text-sm"
                placeholder="请输入店铺名称"
                value={formData.shopName}
                onInput={(e) =>
                  setFormData({ ...formData, shopName: e.detail.value })
                }
              />
            </View>

            <Text className="text-white text-sm font-medium mb-2">店铺地址</Text>
            <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4">
              <Input
                className="w-full bg-transparent text-white placeholder-gray-400 text-sm"
                placeholder="输入你店开在那如某某路多少号等"
                value={formData.shopAddress}
                onInput={(e) =>
                  setFormData({ ...formData, shopAddress: e.detail.value })
                }
              />
            </View>

            <Text className="text-white text-sm font-medium mb-2">主营业务</Text>
            <View className="bg-gray-800 rounded-lg px-4 py-3">
              <Input
                className="w-full bg-transparent text-white placeholder-gray-400 text-sm"
                placeholder="输入你主营业务或产品"
                value={formData.businessScope}
                onInput={(e) =>
                  setFormData({ ...formData, businessScope: e.detail.value })
                }
              />
            </View>
          </View>
        )}

        {/* 产品创作 & 自定义表单 */}
        {(activeTab === 'product' || activeTab === 'custom') && (
          <View className="mb-4">
            <Text className="text-white text-sm font-medium mb-2">描述提示词</Text>
            <View className="bg-gray-800 rounded-xl p-4 mb-2">
              <Textarea
                style={{
                  width: '100%',
                  minHeight: '100px',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                }}
                className="text-sm"
                placeholder="请输入描述提示词"
                maxlength={2000}
                value={formData.prompt}
                onInput={(e) =>
                  setFormData({ ...formData, prompt: e.detail.value })
                }
              />
              <View className="flex flex-row items-center justify-between mt-2">
                <Text className="text-gray-500 text-xs">
                  {formData.prompt?.length || 0}/2000
                </Text>
                <View className="flex flex-row gap-2">
                  <View
                    className="flex flex-row items-center gap-1 bg-gray-700 rounded-lg px-3 py-1"
                    onClick={handleOptimizePrompt}
                  >
                    <Sparkles size={12} color="#EC4899" />
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
        )}

        {/* 视频参数设置 */}
        <View className="mb-4">
          <Text className="text-white text-sm font-medium mb-2">生成数量</Text>
          <View className="flex flex-row gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((count) => (
              <View
                key={count}
                className={`rounded-lg px-4 py-2 ${
                  formData.generationCount === count
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-800'
                }`}
                onClick={() =>
                  setFormData({ ...formData, generationCount: count })
                }
              >
                <Text className="text-white text-sm">{count}</Text>
              </View>
            ))}
          </View>

          <Text className="text-white text-sm font-medium mb-2">选择渠道</Text>
          <View className="flex flex-row gap-2 mb-4">
            <View className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-4 py-2">
              <Text className="text-white text-sm">VED3.1</Text>
            </View>
          </View>

          <Text className="text-white text-sm font-medium mb-2">视频长度</Text>
          <View className="flex flex-row gap-2 mb-4">
            {[5, 8, 10, 12].map((length) => (
              <View
                key={length}
                className={`rounded-lg px-4 py-2 ${
                  formData.videoLength === length
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-800'
                }`}
                onClick={() =>
                  setFormData({ ...formData, videoLength: length })
                }
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
                className={`rounded-lg px-4 py-2 ${
                  formData.resolution === res
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-800'
                }`}
                onClick={() => setFormData({ ...formData, resolution: res })}
              >
                <Text className="text-white text-sm">{res}</Text>
              </View>
            ))}
          </View>

          <Text className="text-white text-sm font-medium mb-2">视频形式</Text>
          <View className="flex flex-row gap-2 mb-4">
            <View
              className={`rounded-lg px-4 py-2 ${
                formData.videoFormat === 'vertical'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-gray-800'
              }`}
              onClick={() =>
                setFormData({ ...formData, videoFormat: 'vertical' })
              }
            >
              <Text className="text-white text-sm">竖屏</Text>
            </View>
            <View
              className={`rounded-lg px-4 py-2 ${
                formData.videoFormat === 'horizontal'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-gray-800'
              }`}
              onClick={() =>
                setFormData({ ...formData, videoFormat: 'horizontal' })
              }
            >
              <Text className="text-white text-sm">横屏</Text>
            </View>
          </View>

          <Text className="text-white text-sm font-medium mb-2">屏蔽字幕</Text>
          <View className="flex flex-row gap-2">
            <View
              className={`rounded-lg px-4 py-2 ${
                formData.subtitleOption === 'hide'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-gray-800'
              }`}
              onClick={() => setFormData({ ...formData, subtitleOption: 'hide' })}
            >
              <Text className="text-white text-sm">屏蔽</Text>
            </View>
            <View
              className={`rounded-lg px-4 py-2 ${
                formData.subtitleOption === 'show'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-gray-800'
              }`}
              onClick={() => setFormData({ ...formData, subtitleOption: 'show' })}
            >
              <Text className="text-white text-sm">不屏蔽</Text>
            </View>
          </View>
        </View>

        <Text className="text-gray-500 text-xs mb-2">
          内容涉及AI人工智能
        </Text>
      </View>

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
          className={`bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl py-4 flex items-center justify-center ${
            isGenerating ? 'opacity-50' : ''
          }`}
          onClick={isGenerating ? undefined : handleGenerate}
        >
          <Text className="text-white font-medium text-base">
            {isGenerating ? '生成中...' : '立即生成视频（50点）'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default CreatePage
