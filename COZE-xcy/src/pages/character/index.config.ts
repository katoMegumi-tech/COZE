export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '创建角色' })
  : { navigationBarTitleText: '创建角色' }
