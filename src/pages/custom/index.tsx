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
import { Network } from '@/network'

type CreationTab = 'custom' | 'shop' | 'product'

const CustomCreatePage: FC = () => {
  const activeTab: CreationTab = 'custom'
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
    if (tab === 'shop') {
      Taro.redirectTo({ url: '/pages/shop/index' })
    } else if (tab === 'product') {
      Taro.redirectTo({ url: '/pages/product/index' })
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
        url: '/api/upload',
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

  // 创建图片
  const handleCreateImage = async () => {
    if (!formData.prompt) {
      Taro.showToast({ title: '请先输入描述提示词', icon: 'none' })
      return
    }
    Taro.showToast({ title: 'AI创建图片中...', icon: 'loading' })
    // TODO: 调用后端AI生图接口
    setTimeout(() => {
      Taro.hideToast()
      Taro.showToast({ title: '图片创建成功', icon: 'success' })
    }, 1500)
  }

  // 生成视频
  const handleGenerate = async () => {
    if (!formData.image) {
      Taro.showToast({ title: '请先上传图片', icon: 'none' })
      return
    }
    if (!formData.prompt) {
      Taro.showToast({ title: '请输入描述提示词', icon: 'none' })
      return
    }

    Taro.showToast({ title: '视频生成中...', icon: 'loading' })
    
    // 上传图片
    const imageUrl = await uploadImage(formData.image)
    if (!imageUrl) {
      Taro.showToast({ title: '图片上传失败', icon: 'none' })
      return
    }

    // TODO: 调用后端视频生成接口
    console.log('生成视频参数:', { ...formData, imageUrl })
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
          <Text className="text-white text-base ml-1">自定义</Text>
        </View>
        <View
          className="flex flex-row items-center gap-1 rounded-full px-3 py-1"
          style={{ background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' }}
          onClick={handleCreateImage}
        >
          <Image size={12} color="#ffffff" />
          <Text className="text-white text-xs">创建图片</Text>
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
                <Text className="text-gray-400 text-sm mb-3">点击上传图片</Text>
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
                    <Text className="text-white text-xs">素材库图片</Text>
                  </View>
                  <View
                    className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTakePhoto()
                    }}
                  >
                    <Camera size={14} color="#ffffff" />
                    <Text className="text-white text-xs">点击直接拍</Text>
                  </View>
                </View>
              </>
            )}
          </View>
          <Text className="text-gray-500 text-xs mt-2">
            玩法解密: 上传产品多角度拼图,生成视频效果更佳
          </Text>
          <Text className="text-orange-500 text-xs mt-1">
            特别提示: 图片不可含人物,否则视频生成会失败
          </Text>
        </View>

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

        {/* 广告栏 */}
        <View className="bg-gradient-to-r from-red-900 to-orange-900 rounded-xl p-4 mb-4 flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-3">
            <View className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Text className="text-red-600 font-bold text-xs">京东</Text>
            </View>
            <View className="flex flex-col">
              <Text className="text-white text-xs font-medium">京东好物 一分钱购</Text>
              <Text className="text-gray-300 text-xs">下手晚了可就真的抢不到了！</Text>
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

export default CustomCreatePage
