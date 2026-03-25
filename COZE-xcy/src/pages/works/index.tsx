import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { Video } from 'lucide-react-taro'

const WorksPage: FC = () => {
  return (
    <View className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <View className="flex flex-col items-center gap-4">
        <Video size={48} color="#EC4899" />
        <Text className="text-white text-lg font-medium">我的作品</Text>
        <Text className="text-gray-400 text-sm text-center">
          作品管理功能开发中，敬请期待
        </Text>
      </View>
    </View>
  )
}

export default WorksPage
