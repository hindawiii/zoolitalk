'use client'

import * as React from 'react'
import { CropEditor, type CropAspect } from './crop-editor'
import { fileToDataUrl } from '@/lib/crop-image'

type ResultCallback = (dataUrl: string) => void

/**
 * Shared "pick a file -> crop -> get a compressed data URL" flow.
 *
 * Usage:
 *   const { pickImage, cropPortal } = useImageCrop()
 *   <button onClick={() => pickImage('avatar', (url) => updateProfile({ avatar: url }))} />
 *   {cropPortal}
 *
 * You can also crop an existing image URL directly with `cropExisting`.
 */
export function useImageCrop() {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const aspectRef = React.useRef<CropAspect>('post')
  const callbackRef = React.useRef<ResultCallback | null>(null)
  const [src, setSrc] = React.useState<string | null>(null)
  const [aspect, setAspect] = React.useState<CropAspect>('post')

  // Lazily create the hidden input once.
  React.useEffect(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    input.style.display = 'none'
    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      ;(e.target as HTMLInputElement).value = ''
      if (!file) return
      try {
        const dataUrl = await fileToDataUrl(file)
        setAspect(aspectRef.current)
        setSrc(dataUrl)
      } catch (err) {
        console.error('[v0] Failed to read image:', err)
      }
    })
    document.body.appendChild(input)
    inputRef.current = input
    return () => {
      input.remove()
      inputRef.current = null
    }
  }, [])

  const pickImage = React.useCallback((cropAspect: CropAspect, onResult: ResultCallback) => {
    aspectRef.current = cropAspect
    callbackRef.current = onResult
    inputRef.current?.click()
  }, [])

  const cropExisting = React.useCallback(
    (imageUrl: string, cropAspect: CropAspect, onResult: ResultCallback) => {
      callbackRef.current = onResult
      setAspect(cropAspect)
      setSrc(imageUrl)
    },
    [],
  )

  const handleConfirm = (dataUrl: string) => {
    callbackRef.current?.(dataUrl)
    callbackRef.current = null
    setSrc(null)
  }

  const handleCancel = () => {
    callbackRef.current = null
    setSrc(null)
  }

  const cropPortal = src ? (
    <CropEditor imageSrc={src} aspect={aspect} onConfirm={handleConfirm} onCancel={handleCancel} />
  ) : null

  return { pickImage, cropExisting, cropPortal }
}
