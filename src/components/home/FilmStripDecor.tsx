/**
 * Edge filmstrip decoration — fixed to viewport sides on landing pages.
 * Pure SVG, no JS, no images. Hidden on small screens to keep mobile clean.
 */
export default function FilmStripDecor() {
  const perforations = Array.from({ length: 14 }, (_, i) => i)
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 z-0 hidden md:block"
      style={{ width: '100%' }}
    >
      <div className="absolute inset-y-0 left-0 w-10 bg-[#1A1A1F]/95">
        <div className="flex flex-col items-center justify-around h-full py-10">
          {perforations.map((i) => (
            <div
              key={`l-${i}`}
              className="w-4 h-4 rounded-[3px] bg-[#F5F1EA]"
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-y-0 right-0 w-10 bg-[#1A1A1F]/95">
        <div className="flex flex-col items-center justify-around h-full py-10">
          {perforations.map((i) => (
            <div
              key={`r-${i}`}
              className="w-4 h-4 rounded-[3px] bg-[#F5F1EA]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
