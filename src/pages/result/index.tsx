import { View, Text, ScrollView, Video } from '@tarojs/components'
import Taro from '@tarojs/taro'
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
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('正在准备...')
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([])
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [generationParams, setGenerationParams] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentNode, setCurrentNode] = useState<string>('')

  useEffect(() => {
    // 从本地存储读取参数
    const imageBase64 = Taro.getStorageSync('video_gen_image')
    const paramsStr = Taro.getStorageSync('video_gen_params')
    
    console.log('[ResultPage] Image base64 length:', imageBase64?.length)
    console.log('[ResultPage] Params string:', paramsStr)
    
    if (!imageBase64 || !paramsStr) {
      setErrorMessage('缺少生成参数，请重新选择图片')
      setIsLoading(false)
      return
    }
    
    const params = JSON.parse(paramsStr)
    console.log('[ResultPage] Parsed params:', params)
    
    // 解析参数
    const parsedParams = {
      images: [imageBase64],  // 使用base64图片
      mode: params.mode,
      // 产品相关参数
      product_name: params.shopName || '',
      product_desc: params.prompt || params.businessScope || '',
      product_features: '',
      product_price: '',
      // 视频相关参数
      video_scene: params.shopAddress || '',
      video_style: '时尚',
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
    
    // 调用视频生成
    generateVideo(parsedParams)
  }, [])

  // 调用Coze工作流生成视频
  const generateVideo = async (params: any) => {
    try {
      setErrorMessage(null)
      setLoadingProgress(5)
      setLoadingText('正在连接Coze服务...')

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
          script: params.product_desc || 'AI生成视频',
          videoUrl: result.videoUrl,
          duration: params.video_length || 10,
          confirmed: false,
          regenerating: false,
        }]
        
        setVideoSegments(segments)
        setLoadingProgress(100)
        setLoadingText('生成完成！')
        
        console.log('[ResultPage] ✓ Video generated successfully')
      } else {
        throw new Error(result.error || '视频生成失败')
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
          {currentNode && (
            <Text className="text-gray-500 text-sm">当前节点: {currentNode}</Text>
          )}
          <Text className="text-gray-500 text-sm mt-2">请稍候，Coze正在为您创作...</Text>
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
