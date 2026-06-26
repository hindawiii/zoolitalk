'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { X, Share2, Download } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/stores/chat-store'

interface MediaViewerProps {
  message: Message
  isRTL: boolean
  onClose: () => void
  onResend: (message: Message) => void
}

const MAX_SCALE = 4
const MIN_SCALE = 1

export function MediaViewer({ message, isRTL, onClose, onResend }: MediaViewerProps) {
  const isVideo = message.type === 'video'
  const mediaUrl = isVideo ? message.videoUrl || '' : message.imageUrl || ''
  const downloadName = isVideo ? 'video.mp4' : 'image.jpg'

  const [scale, setScale] = React.useState(1)
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const [resent, setResent] = React.useState(false)

  // Pointer tracking for pinch-zoom and pan
  const pointers = React.useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStart = React.useRef<{ dist: number; scale: number } | null>(null)
  const panStart = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const lastTap = React.useRef(0)

  const resetZoom = React.useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const getDistance = () => {
    const pts = Array.from(pointers.current.values())
    if (pts.length < 2) return 0
    const [a, b] = pts
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isVideo) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      pinchStart.current = { dist: getDistance(), scale }
      panStart.current = null
    } else if (pointers.current.size === 1 && scale > 1) {
      panStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isVideo) return
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2 && pinchStart.current) {
      const dist = getDistance()
      if (pinchStart.current.dist > 0) {
        const next = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, (dist / pinchStart.current.dist) * pinchStart.current.scale)
        )
        setScale(next)
        if (next === 1) setOffset({ x: 0, y: 0 })
      }
    } else if (pointers.current.size === 1 && panStart.current && scale > 1) {
      setOffset({
        x: panStart.current.ox + (e.clientX - panStart.current.x),
        y: panStart.current.oy + (e.clientY - panStart.current.y),
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
    if (pointers.current.size === 0) panStart.current = null

    // Double-tap to toggle zoom
    if (!isVideo && pointers.current.size === 0) {
      const now = Date.now()
      if (now - lastTap.current < 280) {
        setScale((s) => (s > 1 ? 1 : 2.5))
        setOffset({ x: 0, y: 0 })
        lastTap.current = 0
      } else {
        lastTap.current = now
      }
    }
  }

  const handleResend = () => {
    onResend(message)
    setResent(true)
    setTimeout(() => setResent(false), 1600)
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(mediaUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: open in a new tab if blob download is blocked (e.g. CORS)
      window.open(mediaUrl, '_blank')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 bg-gradient-to-b from-black/70 to-transparent px-2 pb-6 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          aria-label={isRTL ? 'إغلاق' : 'Close'}
        >
          <X className="h-6 w-6" />
        </button>
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
          <AvatarFallback>{message.senderName?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-semibold text-white', isRTL && 'font-arabic text-right')}>
            {message.senderName}
          </p>
          <p className={cn('truncate text-xs text-white/70', isRTL && 'font-arabic text-right')}>
            {new Date(message.timestamp).toLocaleString(isRTL ? 'ar' : 'en', {
              hour: '2-digit',
              minute: '2-digit',
              day: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
      </div>

      {/* Center media */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden"
        style={{ touchAction: isVideo ? 'auto' : 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {isVideo ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={mediaUrl}
            poster={message.videoThumbnail}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl || '/placeholder.svg'}
            alt={message.content || (isRTL ? 'صورة' : 'Image')}
            draggable={false}
            className="max-h-full max-w-full select-none object-contain"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: pinchStart.current || panStart.current ? 'none' : 'transform 0.2s ease-out',
              cursor: scale > 1 ? 'grab' : 'zoom-in',
            }}
          />
        )}
      </div>

      {/* Bottom actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-10 bg-gradient-to-t from-black/70 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-8">
        <button
          type="button"
          onClick={handleResend}
          className="flex flex-col items-center gap-1.5 text-white transition-opacity hover:opacity-80"
          aria-label={isRTL ? 'إعادة إرسال' : 'Resend'}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <Share2 className="h-5 w-5" />
          </span>
          <span className={cn('text-xs', isRTL && 'font-arabic')}>
            {resent ? (isRTL ? 'تم الإرسال' : 'Sent') : isRTL ? 'إعادة إرسال' : 'Resend'}
          </span>
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex flex-col items-center gap-1.5 text-white transition-opacity hover:opacity-80"
          aria-label={isRTL ? 'تحميل' : 'Download'}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <Download className="h-5 w-5" />
          </span>
          <span className={cn('text-xs', isRTL && 'font-arabic')}>{isRTL ? 'تحميل' : 'Download'}</span>
        </button>
      </div>
    </motion.div>
  )
}
