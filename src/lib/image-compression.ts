// Image compression utility for TipTap editor content
// Reduces base64 image sizes before saving to prevent 413 errors

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8, // 80% quality
}

/**
 * Compress a base64 image
 */
export async function compressBase64Image(
  base64: string,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        // Calculate new dimensions
        let width = img.width
        let height = img.height

        if (width > opts.maxWidth! || height > opts.maxHeight!) {
          const ratio = Math.min(opts.maxWidth! / width, opts.maxHeight! / height)
          width = width * ratio
          height = height * ratio
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert back to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', opts.quality)
        resolve(compressedBase64)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = base64
  })
}

/**
 * Compress all base64 images in HTML content
 * Finds all img tags with base64 src and compresses them
 */
export async function compressHtmlImages(
  html: string,
  options: CompressionOptions = {}
): Promise<string> {
  // Find all base64 images in HTML
  const base64Regex = /<img[^>]+src=["']data:image\/[^"']+["'][^>]*>/gi
  const matches = html.match(base64Regex)

  if (!matches || matches.length === 0) {
    return html // No images to compress
  }

  console.log(`🖼️ Found ${matches.length} base64 images to compress...`)

  let compressedHtml = html

  for (const imgTag of matches) {
    try {
      // Extract base64 data from img tag
      const srcMatch = imgTag.match(/src=["'](data:image\/[^"']+)["']/)
      if (!srcMatch) continue

      const originalBase64 = srcMatch[1]
      const originalSize = Math.round(originalBase64.length / 1024)

      // Compress the image
      const compressedBase64 = await compressBase64Image(originalBase64, options)
      const compressedSize = Math.round(compressedBase64.length / 1024)

      console.log(
        `📦 Compressed image: ${originalSize}KB → ${compressedSize}KB (${Math.round(
          ((originalSize - compressedSize) / originalSize) * 100
        )}% reduction)`
      )

      // Replace in HTML
      compressedHtml = compressedHtml.replace(originalBase64, compressedBase64)
    } catch (error) {
      console.error('❌ Failed to compress image:', error)
      // Continue with other images if one fails
    }
  }

  return compressedHtml
}

/**
 * Calculate total size of base64 images in HTML content
 */
export function calculateHtmlImageSize(html: string): number {
  const base64Regex = /src=["']data:image\/[^"']+["']/gi
  const matches = html.match(base64Regex)

  if (!matches) return 0

  let totalSize = 0
  for (const match of matches) {
    const srcMatch = match.match(/src=["'](data:image\/[^"']+)["']/)
    if (srcMatch) {
      totalSize += srcMatch[1].length
    }
  }

  return Math.round(totalSize / 1024) // Return in KB
}

/**
 * Estimate if HTML content will exceed size limit
 */
export function willExceedLimit(html: string, limitMB: number = 4.5): boolean {
  const imageSize = calculateHtmlImageSize(html)
  const htmlSize = new Blob([html]).size / 1024 // Total HTML size in KB
  const totalSizeMB = (imageSize + htmlSize) / 1024

  console.log(`📊 Content size: ${totalSizeMB.toFixed(2)}MB (limit: ${limitMB}MB)`)

  return totalSizeMB > limitMB
}
