/**
 * Coze工作流API调用工具
 * 通过后端代理调用Coze工作流接口，处理SSE流式响应
 */

import Taro from '@tarojs/taro'

// 后端API配置
const API_CONFIG = {
  baseUrl: 'http://192.168.146.161:8080', // 小程序环境使用完整URL
  workflowEndpoint: '/coze/workflow/',
  proxyEndpoint: '/api/coze/workflow', // H5环境通过后端代理
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
 * 调用后端工作流接口（SSE流式响应）
 * H5环境使用fetch，小程序环境使用Taro.request
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

    let videoUrl: string | null = null

    if (isH5) {
      // H5环境：使用fetch处理SSE流
      videoUrl = await runWorkflowWithFetch(requestBody, onProgress)
    } else {
      // 小程序环境：使用Taro.request
      videoUrl = await runWorkflowWithTaro(requestBody, onProgress)
    }

    if (videoUrl) {
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
 * H5环境：使用fetch处理SSE流式响应
 * 通过NestJS后端代理转发请求，避免CORS问题
 */
async function runWorkflowWithFetch(
  requestBody: any,
  onProgress?: (progress: WorkflowProgress) => void
): Promise<string | null> {
  // H5环境通过项目后端代理
  const url = API_CONFIG.proxyEndpoint
  
  console.log('[CozeAPI] Fetching (via backend proxy):', url)
  
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

  console.log('[CozeAPI] Stream started (H5)')

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法获取响应流')
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let videoUrl: string | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // 处理完整的SSE事件
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''

    for (const event of events) {
      const parsed = parseSSEEvent(event)
      if (!parsed) continue

      const { eventType, data } = parsed
      
      // 回调进度
      onProgress?.({
        event: eventType,
        nodeTitle: data.node_title,
        nodeId: data.node_id,
        content: data.content,
        isFinish: data.node_is_finish || false,
      })

      // 处理事件
      const result = handleSSEEvent(eventType, data)
      if (result.videoUrl) {
        videoUrl = result.videoUrl
      }
      if (result.error) {
        throw new Error(result.error)
      }
    }
  }

  return videoUrl
}

/**
 * 小程序环境：使用Taro.request
 * 注意：小程序不支持真正的SSE流式，这里尝试一次性获取响应
 */
async function runWorkflowWithTaro(
  requestBody: any,
  onProgress?: (progress: WorkflowProgress) => void
): Promise<string | null> {
  const url = `${API_CONFIG.baseUrl}${API_CONFIG.workflowEndpoint}`
  
  console.log('[CozeAPI] Starting request (Mini Program):', url)

  // eslint-disable-next-line no-restricted-properties
  const response = await Taro.request({
    url,
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
    },
    data: requestBody,
    enableChunked: true, // 尝试启用分块传输
  })

  console.log('[CozeAPI] Response received:', response.statusCode, response.data)

  if (response.statusCode !== 200) {
    throw new Error(`HTTP error! status: ${response.statusCode}`)
  }

  // 小程序可能一次性返回所有数据
  const responseData = response.data
  
  // 尝试解析响应
  if (typeof responseData === 'string') {
    // 可能是SSE格式的字符串
    const events = responseData.split('\n\n')
    let videoUrl: string | null = null

    for (const event of events) {
      const parsed = parseSSEEvent(event)
      if (!parsed) continue

      const { eventType, data } = parsed
      
      onProgress?.({
        event: eventType,
        nodeTitle: data.node_title,
        nodeId: data.node_id,
        content: data.content,
        isFinish: data.node_is_finish || false,
      })

      const result = handleSSEEvent(eventType, data)
      if (result.videoUrl) {
        videoUrl = result.videoUrl
      }
      if (result.error) {
        throw new Error(result.error)
      }
    }

    return videoUrl
  } else if (typeof responseData === 'object') {
    // 可能是JSON格式的响应
    const data = responseData as any
    
    // 后端返回格式适配
    if (data.code === 0 || data.success) {
      // 尝试从data中提取视频URL
      if (data.data?.video) {
        return data.data.video
      }
      if (data.video) {
        return data.video
      }
      if (data.data?.output) {
        // 解析output中的内容
        try {
          const output = typeof data.data.output === 'string'
            ? JSON.parse(data.data.output)
            : data.data.output
          if (output.video) {
            return output.video
          }
        } catch (e) {
          console.warn('[CozeAPI] Failed to parse output:', e)
        }
      }
    } else if (data.error || data.message) {
      throw new Error(data.error || data.message)
    }
  }

  return null
}

/**
 * 解析SSE事件
 */
function parseSSEEvent(event: string): { eventType: string; data: any } | null {
  if (!event.trim()) return null

  const lines = event.split('\n')
  let eventType = 'message'
  let dataStr = ''

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      eventType = line.slice(7).trim()
    } else if (line.startsWith('data: ')) {
      dataStr = line.slice(6).trim()
    }
  }

  if (dataStr === '[DONE]' || !dataStr) return null

  try {
    const data = JSON.parse(dataStr)
    return { eventType, data }
  } catch (e) {
    console.warn('[CozeAPI] Failed to parse SSE data:', dataStr)
    return null
  }
}

/**
 * 处理SSE事件
 */
function handleSSEEvent(eventType: string, data: any): { videoUrl?: string; error?: string } {
  switch (eventType) {
    case 'Message':
      // 尝试提取视频URL
      if (data.node_is_finish && data.content) {
        try {
          const contentData = typeof data.content === 'string'
            ? JSON.parse(data.content)
            : data.content

          if (contentData.video) {
            console.log('[CozeAPI] ✓ Video URL found:', contentData.video)
            return { videoUrl: contentData.video }
          }
        } catch (e) {
          console.warn('[CozeAPI] Failed to parse content:', e)
        }
      }
      break

    case 'Error':
      console.error('[CozeAPI] ✗ Workflow error:', data.error_message)
      return { error: data.error_message || '工作流执行失败' }

    case 'Done':
      console.log('[CozeAPI] ✓ Workflow completed')
      break

    case 'Interrupt':
      console.warn('[CozeAPI] ⚠ Workflow interrupted:', data)
      break
  }

  return {}
}
