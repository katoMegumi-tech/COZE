import { View, Text, ScrollView, Video, Image as TaroImage } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  RefreshCw,
  Loader,
  Download,
  Share2,
} from 'lucide-react-taro'
import { Network } from '@/network'
import { runCozeWorkflow, WorkflowProgress } from '@/utils/coze-workflow'

type VideoSegment = {
  id: string
  script: string
  videoUrl: string
  duration: number
  confirmed: boolean
  regenerating: boolean
}

const ResultPage: FC = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [, setLoadingProgress] = useState(0)
  const [, setLoadingText] = useState('正在准备...')
  const [isCopyMode, setIsCopyMode] = useState(false)
  const [copyImagePath, setCopyImagePath] = useState<string>('')
  const [copyVariants, setCopyVariants] = useState<
    Array<{ label: string; title: string; content: string; fullText: string }>
  >([])
  const [activeCopyIndex, setActiveCopyIndex] = useState(0)
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([])
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [generationParams, setGenerationParams] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [, setCurrentNode] = useState<string>('')

  useEffect(() => {
    const buildCopyVariantsFromRaw = (raw: any) => {
      const name = raw.productOrServiceName || raw.productName || ''
      const type = raw.copywritingType || ''
      const points = raw.coreSellingPoints || ''
      const audience = raw.targetAudience || ''
      const scene = raw.usageScenario || ''
      const tone = raw.toneStyle || ''
      const keywords = raw.keywords || ''
      const limit = raw.wordLimit || ''
      const structure = raw.structurePreference || ''
      const forbidden = raw.forbiddenWords || ''
      const links = raw.referenceLinks || ''

      const bulletParts = [
        points ? `卖点：${points}` : '',
        audience ? `受众：${audience}` : '',
        scene ? `场景：${scene}` : '',
        tone ? `风格：${tone}` : '',
        keywords ? `关键词：${keywords}` : '',
        limit ? `字数：${limit}` : '',
        structure ? `结构：${structure}` : '',
        forbidden ? `避开：${forbidden}` : '',
        links ? `参考：${links}` : '',
      ].filter(Boolean)

      const titleSeed = [
        name ? name : '推广文案',
        points ? points.split(/[，,、]/)[0] : '',
      ]
        .filter(Boolean)
        .join('｜')

      const mk = (label: string, title: string, contentLines: string[]) => {
        const content = contentLines.filter(Boolean).join('\n')
        const fullText = [`标题：${title}`, '', content].join('\n')
        return { label, title, content, fullText }
      }

      const baseCta = type.includes('邮件')
        ? '回复“再来3版”，我可以输出不同风格的邮件主题/正文/结尾。'
        : '回复“再来3版”，我可以再生成不同风格版本。'

      const v1 = mk(
        '推荐',
        titleSeed || '推广文案',
        [
          type ? `适用：${type}` : '',
          bulletParts.length ? bulletParts.join('\n') : '基于你填写的信息生成一段可直接使用的推广文案。',
          '',
          baseCta,
        ],
      )

      const v2Title = name ? `${name}｜一眼心动的${scene || '场景'}文案` : '一眼心动的推广文案'
      const v2 = mk(
        '种草',
        v2Title,
        [
          points ? `这次我想把“${points}”讲得更具体、更有画面感。` : '这次我想把卖点讲得更具体、更有画面感。',
          audience ? `写给：${audience}` : '',
          scene ? `出现位置：${scene}` : '',
          keywords ? `记得带上关键词：${keywords}` : '',
          forbidden ? `避雷：${forbidden}` : '',
          '',
          baseCta,
        ],
      )

      const v3Title = name ? `${name}｜${points ? points.split(/[，,、]/)[0] : '核心卖点'}（精简版）` : '精简版推广文案'
      const v3 = mk(
        '精简',
        v3Title,
        [
          points ? `一句话卖点：${points}` : '',
          scene ? `场景：${scene}` : '',
          keywords ? `关键词：${keywords}` : '',
          audience ? `受众：${audience}` : '',
          limit ? `字数要求：${limit}` : '',
          '',
          '需要我把精简版扩写成3段式/对比结构吗？',
        ],
      )

      const ordered = [v1, v2, v3]
      const compact = ordered.map(v => ({
        ...v,
        title: v.title || '推广文案',
        content: v.content || '（暂无内容）',
      }))

      return compact
    }

    const ensureLocalImagePath = async (): Promise<string> => {
      try {
        const res = await Taro.getImageInfo({ src: '/assets/tabbar/house.png' })
        return (res as any).path || (res as any).tempFilePath || ''
      } catch {
        return ''
      }
    }

    const mock = (router.params as any)?.mock
    if (mock === '1') {
      ; (async () => {
        // 不再尝试加载本地图片，直接设置为空字符串
        const imagePath = ''
        const raw = {
          mode: 'shop',
          copywritingType: '小红书笔记',
          productOrServiceName: '智能保温杯',
          coreSellingPoints: '长效保温12小时、智能温度显示、防漏水设计',
          targetAudience: '25-35岁上班族，关注健康，喜欢户外运动',
          usageScenario: '电商主图',
          toneStyle: '轻松活泼，带点幽默感',
          keywords: '黑科技、便携、礼盒包装',
          wordLimit: '150-200字',
          structurePreference: '痛点开头→解决方案→呼吁行动',
          forbiddenWords: '不要出现“最低价”、避免负面情绪',
          referenceLinks: 'https://example.com',
        }

        setIsCopyMode(true)
        setCopyImagePath(imagePath)
        setCopyVariants(buildCopyVariantsFromRaw(raw))
        setActiveCopyIndex(0)
        setIsLoading(false)
      })()
      return
    }

    // 从本地存储读取参数
    const imagePath = Taro.getStorageSync('video_gen_image')
    const paramsStr = Taro.getStorageSync('video_gen_params')

    console.log('[ResultPage] Image path:', imagePath)
    console.log('[ResultPage] Params string:', paramsStr)

    if (!imagePath || !paramsStr) {
      setErrorMessage('缺少生成参数，请重新选择图片')
      setIsLoading(false)
      return
    }

    const params = JSON.parse(paramsStr)
    console.log('[ResultPage] Parsed params:', params)

    // 解析参数
    const creationStyleMap: Record<string, string> = {
      fashion: '时尚',
      tech: '科技',
      nature: '自然',
      luxury: '奢华',
    }

    const derivedProductName =
      params.productOrServiceName ||
      params.productName ||
      params.shopName ||
      ''

    const derivedScene =
      params.usageScenario ||
      params.backgroundScene ||
      params.shopAddress ||
      ''

    const derivedStyle =
      params.toneStyle ||
      creationStyleMap[params.creationStyle] ||
      '时尚'

    const derivedDesc = (() => {
      if (params.prompt) return params.prompt
      if (params.coreSellingPoints) return params.coreSellingPoints
      if (params.businessScope) return params.businessScope

      const parts: string[] = []
      if (params.productFeature) parts.push(params.productFeature)
      if (derivedScene) parts.push(`场景：${derivedScene}`)
      if (params.priceRecommendation) parts.push(`价格：${params.priceRecommendation}`)
      return parts.join('\n')
    })()

    const parsedParams = {
      images: [imagePath],
      mode: params.mode,
      // 产品相关参数
      product_name: derivedProductName,
      product_desc: derivedDesc || derivedProductName,
      product_features: params.keywords || params.productFeature || '',
      product_price: params.priceRecommendation || '',
      // 视频相关参数
      video_scene: derivedScene,
      video_style: derivedStyle,
      video_aspect_ratio: params.videoFormat === 'horizontal' ? '16:9' : '9:16',
      video_length: params.videoLength || 10,
      video_num: params.generationCount || 1,
      video_resolution: params.resolution || '720P',
      video_subtitle: params.subtitleOption !== 'hide',
    }

    setGenerationParams(parsedParams)

    // 清除本地存储（避免重复使用）
    Taro.removeStorageSync('video_gen_image')
    Taro.removeStorageSync('video_gen_params')

    if (params.mode === 'shop') {
      setIsCopyMode(true)

      // 检查图片路径是否有效
      if (imagePath && !imagePath.startsWith('http') && !imagePath.includes('://')) {
        // 尝试获取有效的本地图片路径
        const ensureLocalImagePath = async (): Promise<string> => {
          try {
            const res = await Taro.getImageInfo({ src: imagePath })
            return (res as any).path || (res as any).tempFilePath || ''
          } catch {
            // 如果获取失败，返回空字符串
            return ''
          }
        }

        // 异步获取图片路径
        ensureLocalImagePath().then((validPath) => {
          setCopyImagePath(validPath)
        })
      } else {
        // 图片路径已经是有效的 URL 或本地路径
        setCopyImagePath(imagePath)
      }

      // 检查是否有后端返回的文案内容
      if (params.generatedContent) {
        // 清理文案中的多余#号
        const cleanContent = params.generatedContent
          .replace(/^###\s+/gm, '') // 移除行首的###
          .replace(/^##\s+/gm, '')  // 移除行首的##
          .replace(/^#\s+/gm, '')   // 移除行首的#

        // 使用后端返回的文案内容
        const copyVariantsFromAPI = [
          {
            label: '推荐',
            title: params.productOrServiceName || '推广文案',
            content: cleanContent,
            fullText: `${params.productOrServiceName || '推广文案'}\n\n${cleanContent}`
          }
        ]
        setCopyVariants(copyVariantsFromAPI)
      } else {
        // 使用默认模板生成文案
        setCopyVariants(buildCopyVariantsFromRaw(params))
      }

      setActiveCopyIndex(0)
      setIsLoading(false)
      return
    }

    // 调用视频生成
    generateVideo(parsedParams)
  }, [])

  // 调用Coze工作流生成视频
  const generateVideo = async (params: any) => {
    try {
      setErrorMessage(null)
      setLoadingProgress(5)
      setLoadingText('正在生成视频...')

      console.log('[ResultPage] Starting workflow with params:', {
        ...params,
        images: params.images?.length ? `${params.images.length} images` : 'no images'
      })

      // 检查图片是否为本地路径，如果是则转换为base64
      let imageUrls = params.images
      if (params.images?.length > 0 && params.images[0].startsWith('http')) {
        // 已经是URL，直接使用
        console.log('[ResultPage] Using image URL:', params.images[0])
      }

      // 进度回调
      const handleProgress = (progress: WorkflowProgress) => {
        console.log('[ResultPage] Progress:', progress)

        // 更新节点信息
        if (progress.nodeTitle) {
          setCurrentNode(progress.nodeTitle)
        }

        // 更新进度文本
        if (progress.event === 'Message') {
          if (progress.nodeTitle === 'End' || progress.isFinish) {
            setLoadingProgress(90)
            setLoadingText('视频生成完成，正在加载...')
          } else {
            setLoadingProgress(50)
            setLoadingText(`正在执行: ${progress.nodeTitle || '处理中'}...`)
          }
        } else if (progress.event === 'Done') {
          setLoadingProgress(95)
          setLoadingText('工作流完成')
        }
      }

      // 调用Coze工作流
      const result = await runCozeWorkflow({
        images: imageUrls,
        product_desc: params.product_desc,
        product_features: params.product_features,
        product_name: params.product_name,
        product_price: params.product_price,
        video_aspect_ratio: params.video_aspect_ratio,
        video_length: params.video_length,
        video_num: params.video_num,
        video_resolution: params.video_resolution,
        video_scene: params.video_scene,
        video_style: params.video_style,
        video_subtitle: params.video_subtitle,
      }, handleProgress)

      console.log('[ResultPage] Workflow result:', result)

      if (result.success && result.videoUrl) {
        // 成功获取视频URL
        const segments: VideoSegment[] = [{
          id: 'seg_0',
          script: params.product_desc || params.product_name || 'AI生成视频',
          videoUrl: result.videoUrl,
          duration: params.video_length || 10,
          confirmed: false,
          regenerating: false,
        }]

        setVideoSegments(segments)
        setLoadingProgress(100)
        setLoadingText('生成完成！')

        console.log('[ResultPage] ✓ Video generated successfully:', result.videoUrl)

        setTimeout(() => {
          setIsLoading(false)
        }, 500)
      } else {
        throw new Error(result.error || '视频生成失败')
      }
    } catch (err: any) {
      console.error('[ResultPage] Video generation error:', err)
      setErrorMessage(err.message || '视频生成失败')
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    Taro.showModal({
      title: '提示',
      content: '返回将丢失当前生成的内容，确定返回吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack()
        }
      }
    })
  }

  // 重新生成视频
  const handleRegenerate = async () => {
    if (!generationParams || isRegenerating) return

    setIsRegenerating(true)

    try {
      const result = await runCozeWorkflow({
        images: generationParams.images,
        product_desc: generationParams.product_desc,
        product_features: generationParams.product_features,
        product_name: generationParams.product_name,
        product_price: generationParams.product_price,
        video_aspect_ratio: generationParams.video_aspect_ratio,
        video_length: generationParams.video_length,
        video_num: generationParams.video_num,
        video_resolution: generationParams.video_resolution,
        video_scene: generationParams.video_scene,
        video_style: generationParams.video_style,
        video_subtitle: generationParams.video_subtitle,
      })

      if (result.success && result.videoUrl) {
        setVideoSegments([{
          id: 'seg_0',
          script: generationParams.product_desc || '重新生成的视频',
          videoUrl: result.videoUrl,
          duration: generationParams.video_length || 10,
          confirmed: false,
          regenerating: false,
        }])

        Taro.showToast({ title: '重新生成成功', icon: 'success' })
      } else {
        throw new Error(result.error || '重新生成失败')
      }
    } catch (err: any) {
      console.error('[ResultPage] Regenerate error:', err)
      Taro.showToast({ title: '重新生成失败', icon: 'none' })
    } finally {
      setIsRegenerating(false)
    }
  }

  // 保存视频到相册
  const handleSave = async () => {
    const videoUrl = videoSegments[0]?.videoUrl
    if (!videoUrl) {
      Taro.showToast({ title: '暂无视频', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '保存中...' })

      // 下载视频
      const downloadRes = await Network.downloadFile({
        url: videoUrl,
      })

      // 保存到相册
      await Taro.saveVideoToPhotosAlbum({
        filePath: downloadRes.tempFilePath,
      })

      Taro.hideLoading()
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (err: any) {
      Taro.hideLoading()
      console.error('[ResultPage] Save video error:', err)

      if (err.errMsg?.includes('auth deny')) {
        Taro.showModal({
          title: '提示',
          content: '需要您授权保存相册权限',
          success: (res) => {
            if (res.confirm) {
              Taro.openSetting()
            }
          }
        })
      } else {
        Taro.showToast({ title: '保存失败', icon: 'none' })
      }
    }
  }

  // 分享视频
  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' })
  }

  // 获取当前视频
  const currentVideo = videoSegments[0]
  const pageTitle = isCopyMode ? '文案生成' : '视频生成'
  const activeCopy = copyVariants[activeCopyIndex]

  return (
    <View className="min-h-screen bg-black">
      {/* 顶部导航 */}
      <View className="flex flex-row items-center px-4 py-3 border-b border-gray-800">
        <View className="flex flex-row items-center" onClick={handleBack}>
          <ArrowLeft size={20} color="#ffffff" />
          <Text className="text-white text-base ml-1">{pageTitle}</Text>
        </View>
        {!isLoading && (currentVideo || isCopyMode) && (
          <View className="ml-auto">
            <Text className="text-green-500 text-sm">✓ 生成完成</Text>
          </View>
        )}
      </View>

      {!isLoading && isCopyMode && (
        <ScrollView scrollY style={{ height: 'calc(100vh - 60px)' }}>
          <View className="px-4 py-4">
            <View className="bg-gray-900 rounded-xl p-4 mb-4">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-white text-base font-semibold">生成成功</Text>
                <View
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                >
                  <Text className="text-green-400 text-xs">✓ 已生成</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs mt-2">
                可复制文案、保存配图，支持多版本切换
              </Text>
            </View>

            <View className="bg-gray-900 rounded-xl p-4 mb-4">
              <View className="flex flex-row items-center justify-between mb-3">
                <Text className="text-white text-sm font-medium">文案版本</Text>
                <Text className="text-gray-400 text-xs">
                  {copyVariants.length ? `${activeCopyIndex + 1}/${copyVariants.length}` : '0/0'}
                </Text>
              </View>

              <View className="flex flex-row flex-wrap gap-2 mb-4">
                {copyVariants.map((v, idx) => (
                  <View
                    key={`${v.label}_${idx}`}
                    className="rounded-full px-4 py-2"
                    style={{
                      background: activeCopyIndex === idx
                        ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                        : '#1f2937',
                      borderWidth: activeCopyIndex === idx ? 0 : 1,
                      borderColor: '#a855f7',
                    }}
                    onClick={() => setActiveCopyIndex(idx)}
                  >
                    <Text className="text-white text-sm">{v.label}</Text>
                  </View>
                ))}
              </View>

              <View className="bg-gray-800 rounded-lg p-3 mb-3">
                <View className="mb-1">
                  <Text className="text-gray-300 text-xs">标题</Text>
                </View>
                <View>
                  <Text className="text-white text-base font-semibold">
                    {activeCopy?.title || '推广文案'}
                  </Text>
                </View>
              </View>

              <View className="bg-gray-800 rounded-lg p-3">
                <View className="mb-1">
                  <Text className="text-gray-300 text-xs">正文</Text>
                </View>
                <View>
                  <Text className="text-gray-200 text-sm leading-relaxed">
                    {activeCopy?.content || '（暂无内容）'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex flex-row gap-3 mb-3">
              <View
                className="flex-1 bg-gray-800 rounded-xl py-4 flex flex-row items-center justify-center gap-2"
                onClick={async () => {
                  try {
                    await Taro.setClipboardData({ data: activeCopy?.fullText || '' })
                    Taro.showToast({ title: '已复制', icon: 'success' })
                  } catch {
                    Taro.showToast({ title: '复制失败', icon: 'none' })
                  }
                }}
              >
                <Text className="text-white text-base">复制当前版本</Text>
              </View>
            </View>

            <View
              className="bg-gray-800 rounded-xl py-4 flex flex-row items-center justify-center"
              onClick={() => {
                if (!copyVariants.length) return
                const rotated = [...copyVariants.slice(1), copyVariants[0]]
                setCopyVariants(rotated)
                setActiveCopyIndex(0)
                Taro.showToast({ title: '已切换新版本', icon: 'success' })
              }}
            >
              <Text className="text-purple-400 text-base font-medium">再来 3 版（开发态）</Text>
            </View>

            <View className="mt-6 mb-4">
              <Text className="text-gray-500 text-xs text-center">
                内容涉及AI人工智能
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <View className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 60px)' }}>
          <Loader size={64} color="#0abff3" className="animate-spin" />
          <Text className="text-white text-base mt-4">
            {isCopyMode ? '正在生成文案...' : '正在生成视频...'}
          </Text>
        </View>
      )}

      {/* 视频展示区域 */}
      {!isLoading && !isCopyMode && currentVideo && (
        <ScrollView scrollY style={{ height: 'calc(100vh - 60px)' }}>
          <View className="px-4 py-4">
            {/* 视频播放器 */}
            <View className="bg-gray-900 rounded-2xl overflow-hidden mb-4">
              <Video
                src={currentVideo.videoUrl}
                className="w-full"
                style={{
                  width: '100%',
                  height: currentVideo.videoUrl.includes('16:9') ? '240px' : '400px'
                }}
                controls
                showFullscreenBtn
                showPlayBtn
                showCenterPlayBtn
                autoplay={false}
                objectFit="contain"
              />
            </View>

            {/* 视频信息 */}
            <View className="bg-gray-900 rounded-xl p-4 mb-4">
              <View className="flex flex-row items-center justify-between mb-2">
                <Text className="text-white text-sm font-medium">视频信息</Text>
                <Text className="text-gray-400 text-xs">时长: {currentVideo.duration}秒</Text>
              </View>
              <View className="bg-gray-800 rounded-lg p-3">
                <Text className="text-gray-300 text-sm leading-relaxed">
                  {currentVideo.script}
                </Text>
              </View>
            </View>

            {/* 错误提示 */}
            {errorMessage && (
              <View className="bg-orange-900 border border-orange-500 rounded-xl p-4 mb-4" style={{ opacity: 0.3 }}>
                <Text className="text-orange-400 text-sm">{errorMessage}</Text>
                <Text className="text-gray-400 text-xs mt-1">已使用演示视频代替</Text>
              </View>
            )}

            {/* 操作按钮 */}
            <View className="space-y-3">
              {/* 重新生成 */}
              <View
                className="bg-gray-800 rounded-xl py-4 flex flex-row items-center justify-center gap-2"
                onClick={isRegenerating ? undefined : handleRegenerate}
              >
                {isRegenerating ? (
                  <>
                    <Loader size={18} color="#a855f7" className="animate-spin" />
                    <Text className="text-gray-300 text-base">重新生成中...</Text>
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} color="#a855f7" />
                    <Text className="text-purple-400 text-base font-medium">重新生成</Text>
                  </>
                )}
              </View>

              {/* 保存和分享 */}
              <View className="flex flex-row gap-3">
                <View
                  className="flex-1 bg-gray-800 rounded-xl py-4 flex flex-row items-center justify-center gap-2"
                  onClick={handleSave}
                >
                  <Download size={18} color="#ffffff" />
                  <Text className="text-white text-base">保存相册</Text>
                </View>
                <View
                  className="flex-1 rounded-xl py-4 flex flex-row items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' }}
                  onClick={handleShare}
                >
                  <Share2 size={18} color="#ffffff" />
                  <Text className="text-white text-base font-medium">分享</Text>
                </View>
              </View>
            </View>

            {/* 提示信息 */}
            <View className="mt-6 mb-4">
              <Text className="text-gray-500 text-xs text-center">
                内容涉及AI人工智能
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 空状态 */}
      {!isLoading && !isCopyMode && !currentVideo && (
        <View className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 60px)' }}>
          <Text className="text-gray-400 text-base mb-4">视频生成失败</Text>
          <View
            className="bg-purple-600 rounded-xl px-6 py-3"
            onClick={() => generationParams && generateVideo(generationParams)}
          >
            <Text className="text-white text-base">重新生成</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default ResultPage