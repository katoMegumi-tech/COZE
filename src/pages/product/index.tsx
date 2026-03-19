import { View, Text, Input, ScrollView, Image as TaroImage, Textarea } from '@tarojs/components'
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
import { Network } from '@/network'

type CreationTab = 'custom' | 'shop' | 'product'
type Mode = 'simple' | 'creative'
type CreationStyle = 'tech' | 'grounded' | 'luxury' | 'eco'

const ProductCreatePage: FC = () => {
  const activeTab: CreationTab = 'product'
  const [mode, setMode] = useState<Mode>('simple')
  const [formData, setFormData] = useState({
    image: '',
    productName: '',
    backgroundScene: '',
    productFeature: '',
    priceRecommendation: '',
    prompt: '',
    generationType: 'product_promotion' as 'product_promotion' | 'model_promotion',
    creationStyle: 'tech' as CreationStyle,
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

  // 从素材库选择图片
  const handleChooseFromAlbum = async () => {
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
      })
      setFormData({ ...formData, image: result.tempFilePaths[0] })
    } catch (error) {
      console.error('选择图片失败', error)
    }
  }

  // 拍照上传
  const handleTakePhoto = async () => {
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera'],
      })
      setFormData({ ...formData, image: result.tempFilePaths[0] })
    } catch (error) {
      console.error('拍照失败', error)
    }
  }

  // 上传图片到对象存储
  const uploadImage = async (tempFilePath: string): Promise<string | null> => {
    try {
      const res = await Network.uploadFile({
        url: '/api/upload/image',
        filePath: tempFilePath,
        name: 'file',
      })
      console.log('上传结果:', res)
      // res.data 可能是字符串或对象，需要处理
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      console.log('解析后的数据:', data)
      if (data?.code === 200 && data.data?.url) {
        return data.data.url
      }
      return null
    } catch (error) {
      console.error('上传图片失败:', error)
      return null
    }
  }

  // 优化提示词
  const handleOptimizePrompt = async () => {
    if (!formData.prompt) {
      Taro.showToast({ title: '请先输入描述提示词', icon: 'none' })
      return
    }
    Taro.showToast({ title: 'AI优化中...', icon: 'loading' })
    // TODO: 调用后端AI优化接口
    setTimeout(() => {
      Taro.hideToast()
      Taro.showToast({ title: '优化完成', icon: 'success' })
    }, 1500)
  }

  // 生成视频
  const handleGenerate = async () => {
    if (!formData.image) {
      Taro.showToast({ title: '请先上传图片', icon: 'none' })
      return
    }
    
    // 验证必填字段
    if (mode === 'simple') {
      if (!formData.productName) {
        Taro.showToast({ title: '请输入产品名称', icon: 'none' })
        return
      }
    } else {
      if (!formData.prompt) {
        Taro.showToast({ title: '请输入描述提示词', icon: 'none' })
        return
      }
    }

    // 上传图片
    const imageUrl = await uploadImage(formData.image)
    if (!imageUrl) {
      // 上传失败时提供测试模式选项
      Taro.showModal({
        title: '图片上传失败',
        content: '是否使用测试模式直接预览结果页面？',
        success: (res) => {
          if (res.confirm) {
            // 使用测试URL跳转
            Taro.navigateTo({
              url: `/pages/result/index?mode=${mode}&imageUrl=${encodeURIComponent('https://via.placeholder.com/400x300')}&productName=${encodeURIComponent(formData.productName)}&backgroundScene=${encodeURIComponent(formData.backgroundScene)}&productFeature=${encodeURIComponent(formData.productFeature)}&priceRecommendation=${encodeURIComponent(formData.priceRecommendation)}&prompt=${encodeURIComponent(formData.prompt)}&generationType=${formData.generationType}&creationStyle=${formData.creationStyle}`
            })
          }
        }
      })
      return
    }

    // 跳转到结果页面
    Taro.navigateTo({
      url: `/pages/result/index?mode=${mode}&imageUrl=${encodeURIComponent(imageUrl)}&productName=${encodeURIComponent(formData.productName)}&backgroundScene=${encodeURIComponent(formData.backgroundScene)}&productFeature=${encodeURIComponent(formData.productFeature)}&priceRecommendation=${encodeURIComponent(formData.priceRecommendation)}&prompt=${encodeURIComponent(formData.prompt)}&generationType=${formData.generationType}&creationStyle=${formData.creationStyle}`
    })
  }

  const tabs = [
    { key: 'custom' as const, label: '自定义' },
    { key: 'shop' as const, label: '店铺创作' },
    { key: 'product' as const, label: '产品创作' },
  ]

  const creationStyles = [
    { key: 'tech' as const, label: '科技感' },
    { key: 'grounded' as const, label: '接地气' },
    { key: 'luxury' as const, label: '高端大气' },
    { key: 'eco' as const, label: '绿色环保' },
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

      <ScrollView scrollY className="px-4" style={{ height: 'calc(100vh - 240px)' }}>
        {/* 图片上传区 */}
        <View className="mb-4">
          <Text className="text-gray-400 text-xs mb-2">参考图片/图片中不得有任何人物</Text>
          <View 
            className="bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center"
            onClick={!formData.image ? handleChooseFromAlbum : undefined}
          >
            {formData.image ? (
              <View className="w-full aspect-video relative rounded-lg overflow-hidden">
                <TaroImage src={formData.image} mode="aspectFill" className="w-full h-full" />
                <View
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full px-3 py-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFormData({ ...formData, image: '' })
                  }}
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
                    onClick={(e) => {
                      e.stopPropagation()
                      handleChooseFromAlbum()
                    }}
                  >
                    <Image size={14} color="#ffffff" />
                    <Text className="text-white text-xs">素材库</Text>
                  </View>
                  <View
                    className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTakePhoto()
                    }}
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

        {/* 小白模式表单 */}
        {mode === 'simple' && (
          <>
            {/* 生成类型 */}
            <View className="mb-4">
              <Text className="text-white text-sm font-medium mb-2">生成类型</Text>
              <View className="flex flex-row gap-2">
                <View
                  className="rounded-lg px-4 py-2"
                  style={{
                    background: formData.generationType === 'product_promotion'
                      ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                      : '#1f2937',
                  }}
                  onClick={() => setFormData({ ...formData, generationType: 'product_promotion' })}
                >
                  <Text className="text-white text-sm">产品宣传</Text>
                </View>
                <View
                  className="rounded-lg px-4 py-2"
                  style={{
                    background: formData.generationType === 'model_promotion'
                      ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                      : '#1f2937',
                  }}
                  onClick={() => setFormData({ ...formData, generationType: 'model_promotion' })}
                >
                  <Text className="text-white text-sm">模特推品</Text>
                </View>
              </View>
            </View>

            {/* 产品名称 */}
            <View className="mb-4">
              <Text className="text-white text-sm font-medium mb-2">产品名称</Text>
              <View className="bg-gray-800 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-white placeholder-gray-400 text-sm"
                  placeholder="请输入产品名称"
                  value={formData.productName}
                  onInput={(e) => setFormData({ ...formData, productName: e.detail.value })}
                />
              </View>
            </View>

            {/* 背景场景 */}
            <View className="mb-4">
              <Text className="text-white text-sm font-medium mb-2">背景场景</Text>
              <View className="bg-gray-800 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-white placeholder-gray-400 text-sm"
                  placeholder="请输入背景场景描述"
                  value={formData.backgroundScene}
                  onInput={(e) => setFormData({ ...formData, backgroundScene: e.detail.value })}
                />
              </View>
            </View>

            {/* 产品特色 */}
            <View className="mb-4">
              <Text className="text-white text-sm font-medium mb-2">产品特色</Text>
              <View className="bg-gray-800 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-white placeholder-gray-400 text-sm"
                  placeholder="请输入产品特色"
                  value={formData.productFeature}
                  onInput={(e) => setFormData({ ...formData, productFeature: e.detail.value })}
                />
              </View>
            </View>

            {/* 创作风格 */}
            <View className="mb-4">
              <Text className="text-white text-sm font-medium mb-2">创作风格</Text>
              <View className="flex flex-row gap-2 flex-wrap">
                {creationStyles.map((style) => (
                  <View
                    key={style.key}
                    className="rounded-lg px-4 py-2"
                    style={{
                      background: formData.creationStyle === style.key
                        ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                        : '#1f2937',
                    }}
                    onClick={() => setFormData({ ...formData, creationStyle: style.key })}
                  >
                    <Text className="text-white text-sm">{style.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 价格推荐 */}
            <View className="mb-4">
              <Text className="text-white text-sm font-medium mb-2">价格推荐</Text>
              <View className="bg-gray-800 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-white placeholder-gray-400 text-sm"
                  placeholder="请输入推荐价格"
                  value={formData.priceRecommendation}
                  onInput={(e) => setFormData({ ...formData, priceRecommendation: e.detail.value })}
                />
              </View>
            </View>
          </>
        )}

        {/* 创意模式表单 */}
        {mode === 'creative' && (
          <>
            {/* 描述提示词 */}
            <View className="mb-4">
              <Text className="text-white text-sm font-medium mb-2">描述提示词</Text>
              <View className="bg-gray-800 rounded-xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent', color: '#ffffff' }}
                  placeholder="请输入您想要生成的视频描述..."
                  placeholderStyle="color: #9CA3AF"
                  value={formData.prompt}
                  onInput={(e) => setFormData({ ...formData, prompt: e.detail.value })}
                  maxlength={2000}
                />
                <View className="flex flex-row items-center justify-between mt-2">
                  <Text className="text-gray-500 text-xs">AI润色</Text>
                  <Text className="text-gray-500 text-xs">{formData.prompt.length}/2000</Text>
                </View>
              </View>
            </View>

            {/* 优化提示词按钮 */}
            <View className="mb-4">
              <View
                className="rounded-xl py-3 flex flex-row items-center justify-center gap-2"
                style={{ background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' }}
                onClick={handleOptimizePrompt}
              >
                <Sparkles size={16} color="#ffffff" />
                <Text className="text-white font-medium text-sm">优化提示词</Text>
              </View>
            </View>
          </>
        )}

        {/* 广告栏 */}
        <View className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-4 mb-4 flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-3">
            <View className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Text className="text-purple-600 font-bold text-xs">千问</Text>
            </View>
            <View className="flex flex-col">
              <Text className="text-white text-xs font-medium">千问AI生图秒级出图！输入文字就生成，</Text>
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

        <Text className="text-gray-500 text-xs mb-4">内容涉及AI人工智能</Text>
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
