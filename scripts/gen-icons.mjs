import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')
const svg = readFileSync(resolve(root, 'public/icon.svg'))

const sizes = [
  { name: 'icon-16.png',     size: 16,   round: false },
  { name: 'icon-32.png',     size: 32,   round: false },
  { name: 'icon-180.png',    size: 180,  round: false },
  { name: 'icon-192.png',    size: 192,  round: false },
  { name: 'icon-512.png',    size: 512,  round: false },
  { name: 'icon-1024.png',   size: 1024, round: false },
]

for (const { name, size } of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(resolve(root, 'public', name))
  console.log(`✓ public/${name}`)
}

// Favicon ICO (use 32px PNG as .ico via rename — good enough for most browsers)
// Also write a square favicon.png for modern browsers
await sharp(svg)
  .resize(32, 32)
  .png()
  .toFile(resolve(root, 'app', 'favicon-new.png'))
console.log('✓ app/favicon-new.png (copy to favicon.ico to replace)')

console.log('\nDone — all icons generated in public/')
