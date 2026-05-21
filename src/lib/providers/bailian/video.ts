import {
  assertOfficialModelRegistered,
  type OfficialModelModality,
} from '@/lib/providers/official/model-registry'
import { getProviderConfig } from '@/lib/api-config'
import type { GenerateResult } from '@/lib/generators/base'
import { toFetchableUrl } from '@/lib/storage/utils'
import { ensureBailianCatalogRegistered } from './catalog'
import type { BailianGenerateRequestOptions } from './types'

export interface BailianVideoGenerateParams {
  userId: string
  imageUrl: string
  prompt?: string
  options: BailianGenerateRequestOptions
}

function assertRegistered(modelId: string): void {
  ensureBailianCatalogRegistered()
  assertOfficialModelRegistered({
    provider: 'bailian',
    modality: 'video' satisfies OfficialModelModality,
    modelId,
  })
}

const BAILIAN_VIDEO_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'
const BAILIAN_KF2V_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2video/video-synthesis'
const BAILIAN_FIRST_LAST_FRAME_ONLY_MODELS = new Set([
  'wan2.2-kf2v-flash',
  'wanx2.1-kf2v-plus',
])
const BAILIAN_FIRST_LAST_FRAME_CAPABLE_MODELS = new Set([
  ...BAILIAN_FIRST_LAST_FRAME_ONLY_MODELS,
  'wan2.7-i2v',
])
const HAPPYHORSE_I2V_MODEL = 'happyhorse-1.0-i2v'
const HAPPYHORSE_T2V_MODEL = 'happyhorse-1.0-t2v'
const HAPPYHORSE_MODELS = new Set([HAPPYHORSE_I2V_MODEL, HAPPYHORSE_T2V_MODEL])

interface BailianVideoSubmitResponse {
  request_id?: string
  code?: string
  message?: string
  output?: {
    task_id?: string
    task_status?: string
  }
}

interface BailianVideoSubmitParameters {
  resolution?: string
  size?: string
  watermark?: boolean
  prompt_extend?: boolean
  duration?: number
  ratio?: string
  seed?: number
}

interface BailianVideoMediaItem {
  type: 'first_frame'
  url: string
}

interface BailianVideoSubmitBody {
  model: string
  input: Record<string, unknown>
  parameters?: BailianVideoSubmitParameters
}

function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function readOptionalPositiveInteger(value: unknown, fieldName: string): number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`BAILIAN_VIDEO_OPTION_INVALID_${fieldName.toUpperCase()}`)
  }
  return value
}

function supportsFirstLastFrame(modelId: string): boolean {
  return BAILIAN_FIRST_LAST_FRAME_CAPABLE_MODELS.has(modelId)
}

function isFirstLastFrameOnlyModel(modelId: string): boolean {
  return BAILIAN_FIRST_LAST_FRAME_ONLY_MODELS.has(modelId)
}

function assertNoUnsupportedOptions(options: BailianGenerateRequestOptions): void {
  const allowedOptionKeys = new Set([
    'provider',
    'modelId',
    'modelKey',
    'prompt',
    'resolution',
    'size',
    'watermark',
    'promptExtend',
    'duration',
    'lastFrameImageUrl',
    'ratio',
    'aspectRatio',
    'seed',
  ])
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined) continue
    if (!allowedOptionKeys.has(key)) {
      throw new Error(`BAILIAN_VIDEO_OPTION_UNSUPPORTED: ${key}`)
    }
  }
}

function readOptionalSeed(value: unknown): number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 2147483647) {
    throw new Error('BAILIAN_VIDEO_OPTION_INVALID_SEED')
  }
  return value
}

function normalizeHappyHorseResolution(value: string): string | undefined {
  if (!value) return undefined
  const upper = value.toUpperCase()
  if (upper === '720P' || upper === '1080P') return upper
  // Accept lowercase variants from existing UI (e.g. '720p')
  if (value === '720p') return '720P'
  if (value === '1080p') return '1080P'
  throw new Error(`BAILIAN_VIDEO_OPTION_VALUE_UNSUPPORTED: resolution=${value}`)
}

function buildHappyHorseSubmitRequest(
  modelId: string,
  imageUrl: string,
  prompt: string,
  options: BailianGenerateRequestOptions,
): { endpoint: string; body: BailianVideoSubmitBody } {
  const isI2V = modelId === HAPPYHORSE_I2V_MODEL
  if (isI2V && !imageUrl) {
    throw new Error('BAILIAN_VIDEO_IMAGE_URL_REQUIRED')
  }
  if (!isI2V && imageUrl) {
    throw new Error(`BAILIAN_VIDEO_IMAGE_URL_UNSUPPORTED_FOR_MODEL: ${modelId}`)
  }
  if (readTrimmedString(options.lastFrameImageUrl)) {
    throw new Error(`BAILIAN_VIDEO_LAST_FRAME_UNSUPPORTED_FOR_MODEL: ${modelId}`)
  }
  if (options.size !== undefined) {
    throw new Error(`BAILIAN_VIDEO_OPTION_UNSUPPORTED: size for ${modelId}`)
  }
  if (options.promptExtend !== undefined) {
    throw new Error(`BAILIAN_VIDEO_OPTION_UNSUPPORTED: promptExtend for ${modelId}`)
  }

  if (!isI2V && !prompt) {
    throw new Error('BAILIAN_VIDEO_PROMPT_REQUIRED')
  }

  const input: Record<string, unknown> = {}
  if (prompt) {
    input.prompt = prompt
  }
  if (isI2V) {
    const media: BailianVideoMediaItem[] = [
      { type: 'first_frame', url: toFetchableUrl(imageUrl) },
    ]
    input.media = media
  }

  const resolution = normalizeHappyHorseResolution(readTrimmedString(options.resolution))
  const duration = readOptionalPositiveInteger(options.duration, 'duration')
  if (typeof duration === 'number' && (duration < 3 || duration > 15)) {
    throw new Error('BAILIAN_VIDEO_OPTION_VALUE_UNSUPPORTED: duration must be in [3,15]')
  }
  // happyhorse 文档默认 watermark=true（视频右下角“Happy Horse”）。我们默认关掉。
  const watermark = readOptionalBoolean(options.watermark) ?? false
  const seed = readOptionalSeed(options.seed)
  const ratio = readTrimmedString(options.ratio) || readTrimmedString(options.aspectRatio)

  const parameters: BailianVideoSubmitParameters = {}
  if (resolution) parameters.resolution = resolution
  if (typeof duration === 'number') parameters.duration = duration
  parameters.watermark = watermark
  if (typeof seed === 'number') parameters.seed = seed
  if (ratio) {
    if (isI2V) {
      // i2v 不支持 ratio（宽高比跟随首帧），按文档忽略
    } else {
      parameters.ratio = ratio
    }
  }

  const body: BailianVideoSubmitBody = {
    model: modelId,
    input,
  }
  if (Object.keys(parameters).length > 0) {
    body.parameters = parameters
  }

  return { endpoint: BAILIAN_VIDEO_ENDPOINT, body }
}

