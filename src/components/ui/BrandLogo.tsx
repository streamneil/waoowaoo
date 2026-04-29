import { BrandMark } from '@/components/ui/icons'

/**
 * BrandLogo — QuYing wordmark for navbars and splash surfaces.
 *
 * Composes the BrandMark icon (aperture arc) with two-line text
 * ("趣影" + "QuYing"). Renders crisp at any size and adapts to dark mode
 * through QuYing tokens. Pass variant="mark-only" to skip the text.
 */
type Variant = 'horizontal' | 'mark-only'
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, { mark: number; titleZh: string; titleEn: string; gap: number }> = {
  sm: { mark: 28, titleZh: '15px', titleEn: '9px', gap: 8 },
  md: { mark: 36, titleZh: '18px', titleEn: '10px', gap: 10 },
  lg: { mark: 48, titleZh: '24px', titleEn: '12px', gap: 14 },
}

type Props = {
  variant?: Variant
  size?: Size
  className?: string
  ariaLabel?: string
}

export default function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  className = '',
  ariaLabel = 'QuYing 趣影',
}: Props) {
  const cfg = SIZES[size]
  const mark = (
    <BrandMark
      width={cfg.mark}
      height={cfg.mark}
      style={{ flexShrink: 0 }}
    />
  )

  if (variant === 'mark-only') {
    return (
      <span
        className={className}
        role="img"
        aria-label={ariaLabel}
        style={{ display: 'inline-flex' }}
      >
        {mark}
      </span>
    )
  }

  return (
    <span
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: cfg.gap,
        lineHeight: 1,
      }}
    >
      {mark}
      <span
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily:
              "'Source Han Serif SC', 'Songti SC', 'Noto Serif CJK SC', serif",
            fontWeight: 900,
            fontSize: cfg.titleZh,
            letterSpacing: '0.02em',
            color: 'var(--qy-ink-primary)',
            lineHeight: 1,
          }}
        >
          趣影
        </span>
        <span
          style={{
            fontFamily:
              "'Geist Sans', 'Inter', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: cfg.titleEn,
            letterSpacing: '0.28em',
            color: 'var(--qy-ink-tertiary)',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          QuYing
        </span>
      </span>
    </span>
  )
}
