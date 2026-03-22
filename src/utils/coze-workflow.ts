/**
 * Coze工作流API调用工具
 * 通过项目后端代理调用用户后端接口
 */

import Taro from '@tarojs/taro'

// API配置 - 统一使用项目后端代理
const API_CONFIG = {
  proxyEndpoint: '/api/coze/workflow', // 通过项目后端代理
}

export interface WorkflowParams {
  images: string[]
  product_desc?: string
  product_features?: string
  product_name?: string
  product_price?: string
  video_aspect_ratio?: '16:9' | '9:16' | '1:1'
  video_length?: number
  video_num?: number
  video_resolution?: '480P' | '720P' | '1080P'
  video_scene?: string
  video_style?: string
  video_subtitle?: boolean
}

export interface WorkflowProgress {
  event: string
  nodeTitle?: string
  nodeId?: string
  content?: string
  videoUrl?: string
  isFinish: boolean
}

export interface WorkflowResult {
  success: boolean
  videoUrl?: string
  error?: string
}

/**
 * 将本地图片文件转换为base64
 * H5环境使用fetch，小程序环境使用FileSystemManager
 */
export async function imageToBase64(filePath: string): Promise<string> {
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB
  
  console.log('[CozeAPI] Converting image to base64, env:', isH5 ? 'H5' : 'Mini Program')
  
  if (isH5) {
    // H5环境：使用fetch获取图片并转为base64
    return imageToBase64H5(filePath)
  } else {
    // 小程序环境：使用FileSystemManager
    return imageToBase64Native(filePath)
  }
}

/**
 * H5环境：使用fetch获取图片并转为base64
 */
async function imageToBase64H5(filePath: string): Promise<string> {
  try {
    console.log('[CozeAPI] H5: Fetching image from', filePath)
    
    // 使用fetch获取图片blob
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    
    const blob = await response.blob()
    
    // 转换blob为base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        console.log('[CozeAPI] H5: Image converted, length:', base64.length)
        resolve(base64)
      }
      reader.onerror = (error) => {
        console.error('[CozeAPI] H5: FileReader error:', error)
        reject(new Error('Failed to read image as base64'))
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('[CozeAPI] H5: Failed to convert image to base64:', error)
    throw error
  }
}

/**
 * 小程序环境：使用FileSystemManager读取base64
 */
async function imageToBase64Native(filePath: string): Promise<string> {
  try {
    const fileSystemManager = Taro.getFileSystemManager()
    
    const base64 = await new Promise<string>((resolve, reject) => {
      fileSystemManager.readFile({
        filePath,
        encoding: 'base64',
        success: (res) => resolve(res.data as string),
        fail: reject,
      })
    })
    
    // 获取文件类型
    const ext = filePath.split('.').pop()?.toLowerCase() || 'jpg'
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
    
    const result = `data:${mimeType};base64,${base64}`
    console.log('[CozeAPI] Native: Image converted, length:', result.length)
    
    return result
  } catch (error) {
    console.error('[CozeAPI] Native: Failed to convert image to base64:', error)
    throw error
  }
}

/**
 * 调用工作流接口（通过后端代理）
 * 返回格式: { code: 0, message: "success", data: { firstVideoUrl: "xxx", ... } }
 */
export async function runCozeWorkflow(
  params: WorkflowParams,
  onProgress?: (progress: WorkflowProgress) => void
): Promise<WorkflowResult> {
  console.log('[CozeAPI] Starting workflow with params:', {
    ...params,
    images: params.images?.length ? `${params.images.length} images` : 'no images',
  })

  // 检测运行环境
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB

  try {
    // 准备请求体
    const requestBody = {
      images: params.images,
      product_desc: params.product_desc || '',
      product_features: params.product_features || '',
      product_name: params.product_name || '',
      product_price: params.product_price || '',
      video_aspect_ratio: params.video_aspect_ratio || '16:9',
      video_length: params.video_length || 10,
      video_num: params.video_num || 1,
      video_resolution: params.video_resolution || '720P',
      video_scene: params.video_scene || '',
      video_style: params.video_style || '时尚',
      video_subtitle: params.video_subtitle !== false,
    }

    // 通知开始
    onProgress?.({
      event: 'start',
      content: '正在生成视频...',
      isFinish: false,
    })

    const url = API_CONFIG.proxyEndpoint
    
    let videoUrl: string | null = null

    if (isH5) {
      // H5环境：使用fetch
      videoUrl = await runWorkflowWithFetch(url, requestBody, onProgress)
    } else {
      // 小程序环境：使用Taro.request
      videoUrl = await runWorkflowWithTaro(url, requestBody, onProgress)
    }

    if (videoUrl) {
      onProgress?.({
        event: 'complete',
        videoUrl,
        isFinish: true,
      })
      return { success: true, videoUrl }
    } else {
      return { success: false, error: '未获取到视频URL' }
    }
  } catch (error: any) {
    console.error('[CozeAPI] Workflow failed:', error)
    return { success: false, error: error.message || '工作流调用失败' }
  }
}

/**
 * H5环境：使用fetch调用项目后端代理
 */
async function runWorkflowWithFetch(
  url: string,
  requestBody: any,
  _onProgress?: (progress: WorkflowProgress) => void
): Promise<string | null> {
  console.log('[CozeAPI] H5: Fetching via proxy:', url)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const responseData = await response.json()
  console.log('[CozeAPI] H5: Response:', responseData)

  return parseWorkflowResponse(responseData)
}

/**
 * 小程序环境：使用Taro.request调用项目后端代理
 */
async function runWorkflowWithTaro(
  url: string,
  requestBody: any,
  _onProgress?: (progress: WorkflowProgress) => void
): Promise<string | null> {
  console.log('[CozeAPI] Mini Program: Requesting via proxy:', url)

  // eslint-disable-next-line no-restricted-properties
  const response = await Taro.request({
    url,
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
    },
    data: requestBody,
    timeout: 300000, // 5分钟超时
  })

  console.log('[CozeAPI] Mini Program: Response:', response.statusCode, response.data)

  if (response.statusCode !== 200) {
    throw new Error(`HTTP error! status: ${response.statusCode}`)
  }

  return parseWorkflowResponse(response.data)
}

/**
 * 解析工作流响应
 * 返回格式: { code: 0, message: "success", data: { firstVideoUrl: "xxx", ... } }
 */
function parseWorkflowResponse(responseData: any): string | null {
  // 检查响应格式
  if (!responseData) {
    throw new Error('响应数据为空')
  }

  // 检查code
  if (responseData.code !== 0 && responseData.code !== 200) {
    const errorMsg = responseData.message || responseData.msg || '请求失败'
    throw new Error(errorMsg)
  }

  // 获取data
  const data = responseData.data
  if (!data) {
    throw new Error('响应data为空')
  }

  // 检查是否有错误
  if (data.errorMessage) {
    throw new Error(data.errorMessage)
  }

  // 检查状态
  if (data.status === 'failed' || data.status === 'error') {
    throw new Error(data.errorMessage || '视频生成失败')
  }

  // 获取第一个视频URL
  const videoUrl = data.firstVideoUrl || (data.videoUrls && data.videoUrls[0])
  
  if (videoUrl) {
    console.log('[CozeAPI] ✓ Got video URL:', videoUrl)
    return videoUrl
  }

  // 如果没有视频URL，可能是还在处理中
  if (data.status === 'processing' || data.status === 'pending') {
    throw new Error('视频正在生成中，请稍候')
  }

  console.warn('[CozeAPI] No video URL in response:', responseData)
  return null
}
