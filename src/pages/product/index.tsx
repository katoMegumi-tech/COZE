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
  Loader,
} from 'lucide-react-taro'
import { imageToBase64 } from '@/utils/coze-workflow'

type CreationTab = 'custom' | 'shop' | 'product'
type Mode = 'simple' | 'creative'

const ProductCreatePage: FC = () => {
  const activeTab: CreationTab = 'product'
  const [mode, setMode] = useState<Mode>('simple')
  const [formData, setFormData] = useState({
    image: '',
    imageBase64: '',
    productName: '',
    productFeature: '',
    priceRecommendation: '',
    backgroundScene: '',
    prompt: '',
    creationStyle: 'fashion' as 'fashion' | 'tech' | 'nature' | 'luxury',
    generationCount: 1,
    channel: 'VED3.1',
    videoLength: 8,
    resolution: '720P',
    videoFormat: 'vertical' as 'vertical' | 'horizontal',
    subtitleOption: 'hide' as 'hide' | 'show',
  })
  const [isConverting, setIsConverting] = useState(false)

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

  // 处理图片选择
  const handleImageSelect = async (sourceType: 'album' | 'camera') => {
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: [sourceType],
      })
      
      const tempFilePath = result.tempFilePaths[0]
      console.log('[ProductPage] Selected image:', tempFilePath)
      
      setFormData({ ...formData, image: tempFilePath, imageBase64: '' })
      
      setIsConverting(true)
      Taro.showLoading({ title: '处理图片...' })
      
      try {
        const base64 = await imageToBase64(tempFilePath)
        console.log('[ProductPage] Image converted to base64, length:', base64.length)
        
        setFormData(prev => ({
          ...prev,
          image: tempFilePath,
          imageBase64: base64,
        }))
        
        Taro.hideLoading()
        Taro.showToast({ title: '图片准备完成', icon: 'success' })
      } catch (convertError) {
        console.error('[ProductPage] Convert error:', convertError)
        Taro.hideLoading()
        Taro.showToast({ title: '图片处理失败', icon: 'none' })
      }
    } catch (error) {
      console.error('选择图片失败', error)
      Taro.hideLoading()
    } finally {
      setIsConverting(false)
    }
  }

  const handleChooseFromAlbum = () => handleImageSelect('album')
  const handleTakePhoto = () => handleImageSelect('camera')

  const handleOptimizePrompt = async () => {
    if (!formData.prompt) {
      Taro.showToast({ title: '请先输入描述提示词', icon: 'none' })
      return
    }
    Taro.showToast({ title: 'AI优化中...', icon: 'loading' })
    setTimeout(() => {
      Taro.hideToast()
      Taro.showToast({ title: '优化完成', icon: 'success' })
    }, 1500)
  }

  const handleGenerate = async () => {
    if (!formData.image) {
      Taro.showToast({ title: '请先上传图片', icon: 'none' })
      return
    }
    
    if (!formData.imageBase64) {
      Taro.showToast({ title: '图片正在处理，请稍候', icon: 'none' })
      return
    }
    
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

    const params = {
      mode: activeTab,
      productName: formData.productName,
      productFeature: formData.productFeature,
      priceRecommendation: formData.priceRecommendation,
      backgroundScene: formData.backgroundScene,
      prompt: formData.prompt,
      creationStyle: formData.creationStyle,
      generationCount: formData.generationCount,
      videoLength: formData.videoLength,
      resolution: formData.resolution,
      videoFormat: formData.videoFormat,
      subtitleOption: formData.subtitleOption,
    }
    
    Taro.setStorageSync('video_gen_image', formData.imageBase64)
    Taro.setStorageSync('video_gen_params', JSON.stringify(params))
    
    Taro.navigateTo({ url: '/pages/result/index?from=product' })
  }

  const tabs = [
    { key: 'custom' as const, label: '自定义' },
    { key: 'shop' as const, label: '店铺创作' },
    { key: 'product' as const, label: '产品创作' },
  ]

  return (
    <View className="min-h-screen bg-black">
      <View className="flex flex-row items-center px-4 py-3 border-b border-gray-800">
        <View className="flex flex-row items-center" onClick={handleBack}>
          <ArrowLeft size={20} color="#ffffff" />
          <Text className="text-white text-base ml-1">产品创作</Text>
        </View>
      </View>

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
        <View className="mb-4">
          <Text className="text-gray-400 text-xs mb-2">参考图片/图片中不得有任何人物</Text>
          <View 
            className="bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center"
            onClick={!formData.image ? handleChooseFromAlbum : undefined}
          >
            {formData.image ? (
              <View className="w-full aspect-video relative rounded-lg overflow-hidden">
                <TaroImage src={formData.image} mode="aspectFill" className="w-full h-full" />
                {isConverting && (
                  <View className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <View className="flex flex-col items-center">
                      <Loader size={32} color="#a855f7" className="animate-spin" />
                      <Text className="text-white text-sm mt-2">处理中...</Text>
                    </View>
                  </View>
                )}
                {!isConverting && formData.imageBase64 && (
                  <View className="absolute top-2 left-2 rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }}>
                    <Text className="text-white text-xs">✓ 已准备</Text>
                  </View>
                )}
                <View
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full px-3 py-1"
                  onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, image: '', imageBase64: '' }) }}
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
                <View className="w-full flex flex-row items-center justify-center gap-4 mt-3">
                  <View className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2" onClick={handleChooseFromAlbum}>
                    <Image size={14} color="#ffffff" />
                    <Text className="text-white text-xs">素材库</Text>
                  </View>
                  <View className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2" onClick={handleTakePhoto}>
                    <Camera size={14} color="#ffffff" />
                    <Text className="text-white text-xs">直接拍</Text>
                  </View>
                </View>
              </>
            )}
          </View>
          <Text className="text-gray-500 text-xs mt-2">玩法解密: 上传产品多角度拼图,生成视频效果更佳</Text>
        </View>

        <View className="flex flex-row gap-2 mb-4">
          <View className="rounded-full px-4 py-2" style={{ background: mode === 'simple' ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' : '#1f2937' }} onClick={() => setMode('simple')}>
            <Text className="text-white text-sm">小白模式</Text>
          </View>
          <View className="rounded-full px-4 py-2" style={{ background: mode === 'creative' ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' : '#1f2937' }} onClick={() => setMode('creative')}>
            <Text className="text-white text-sm">创意模式</Text>
          </View>
        </View>

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

        {mode === 'simple' ? (
          <View className="mb-4">
            <Text className="text-white text-sm font-medium mb-2">产品名称</Text>
            <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4">
              <Input className="w-full bg-transparent text-white placeholder-gray-400 text-sm" placeholder="请输入产品名称" value={formData.productName} onInput={(e) => setFormData({ ...formData, productName: e.detail.value })} />
            </View>
            <Text className="text-white text-sm font-medium mb-2">产品特点</Text>
            <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4">
              <Input className="w-full bg-transparent text-white placeholder-gray-400 text-sm" placeholder="请输入产品特点" value={formData.productFeature} onInput={(e) => setFormData({ ...formData, productFeature: e.detail.value })} />
            </View>
            <Text className="text-white text-sm font-medium mb-2">价格推荐</Text>
            <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4">
              <Input className="w-full bg-transparent text-white placeholder-gray-400 text-sm" placeholder="请输入价格推荐" value={formData.priceRecommendation} onInput={(e) => setFormData({ ...formData, priceRecommendation: e.detail.value })} />
            </View>
            <Text className="text-white text-sm font-medium mb-2">背景场景</Text>
            <View className="bg-gray-800 rounded-lg px-4 py-3">
              <Input className="w-full bg-transparent text-white placeholder-gray-400 text-sm" placeholder="请输入背景场景" value={formData.backgroundScene} onInput={(e) => setFormData({ ...formData, backgroundScene: e.detail.value })} />
            </View>
          </View>
        ) : (
          <View className="mb-4">
            <Text className="text-white text-sm font-medium mb-2">描述提示词</Text>
            <View className="bg-gray-800 rounded-xl p-4 mb-2">
              <Textarea style={{ width: '100%', minHeight: '100px', backgroundColor: 'transparent', color: '#ffffff', fontSize: '14px' }} placeholder="请输入描述提示词" maxlength={2000} value={formData.prompt} onInput={(e) => setFormData({ ...formData, prompt: e.detail.value })} />
              <View className="flex flex-row items-center justify-between mt-2">
                <Text className="text-gray-500 text-xs">{formData.prompt.length}/2000</Text>
                <View className="flex flex-row gap-2">
                  <View className="flex flex-row items-center gap-1 bg-gray-700 rounded-lg px-3 py-1" onClick={handleOptimizePrompt}>
                    <Sparkles size={12} color="#ec4899" />
                    <Text className="text-pink-400 text-xs">AI润色</Text>
                  </View>
                  <View className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-3 py-1" onClick={handleOptimizePrompt}>
                    <Text className="text-white text-xs">优化提示词</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-white text-sm font-medium mb-2">创作风格</Text>
          <View className="flex flex-row gap-2 mb-4 flex-wrap">
            {[
              { key: 'fashion', label: '时尚' },
              { key: 'tech', label: '科技' },
              { key: 'nature', label: '自然' },
              { key: 'luxury', label: '奢华' },
            ].map((style) => (
              <View key={style.key} className="rounded-lg px-4 py-2" style={{ background: formData.creationStyle === style.key ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' : '#1f2937' }} onClick={() => setFormData({ ...formData, creationStyle: style.key as any })}>
                <Text className="text-white text-sm">{style.label}</Text>
              </View>
            ))}
          </View>

          <Text className="text-white text-sm font-medium mb-2">生成数量</Text>
          <View className="flex flex-row gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((count) => (
              <View key={count} className="rounded-lg px-4 py-2" style={{ background: formData.generationCount === count ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' : '#1f2937' }} onClick={() => setFormData({ ...formData, generationCount: count })}>
                <Text className="text-white text-sm">{count}</Text>
              </View>
            ))}
          </View>

          <Text className="text-white text-sm font-medium mb-2">视频长度</Text>
          <View className="flex flex-row gap-2 mb-4">
            {[5, 8, 10, 12].map((len) => (
              <View key={len} className="rounded-lg px-4 py-2" style={{ background: formData.videoLength === len ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' : '#1f2937' }} onClick={() => setFormData({ ...formData, videoLength: len })}>
                <Text className="text-white text-sm">{len}s</Text>
              </View>
            ))}
          </View>

          <Text className="text-white text-sm font-medium mb-2">视频清晰度</Text>
          <View className="flex flex-row gap-2 mb-4">
            {['480P', '720P', '1080P'].map((res) => (
              <View key={res} className="rounded-lg px-4 py-2" style={{ background: formData.resolution === res ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' : '#1f2937' }} onClick={() => setFormData({ ...formData, resolution: res })}>
                <Text className="text-white text-sm">{res}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-gray-500 text-xs mb-2">内容涉及AI人工智能</Text>
      </ScrollView>

      <View style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', backgroundColor: '#000000', borderTop: '1px solid #374151' }}>
        <View className="rounded-xl py-4 flex flex-row items-center justify-center gap-2" style={{ background: (isConverting || !formData.imageBase64) ? '#4a5568' : 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' }} onClick={isConverting ? undefined : handleGenerate}>
          {isConverting ? (
            <>
              <Loader size={18} color="#a855f7" className="animate-spin" />
              <Text className="text-gray-300 font-medium text-base">处理图片...</Text>
            </>
          ) : !formData.imageBase64 ? (
            <Text className="text-gray-400 font-medium text-base">{formData.image ? '请等待图片处理' : '请先上传图片'}</Text>
          ) : (
            <Text className="text-white font-medium text-base">立即生成视频（50点）</Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default ProductCreatePage
