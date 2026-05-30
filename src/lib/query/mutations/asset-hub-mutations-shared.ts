import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { invalidateQueryTemplates } from './mutation-shared'

export const GLOBAL_ASSET_PROJECT_ID = 'global-asset-hub'

// 资产中心列表实际由 useAssets 渲染，订阅的是 unified 子键
// (['global-assets','unified',…])，而非旧的 globalAssets.characters() 等分散键。
// 失效时必须带上 unified 键，否则乐观更新写不到、invalidate 也刷不到渲染缓存，
// 表现为切换方案需重新挂载组件（command+R）才生效。同 a08a226。
const UNIFIED_GLOBAL_KEY = queryKeys.assets.all('global')

export function invalidateGlobalCharacters(queryClient: QueryClient) {
  return invalidateQueryTemplates(queryClient, [queryKeys.globalAssets.characters(), UNIFIED_GLOBAL_KEY])
}

export function invalidateGlobalLocations(queryClient: QueryClient) {
  return invalidateQueryTemplates(queryClient, [queryKeys.globalAssets.locations(), UNIFIED_GLOBAL_KEY])
}

export function invalidateGlobalVoices(queryClient: QueryClient) {
  return invalidateQueryTemplates(queryClient, [queryKeys.globalAssets.voices(), UNIFIED_GLOBAL_KEY])
}
