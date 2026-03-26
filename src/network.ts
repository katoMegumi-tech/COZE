import Taro from '@tarojs/taro'

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 * 如果请求的 url 以 http:// 或 https:// 开头，则不会添加域名前缀
 *
 * IMPORTANT: 项目已经全局注入 PROJECT_DOMAIN
 * IMPORTANT: 除非你需要添加全局参数，如给所有请求加上 header，否则不能修改此文件
 */
export namespace Network {
    const createUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `${PROJECT_DOMAIN}${url}`
    }

    export const request: typeof Taro.request = option => {
        return Taro.request({
            ...option,
            url: createUrl(option.url),
        })
    }

    export const uploadFile: typeof Taro.uploadFile = option => {
        return Taro.uploadFile({
            ...option,
            url: createUrl(option.url),
        })
    }

    export const downloadFile: typeof Taro.downloadFile = option => {
        return Taro.downloadFile({
            ...option,
            url: createUrl(option.url),
        })
    }

    // 文案生成相关 API
    export const copywriting = {
        // 生成文案
        generate: (data: {
            fileIds?: string[]
            productServiceName: string
            coreSellingPoints?: string
            targetAudience?: string
            usageScenario?: string
            copyType?: string
            toneStyle?: string
            wordCountLimit?: string
            structurePreference?: string
            keywords?: string
            forbiddenWords?: string
            referenceLink?: string
        }) => {
            return request({
                url: '/api/copywriting/generate',
                method: 'POST',
                data,
                header: {
                    'Content-Type': 'application/json',
                },
            })
        },
    }

    // 文件上传相关 API
    export const upload = {
        // 上传文件到 Coze
        coze: (filePath: string, name?: string) => {
            return uploadFile({
                url: '/api/upload/coze',
                filePath,
                name: name || 'file',
                header: {
                    'Content-Type': 'multipart/form-data',
                },
            })
        },
    }
}
