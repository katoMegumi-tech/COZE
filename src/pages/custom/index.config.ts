export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '自定义创作' })
  : { navigationBarTitleText: '自定义创作' }
