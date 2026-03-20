import { View, Text, ScrollView, Video } from '@tarojs/components'
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
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('正在分析图片内容...')
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([])
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [generationParams, setGenerationParams] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // 获取路由参数
    const params = router.params
    console.log('[ResultPage] Route params:', params)
    
    // 解析参数
    const parsedParams = {
      images: params.imageUrl ? [decodeURIComponent(params.imageUrl)] : [],
      mode: params.mode,
      // 产品相关参数
      product_name: params.shopName || params.productName || '',
      product_desc: params.prompt || params.businessScope || '',
      product_features: params.productFeature || '',
      product_price: params.priceRecommendation || '',
      // 视频相关参数
      video_scene: params.shopAddress || params.backgroundScene || '',
      video_style: params.creationStyle || '时尚',
      video_aspect_ratio: params.videoFormat === 'horizontal' ? '16:9' : '9:16',
      video_length: parseInt(params.videoLength || '10'),
      video_num: parseInt(params.generationCount || '1'),
      video_resolution: params.resolution || '720P',
      video_subtitle: params.subtitleOption !== 'hide',
    }
    
    setGenerationParams(parsedParams)
    
    // 调用视频生成API
    generateVideo(parsedParams)
  }, [])

  // 调用后端视频生成API
  const generateVideo = async (params: any) => {
    try {
      setErrorMessage(null)
      
      // 显示加载进度
      const loadingSteps = [
        { progress: 10, text: '正在连接服务器...' },
        { progress: 20, text: '图片上传成功，开始生成...' },
        { progress: 40, text: '正在分析图片内容...' },
        { progress: 60, text: '正在生成视频中...' },
        { progress: 80, text: '正在处理视频...' },
      ]

      // 模拟前期进度
      for (const step of loadingSteps) {
        setLoadingProgress(step.progress)
        setLoadingText(step.text)
        await new Promise(resolve => setTimeout(resolve, 600))
      }

      console.log('[ResultPage] Calling API with params:', {
        ...params,
        images: params.images?.length ? `${params.images.length} images` : 'no images'
      })

      // 调用后端API
      const res = await Network.request({
        url: '/api/video/generate',
        method: 'POST',
        data: params,
      })

      console.log('[ResultPage] API response:', res)

      // 解析响应
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      console.log('[ResultPage] Parsed response data:', data)

      // 更新进度
      setLoadingProgress(90)
      setLoadingText('视频生成完成，正在加载...')

      if (data?.code === 200 && data.data?.segments && data.data.segments.length > 0) {
        // 转换后端数据格式
        const segments: VideoSegment[] = data.data.segments.map((seg: any) => ({
          id: seg.id,
          script: seg.script,
          videoUrl: seg.videoUrl,
          duration: seg.duration,
          confirmed: false,
          regenerating: false,
        }))
        
        setVideoSegments(segments)
        setLoadingProgress(100)
        setLoadingText('生成完成！')
        
        console.log('[ResultPage] ✓ Video generated successfully')
      } else {
        throw new Error(data?.msg || '视频生成失败，请重试')
      }

      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    } catch (err: any) {
      console.error('[ResultPage] Video generation error:', err)
      setErrorMessage(err.message || '视频生成失败')
      
      // 使用模拟数据（用于演示）
      const mockSegments: VideoSegment[] = [
        {
          id: 'seg_0',
          script: params.product_desc || 'AI生成视频（演示）',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          duration: params.video_length || 10,
          confirmed: false,
          regenerating: false,
        },
      ]
      
      setVideoSegments(mockSegments)
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
      const res = await Network.request({
        url: '/api/video/regenerate',
        method: 'POST',
        data: {
          segmentId: videoSegments[0]?.id,
          ...generationParams,
        },
      })

      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      
      if (data?.code === 200 && data.data?.segment) {
        const newSegment = data.data.segment
        
        setVideoSegments([{
          id: newSegment.id || 'seg_0',
          videoUrl: newSegment.videoUrl,
          script: newSegment.script,
          duration: newSegment.duration,
          confirmed: false,
          regenerating: false,
        }])
        
        Taro.showToast({ title: '重新生成成功', icon: 'success' })
      } else {
        throw new Error(data?.msg || '重新生成失败')
      }
    } catch (err) {
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

  return (
    <View className="min-h-screen bg-black">
      {/* 顶部导航 */}
      <View className="flex flex-row items-center px-4 py-3 border-b border-gray-800">
        <View className="flex flex-row items-center" onClick={handleBack}>
          <ArrowLeft size={20} color="#ffffff" />
          <Text className="text-white text-base ml-1">视频生成</Text>
        </View>
        {!isLoading && currentVideo && (
          <View className="ml-auto">
            <Text className="text-green-500 text-sm">✓ 生成完成</Text>
          </View>
        )}
      </View>

      {/* 加载状态 */}
      {isLoading && (
        <View className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 60px)' }}>
          <View className="relative w-32 h-32 mb-6">
            <Loader size={64} color="#a855f7" className="animate-spin" />
            <View className="absolute inset-0 flex items-center justify-center">
              <Text className="text-white text-lg font-bold">{loadingProgress}%</Text>
            </View>
          </View>
          <Text className="text-white text-base mb-2">{loadingText}</Text>
          <Text className="text-gray-500 text-sm">请稍候，AI正在为您创作...</Text>
        </View>
      )}

      {/* 视频展示区域 */}
      {!isLoading && currentVideo && (
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
      {!isLoading && !currentVideo && (
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
