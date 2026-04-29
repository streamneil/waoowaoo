// One-shot script: render QuYing logo SVGs to PNG/ICO for legacy paths.
// Run with: node scripts/rebrand-rasterize.mjs
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

async function readSvg(name) {
  return fs.readFile(path.join(PUBLIC, name))
}

async function rasterize(svg, size, outName) {
  const out = path.join(PUBLIC, outName)
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log(`✓ ${outName} (${size}x${size})`)
}

// Build a multi-resolution .ico (16, 32, 48) by stacking 32-bit BGRA buffers
// in the simplest valid ICO container. Most browsers accept either PNG-in-ICO
// or BMP-in-ICO; we use PNG-in-ICO for size & alpha fidelity.
async function buildIco(svg, sizes, outName) {
  const buffers = await Promise.all(
    sizes.map((s) =>
      sharp(svg, { density: 384 })
        .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toBuffer(),
    ),
  )
  const headerSize = 6 + 16 * sizes.length
  let offset = headerSize
  const entries = buffers.map((buf, i) => {
    const e = {
      size: sizes[i],
      bytes: buf.length,
      offset,
    }
    offset += buf.length
    return e
  })
  const total = headerSize + buffers.reduce((s, b) => s + b.length, 0)
  const ico = Buffer.alloc(total)
  // ICONDIR
  ico.writeUInt16LE(0, 0)
  ico.writeUInt16LE(1, 2) // type 1 = ICO
  ico.writeUInt16LE(sizes.length, 4)
  // ICONDIRENTRY
  for (let i = 0; i < entries.length; i++) {
    const base = 6 + i * 16
    const w = entries[i].size >= 256 ? 0 : entries[i].size
    const h = entries[i].size >= 256 ? 0 : entries[i].size
    ico.writeUInt8(w, base + 0)
    ico.writeUInt8(h, base + 1)
    ico.writeUInt8(0, base + 2) // colors
    ico.writeUInt8(0, base + 3) // reserved
    ico.writeUInt16LE(1, base + 4) // planes
    ico.writeUInt16LE(32, base + 6) // bpp
    ico.writeUInt32LE(entries[i].bytes, base + 8)
    ico.writeUInt32LE(entries[i].offset, base + 12)
  }
  // Image data
  let cursor = headerSize
  for (const buf of buffers) {
    buf.copy(ico, cursor)
    cursor += buf.length
  }
  await fs.writeFile(path.join(PUBLIC, outName), ico)
  console.log(`✓ ${outName} (sizes: ${sizes.join(', ')})`)
}

const mark = await readSvg('logo-mark.svg')
const wide = await readSvg('logo.svg')
const banner = await readSvg('banner.svg')

await rasterize(mark, 256, 'logo-small.png')
await rasterize(mark, 1024, 'logo.png')
await sharp(wide, { density: 384 })
  .resize(1440, 512, { fit: 'contain', background: { r: 245, g: 241, b: 234, alpha: 1 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(PUBLIC, 'logo-wide.png'))
console.log('✓ logo-wide.png (1440x512)')
await sharp(banner, { density: 240 })
  .resize(1200, 480, { fit: 'cover' })
  .png({ compressionLevel: 9 })
  .toFile(path.join(PUBLIC, 'banner.png'))
console.log('✓ banner.png (1200x480)')

await buildIco(mark, [16, 32, 48], 'logo.ico')

console.log('\nDone.')
