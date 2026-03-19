import { View, Text, ScrollView, Video } from '@tarojs/components'
import Taro from '@tarojs/taro'
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
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('正在分析图片内容...')
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([])
  const [currentPreview, setCurrentPreview] = useState<string | null>(null)
  const [isMerging, setIsMerging] = useState(false)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    // 模拟加载进度
    simulateLoading()
  }, [])

  // 模拟加载和生成过程
  const simulateLoading = async () => {
    const steps = [
      { progress: 20, text: '正在分析图片内容...' },
      { progress: 40, text: '正在生成视频脚本...' },
      { progress: 60, text: '正在拆分镜头...' },
      { progress: 80, text: '正在生成分段视频...' },
      { progress: 100, text: '生成完成！' },
    ]

    for (const step of steps) {
      setLoadingProgress(step.progress)
      setLoadingText(step.text)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 模拟生成的视频分段数据
    const mockSegments: VideoSegment[] = [
      {
        id: '1',
        script: '店铺门头特写，展示品牌标识和店铺特色',
        videoUrl: 'https://example.com/video1.mp4',
        duration: 3,
        confirmed: false,
        regenerating: false,
      },
      {
        id: '2',
        script: '店内环境全景，展示温馨的用餐氛围',
        videoUrl: 'https://example.com/video2.mp4',
        duration: 3,
        confirmed: false,
        regenerating: false,
      },
      {
        id: '3',
        script: '特色产品展示，突出主推商品的诱人外观',
        videoUrl: 'https://example.com/video3.mp4',
        duration: 3,
        confirmed: false,
        regenerating: false,
      },
      {
        id: '4',
        script: '顾客用餐场景，传递美味和满意的情感',
        videoUrl: 'https://example.com/video4.mp4',
        duration: 3,
        confirmed: false,
        regenerating: false,
      },
    ]

    setVideoSegments(mockSegments)
    setIsLoading(false)
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
      // TODO: 调用后端重新生成接口
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 模拟重新生成成功
      setVideoSegments(prev => 
        prev.map(seg => 
          seg.id === segmentId 
            ? { ...seg, regenerating: false, confirmed: false } 
            : seg
        )
      )
      
      Taro.showToast({ title: '重新生成成功', icon: 'success' })
    } catch (error) {
      console.error('重新生成失败:', error)
      setVideoSegments(prev => 
        prev.map(seg => 
          seg.id === segmentId 
            ? { ...seg, regenerating: false } 
            : seg
        )
      )
      Taro.showToast({ title: '重新生成失败', icon: 'none' })
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

  // 确认合成
  const handleMerge = async () => {
    const allConfirmed = videoSegments.every(seg => seg.confirmed)
    
    if (!allConfirmed) {
      Taro.showToast({ title: '请先确认所有视频分段', icon: 'none' })
      return
    }

    setIsMerging(true)

    try {
      // TODO: 调用后端合成接口
      const res = await Network.request({
        url: '/api/video/merge',
        method: 'POST',
        data: {
          segments: videoSegments.map(seg => seg.id),
        }
      })

      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      
      if (data?.code === 200 && data.data?.videoUrl) {
        setFinalVideoUrl(data.data.videoUrl)
        Taro.showToast({ title: '合成成功', icon: 'success' })
      } else {
        throw new Error('合成失败')
      }
    } catch (error) {
      console.error('合成失败:', error)
      Taro.showToast({ title: '合成失败，请重试', icon: 'none' })
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
                    className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center mb-3"
                    style={{ position: 'relative' }}
                  >
                    {segment.videoUrl ? (
                      <View className="w-full h-full flex items-center justify-center">
                        <View 
                          className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center"
                          onClick={() => handlePreview(segment.id)}
                        >
                          <Play size={32} color="#ffffff" />
                        </View>
                      </View>
                    ) : (
                      <Text className="text-gray-500 text-sm">视频生成中...</Text>
                    )}
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex flex-row gap-3">
                    <View
                      className="flex-1 rounded-lg py-3 flex flex-row items-center justify-center gap-2 bg-gray-800"
                      onClick={() => handleRegenerate(segment.id)}
                    >
                      <RefreshCw size={16} color="#9CA3AF" />
                      <Text className="text-gray-300 text-sm">重新生成</Text>
                    </View>
                    <View
                      className="flex-1 rounded-lg py-3 flex flex-row items-center justify-center gap-2"
                      style={{
                        background: segment.confirmed 
                          ? '#374151'
                          : 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                      }}
                      onClick={() => handleConfirm(segment.id)}
                    >
                      <Check size={16} color={segment.confirmed ? '#6B7280' : '#ffffff'} />
                      <Text className={segment.confirmed ? 'text-gray-500 text-sm' : 'text-white text-sm'}>
                        {segment.confirmed ? '已确定' : '确定'}
                      </Text>
                    </View>
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
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default ResultPage
