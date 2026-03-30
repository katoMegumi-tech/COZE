export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '图文生成' })
  : { navigationBarTitleText: '图文生成' }
