'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Link2, Youtube, Facebook, Instagram, Hash, AlertCircle, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/stores/user-store'
import {
  useReelsStore,
  detectPlatform,
  getEmbedUrl,
  extractHashtags,
  PLATFORM_LABELS,
  type ReelSource,
} from '@/lib/stores/reels-store'

interface ReelComposerProps {
  open: boolean
  onClose: () => void
  onPublished?: () => void
}

// Small platform hint chips shown under the link field.
const SUPPORTED: { source: ReelSource; icon: React.ReactNode; label: string }[] = [
  { source: 'youtube', icon: <Youtube className="h-4 w-4" />, label: 'يوتيوب' },
  { source: 'facebook', icon: <Facebook className="h-4 w-4" />, label: 'فيسبوك' },
  { source: 'instagram', icon: <Instagram className="h-4 w-4" />, label: 'إنستغرام' },
]

function PlatformIcon({ source, className }: { source: ReelSource; className?: string }) {
  if (source === 'youtube') return <Youtube className={className} />
  if (source === 'facebook') return <Facebook className={className} />
  if (source === 'instagram') return <Instagram className={className} />
  return <Link2 className={className} />
}

export function ReelComposer({ open, onClose, onPublished }: ReelComposerProps) {
  const { currentUser } = useUserStore()
  const addReel = useReelsStore((s) => s.addReel)

  const [link, setLink] = React.useState('')
  const [caption, setCaption] = React.useState('')
  const [touched, setTouched] = React.useState(false)

  const reset = React.useCallback(() => {
    setLink('')
    setCaption('')
    setTouched(false)
  }, [])

  React.useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const trimmedLink = link.trim()
  const isValidUrl = /^https?:\/\/.+\..+/.test(trimmedLink)
  const platform = isValidUrl ? detectPlatform(trimmedLink) : 'link'
  const embedUrl = isValidUrl ? getEmbedUrl(trimmedLink) : null
  const hashtags = extractHashtags(caption)

  const handlePublish = () => {
    if (!isValidUrl || !currentUser) return
    addReel({
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerNameAr: currentUser.nameAr,
      ownerAvatar: currentUser.avatar,
      videoUrl: trimmedLink,
      posterUrl: '',
      caption: caption.trim(),
      hashtags,
      source: platform,
      linkUrl: trimmedLink,
    })
    onPublished?.()
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        dir="rtl"
        className="fixed inset-0 z-[120] bg-background flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-arabic text-base font-bold text-foreground">إضافة فيديو برابط</h2>
          <Button
            onClick={handlePublish}
            disabled={!isValidUrl}
            size="sm"
            className="h-9 gap-1.5 bg-primary font-arabic font-bold text-primary-foreground disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            نشر
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Info banner: why links instead of uploads */}
          <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-3">
            <Video className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <p className="font-arabic text-xs leading-relaxed text-foreground/80">
              الصق رابط الفيديو من يوتيوب أو فيسبوك أو إنستغرام. لا حاجة لرفع الفيديو، فقط شاركه من مكانه.
            </p>
          </div>

          {/* Link input */}
          <div className="space-y-2">
            <label className="font-arabic text-sm font-semibold text-foreground">رابط الفيديو</label>
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 transition-colors',
                touched && !isValidUrl ? 'border-destructive' : 'border-border focus-within:border-primary',
              )}
            >
              <PlatformIcon source={platform} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onBlur={() => setTouched(true)}
                dir="ltr"
                inputMode="url"
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              {link && (
                <button onClick={() => setLink('')} aria-label="مسح" className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {touched && !isValidUrl && trimmedLink.length > 0 && (
              <p className="flex items-center gap-1 font-arabic text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                الرجاء إدخال رابط صحيح يبدأ بـ https
              </p>
            )}

            {isValidUrl && (
              <p className="flex items-center gap-1.5 font-arabic text-xs text-primary">
                <PlatformIcon source={platform} className="h-3.5 w-3.5" />
                تم التعرف على المصدر: {PLATFORM_LABELS[platform]}
              </p>
            )}

            {/* Supported platforms */}
            <div className="flex flex-wrap gap-2 pt-1">
              {SUPPORTED.map((p) => (
                <span
                  key={p.source}
                  className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-arabic text-[11px] text-secondary-foreground"
                >
                  {p.icon}
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          {/* Preview */}
          {isValidUrl && (
            <div className="space-y-2">
              <span className="font-arabic text-sm font-semibold text-foreground">معاينة</span>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title="معاينة الفيديو"
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-white/80">
                    <PlatformIcon source={platform} className="h-10 w-10" />
                    <p className="font-arabic text-sm">سيتم فتح الفيديو على {PLATFORM_LABELS[platform]}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caption + hashtags */}
          <div className="space-y-2">
            <label className="font-arabic text-sm font-semibold text-foreground">الوصف والهاشتاج</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="اكتب وصفاً للفيديو... أضف #هاشتاج للوصول لعدد أكبر"
              className="w-full resize-none rounded-xl border border-border bg-card p-3 font-arabic text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary"
            />
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((h) => (
                  <span
                    key={h}
                    className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 font-arabic text-xs font-semibold text-primary"
                  >
                    <Hash className="h-3 w-3" />
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
