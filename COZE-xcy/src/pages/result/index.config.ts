export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '视频生成',
      navigationBarBackgroundColor: '#000000',
      navigationBarTextStyle: 'white',
    })
  : {
      navigationBarTitleText: '视频生成',
      navigationBarBackgroundColor: '#000000',
      navigationBarTextStyle: 'white',
    }
