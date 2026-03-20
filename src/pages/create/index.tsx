import { View, Text, Input, Textarea, Image as TaroImage, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import {
  Upload,
  Camera,
  Image,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Loader,
} from 'lucide-react-taro'
import { Network } from '@/network'

type CreationTab = 'custom' | 'shop' | 'product'
type Mode = 'simple' | 'creative'

interface FormData {
  // 店铺创作
  shopName: string
  shopAddress: string
  businessScope: string
  generationType: 'shop_promotion' | 'model_promotion'
  // 产品创作 & 自定义
  prompt: string
  // 通用参数
  image: string  // 本地临时路径
  imageUrl: string  // 上传后的URL
  generationCount: number
  channel: string
  videoLength: number
  resolution: string
  videoFormat: 'vertical' | 'horizontal'
  subtitleOption: 'hide' | 'show'
}

const CreatePage: FC = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<CreationTab>('custom')
  const [mode, setMode] = useState<Mode>('simple')
  const [formData, setFormData] = useState<FormData>({
    shopName: '',
    shopAddress: '',
    businessScope: '',
    generationType: 'shop_promotion',
    prompt: '',
    image: '',
    imageUrl: '',
    generationCount: 1,
    channel: 'VED3.1',
    videoLength: 8,
    resolution: '720P',
    videoFormat: 'vertical',
    subtitleOption: 'hide',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const tab = router.params.tab as CreationTab
    if (tab && ['custom', 'shop', 'product'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [router.params])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleChooseImage = async () => {
    try {
      // 选择图片
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      
      const tempFilePath = result.tempFilePaths[0]
      console.log('[CreatePage] Selected image:', tempFilePath)
      
      // 显示本地预览
      setFormData({ ...formData, image: tempFilePath, imageUrl: '' })
      
      // 上传图片到后端
      setIsUploading(true)
      Taro.showLoading({ title: '上传中...' })
      
      console.log('[CreatePage] Uploading image to server...')
      
      const uploadRes = await Network.uploadFile({
        url: '/api/upload/image',
        filePath: tempFilePath,
        name: 'file',
      })
      
      console.log('[CreatePage] Upload response:', uploadRes)
      
      const data = typeof uploadRes.data === 'string' 
        ? JSON.parse(uploadRes.data) 
        : uploadRes.data
      
      if (data?.code === 200 && data.data?.url) {
        console.log('[CreatePage] ✓ Image uploaded successfully:', data.data.url)
        
        // 更新图片URL
        setFormData(prev => ({
          ...prev,
          image: tempFilePath,
          imageUrl: data.data.url,
        }))
        
        Taro.hideLoading()
        Taro.showToast({ title: '上传成功', icon: 'success' })
      } else {
        throw new Error(data?.msg || '上传失败')
      }
    } catch (error: any) {
      console.error('[CreatePage] Upload error:', error)
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '上传失败', icon: 'none' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerate = async () => {
    // 检查图片
    if (!formData.image) {
      Taro.showToast({ title: '请先上传图片', icon: 'none' })
      return
    }
    
    // 检查图片是否已上传
    if (!formData.imageUrl) {
      Taro.showToast({ title: '图片正在上传，请稍候', icon: 'none' })
      return
    }

    setIsGenerating(true)
    try {
      console.log('[CreatePage] Starting video generation...')
      
      // 构建参数并导航到结果页面
      const params = new URLSearchParams()
      params.append('mode', activeTab)
      params.append('imageUrl', formData.imageUrl)  // 使用上传后的URL
      
      // 店铺创作参数
      if (activeTab === 'shop') {
        params.append('shopName', formData.shopName)
        params.append('shopAddress', formData.shopAddress)
        params.append('businessScope', formData.businessScope)
        params.append('generationType', formData.generationType)
      }
      
      // 产品创作/自定义参数
      if (activeTab === 'product' || activeTab === 'custom') {
        params.append('prompt', formData.prompt)
      }
      
      // 通用参数
      params.append('generationCount', String(formData.generationCount))
      params.append('videoLength', String(formData.videoLength))
      params.append('resolution', formData.resolution)
      params.append('videoFormat', formData.videoFormat)
      params.append('subtitleOption', formData.subtitleOption)
      
      console.log('[CreatePage] Navigating to result page with params:', params.toString())
      
      // 导航到结果页面
      Taro.navigateTo({
        url: `/pages/result/index?${params.toString()}`,
      })
    } catch (error) {
      console.error('[CreatePage] Generate error:', error)
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
      <View className="flex flex-row items-center px-4 py-3 border-b border-gray-800">
        <View className="flex flex-row items-center" onClick={handleBack}>
          <ArrowLeft size={20} color="#ffffff" />
          <Text className="text-white text-base ml-1">返回</Text>
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
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className="text-white text-sm">{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY className="px-4" style={{ height: 'calc(100vh - 180px)' }}>
        {/* 图片上传区 */}
        <View className="mb-4">
          <View className="flex flex-row items-center justify-between mb-2">
            <Text className="text-gray-400 text-xs">参考图片/图片中不得有任何人物</Text>
            {activeTab === 'custom' && (
              <View 
                className="flex flex-row items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-3 py-1"
                onClick={() => Taro.showToast({ title: '创建图片功能开发中', icon: 'none' })}
              >
                <Image size={12} color="#ffffff" />
                <Text className="text-white text-xs">创建图片</Text>
              </View>
            )}
          </View>
          
          <View className="bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center">
            {formData.image ? (
              <View className="w-full aspect-video relative rounded-lg overflow-hidden">
                <TaroImage
                  src={formData.image}
                  mode="aspectFill"
                  className="w-full h-full"
                />
                {/* 上传状态指示器 */}
                {isUploading && (
                  <View 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <View className="flex flex-col items-center">
                      <Loader size={32} color="#a855f7" className="animate-spin" />
                      <Text className="text-white text-sm mt-2">上传中...</Text>
                    </View>
                  </View>
                )}
                {/* 上传成功指示器 */}
                {!isUploading && formData.imageUrl && (
                  <View 
                    className="absolute top-2 left-2 rounded-full px-3 py-1"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }}
                  >
                    <Text className="text-white text-xs">✓ 已上传</Text>
                  </View>
                )}
                <View
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full px-3 py-1"
                  onClick={() => setFormData({ ...formData, image: '', imageUrl: '' })}
                >
                  <Text className="text-white text-xs">更换</Text>
                </View>
              </View>
            ) : (
              <>
                <View className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                  <Upload size={24} color="#9CA3AF" />
                </View>
                <Text className="text-gray-400 text-sm mb-3">
                  点击上传{activeTab === 'shop' ? '店铺门头/店内照' : activeTab === 'product' ? '产品图片' : '图片'}
                </Text>
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
                {activeTab === 'product' && (
                  <View className="mt-3 flex flex-row items-center justify-center">
                    <View className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                      <Text className="text-gray-500 text-xs">单张展示案例</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
          <Text className="text-gray-500 text-xs mt-2">
            玩法解密: 上传产品多角度拼图,生成视频效果更佳
          </Text>
          {activeTab === 'custom' && (
            <Text className="text-orange-500 text-xs mt-1">
              特别提示: 图片不可含人物,否则视频生成会失败
            </Text>
          )}
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

        {/* 店铺创作表单 */}
        {activeTab === 'shop' && (
          <View className="mb-4">
            <Text className="text-white text-sm font-medium mb-2">生成类型</Text>
            <View className="flex flex-row gap-2 mb-4">
              <View
                className="rounded-lg px-4 py-2"
                style={{
                  background: formData.generationType === 'shop_promotion'
                    ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                    : '#1f2937',
                }}
                onClick={() =>
                  setFormData({ ...formData, generationType: 'shop_promotion' })
                }
              >
                <Text className="text-white text-sm">店铺宣传</Text>
              </View>
              <View
                className="rounded-lg px-4 py-2"
                style={{
                  background: formData.generationType === 'model_promotion'
                    ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                    : '#1f2937',
                }}
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
                  fontSize: '14px',
                }}
                placeholder="请输入描述提示词"
                maxlength={2000}
                value={formData.prompt}
                onInput={(e) =>
                  setFormData({ ...formData, prompt: e.detail.value })
                }
              />
              <View className="flex flex-row items-center justify-between mt-2">
                <Text className="text-gray-500 text-xs">
                  {formData.prompt.length}/2000
                </Text>
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
        )}

        {/* 视频参数设置 */}
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
            <View 
              className="rounded-lg px-4 py-2"
              style={{
                background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
              }}
            >
              <Text className="text-white text-sm">VED3.1</Text>
            </View>
          </View>

          <Text className="text-white text-sm font-medium mb-2">视频长度</Text>
          <View className="flex flex-row gap-2 mb-4">
            {[
              { value: 5, label: '5s' },
              { value: 8, label: '8s' },
              { value: 10, label: '10s' },
              { value: 12, label: '12s' },
            ].map((item) => (
              <View
                key={item.value}
                className="rounded-lg px-4 py-2"
                style={{
                  background: formData.videoLength === item.value
                    ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                    : '#1f2937',
                }}
                onClick={() =>
                  setFormData({ ...formData, videoLength: item.value })
                }
              >
                <Text className="text-white text-sm">{item.label}</Text>
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
              onClick={() =>
                setFormData({ ...formData, videoFormat: 'vertical' })
              }
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

        <Text className="text-gray-500 text-xs mb-2">
          内容涉及AI人工智能
        </Text>
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
          className="rounded-xl py-4 flex flex-row items-center justify-center gap-2"
          style={{
            background: (isGenerating || isUploading || !formData.imageUrl)
              ? '#4a5568'
              : 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
          }}
          onClick={(isGenerating || isUploading) ? undefined : handleGenerate}
        >
          {isUploading ? (
            <>
              <Loader size={18} color="#a855f7" className="animate-spin" />
              <Text className="text-gray-300 font-medium text-base">上传中...</Text>
            </>
          ) : isGenerating ? (
            <>
              <Loader size={18} color="#a855f7" className="animate-spin" />
              <Text className="text-gray-300 font-medium text-base">生成中...</Text>
            </>
          ) : !formData.imageUrl ? (
            <Text className="text-gray-400 font-medium text-base">
              {formData.image ? '请等待图片上传' : '请先上传图片'}
            </Text>
          ) : (
            <Text className="text-white font-medium text-base">立即生成视频（50点）</Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default CreatePage
