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
