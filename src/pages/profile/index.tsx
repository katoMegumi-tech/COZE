import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { User } from 'lucide-react-taro'

const ProfilePage: FC = () => {
  return (
    <View className="flex flex-col items-center justify-center min-h-screen bg-[color:var(--background)] p-4 overflow-hidden">
      <View className="flex flex-col items-center gap-4">
        <User size={48} color="#0abff3" />
        <Text className="text-white text-lg font-medium">个人中心</Text>
        <Text className="text-gray-400 text-sm text-center">
          个人中心功能开发中，敬请期待
        </Text>
      </View>
    </View>
  )
}

export default ProfilePage
