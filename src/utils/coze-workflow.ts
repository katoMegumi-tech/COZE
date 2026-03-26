/**
 * Coze工作流API调用工具
 * 通过项目后端代理调用用户后端接口
 */

import Taro from '@tarojs/taro'
import { Network } from '../network'

// API配置 - 直接调用 Java 后端 (8088) 的 /api 前缀接口
const API_PREFIX =
  typeof PROJECT_DOMAIN === 'string' &&
  PROJECT_DOMAIN.replace(/\/+$/, '').endsWith('/api')
    ? ''
    : '/api'

const API_CONFIG = {
  // 上传文件到 Coze 对象存储
  uploadToCoze: `${API_PREFIX}/upload/coze`,
  // 异步启动工作流
  workflowAsync: `${API_PREFIX}/coze/workflow/async`,
  // 查询工作流状态
  workflowStatus: (taskId: string) => `${API_PREFIX}/coze/workflow/status/${taskId}`,
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

export interface RunWorkflowOptions {
  isCancelled?: () => boolean
  maxWaitMs?: number
  intervalMs?: number
}

interface CozeUploadResponse {
  code: number
  message: string
  data: {
    id: string
    bytes: number
    fileName: string
    createdAt: number
    url?: string
  } | null
}

interface CozeAsyncStartResponse {
  code: number
  message: string
  data: {
    taskId: string
  } | null
}

interface CozeStatusResponse {
  code: number
  message: string
  data: {
    taskId: string
    status: string
    progress: number
    message: string
    videoUrls: string[]
    errorMessage?: string
  } | null
}

/**
 * 小程序环境：使用 FileSystemManager 读取 base64
 * （项目只支持小程序，不再处理 H5 场景）
 */
export async function imageToBase64(filePath: string): Promise<string> {
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
  onProgress?: (progress: WorkflowProgress) => void,
  options?: RunWorkflowOptions,
): Promise<WorkflowResult> {
  console.log('[CozeAPI] Starting workflow with params:', {
    ...params,
    images: params.images?.length ? `${params.images.length} images` : 'no images',
  })

  try {
    if (options?.isCancelled?.()) {
      return { success: false, error: '已取消' }
    }

    // 通知开始
    onProgress?.({
      event: 'start',
      content: '正在生成视频...',
      isFinish: false,
    })

    // 1. 上传第一张图片到后端 /api/upload/coze，获取 fileId
    const firstImage = params.images?.[0]
    if (!firstImage) {
      return { success: false, error: '请至少选择一张图片' }
    }

    const uploadResp = await uploadFileToCoze(firstImage)
    if (options?.isCancelled?.()) {
      return { success: false, error: '已取消' }
    }
    if (!uploadResp) {
      throw new Error('文件上传失败')
    }
    if (uploadResp.code !== 200) {
      throw new Error(uploadResp.message || '文件上传失败')
    }
    if (!uploadResp.data || !uploadResp.data.id) {
      throw new Error('文件上传失败：返回数据缺少文件ID')
    }

    const fileId = uploadResp.data.id

    onProgress?.({
      event: 'upload_done',
      content: '图片上传成功，开始提交工作流任务...',
      isFinish: false,
    })

    // 2. 启动异步工作流 /api/coze/workflow/async
    const startResp = await startAsyncWorkflow({
      fileId,
      productName: params.product_name,
      productDesc: params.product_desc,
      productFeatures: params.product_features,
      productPrice: params.product_price,
      videoAspectRatio: params.video_aspect_ratio,
      videoLength: params.video_length,
      videoNum: params.video_num,
      videoResolution: params.video_resolution,
      videoScene: params.video_scene,
      videoStyle: params.video_style,
      videoSubtitle: params.video_subtitle,
    })

    if (options?.isCancelled?.()) {
      return { success: false, error: '已取消' }
    }
    if (!startResp) {
      throw new Error('工作流启动失败')
    }
    if (startResp.code !== 200) {
      throw new Error(startResp.message || '工作流启动失败')
    }
    if (!startResp.data || !startResp.data.taskId) {
      throw new Error('工作流启动失败：返回数据缺少任务ID')
    }

    const taskId = startResp.data.taskId

    onProgress?.({
      event: 'task_created',
      content: `任务已创建，任务ID：${taskId}`,
      isFinish: false,
    })

    // 3. 轮询任务状态 /api/coze/workflow/status/{taskId}
    const videoUrl = await pollWorkflowResult(taskId, onProgress, options)

    if (videoUrl) {
      onProgress?.({
        event: 'complete',
        videoUrl,
        isFinish: true,
      })
      return { success: true, videoUrl }
    }

    return { success: false, error: '未获取到视频URL' }
  } catch (error: any) {
    if (String(error?.message || '').includes('已取消')) {
      return { success: false, error: '已取消' }
    }
    console.error('[CozeAPI] Workflow failed:', error)
    return { success: false, error: error.message || '工作流调用失败' }
  }
}

/**
 * 上传文件到 Coze（后端 /api/upload/coze）
 */
async function uploadFileToCoze(
  filePath: string,
): Promise<CozeUploadResponse | null> {
  const url = API_CONFIG.uploadToCoze

  // 小程序 / H5 都统一用 Taro.uploadFile，方便走 PROJECT_DOMAIN
  // eslint-disable-next-line no-restricted-properties
  const res = await Network.uploadFile({
    url,
    name: 'file',
    filePath,
  })

  try {
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
    return data as CozeUploadResponse
  } catch (e) {
    console.error('[CozeAPI] Failed to parse upload response:', e)
    return null
  }
}

/**
 * 启动异步工作流（后端 /api/coze/workflow/async）
 */
async function startAsyncWorkflow(
  body: {
    fileId: string
    productName?: string
    productDesc?: string
    productFeatures?: string
    productPrice?: string
    videoAspectRatio?: '16:9' | '9:16' | '1:1'
    videoLength?: number
    videoNum?: number
    videoResolution?: '480P' | '720P' | '1080P'
    videoScene?: string
    videoStyle?: string
    videoSubtitle?: boolean
  },
): Promise<CozeAsyncStartResponse | null> {
  const url = API_CONFIG.workflowAsync

  const res = await Network.request({
    url,
    method: 'POST',
    data: body,
  })

  return res.data as CozeAsyncStartResponse
}

/**
 * 轮询异步任务状态，直到完成或失败
 */
async function pollWorkflowResult(
  taskId: string,
  onProgress?: (progress: WorkflowProgress) => void,
  options?: RunWorkflowOptions,
): Promise<string | null> {
  const maxWaitMs = options?.maxWaitMs ?? 1000 * 60 * 5
  const intervalMs = options?.intervalMs ?? 3000
  const start = Date.now()

  while (Date.now() - start < maxWaitMs) {
    if (options?.isCancelled?.()) {
      throw new Error('已取消')
    }
    const status = await getWorkflowStatus(taskId)
    if (options?.isCancelled?.()) {
      throw new Error('已取消')
    }

    if (!status) {
      throw new Error('查询任务状态失败')
    }
    if (status.code !== 200) {
      throw new Error(status.message || '查询任务状态失败')
    }
    if (!status.data) {
      throw new Error('查询任务状态失败：返回数据为空')
    }

    const data = status.data
    const videoUrl = data.videoUrls?.[0]
    const normalizedStatus = String(data.status || '').trim().toLowerCase()
    const isFailed = normalizedStatus === 'failed' || normalizedStatus === 'error'
    const isDone =
      normalizedStatus === 'completed' ||
      normalizedStatus === 'finished' ||
      normalizedStatus === 'success' ||
      normalizedStatus === 'done'
    const isFinish = !!videoUrl || isDone || isFailed

    onProgress?.({
      event: 'status',
      content: data.message,
      isFinish,
      videoUrl,
    })

    // 后端一旦返回 videoUrl，即视为任务完成，立即返回
    if (videoUrl) {
      return videoUrl
    }

    if (isFailed) {
      throw new Error(data.errorMessage || '视频生成失败')
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error('视频生成超时，请稍后重试')
}

async function getWorkflowStatus(
  taskId: string,
): Promise<CozeStatusResponse | null> {
  const url = API_CONFIG.workflowStatus(taskId)

  const res = await Network.request({
    url,
    method: 'GET',
  })

  return res.data as CozeStatusResponse
}
