export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '产品创作' })
  : { navigationBarTitleText: '产品创作' }
