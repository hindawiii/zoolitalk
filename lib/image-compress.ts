/**
 * Reads an image File, resizes/compresses it on a canvas, and returns a
 * Base64 data URL suitable for storing in localStorage (via the user store).
 *
 * Keeping images small is important because localStorage has a ~5MB quota
 * and we store the result inside the persisted user profile.
 */
export async function compressImage(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<string> {
  const { maxWidth = 1080, maxHeight = 1080, quality = 0.8 } = options

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف المحدد ليس صورة'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة'))
    reader.onload = () => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onerror = () => reject(new Error('تعذر تحميل الصورة'))
      img.onload = () => {
        let { width, height } = img

        // Scale down while preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('تعذر معالجة الصورة'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        // JPEG keeps the Base64 string compact. Fall back to original on error.
        try {
          resolve(canvas.toDataURL('image/jpeg', quality))
        } catch {
          resolve(reader.result as string)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/** Approximate byte size of a base64 data URL. */
function dataUrlByteSize(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',')
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl
  // Each base64 char encodes 6 bits → length * 3/4 bytes, minus padding.
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

/**
 * Compresses an image so the resulting data URL stays under `maxBytes`.
 * It first downscales the dimensions, then progressively lowers JPEG quality
 * (and dimensions as a last resort) until the size target is met.
 *
 * Returns the base64 data URL ready to be stored/sent.
 */
export async function compressImageToLimit(
  file: File,
  maxBytes: number = 2 * 1024 * 1024,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('الملف المحدد ليس صورة')
  }

  // Load the image once into an HTMLImageElement.
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة'))
    reader.onload = () => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onerror = () => reject(new Error('تعذر تحميل الصورة'))
      image.onload = () => resolve(image)
      image.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })

  let maxDimension = 1600
  let quality = 0.85

  const render = (dimension: number, q: number): string => {
    let { width, height } = img
    if (width > dimension || height > dimension) {
      const ratio = Math.min(dimension / width, dimension / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('تعذر معالجة الصورة')
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', q)
  }

  let result = render(maxDimension, quality)

  // Step the quality down first, then the dimensions, until under the limit.
  let guard = 0
  while (dataUrlByteSize(result) > maxBytes && guard < 12) {
    guard++
    if (quality > 0.4) {
      quality -= 0.1
    } else {
      maxDimension = Math.round(maxDimension * 0.85)
      quality = 0.7
    }
    result = render(maxDimension, quality)
  }

  return result
}