function buildSubmitRequest(params: BailianVideoGenerateParams): {
  endpoint: string
  body: BailianVideoSubmitBody
} {
  const imageUrl = readTrimmedString(params.imageUrl)
  const modelId = readTrimmedString(params.options.modelId)
  if (!modelId) {
    throw new Error('BAILIAN_VIDEO_MODEL_ID_REQUIRED')
  }

  if (HAPPYHORSE_MODELS.has(modelId)) {
    const prompt = readTrimmedString(params.prompt) || readTrimmedString(params.options.prompt)
    return buildHappyHorseSubmitRequest(modelId, imageUrl, prompt, params.options)
  }

  if (!imageUrl) {
    throw new Error('BAILIAN_VIDEO_IMAGE_URL_REQUIRED')
  }

  const firstFrameUrl = toFetchableUrl(imageUrl)
  const lastFrameImageUrl = readTrimmedString(params.options.lastFrameImageUrl)
  const firstLastFrame = !!lastFrameImageUrl
  if (isFirstLastFrameOnlyModel(modelId) && !firstLastFrame) {
    throw new Error('BAILIAN_VIDEO_LAST_FRAME_IMAGE_URL_REQUIRED')
  }
  if (firstLastFrame && !supportsFirstLastFrame(modelId)) {
    throw new Error(`BAILIAN_VIDEO_LAST_FRAME_UNSUPPORTED_FOR_MODEL: ${modelId}`)
  }

  const prompt = readTrimmedString(params.prompt) || readTrimmedString(params.options.prompt)
  const resolution = readTrimmedString(params.options.resolution)
  const size = readTrimmedString(params.options.size)
  const watermark = readOptionalBoolean(params.options.watermark)
  const promptExtend = readOptionalBoolean(params.options.promptExtend)
  const duration = readOptionalPositiveInteger(params.options.duration, 'duration')

  const submitBody: BailianVideoSubmitBody = {
    model: modelId,
    input: firstLastFrame
      ? {
        first_frame_url: firstFrameUrl,
        last_frame_url: toFetchableUrl(lastFrameImageUrl),
      }
      : {
        img_url: firstFrameUrl,
      },
  }
  if (prompt) {
    submitBody.input.prompt = prompt
  }

  const submitParameters: BailianVideoSubmitParameters = {}
  if (resolution) {
    submitParameters.resolution = resolution
  }
  if (size) {
    submitParameters.size = size
  }
  if (typeof watermark === 'boolean') {
    submitParameters.watermark = watermark
  }
  if (typeof promptExtend === 'boolean') {
    submitParameters.prompt_extend = promptExtend
  }
  if (typeof duration === 'number') {
    submitParameters.duration = duration
  }
  if (Object.keys(submitParameters).length > 0) {
    submitBody.parameters = submitParameters
  }

  return {
    endpoint: firstLastFrame ? BAILIAN_KF2V_ENDPOINT : BAILIAN_VIDEO_ENDPOINT,
    body: submitBody,
  }
}

async function parseSubmitResponse(response: Response): Promise<BailianVideoSubmitResponse> {
  const raw = await response.text()
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('BAILIAN_VIDEO_RESPONSE_INVALID')
    }
    return parsed as BailianVideoSubmitResponse
  } catch {
    throw new Error('BAILIAN_VIDEO_RESPONSE_INVALID_JSON')
  }
}

export async function generateBailianVideo(params: BailianVideoGenerateParams): Promise<GenerateResult> {
  assertRegistered(params.options.modelId)
  assertNoUnsupportedOptions(params.options)

  const { apiKey } = await getProviderConfig(params.userId, params.options.provider)
  const submitRequest = buildSubmitRequest(params)
  const response = await fetch(submitRequest.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify(submitRequest.body),
  })
  const data = await parseSubmitResponse(response)

  if (!response.ok) {
    const code = readTrimmedString(data.code)
    const message = readTrimmedString(data.message)
    throw new Error(`BAILIAN_VIDEO_SUBMIT_FAILED(${response.status}): ${code || message || 'unknown error'}`)
  }

  const taskId = readTrimmedString(data.output?.task_id)
  if (!taskId) {
    throw new Error('BAILIAN_VIDEO_TASK_ID_MISSING')
  }

  return {
    success: true,
    async: true,
    requestId: taskId,
    externalId: `BAILIAN:VIDEO:${taskId}`,
  }
}
