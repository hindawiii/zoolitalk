/**
 * Crops an image (data URL or object URL) to the given pixel area returned by
 * react-easy-crop, then resizes/compresses it to a compact JPEG data URL that
 * is safe to persist in localStorage / Firestore.
 */

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('تعذر تحميل الصورة'))
    img.src = src
  })
}

export async function getCroppedImg(
  imageSrc: string,
  cropPixels: CropArea,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<string> {
  const { maxWidth = 1080, maxHeight = 1080, quality = 0.82 } = options
  const image = await loadImage(imageSrc)

  // First, draw the cropped region at full resolution.
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(cropPixels.width))
  canvas.height = Math.max(1, Math.round(cropPixels.height))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('تعذر معالجة الصورة')

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  )

  // Scale down if larger than the requested bounds.
  let { width, height } = canvas
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    const scaled = document.createElement('canvas')
    scaled.width = Math.round(width * ratio)
    scaled.height = Math.round(height * ratio)
    const sctx = scaled.getContext('2d')
    if (!sctx) throw new Error('تعذر معالجة الصورة')
    sctx.drawImage(canvas, 0, 0, scaled.width, scaled.height)
    return scaled.toDataURL('image/jpeg', quality)
  }

  return canvas.toDataURL('image/jpeg', quality)
}

/** Reads a File into a data URL (no resizing) so it can be shown in the cropper. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف المحدد ليس صورة'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة'))
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}
