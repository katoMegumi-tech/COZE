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
  Loader,
} from 'lucide-react-taro'
import { imageToBase64 } from '@/utils/coze-workflow'
import { Network } from '@/network'

type CreationTab = 'shop' | 'product'
type Mode = 'simple' | 'creative'

interface FormData {
  // 文案创作
  copywritingType: string
  productOrServiceName: string
  coreSellingPoints: string
  targetAudience: string
  usageScenario: string
  toneStyle: string
  keywords: string
  wordLimit: string
  structurePreference: string
  forbiddenWords: string
  referenceLinks: string
  // 产品创作
  prompt: string
  // 通用参数
  image: string  // 本地临时路径
  imageBase64: string  // base64编码（用于传递给Coze）
  fileId?: string  // 上传到Coze后的文件ID
  generationCount: number
  channel: string
  videoLength: number
  resolution: string
  videoFormat: 'vertical' | 'horizontal'
  subtitleOption: 'hide' | 'show'
}

const CreatePage: FC = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<CreationTab>('shop')
  const [mode, setMode] = useState<Mode>('simple')
  const [formData, setFormData] = useState<FormData>({
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
    prompt: '',
    image: '',
    imageBase64: '',
    generationCount: 1,
    channel: 'VED3.1',
    videoLength: 8,
    resolution: '720P',
    videoFormat: 'vertical',
    subtitleOption: 'hide',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

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

  useEffect(() => {
    const tab = router.params.tab as CreationTab
    if (tab && ['shop', 'product'].includes(tab)) {
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
      setFormData({ ...formData, image: tempFilePath, imageBase64: '' })

      // 转换为base64（用于传递给Coze工作流）
      setIsConverting(true)
      Taro.showLoading({ title: '处理图片...' })

      try {
        // 上传图片到 Coze 获取 fileId
        const uploadResponse = await Network.upload.coze(tempFilePath)
        console.log('[CreatePage] Upload response:', uploadResponse)

        if (uploadResponse.statusCode === 200 && uploadResponse.data) {
          const uploadData = JSON.parse(uploadResponse.data)
          if (uploadData.code === 200 && uploadData.data) {
            const fileId = uploadData.data.fileId
            console.log('[CreatePage] Upload success, fileId:', fileId)

            // 转换为base64（用于传递给Coze工作流）
            const base64 = await imageToBase64(tempFilePath)
            console.log('[CreatePage] Image converted to base64, length:', base64.length)

            setFormData(prev => ({
              ...prev,
              image: tempFilePath,
              imageBase64: base64,
              fileId: fileId, // 存储文件ID
            }))

            Taro.hideLoading()
            Taro.showToast({ title: '图片准备完成', icon: 'success' })
          } else {
            throw new Error(uploadData.message || '上传失败')
          }
        } else {
          throw new Error('上传失败')
        }
      } catch (convertError) {
        console.error('[CreatePage] Convert error:', convertError)
        Taro.hideLoading()
        Taro.showToast({ title: '图片处理失败', icon: 'none' })
      }
    } catch (error: any) {
      console.error('[CreatePage] Choose image error:', error)
      Taro.hideLoading()
    } finally {
      setIsConverting(false)
    }
  }

  const getDefaultImagePath = async (): Promise<string> => {
    try {
      const res = await Taro.getImageInfo({ src: '/assets/tabbar/house.png' })
      return (res as any).path || (res as any).tempFilePath || ''
    } catch (error) {
      console.error('[CreatePage] Get default image error:', error)
      return ''
    }
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
    let imagePath = formData.image
    if (activeTab === 'product') {
      if (!imagePath) {
        Taro.showToast({ title: '请先上传图片', icon: 'none' })
        return
      }
      if (isConverting) {
        Taro.showToast({ title: '图片正在处理，请稍候', icon: 'none' })
        return
      }
    } else {
      if (!imagePath) {
        try {
          imagePath = await getDefaultImagePath()
        } catch (error) {
          console.error('[CreatePage] Get default image error:', error)
          imagePath = ''
        }
      }

      // 对于文案创作模式，图片是可选的，不需要强制要求
      // if (!imagePath) {
      //   Taro.showToast({ title: '默认参考图不可用，请上传参考图片', icon: 'none' })
      //   return
      // }
    }

    setIsGenerating(true)
    try {
      if (activeTab === 'shop') {
        // 文案创作模式：调用后端 API 生成文案
        console.log('[CreatePage] Starting copywriting generation...')

        // 构建请求参数
        const requestData = {
          fileIds: formData.fileId ? [formData.fileId] : undefined,
          productServiceName: formData.productOrServiceName,
          coreSellingPoints: formData.coreSellingPoints,
          targetAudience: formData.targetAudience,
          usageScenario: formData.usageScenario,
          copyType: formData.copywritingType,
          toneStyle: formData.toneStyle,
          wordCountLimit: formData.wordLimit,
          structurePreference: formData.structurePreference,
          keywords: formData.keywords,
          forbiddenWords: formData.forbiddenWords,
          referenceLink: formData.referenceLinks,
        }

        console.log('[CreatePage] Copywriting request data:', requestData)

        // 调用后端 API
        const response = await Network.copywriting.generate(requestData)

        console.log('[CreatePage] Copywriting API response:', response)

        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          const copywritingResponse = response.data.data

          if (copywritingResponse.status === 'SUCCESS') {
            console.log('[CreatePage] Copywriting generation success:', copywritingResponse)

            // 构建参数并导航到结果页面
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
              prompt: buildCopyPrompt(),
              // 通用参数
              generationCount: formData.generationCount,
              videoLength: formData.videoLength,
              resolution: formData.resolution,
              videoFormat: formData.videoFormat,
              subtitleOption: formData.subtitleOption,
              // 后端返回的文案内容
              generatedContent: copywritingResponse.content,
              outputLinks: copywritingResponse.outputLinks,
            }

            // 将图片本地路径存储到本地
            Taro.setStorageSync('video_gen_image', imagePath)
            Taro.setStorageSync('video_gen_params', JSON.stringify(resultParams))

            console.log('[CreatePage] Navigating to result page')

            // 导航到结果页面
            Taro.navigateTo({
              url: '/pages/result/index?from=create',
            })
          } else {
            console.error('[CreatePage] Copywriting generation failed:', copywritingResponse.errorMessage)
            Taro.showToast({ title: `生成失败: ${copywritingResponse.errorMessage}`, icon: 'none' })
          }
        } else {
          console.error('[CreatePage] API request failed:', response)
          Taro.showToast({ title: '接口请求失败，请重试', icon: 'none' })
        }
      } else {
        // 产品创作模式：保持原有逻辑
        console.log('[CreatePage] Starting video generation...')

        // 构建参数并导航到结果页面
        // 注意：base64数据可能很长，使用Taro.setStorageSync传递
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
          prompt: activeTab === 'product' ? formData.prompt : copyPrompt,
          // 通用参数
          generationCount: formData.generationCount,
          videoLength: formData.videoLength,
          resolution: formData.resolution,
          videoFormat: formData.videoFormat,
          subtitleOption: formData.subtitleOption,
        }

        // 将图片本地路径存储到本地
        Taro.setStorageSync('video_gen_image', imagePath)
        Taro.setStorageSync('video_gen_params', JSON.stringify(resultParams))

        console.log('[CreatePage] Navigating to result page')

        // 导航到结果页面
        Taro.navigateTo({
          url: '/pages/result/index?from=create',
        })
      }
    } catch (error) {
      console.error('[CreatePage] Generate error:', error)
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOptimizePrompt = async () => {
    Taro.showToast({ title: 'AI润色功能开发中', icon: 'none' })
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
                ? 'var(--gradient-primary)'
                : '#1f2937',
              borderWidth: activeTab === tab.key ? 0 : 1,
              borderColor: 'var(--tech-2)',
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
          </View>

          <View className="bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center">
            {formData.image ? (
              <View className="w-full aspect-video relative rounded-lg overflow-hidden">
                <TaroImage
                  src={formData.image}
                  mode="aspectFill"
                  className="w-full h-full"
                />
                {isConverting && (
                  <View
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <View className="flex flex-col items-center">
                      <Loader size={32} color="#0abff3" className="animate-spin" />
                      <Text className="text-white text-sm mt-2">处理中...</Text>
                    </View>
                  </View>
                )}
                {!isConverting && formData.imageBase64 && (
                  <View
                    className="absolute top-2 left-2 rounded-full px-3 py-1"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }}
                  >
                    <Text className="text-white text-xs">✓ 已准备</Text>
                  </View>
                )}
                <View
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full px-3 py-1"
                  onClick={() => setFormData({ ...formData, image: '', imageBase64: '' })}
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
                  点击上传{activeTab === 'shop' ? '参考图片（可选）' : '产品图片'}
                </Text>
                <View className="w-full flex flex-row items-center justify-center">
                  <Text className="text-gray-500 text-xs">—— 或者 ——</Text>
                </View>
                <View className="w-full flex flex-row flex-wrap items-center justify-center gap-4 mt-3">
                  <View
                    className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChooseImage();
                    }}
                  >
                    <Image size={14} color="#ffffff" />
                    <Text className="text-white text-xs">素材库</Text>
                  </View>

                  <View
                    className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChooseImage();
                    }}
                  >
                    <Camera size={14} color="#ffffff" />
                    <Text className="text-white text-xs">直接拍</Text>
                  </View>
                </View>
              </>
            )}
          </View>
          {activeTab === 'product' && (
            <Text className="text-gray-500 text-xs mt-2">
              玩法解密: 上传产品多角度拼图,生成视频效果更佳
            </Text>
          )}
        </View>

        {activeTab === 'product' && (
          <View className="flex flex-row gap-2 mb-4">
            <View
              className="rounded-full px-4 py-2"
              style={{
                background: mode === 'simple'
                  ? 'var(--gradient-primary)'
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
                  ? 'var(--gradient-primary)'
                  : '#1f2937',
              }}
              onClick={() => setMode('creative')}
            >
              <Text className="text-white text-sm">创意模式</Text>
            </View>
          </View>
        )}

        {activeTab === 'shop' && (
          <>
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
                    setFormData({
                      ...formData,
                      coreSellingPoints: e.detail.value,
                    })
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
          </>
        )}

        {/* 产品创作表单 */}
        {activeTab === 'product' && (
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
                    <Sparkles size={12} color="#08e7de" />
                    <Text className="text-[color:var(--secondary)] text-xs">AI润色</Text>
                  </View>
                  <View
                    className="fx-gradient-primary fx-glow-primary rounded-lg px-3 py-1"
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
                    ? 'var(--gradient-primary)'
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

          {activeTab === 'product' && (
            <>
              <Text className="text-white text-sm font-medium mb-2">选择渠道</Text>
              <View className="flex flex-row gap-2 mb-4">
                <View
                  className="rounded-lg px-4 py-2"
                  style={{
                    background: 'var(--gradient-primary)',
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
                        ? 'var(--gradient-primary)'
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
                        ? 'var(--gradient-primary)'
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
                      ? 'var(--gradient-primary)'
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
                      ? 'var(--gradient-primary)'
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
                      ? 'var(--gradient-primary)'
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
                      ? 'var(--gradient-primary)'
                      : '#1f2937',
                  }}
                  onClick={() => setFormData({ ...formData, subtitleOption: 'show' })}
                >
                  <Text className="text-white text-sm">不屏蔽</Text>
                </View>
              </View>
            </>
          )}
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
          backgroundColor: 'var(--background)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <View
          className="rounded-xl py-4 flex flex-row items-center justify-center gap-2"
          style={{
            background:
              isGenerating ||
                (activeTab === 'product' &&
                  (isConverting || !formData.image || !formData.imageBase64))
                ? '#4a5568'
                : 'var(--gradient-primary)',
            boxShadow:
              isGenerating ||
                (activeTab === 'product' &&
                  (isConverting || !formData.image || !formData.imageBase64))
                ? undefined
                : '0 0 18px rgba(10, 191, 243, 0.35)',
          }}
          onClick={
            isGenerating ||
              (activeTab === 'product' &&
                (isConverting || !formData.image || !formData.imageBase64))
              ? undefined
              : handleGenerate
          }
        >
          {isGenerating ? (
            <>
              <Loader size={18} color="#0abff3" className="animate-spin" />
              <Text className="text-gray-300 font-medium text-base">生成中...</Text>
            </>
          ) : activeTab === 'product' && isConverting ? (
            <>
              <Loader size={18} color="#0abff3" className="animate-spin" />
              <Text className="text-gray-300 font-medium text-base">处理图片...</Text>
            </>
          ) : activeTab === 'product' && (!formData.image || !formData.imageBase64) ? (
            <Text className="text-gray-400 font-medium text-base">
              {formData.image ? '请等待图片处理' : '请先上传图片'}
            </Text>
          ) : (
            <Text className="text-white font-medium text-base">
              {activeTab === 'shop' ? '生成文案与配图' : '立即生成视频（50点）'}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default CreatePage
