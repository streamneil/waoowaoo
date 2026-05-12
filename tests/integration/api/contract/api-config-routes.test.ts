import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildMockRequest } from '../../../helpers/request'

const authState = vi.hoisted(() => ({
  authenticated: false,
}))

const prismaMock = vi.hoisted(() => ({
  userPreference: {
    findUnique: vi.fn(),
    upsert: vi.fn(async () => ({})),
  },
}))

const billingMock = vi.hoisted(() => ({
  getBillingMode: vi.fn(async () => 'OFF' as 'OFF' | 'SHADOW' | 'ENFORCE'),
}))

vi.mock('@/lib/api-auth', () => {
  const unauthorized = () => new Response(
    JSON.stringify({ error: { code: 'UNAUTHORIZED' } }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  )
  return {
    isErrorResponse: (value: unknown) => value instanceof Response,
    requireUserAuth: async () => {
      if (!authState.authenticated) return unauthorized()
      return { session: { user: { id: 'user-1' } } }
    },
  }
})

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/billing/mode', () => billingMock)

// AES-256-GCM cipher with the project-default key, matching crypto-utils.encryptApiKey
async function encryptForFixture(plaintext: string): Promise<string> {
  process.env.API_ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || 'quying-fixed-key-2026'
  const { encryptApiKey } = await import('@/lib/crypto-utils')
  return encryptApiKey(plaintext)
}

describe('api contract - /api/user/api-config (security: no plaintext apiKey)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.authenticated = false
  })

  it('GET rejects unauthenticated requests', async () => {
    const mod = await import('@/app/api/user/api-config/route')
    const req = buildMockRequest({ path: '/api/user/api-config', method: 'GET' })
    const res = await mod.GET(req, { params: Promise.resolve({}) })
    expect(res.status).toBe(401)
    expect(prismaMock.userPreference.findUnique).toHaveBeenCalledTimes(0)
  })

  it('GET never returns plaintext apiKey; reports hasApiKey instead', async () => {
    authState.authenticated = true
    const ciphertext = await encryptForFixture('sk-secret-plaintext-XYZ')
    const storedProviders = [
      { id: 'fal', name: 'Fal', baseUrl: 'https://fal.run', apiKey: ciphertext },
      { id: 'ark', name: 'Ark', baseUrl: 'https://ark.example', apiKey: '' },
    ]
    prismaMock.userPreference.findUnique.mockResolvedValueOnce({
      customProviders: JSON.stringify(storedProviders),
      customModels: null,
      analysisModel: null,
      characterModel: null,
      locationModel: null,
      storyboardModel: null,
      editModel: null,
      videoModel: null,
      audioModel: null,
      lipSyncModel: null,
      voiceDesignModel: null,
      capabilityDefaults: null,
      analysisConcurrency: null,
      imageConcurrency: null,
      videoConcurrency: null,
    })

    const mod = await import('@/app/api/user/api-config/route')
    const req = buildMockRequest({ path: '/api/user/api-config', method: 'GET' })
    const res = await mod.GET(req, { params: Promise.resolve({}) })

    expect(res.status).toBe(200)
    const json = await res.json() as { providers: Array<{ id: string; apiKey: string; hasApiKey: boolean }> }
    const serialized = JSON.stringify(json)
    expect(serialized).not.toContain('sk-secret-plaintext-XYZ')
    expect(serialized).not.toContain(ciphertext)

    const falEntry = json.providers.find((p) => p.id === 'fal')
    expect(falEntry).toBeDefined()
    expect(falEntry?.apiKey).toBe('')
    expect(falEntry?.hasApiKey).toBe(true)

    const arkEntry = json.providers.find((p) => p.id === 'ark')
    expect(arkEntry?.hasApiKey).toBe(false)
  })

  it('PUT treats empty-string apiKey as "keep existing"; only non-empty replaces', async () => {
    authState.authenticated = true
    const oldCipher = await encryptForFixture('OLD-KEY-keep-me')
    prismaMock.userPreference.findUnique.mockResolvedValueOnce({
      customProviders: JSON.stringify([
        { id: 'fal', name: 'Fal', baseUrl: 'https://fal.run', apiKey: oldCipher },
        { id: 'ark', name: 'Ark', baseUrl: 'https://ark.example', apiKey: oldCipher },
      ]),
      customModels: null,
    })

    const mod = await import('@/app/api/user/api-config/route')
    const req = buildMockRequest({
      path: '/api/user/api-config',
      method: 'PUT',
      body: {
        providers: [
          { id: 'fal', name: 'Fal', baseUrl: 'https://fal.run', apiKey: '' },
          { id: 'ark', name: 'Ark', baseUrl: 'https://ark.example', apiKey: 'NEW-KEY-replace' },
        ],
      },
    })
    const res = await mod.PUT(req, { params: Promise.resolve({}) })
    expect(res.status).toBe(200)

    expect(prismaMock.userPreference.upsert).toHaveBeenCalledTimes(1)
    expect(prismaMock.userPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    )
    const upsertCalls = prismaMock.userPreference.upsert.mock.calls as unknown as Array<
      Array<{ update: { customProviders: string } }>
    >
    const upsertArg = upsertCalls[0][0]
    expect(upsertArg).toBeDefined()
    const savedProviders = JSON.parse(upsertArg.update.customProviders) as Array<{
      id: string
      apiKey?: string
    }>

    const savedFal = savedProviders.find((p) => p.id === 'fal')
    expect(savedFal?.apiKey).toBe(oldCipher)

    const savedArk = savedProviders.find((p) => p.id === 'ark')
    expect(savedArk?.apiKey).toBeDefined()
    expect(savedArk?.apiKey).not.toBe('NEW-KEY-replace')
    expect(savedArk?.apiKey).not.toBe('')
    expect(savedArk?.apiKey).not.toBe(oldCipher)
  })
})
