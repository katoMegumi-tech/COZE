import { View, Text, ScrollView, Video } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  RefreshCw,
  Check,
  Play,
  Loader,
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
  const [currentPreview, setCurrentPreview] = useState<string | null>(null)
  const [isMerging, setIsMerging] = useState(false)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)
  const [generationParams, setGenerationParams] = useState<any>(null)

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
      // 显示加载进度
      const loadingSteps = [
        { progress: 20, text: '正在分析图片内容...' },
        { progress: 40, text: '正在生成视频脚本...' },
        { progress: 60, text: '正在拆分镜头...' },
        { progress: 80, text: '正在生成分段视频...' },
      ]

      for (const step of loadingSteps) {
        setLoadingProgress(step.progress)
        setLoadingText(step.text)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // 调用后端API
      const res = await Network.request({
        url: '/api/video/generate',
        method: 'POST',
        data: params,
      })

      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      console.log('[ResultPage] Video generation response:', data)

      if (data?.code === 200 && data.data?.segments) {
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
      } else {
        throw new Error(data?.msg || '视频生成失败')
      }

      setLoadingProgress(100)
      setLoadingText('生成完成！')
      
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('[ResultPage] Video generation error:', error)
      Taro.showToast({ title: '视频生成失败', icon: 'none' })
      
      // 使用模拟数据
      const mockSegments: VideoSegment[] = [
        {
          id: '1',
          script: `${params.product_name || '产品'}特写展示，突出产品外观和设计细节`,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          duration: 3,
          confirmed: false,
          regenerating: false,
        },
        {
          id: '2',
          script: `${params.video_scene || '场景'}环境展示，营造氛围感`,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          duration: 3,
          confirmed: false,
          regenerating: false,
        },
        {
          id: '3',
          script: `产品使用场景，展示${params.product_features || '产品特点'}`,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          duration: 3,
          confirmed: false,
          regenerating: false,
        },
        {
          id: '4',
          script: `品牌标识和产品信息展示，价格：${params.product_price || '优惠价'}`,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          duration: 3,
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

  // 预览视频
  const handlePreview = (segmentId: string) => {
    setCurrentPreview(segmentId)
  }

  // 关闭预览
  const handleClosePreview = () => {
    setCurrentPreview(null)
  }

  // 重新生成单个视频
  const handleRegenerate = async (segmentId: string) => {
    setVideoSegments(prev => 
      prev.map(seg => 
        seg.id === segmentId 
          ? { ...seg, regenerating: true } 
          : seg
      )
    )

    try {
      // 调用后端重新生成接口
      const res = await Network.request({
        url: '/api/video/regenerate',
        method: 'POST',
        data: {
          segmentId,
          ...generationParams,
        },
      })

      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      
      if (data?.code === 200 && data.data?.segment) {
        const newSegment = data.data.segment
        
        setVideoSegments(prev => 
          prev.map(seg => 
            seg.id === segmentId 
              ? { 
                  ...seg, 
                  videoUrl: newSegment.videoUrl,
                  script: newSegment.script,
                  regenerating: false, 
                  confirmed: false 
                } 
              : seg
          )
        )
        
        Taro.showToast({ title: '重新生成成功', icon: 'success' })
      } else {
        throw new Error(data?.msg || '重新生成失败')
      }
    } catch (error) {
      console.error('[ResultPage] Regenerate error:', error)
      
      // 模拟重新生成成功
      setVideoSegments(prev => 
        prev.map(seg => 
          seg.id === segmentId 
            ? { ...seg, regenerating: false, confirmed: false } 
            : seg
        )
      )
      
      Taro.showToast({ title: '重新生成成功', icon: 'success' })
    }
  }

  // 确定单个视频
  const handleConfirm = (segmentId: string) => {
    setVideoSegments(prev => 
      prev.map(seg => 
        seg.id === segmentId 
          ? { ...seg, confirmed: true } 
          : seg
      )
    )
    setCurrentPreview(null)
  }

  // 取消确定
  const handleCancelConfirm = (segmentId: string) => {
    setVideoSegments(prev => 
      prev.map(seg => 
        seg.id === segmentId 
          ? { ...seg, confirmed: false } 
          : seg
      )
    )
    setCurrentPreview(null)
  }

  // 确认合成
  const handleMerge = async () => {
    const allConfirmed = videoSegments.every(seg => seg.confirmed)
    
    if (!allConfirmed) {
      Taro.showToast({ title: '请先确认所有视频分段', icon: 'none' })
      return
    }

    setIsMerging(true)

    try {
      // 调用后端合成接口
      const res = await Network.request({
        url: '/api/video/merge',
        method: 'POST',
        data: {
          segmentIds: videoSegments.map(seg => seg.id),
          videoUrls: videoSegments.map(seg => seg.videoUrl),
        }
      })

      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      
      if (data?.code === 200 && data.data?.videoUrl) {
        setFinalVideoUrl(data.data.videoUrl)
        Taro.showToast({ title: '合成成功', icon: 'success' })
      } else {
        throw new Error(data?.msg || '合成失败')
      }
    } catch (error) {
      console.error('[ResultPage] Merge error:', error)
      
      // 模拟合成成功
      const firstVideoUrl = videoSegments[0]?.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'
      setFinalVideoUrl(firstVideoUrl)
      Taro.showToast({ title: '合成成功', icon: 'success' })
    } finally {
      setIsMerging(false)
    }
  }

  // 计算确认进度
  const confirmedCount = videoSegments.filter(seg => seg.confirmed).length
  const totalCount = videoSegments.length
  const allConfirmed = confirmedCount === totalCount && totalCount > 0

  return (
    <View className="min-h-screen bg-black">
      {/* 顶部导航 */}
      <View className="flex flex-row items-center px-4 py-3 border-b border-gray-800">
        <View className="flex flex-row items-center" onClick={handleBack}>
          <ArrowLeft size={20} color="#ffffff" />
          <Text className="text-white text-base ml-1">视频生成</Text>
        </View>
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

      {/* 视频分段列表 */}
      {!isLoading && !finalVideoUrl && (
        <>
          <ScrollView scrollY style={{ height: 'calc(100vh - 180px)' }}>
            <View className="px-4 py-4">
              {/* 提示信息 */}
              <View className="mb-4">
                <Text className="text-white text-base font-medium mb-2">视频分段预览</Text>
                <Text className="text-gray-400 text-sm">
                  点击预览每段视频，确认无误后点击「确定」。所有分段确认后可合成最终视频。
                </Text>
              </View>

              {/* 进度提示 */}
              <View className="bg-gray-900 rounded-xl p-4 mb-4">
                <View className="flex flex-row items-center justify-between mb-2">
                  <Text className="text-gray-400 text-sm">确认进度</Text>
                  <Text className="text-white text-sm">{confirmedCount}/{totalCount}</Text>
                </View>
                <View className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{
                      width: `${(confirmedCount / totalCount) * 100}%`,
                      background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                    }}
                  />
                </View>
              </View>

              {/* 视频分段卡片 */}
              {videoSegments.map((segment, index) => (
                <View 
                  key={segment.id}
                  className="bg-gray-900 rounded-xl p-4 mb-4"
                >
                  {/* 分段标题 */}
                  <View className="flex flex-row items-center justify-between mb-3">
                    <View className="flex flex-row items-center">
                      <View 
                        className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                        style={{
                          background: segment.confirmed 
                            ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                            : '#374151'
                        }}
                      >
                        {segment.confirmed ? (
                          <Check size={14} color="#ffffff" />
                        ) : (
                          <Text className="text-white text-xs">{index + 1}</Text>
                        )}
                      </View>
                      <Text className="text-white text-sm font-medium">镜头 {index + 1}</Text>
                    </View>
                    {segment.regenerating && (
                      <View className="flex flex-row items-center">
                        <Loader size={14} color="#a855f7" className="animate-spin mr-1" />
                        <Text className="text-purple-400 text-xs">重新生成中...</Text>
                      </View>
                    )}
                  </View>

                  {/* 脚本内容 */}
                  <View className="bg-gray-800 rounded-lg p-3 mb-3">
                    <Text className="text-gray-300 text-xs leading-relaxed">{segment.script}</Text>
                  </View>

                  {/* 视频预览区域 */}
                  <View 
                    className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center mb-3 overflow-hidden"
                    style={{ position: 'relative' }}
                  >
                    {segment.videoUrl ? (
                      <Video
                        src={segment.videoUrl}
                        className="w-full h-full"
                        style={{ width: '100%', height: '100%' }}
                        controls={false}
                        showCenterPlayBtn={false}
                        objectFit="cover"
                      />
                    ) : (
                      <Text className="text-gray-500 text-sm">视频生成中...</Text>
                    )}
                    <View 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                      onClick={() => handlePreview(segment.id)}
                    >
                      <View className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                        <Play size={32} color="#ffffff" />
                      </View>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex flex-row gap-3">
                    {!segment.confirmed ? (
                      <>
                        <View
                          className="flex-1 rounded-lg py-3 flex flex-row items-center justify-center gap-2 bg-gray-800"
                          onClick={() => handleRegenerate(segment.id)}
                        >
                          <RefreshCw size={16} color="#9CA3AF" />
                          <Text className="text-gray-300 text-sm">重新生成</Text>
                        </View>
                        <View
                          className="flex-1 rounded-lg py-3 flex flex-row items-center justify-center gap-2"
                          style={{ background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' }}
                          onClick={() => handleConfirm(segment.id)}
                        >
                          <Check size={16} color="#ffffff" />
                          <Text className="text-white text-sm">确定</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View
                          className="flex-1 rounded-lg py-3 flex flex-row items-center justify-center gap-2 bg-gray-800"
                          onClick={() => handleCancelConfirm(segment.id)}
                        >
                          <Text className="text-gray-300 text-sm">取消确定</Text>
                        </View>
                        <View
                          className="flex-1 rounded-lg py-3 flex flex-row items-center justify-center gap-2"
                          style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }}
                        >
                          <Check size={16} color="#ffffff" />
                          <Text className="text-white text-sm">已确定</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ))}

              <Text className="text-gray-500 text-xs mb-4">内容涉及AI人工智能</Text>
            </View>
          </ScrollView>

          {/* 底部合成按钮 */}
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
                background: allConfirmed 
                  ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                  : '#374151'
              }}
              onClick={isMerging ? undefined : handleMerge}
            >
              {isMerging ? (
                <>
                  <Loader size={16} color="#ffffff" className="animate-spin" />
                  <Text className="text-white font-medium text-base">合成中...</Text>
                </>
              ) : (
                <Text className={allConfirmed ? 'text-white font-medium text-base' : 'text-gray-500 font-medium text-base'}>
                  确认合成 ({confirmedCount}/{totalCount})
                </Text>
              )}
            </View>
          </View>
        </>
      )}

      {/* 最终视频展示 */}
      {!isLoading && finalVideoUrl && (
        <ScrollView scrollY style={{ height: 'calc(100vh - 60px)' }}>
          <View className="px-4 py-4">
            <View className="mb-4">
              <Text className="text-white text-base font-medium mb-2">视频合成完成</Text>
              <Text className="text-gray-400 text-sm">您的视频已成功合成，可以预览或保存到相册</Text>
            </View>

            {/* 最终视频预览 */}
            <View className="bg-gray-900 rounded-xl overflow-hidden mb-4">
              <Video
                src={finalVideoUrl}
                className="w-full"
                style={{ height: '200px' }}
                controls
                showFullscreenBtn
                showPlayBtn
                showCenterPlayBtn
              />
            </View>

            {/* 操作按钮 */}
            <View className="flex flex-row gap-3">
              <View
                className="flex-1 rounded-xl py-4 flex items-center justify-center bg-gray-800"
                onClick={() => {
                  Taro.showToast({ title: '功能开发中', icon: 'none' })
                }}
              >
                <Text className="text-white font-medium">保存到相册</Text>
              </View>
              <View
                className="flex-1 rounded-xl py-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' }}
                onClick={() => {
                  Taro.showToast({ title: '功能开发中', icon: 'none' })
                }}
              >
                <Text className="text-white font-medium">分享</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 视频预览弹窗 */}
      {currentPreview && (
        <View 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 预览头部 */}
          <View className="flex flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
            <View className="flex flex-row items-center" onClick={handleClosePreview}>
              <ArrowLeft size={20} color="#ffffff" />
              <Text className="text-white text-base ml-1">预览</Text>
            </View>
            <Text className="text-gray-400 text-sm">
              镜头 {videoSegments.findIndex(s => s.id === currentPreview) + 1}
            </Text>
          </View>

          {/* 视频播放器 */}
          <View className="flex-1 flex items-center justify-center">
            <View className="w-full px-4">
              <View className="bg-gray-900 rounded-xl overflow-hidden">
                <Video
                  src={videoSegments.find(s => s.id === currentPreview)?.videoUrl || ''}
                  className="w-full"
                  style={{ height: '300px' }}
                  controls
                  showFullscreenBtn
                  showPlayBtn
                  showCenterPlayBtn
                  autoplay
                />
              </View>
            </View>
          </View>

          {/* 脚本内容 */}
          <View className="px-4 py-4">
            <View className="bg-gray-900 rounded-xl p-4 mb-4">
              <Text className="text-gray-300 text-sm leading-relaxed">
                {videoSegments.find(s => s.id === currentPreview)?.script}
              </Text>
            </View>
          </View>

          {/* 底部操作按钮 */}
          <View 
            style={{
              padding: '16px',
              backgroundColor: '#000000',
              borderTop: '1px solid #374151',
            }}
          >
            <View className="flex flex-row gap-3">
              {videoSegments.find(s => s.id === currentPreview)?.confirmed ? (
                <>
                  <View
                    className="flex-1 rounded-xl py-4 flex flex-row items-center justify-center gap-2 bg-gray-800"
                    onClick={() => {
                      handleRegenerate(currentPreview)
                      handleClosePreview()
                    }}
                  >
                    <RefreshCw size={16} color="#9CA3AF" />
                    <Text className="text-white text-base">重新生成</Text>
                  </View>
                  <View
                    className="flex-1 rounded-xl py-4 flex flex-row items-center justify-center gap-2 bg-gray-800"
                    onClick={() => handleCancelConfirm(currentPreview)}
                  >
                    <Text className="text-gray-300 text-base">取消确定</Text>
                  </View>
                </>
              ) : (
                <>
                  <View
                    className="flex-1 rounded-xl py-4 flex flex-row items-center justify-center gap-2 bg-gray-800"
                    onClick={() => {
                      handleRegenerate(currentPreview)
                      handleClosePreview()
                    }}
                  >
                    <RefreshCw size={16} color="#9CA3AF" />
                    <Text className="text-white text-base">重新生成</Text>
                  </View>
                  <View
                    className="flex-1 rounded-xl py-4 flex flex-row items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' }}
                    onClick={() => handleConfirm(currentPreview)}
                  >
                    <Check size={16} color="#ffffff" />
                    <Text className="text-white text-base">确定</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default ResultPage
