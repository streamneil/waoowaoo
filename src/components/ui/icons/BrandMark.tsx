import { forwardRef, type SVGProps } from 'react'

export const BrandMark = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  function BrandMark(props, ref) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
        {...props}
      >
        <rect x="2" y="2" width="44" height="44" rx="12" fill="#1A1A1F" />
        {/* Q ring — open arc with a notch at lower-right where the Y tail crosses */}
        <path
          d="M 32.7 28.4 A 12 12 0 1 0 28.4 32.7"
          stroke="url(#qy-mark-ring)"
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Y tail — diagonal stroke springs from inside the ring through the notch */}
        <path
          d="M 24 24 L 38 38"
          stroke="url(#qy-mark-tail)"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        {/* Aperture spark at tail end */}
        <circle cx="38" cy="38" r="2.4" fill="#FFE4D6" />
        <defs>
          <linearGradient id="qy-mark-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8B66" />
            <stop offset="100%" stopColor="#FF6A3D" />
          </linearGradient>
          <linearGradient id="qy-mark-tail" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF6A3D" />
            <stop offset="100%" stopColor="#FFB089" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
)
