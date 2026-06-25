'use client'

import * as React from 'react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Check, X, ZoomIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { getCroppedImg, type CropArea } from '@/lib/crop-image'
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'

export type CropAspect = 'avatar' | 'cover' | 'post' | 'story' | 'reel'

const ASPECT_CONFIG: Record<
  CropAspect,
  { ratio: number; shape: 'round' | 'rect'; maxWidth: number; maxHeight: number; label: string }
> = {
  avatar: { ratio: 1, shape: 'round', maxWidth: 600, maxHeight: 600, label: 'الصورة الشخصية' },
  cover: { ratio: 16 / 9, shape: 'rect', maxWidth: 1600, maxHeight: 900, label: 'صورة الخلفية' },
  post: { ratio: 4 / 5, shape: 'rect', maxWidth: 1080, maxHeight: 1350, label: 'المنشور' },
  story: { ratio: 9 / 16, shape: 'rect', maxWidth: 1080, maxHeight: 1920, label: 'القصة' },
  reel: { ratio: 9 / 16, shape: 'rect', maxWidth: 1080, maxHeight: 1920, label: 'الريل' },
}

interface CropEditorProps {
  imageSrc: string
  aspect: CropAspect
  onConfirm: (dataUrl: string) => void
  onCancel: () => void
}

export function CropEditor({ imageSrc, aspect, onConfirm, onCancel }: CropEditorProps) {
  const { isRTL } = useLanguage()
  const config = ASPECT_CONFIG[aspect]
  const [crop, setCrop] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<CropArea | null>(null)
  const [processing, setProcessing] = React.useState(false)

  const onCropComplete = React.useCallback((_: unknown, areaPixels: CropArea) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels, {
        maxWidth: config.maxWidth,
        maxHeight: config.maxHeight,
        quality: 0.82,
      })
      onConfirm(result)
    } catch (err) {
      console.error('[v0] Crop failed:', err)
      onCancel()
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="fixed inset-0 z-[120] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={processing}
          className="text-white hover:bg-white/15 rounded-full"
          aria-label={isRTL ? 'إلغاء' : 'Cancel'}
        >
          <X className="h-6 w-6" />
        </Button>
        <span className="font-arabic font-bold text-white text-sm">
          {isRTL ? `قص ${config.label}` : 'Crop'}
        </span>
        <Button
          size="icon"
          onClick={handleConfirm}
          disabled={processing || !croppedAreaPixels}
          className="bg-[#2D5A27] hover:bg-[#3a7332] text-white rounded-full"
          aria-label={isRTL ? 'تأكيد' : 'Confirm'}
        >
          {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
        </Button>
      </div>

      {/* Cropper area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={config.ratio}
          cropShape={config.shape}
          showGrid={config.shape === 'rect'}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="contain"
        />
      </div>

      {/* Zoom control */}
      <div className="px-6 py-5 bg-black/80 backdrop-blur-md">
        <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
          <ZoomIn className="h-5 w-5 text-white/70 flex-shrink-0" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={(v) => setZoom(v[0])}
            className="flex-1"
          />
        </div>
        <p className="text-center text-white/60 text-xs font-arabic mt-3">
          {isRTL ? 'حرّك الصورة واستخدم الشريط للتكبير' : 'Drag to reposition, slide to zoom'}
        </p>
      </div>
    </div>
  )
}
