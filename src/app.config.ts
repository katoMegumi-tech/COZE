export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/material/index',
    'pages/character/index',
    'pages/works/index',
    'pages/profile/index',
    'pages/shop/index',
    'pages/product/index',
    'pages/custom/index',
    'pages/create/index',
    'pages/result/index',
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#000000',
    navigationBarTitleText: 'AI视频生成器',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#EC4899',
    backgroundColor: '#000000',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/house.png',
        selectedIconPath: './assets/tabbar/house-active.png',
      },
      {
        pagePath: 'pages/material/index',
        text: '素材库',
        iconPath: './assets/tabbar/image.png',
        selectedIconPath: './assets/tabbar/image-active.png',
      },
      {
        pagePath: 'pages/character/index',
        text: '创建角色',
        iconPath: './assets/tabbar/user-plus.png',
        selectedIconPath: './assets/tabbar/user-plus-active.png',
      },
      {
        pagePath: 'pages/works/index',
        text: '作品',
        iconPath: './assets/tabbar/video.png',
        selectedIconPath: './assets/tabbar/video-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      },
    ],
  },
})
