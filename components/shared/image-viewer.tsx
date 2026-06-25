'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  MoreVertical,
  Download,
  Flag,
  User as UserIcon,
  ImageIcon,
  Circle,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'

export interface ImageViewerData {
  url: string
  authorName?: string
  date?: string
  likes?: number
}

interface ImageViewerProps {
  image: ImageViewerData | null
  onClose: () => void
  onUseAsAvatar?: (url: string) => void
  onUseAsCover?: (url: string) => void
  onUseAsStory?: (url: string) => void
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
  liked?: boolean
}

const REPORT_REASONS = [
  { id: 'inappropriate', label: 'محتوى غير لائق' },
  { id: 'copyright', label: 'حقوق ملكية' },
  { id: 'violent', label: 'محتوى عنيف' },
  { id: 'other', label: 'آخر' },
]

async function downloadImage(url: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `rakobatna-${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    // Fallback: open in a new tab
    window.open(url, '_blank')
  }
}

export function ImageViewer({
  image,
  onClose,
  onUseAsAvatar,
  onUseAsCover,
  onUseAsStory,
  onLike,
  onComment,
  onShare,
  liked,
}: ImageViewerProps) {
  const { isRTL } = useLanguage()
  const [reportOpen, setReportOpen] = React.useState(false)
  const [reported, setReported] = React.useState(false)
  const [scale, setScale] = React.useState(1)

  // Reset zoom each time a new image opens
  React.useEffect(() => {
    setScale(1)
  }, [image?.url])

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          dir={isRTL ? 'rtl' : 'ltr'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex flex-col bg-black/90 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-full"
              aria-label={isRTL ? 'إغلاق' : 'Close'}
            >
              <X className="h-6 w-6" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-full"
                  aria-label={isRTL ? 'خيارات' : 'Options'}
                >
                  <MoreVertical className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="font-arabic w-56">
                <DropdownMenuItem onClick={() => downloadImage(image.url)}>
                  <Download className="h-4 w-4 me-2" />
                  {isRTL ? 'حفظ الصورة' : 'Save image'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                  <Flag className="h-4 w-4 me-2 text-destructive" />
                  {isRTL ? 'الإبلاغ عن الصورة' : 'Report image'}
                </DropdownMenuItem>
                {(onUseAsAvatar || onUseAsCover || onUseAsStory) && <DropdownMenuSeparator />}
                {onUseAsAvatar && (
                  <DropdownMenuItem onClick={() => onUseAsAvatar(image.url)}>
                    <UserIcon className="h-4 w-4 me-2" />
                    {isRTL ? 'استخدام كصورة شخصية' : 'Use as profile picture'}
                  </DropdownMenuItem>
                )}
                {onUseAsCover && (
                  <DropdownMenuItem onClick={() => onUseAsCover(image.url)}>
                    <ImageIcon className="h-4 w-4 me-2" />
                    {isRTL ? 'استخدام كصورة خلفية' : 'Use as cover'}
                  </DropdownMenuItem>
                )}
                {onUseAsStory && (
                  <DropdownMenuItem onClick={() => onUseAsStory(image.url)}>
                    <Circle className="h-4 w-4 me-2" />
                    {isRTL ? 'استخدام كقصة' : 'Use as Story'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Body */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden px-2"
            onClick={() => setScale((s) => (s === 1 ? 2 : 1))}
          >
            <motion.img
              src={image.url}
              alt=""
              crossOrigin="anonymous"
              animate={{ scale }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-4 bg-gradient-to-t from-black/70 to-transparent">
            {(image.authorName || image.date) && (
              <div className="flex items-center gap-2 mb-3">
                <div className="min-w-0">
                  {image.authorName && (
                    <p className="text-white font-arabic text-sm font-semibold truncate">
                      {image.authorName}
                    </p>
                  )}
                  {image.date && (
                    <p className="text-white/60 text-xs font-arabic">{image.date}</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                className={cn('text-white hover:bg-white/15 gap-1.5', liked && 'text-[#C9A227]')}
              >
                <Heart className={cn('h-5 w-5', liked && 'fill-current')} />
                {typeof image.likes === 'number' && <span className="text-xs">{image.likes}</span>}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onComment}
                className="text-white hover:bg-white/15 gap-1.5"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShare}
                className="text-white hover:bg-white/15 gap-1.5"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Report Modal */}
          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="font-arabic max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-[#2D5A27]">
                  {reported
                    ? isRTL ? 'تم الإبلاغ' : 'Reported'
                    : isRTL ? 'الإبلاغ عن الصورة' : 'Report image'}
                </DialogTitle>
              </DialogHeader>
              {reported ? (
                <p className="text-sm text-muted-foreground py-2">
                  {isRTL ? 'شكراً لك، تم استلام بلاغك وسنراجعه.' : 'Thanks, your report was received.'}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5 py-1">
                  {REPORT_REASONS.map((reason) => (
                    <Button
                      key={reason.id}
                      variant="outline"
                      className="justify-start font-arabic"
                      onClick={() => {
                        setReported(true)
                        setTimeout(() => {
                          setReportOpen(false)
                          setReported(false)
                        }, 1400)
                      }}
                    >
                      <Flag className="h-4 w-4 me-2 text-destructive" />
                      {reason.label}
                    </Button>
                  ))}
                </div>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setReportOpen(false)} className="font-arabic">
                  {isRTL ? 'إغلاق' : 'Close'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
