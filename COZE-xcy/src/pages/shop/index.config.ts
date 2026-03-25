export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '文案创作' })
  : { navigationBarTitleText: '文案创作' }
