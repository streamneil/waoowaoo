import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { testProviderConnection } from '@/lib/user-api/provider-test'
import { getProviderConfig } from '@/lib/api-config'

export const POST = apiHandler(async (request: NextRequest) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const incomingKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''
  if (!incomingKey) {
    const providerId = typeof body.providerId === 'string' ? body.providerId : ''
    if (providerId) {
      try {
        const cfg = await getProviderConfig(authResult.session.user.id, providerId)
        body.apiKey = cfg.apiKey
        if (!body.baseUrl && cfg.baseUrl) body.baseUrl = cfg.baseUrl
      } catch {
        // fall through; testProviderConnection will surface the missing-key error
      }
    }
  }

  const startedAt = Date.now()
  const result = await testProviderConnection(body as Parameters<typeof testProviderConnection>[0])
  return NextResponse.json({
    ...result,
    latencyMs: Date.now() - startedAt,
  })
})
