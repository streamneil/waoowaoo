/**
 * FilmstripLoader — 8-frame filmstrip that slides horizontally as a loading indicator.
 * Pure CSS (qy-filmstrip keyframe defined in globals.css). No JS animation cost.
 */
type Props = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: { frame: 16, gap: 4, holes: 2, height: 22 },
  md: { frame: 24, gap: 6, holes: 3, height: 36 },
  lg: { frame: 36, gap: 8, holes: 4, height: 52 },
}

export default function FilmstripLoader({ size = 'md', className = '' }: Props) {
  const cfg = SIZES[size]
  const frames = Array.from({ length: 12 })
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`relative overflow-hidden rounded-md bg-[#1A1A1F] shadow-[0_4px_14px_rgba(26,26,31,0.18)] ${className}`}
      style={{
        width: (cfg.frame + cfg.gap) * 8,
        height: cfg.height + 12,
        padding: '6px 0',
      }}
    >
      <div
        className="qy-filmstrip-track flex"
        style={{
          gap: cfg.gap,
          // make the track wider than the viewport so the loop is seamless
          paddingLeft: cfg.gap,
          width: 'fit-content',
        }}
      >
        {frames.map((_, i) => (
          <div
            key={i}
            className="rounded-[3px] bg-[var(--qy-canvas)]"
            style={{ width: cfg.frame, height: cfg.height }}
          >
            {/* Inner spark — orange dot to suggest "exposed frame" */}
            {i % 3 === 0 ? (
              <div
                className="m-auto rounded-full bg-[var(--qy-accent)]"
                style={{
                  width: cfg.frame * 0.3,
                  height: cfg.frame * 0.3,
                  marginTop: cfg.height / 2 - cfg.frame * 0.15,
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
