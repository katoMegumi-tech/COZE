export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '素材库' })
  : { navigationBarTitleText: '素材库' }
