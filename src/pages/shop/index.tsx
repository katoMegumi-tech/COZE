import { View, Text, Input, ScrollView, Image as TaroImage, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  Upload,
  Camera,
  Image,
  ArrowLeft,
} from 'lucide-react-taro'
import { Network } from '@/network'

type CreationTab = 'shop' | 'product'

const ShopCreatePage: FC = () => {
  const activeTab: CreationTab = 'shop'
  const chooseImageLockRef = useRef(false)
  const [formData, setFormData] = useState({
    image: '',
    copywritingType: '',
    productOrServiceName: '',
    coreSellingPoints: '',
    targetAudience: '',
    usageScenario: '',
    toneStyle: '',
    keywords: '',
    wordLimit: '',
    structurePreference: '',
    forbiddenWords: '',
    referenceLinks: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
  } as const

  const optionStyle = (selected: boolean) =>
    ({
      background: selected ? 'var(--gradient-primary)' : '#1f2937',
      borderWidth: selected ? 0 : 1,
      borderColor: 'var(--tech-2)',
    }) as const

  const copywritingTypeOptions = [
    '朋友圈广告',
    '小红书笔记',
    '产品详情页',
    '邮件营销',
    '短视频脚本',
  ]
  const usageScenarioOptions = [
    '公众号推文头图',
    '电商主图',
    '直播口播',
    '短视频',
    '邮件',
  ]
  const toneStyleOptions = ['正式', '幽默', '亲切', '紧迫', '文艺', '专业', '种草', '促销']
  const wordLimitOptions = ['50字以内', '100字以内', '150-200字', '300字以内', '不限']
  const structurePreferenceOptions = [
    '痛点开头→解决方案→呼吁行动',
    '亮点清单',
    '故事化',
    '对比结构',
    '三段式',
  ]

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleTabChange = (tab: CreationTab) => {
    if (tab === 'product') {
      Taro.redirectTo({ url: '/pages/product/index' })
    }
  }

  const handleImageSelect = async (sourceType: 'album' | 'camera') => {
    if (chooseImageLockRef.current) return
    chooseImageLockRef.current = true
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: [sourceType],
      })

      const tempFilePath = result.tempFilePaths[0]
      console.log('选择的图片路径:', tempFilePath)
      setFormData({ ...formData, image: tempFilePath })

    } catch (error) {
      console.error('选择图片失败', error)
    } finally {
      chooseImageLockRef.current = false
    }
  }

  useEffect(() => {
    console.log('image 状态变化：', formData.image);
  }, [formData.image]);

  // 从素材库选择图片
  const handleChooseFromAlbum = () => handleImageSelect('album')

  // 拍照上传
  const handleTakePhoto = () => handleImageSelect('camera')

  const getDefaultImagePath = async (): Promise<string> => {
    const res = await Taro.getImageInfo({ src: '/assets/tabbar/house.png' })
    return (res as any).path || (res as any).tempFilePath || ''
  }

  const buildCopyPrompt = () => {
    const lines: string[] = []
    const add = (label: string, value: string) => {
      const v = value?.trim()
      if (v) lines.push(`${label}：${v}`)
    }

    add('文案类型', formData.copywritingType)
    add('产品/服务名称', formData.productOrServiceName)
    add('核心卖点', formData.coreSellingPoints)
    add('目标受众', formData.targetAudience)
    add('使用场景', formData.usageScenario)
    add('语气/风格', formData.toneStyle)
    add('关键词', formData.keywords)
    add('字数限制', formData.wordLimit)
    add('结构偏好', formData.structurePreference)
    add('违禁词', formData.forbiddenWords)
    add('参考链接', formData.referenceLinks)

    if (lines.length === 0) return '请生成一段用于推广的高质量文案。'
    return lines.join('\n')
  }

  const handleGenerate = async () => {
    if (!formData.productOrServiceName) {
      Taro.showToast({ title: '请输入产品名称', icon: 'none' })
      return
    }

    if (isGenerating) {
      return
    }

    setIsGenerating(true)

    try {
      let imagePath = formData.image
      if (!imagePath) {
        try {
          imagePath = await getDefaultImagePath()
        } catch {
          imagePath = ''
        }
      }

      let fileIds: string[] = []

      if (imagePath) {
        Taro.showLoading({ title: '上传参考图片中...', mask: true })
        try {
          const uploadRes = await Network.upload.coze(imagePath)
          const uploadData = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
          if (uploadData.code === 200 && uploadData.data && uploadData.data.id) {
            fileIds = [uploadData.data.id]
          }
        } catch (uploadError) {
          console.error('图片上传失败:', uploadError)
        }
      }

      Taro.showLoading({ title: '生成文案中...', mask: true })

      const params = {
        fileIds: fileIds.length > 0 ? fileIds : undefined,
        productServiceName: formData.productOrServiceName,
        coreSellingPoints: formData.coreSellingPoints || undefined,
        targetAudience: formData.targetAudience || undefined,
        usageScenario: formData.usageScenario || undefined,
        copyType: formData.copywritingType || undefined,
        toneStyle: formData.toneStyle || undefined,
        wordCountLimit: formData.wordLimit || undefined,
        structurePreference: formData.structurePreference || undefined,
        keywords: formData.keywords || undefined,
        forbiddenWords: formData.forbiddenWords || undefined,
        referenceLink: formData.referenceLinks || undefined,
      }

      const response = await Network.copywriting.generate(params)

      Taro.hideLoading()
      setIsGenerating(false)

      if (response.data && response.data.code === 200) {
        const result = response.data.data
        if (result && result.content) {
          const copyPrompt = buildCopyPrompt()
          const resultParams = {
            mode: activeTab,
            copywritingType: formData.copywritingType,
            productOrServiceName: formData.productOrServiceName,
            coreSellingPoints: formData.coreSellingPoints,
            targetAudience: formData.targetAudience,
            usageScenario: formData.usageScenario,
            toneStyle: formData.toneStyle,
            keywords: formData.keywords,
            wordLimit: formData.wordLimit,
            structurePreference: formData.structurePreference,
            forbiddenWords: formData.forbiddenWords,
            referenceLinks: formData.referenceLinks,
            prompt: copyPrompt,
            generatedContent: result.content,
            outputLinks: result.outputLinks,
          }

          Taro.setStorageSync('video_gen_image', imagePath)
          Taro.setStorageSync('video_gen_params', JSON.stringify(resultParams))

          Taro.navigateTo({ url: '/pages/result/index?from=shop' })
        } else {
          Taro.showToast({ title: '生成失败：未返回有效内容', icon: 'none' })
        }
      } else {
        const errorMsg = response.data?.message || '生成失败'
        Taro.showToast({ title: errorMsg, icon: 'none' })
      }
    } catch (error) {
      Taro.hideLoading()
      setIsGenerating(false)
      console.error('生成失败:', error)
      Taro.showToast({ title: '网络错误，请重试', icon: 'none' })
    }
  }

  const tabs = [
    { key: 'shop' as const, label: '文案创作' },
    { key: 'product' as const, label: '产品创作' },
  ]

  return (
    <View className="min-h-screen bg-[color:var(--background)] overflow-hidden">
      {/* 顶部导航 */}
      <View className="flex flex-row items-center px-4 py-3 border-b border-gray-800">
        <View className="flex flex-row items-center" onClick={handleBack}>
          <ArrowLeft size={20} color="#ffffff" />
          <Text className="text-white text-base ml-1">文案创作</Text>
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
                ? 'var(--gradient-primary)'
                : '#1f2937',
              borderWidth: activeTab === tab.key ? 0 : 1,
              borderColor: 'var(--tech-2)',
            }}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text className="text-white text-sm">{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        scrollY
        style={{
          height: 'calc(100vh - 240px)',
          width: '690rpx',
          padding: '0 32rpx'  // 直接设置内边距
        }}
      >
        {/* 图片上传区 */}
        <View className="mb-4">
          <Text className="text-gray-400 text-xs mb-2">参考图片/图片中不得有任何人物</Text>
          <View
            className="bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center"
            onClick={!formData.image ? handleChooseFromAlbum : undefined}
          >
            {formData.image ? (
              <View className="w-full aspect-video relative rounded-lg overflow-hidden">
                <TaroImage
                  src={formData.image}
                  mode="aspectFill"
                  className="w-full h-full"
                />
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
                <Text className="text-gray-400 text-sm mb-3">点击上传参考图片（可选）</Text>
                <View className="w-full flex flex-row items-center justify-center">
                  <Text className="text-gray-500 text-xs">—— 或者 ——</Text>
                </View>
                <View className="w-full flex flex-row flex-wrap items-center justify-center gap-4 mt-3">
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

        <View className="mb-6">
          <View className="mb-3">
            <Text className="text-white text-sm font-semibold">基础信息</Text>
          </View>

          <View className="mb-2">
            <Text className="text-white text-sm font-medium">文案类型</Text>
          </View>
          <View className="flex flex-row flex-wrap gap-2 mb-4">
            {copywritingTypeOptions.map((opt) => (
              <View
                key={opt}
                className="rounded-full px-4 py-2"
                style={optionStyle(formData.copywritingType === opt)}
                onClick={() => setFormData({ ...formData, copywritingType: opt })}
              >
                <Text className="text-white text-sm">{opt}</Text>
              </View>
            ))}
          </View>
          <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4 overflow-hidden">
            <Input
              style={inputStyle}
              className="bg-transparent text-white placeholder-gray-400 text-sm"
              placeholder="其他类型（可选）"
              value={formData.copywritingType}
              onInput={(e) =>
                setFormData({ ...formData, copywritingType: e.detail.value })
              }
            />
          </View>

          <Text className="text-white text-sm font-medium mb-2">产品 / 服务名称</Text>
          <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4 overflow-hidden">
            <Input
              style={inputStyle}
              className="bg-transparent text-white placeholder-gray-400 text-sm"
              placeholder="例如：智能保温杯"
              value={formData.productOrServiceName}
              onInput={(e) =>
                setFormData({
                  ...formData,
                  productOrServiceName: e.detail.value,
                })
              }
            />
          </View>

          <Text className="text-white text-sm font-medium mb-2">核心卖点</Text>
          <View className="bg-gray-800 rounded-xl p-4 mb-4">
            <Textarea
              style={{
                width: '100%',
                minHeight: '80px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontSize: '14px',
              }}
              placeholder="例如：长效保温12小时、智能温度显示、防漏水设计"
              maxlength={500}
              value={formData.coreSellingPoints}
              onInput={(e) =>
                setFormData({ ...formData, coreSellingPoints: e.detail.value })
              }
            />
          </View>

          <Text className="text-white text-sm font-medium mb-2">目标受众</Text>
          <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4 overflow-hidden">
            <Input
              style={inputStyle}
              className="bg-transparent text-white placeholder-gray-400 text-sm"
              placeholder="例如：25-35岁上班族，关注健康，喜欢户外运动"
              value={formData.targetAudience}
              onInput={(e) =>
                setFormData({ ...formData, targetAudience: e.detail.value })
              }
            />
          </View>

          <Text className="text-white text-sm font-medium mb-2">使用场景</Text>
          <View className="flex flex-row flex-wrap gap-2 mb-3">
            {usageScenarioOptions.map((opt) => (
              <View
                key={opt}
                className="rounded-full px-4 py-2"
                style={optionStyle(formData.usageScenario === opt)}
                onClick={() => setFormData({ ...formData, usageScenario: opt })}
              >
                <Text className="text-white text-sm">{opt}</Text>
              </View>
            ))}
          </View>
          <View className="bg-gray-800 rounded-lg px-4 py-3 overflow-hidden">
            <Input
              style={inputStyle}
              className="bg-transparent text-white placeholder-gray-400 text-sm"
              placeholder="其他场景（可选）"
              value={formData.usageScenario}
              onInput={(e) =>
                setFormData({ ...formData, usageScenario: e.detail.value })
              }
            />
          </View>
        </View>

        <View className="mb-6">
          <View className="mb-3">
            <Text className="text-white text-sm font-semibold">内容与风格</Text>
          </View>

          <View className="mb-2">
            <Text className="text-white text-sm font-medium">语气 / 风格</Text>
          </View>
          <View className="flex flex-row flex-wrap gap-2 mb-3">
            {toneStyleOptions.map((opt) => (
              <View
                key={opt}
                className="rounded-full px-4 py-2"
                style={optionStyle(formData.toneStyle === opt)}
                onClick={() => setFormData({ ...formData, toneStyle: opt })}
              >
                <Text className="text-white text-sm">{opt}</Text>
              </View>
            ))}
          </View>
          <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4 overflow-hidden">
            <Input
              style={inputStyle}
              className="bg-transparent text-white placeholder-gray-400 text-sm"
              placeholder="自定义风格（可选）"
              value={formData.toneStyle}
              onInput={(e) =>
                setFormData({ ...formData, toneStyle: e.detail.value })
              }
            />
          </View>

          <Text className="text-white text-sm font-medium mb-2">关键词</Text>
          <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4 overflow-hidden">
            <Input
              style={inputStyle}
              className="bg-transparent text-white placeholder-gray-400 text-sm"
              placeholder="例如：黑科技 / 便携 / 礼盒包装"
              value={formData.keywords}
              onInput={(e) =>
                setFormData({ ...formData, keywords: e.detail.value })
              }
            />
          </View>

          <Text className="text-white text-sm font-medium mb-2">字数限制</Text>
          <View className="flex flex-row flex-wrap gap-2 mb-3">
            {wordLimitOptions.map((opt) => (
              <View
                key={opt}
                className="rounded-full px-4 py-2"
                style={optionStyle(formData.wordLimit === opt)}
                onClick={() => setFormData({ ...formData, wordLimit: opt })}
              >
                <Text className="text-white text-sm">{opt}</Text>
              </View>
            ))}
          </View>
          <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4 overflow-hidden">
            <Input
              style={inputStyle}
              className="bg-transparent text-white placeholder-gray-400 text-sm"
              placeholder="自定义字数（可选）"
              value={formData.wordLimit}
              onInput={(e) =>
                setFormData({ ...formData, wordLimit: e.detail.value })
              }
            />
          </View>

          <Text className="text-white text-sm font-medium mb-2">结构偏好</Text>
          <View className="flex flex-row flex-wrap gap-2 mb-3">
            {structurePreferenceOptions.map((opt) => (
              <View
                key={opt}
                className="rounded-full px-4 py-2"
                style={optionStyle(formData.structurePreference === opt)}
                onClick={() =>
                  setFormData({ ...formData, structurePreference: opt })
                }
              >
                <Text className="text-white text-sm">{opt}</Text>
              </View>
            ))}
          </View>
          <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4 overflow-hidden">
            <Input
              style={inputStyle}
              className="bg-transparent text-white placeholder-gray-400 text-sm"
              placeholder="自定义结构（可选）"
              value={formData.structurePreference}
              onInput={(e) =>
                setFormData({
                  ...formData,
                  structurePreference: e.detail.value,
                })
              }
            />
          </View>

          <Text className="text-white text-sm font-medium mb-2">违禁词</Text>
          <View className="bg-gray-800 rounded-xl p-4">
            <Textarea
              style={{
                width: '100%',
                minHeight: '60px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontSize: '14px',
              }}
              placeholder="例如：不能写“最低价”、不能使用负面情绪"
              maxlength={300}
              value={formData.forbiddenWords}
              onInput={(e) =>
                setFormData({ ...formData, forbiddenWords: e.detail.value })
              }
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-white text-sm font-semibold mb-3">参考链接</Text>
          <View className="bg-gray-800 rounded-xl p-4">
            <Textarea
              style={{
                width: '100%',
                minHeight: '80px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontSize: '14px',
              }}
              placeholder="粘贴链接（可多行）"
              maxlength={1000}
              value={formData.referenceLinks}
              onInput={(e) =>
                setFormData({ ...formData, referenceLinks: e.detail.value })
              }
            />
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
          backgroundColor: 'var(--background)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <View
          className="rounded-xl py-4 flex flex-row items-center justify-center gap-2"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: '0 0 18px rgba(10, 191, 243, 0.35)',
          }}
          onClick={isGenerating ? undefined : handleGenerate}
        >
          <Text className="text-white font-medium text-base">生成文案</Text>
        </View>
      </View>
    </View>
  )
}

export default ShopCreatePage
