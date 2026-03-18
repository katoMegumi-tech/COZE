export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '店铺创作' })
  : { navigationBarTitleText: '店铺创作' }
