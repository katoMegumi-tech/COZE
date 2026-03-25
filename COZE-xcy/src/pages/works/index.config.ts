export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '作品' })
  : { navigationBarTitleText: '作品' }
