import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Character, Location, Project } from '@/types/project'
import type { ProjectAssetsData } from '@/lib/query/hooks/useProjectAssets'
import { queryKeys } from '@/lib/query/keys'
import { MockQueryClient } from '../../helpers/mock-query-client'

let queryClient = new MockQueryClient()
const useQueryClientMock = vi.fn(() => queryClient)
const useMutationMock = vi.fn((options: unknown) => options)
const { invalidateQueryTemplatesMock } = vi.hoisted(() => ({
  invalidateQueryTemplatesMock: vi.fn(),
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useRef: <T,>(value: T) => ({ current: value }),
  }
})

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => useQueryClientMock(),
  useMutation: (options: unknown) => useMutationMock(options),
}))

vi.mock('@/lib/query/mutations/mutation-shared', async () => {
  const actual = await vi.importActual<typeof import('@/lib/query/mutations/mutation-shared')>(
    '@/lib/query/mutations/mutation-shared',
  )
  return {
    ...actual,
    requestJsonWithError: vi.fn(),
    requestVoidWithError: vi.fn(),
    invalidateQueryTemplates: (...args: unknown[]) => invalidateQueryTemplatesMock(...args),
  }
})

import {
  useDeleteProjectCharacter,
  useSelectProjectCharacterImage,
} from '@/lib/query/mutations/character-base-mutations'

interface SelectProjectCharacterMutation {
  onMutate?: unknown
  onError?: unknown
  onSettled: () => void
}

interface DeleteProjectCharacterMutation {
  onMutate: (characterId: string) => Promise<unknown>
  onError: (error: unknown, characterId: string, context: unknown) => void
}

function buildCharacter(selectedIndex: number | null): Character {
  return {
    id: 'character-1',
    name: 'Hero',
    appearances: [{
      id: 'appearance-1',
      appearanceIndex: 0,
      changeReason: 'default',
      description: null,
      descriptions: null,
      imageUrl: selectedIndex === null ? null : `img-${selectedIndex}`,
      imageUrls: ['img-0', 'img-1', 'img-2'],
      previousImageUrl: null,
      previousImageUrls: [],
      previousDescription: null,
      previousDescriptions: null,
      selectedIndex,
    }],
  }
}

function buildAssets(selectedIndex: number | null): ProjectAssetsData {
  return {
    characters: [buildCharacter(selectedIndex)],
    locations: [] as Location[],
    props: [],
  }
}

function buildProject(selectedIndex: number | null): Project {
  return {
    novelPromotionData: {
      characters: [buildCharacter(selectedIndex)],
      locations: [],
      props: [],
    },
  } as unknown as Project
}

describe('project asset optimistic mutations', () => {
  beforeEach(() => {
    queryClient = new MockQueryClient()
    useQueryClientMock.mockClear()
    useMutationMock.mockClear()
    invalidateQueryTemplatesMock.mockClear()
  })

  // 选图 mutation 之前的乐观更新写到了 projectAssets.all，
  // 但 useProjectAssets 真正订阅的是 assets.all('project', ...) (unified)，
  // 导致 UI 在 refetch 之前看不到切换。
  // 现契约：不再做乐观更新，依赖 onSettled 无条件 invalidate
  // projectAssets.all + projectData（前缀匹配会让 unified 数据失效）。
  it('selecting project character image invalidates both projectAssets and projectData on settle', () => {
    const projectId = 'project-1'

    const mutation = useSelectProjectCharacterImage(projectId) as unknown as SelectProjectCharacterMutation

    expect(mutation.onMutate).toBeUndefined()
    expect(mutation.onError).toBeUndefined()

    mutation.onSettled()

    expect(invalidateQueryTemplatesMock).toHaveBeenCalledTimes(1)
    const [, keys] = invalidateQueryTemplatesMock.mock.calls[0] as [unknown, unknown[]]
    expect(keys).toEqual(expect.arrayContaining([
      queryKeys.projectAssets.all(projectId),
      queryKeys.projectData(projectId),
    ]))
  })

  it('optimistically deletes project character and restores on error', async () => {
    const projectId = 'project-1'
    const assetsKey = queryKeys.projectAssets.all(projectId)
    const projectKey = queryKeys.projectData(projectId)
    queryClient.seedQuery(assetsKey, buildAssets(0))
    queryClient.seedQuery(projectKey, buildProject(0))

    const mutation = useDeleteProjectCharacter(projectId) as unknown as DeleteProjectCharacterMutation
    const context = await mutation.onMutate('character-1')

    const afterDeleteAssets = queryClient.getQueryData<ProjectAssetsData>(assetsKey)
    expect(afterDeleteAssets?.characters).toHaveLength(0)

    const afterDeleteProject = queryClient.getQueryData<Project>(projectKey)
    expect(afterDeleteProject?.novelPromotionData?.characters ?? []).toHaveLength(0)

    mutation.onError(new Error('delete failed'), 'character-1', context)

    const rolledBackAssets = queryClient.getQueryData<ProjectAssetsData>(assetsKey)
    expect(rolledBackAssets?.characters).toHaveLength(1)
    expect(rolledBackAssets?.characters[0]?.id).toBe('character-1')
  })
})
