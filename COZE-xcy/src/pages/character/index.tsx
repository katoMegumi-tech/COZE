import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { UserPlus } from 'lucide-react-taro'

const CharacterPage: FC = () => {
  return (
    <View className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <View className="flex flex-col items-center gap-4">
        <UserPlus size={48} color="#EC4899" />
        <Text className="text-white text-lg font-medium">创建角色</Text>
        <Text className="text-gray-400 text-sm text-center">
          角色创建功能开发中，敬请期待
        </Text>
      </View>
    </View>
  )
}

export default CharacterPage
