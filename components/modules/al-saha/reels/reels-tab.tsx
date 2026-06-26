'use client'

import * as React from 'react'
import { Heart, MessageCircle, Share2, Bookmark, Music, Plus, Volume2, VolumeX, Play } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useReelsStore, type Reel } from '@/lib/stores/reels-store'
import { ReelCommentsSheet } from './reel-comments-sheet'
import { ReelComposer } from './reel-composer'
import { cn } from '@/lib/utils'

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}

interface ReelItemProps {
  reel: Reel
  active: boolean
  muted: boolean
  onToggleMute: () => void
  onOpenComments: (id: string) => void
  commentCount: number
}

function ReelItem({ reel, active, muted, onToggleMute, onOpenComments, commentCount }: ReelItemProps) {
  const toggleLike = useReelsStore((s) => s.toggleLike)
  const toggleSave = useReelsStore((s) => s.toggleSave)
  const shareReel = useReelsStore((s) => s.shareReel)

  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [paused, setPaused] = React.useState(false)
  const [showHeart, setShowHeart] = React.useState(false)
  const lastTap = React.useRef(0)

  // Autoplay only the active reel.
  React.useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active) {
      v.currentTime = 0
      const p = v.play()
      if (p) p.then(() => setPaused(false)).catch(() => setPaused(true))
    } else {
      v.pause()
    }
  }, [active])

  const handleTap = () => {
    const now = Date.now()
    if (now - lastTap.current < 280) {
      // double tap -> like
      if (!reel.liked) toggleLike(reel.id)
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 700)
    } else {
      // single tap -> play/pause
      const v = videoRef.current
      if (!v) return
      if (v.paused) {
        v.play()
        setPaused(false)
      } else {
        v.pause()
        setPaused(true)
      }
    }
    lastTap.current = now
  }

  const handleShare = async () => {
    shareReel(reel.id)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Reel', text: reel.caption })
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="relative h-full w-full snap-start snap-always shrink-0 bg-black overflow-hidden">
      {/* Poster background fallback (shows when the video is buffering or unavailable) */}
      {reel.posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={reel.posterUrl || '/placeholder.svg'}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Video */}
      <button type="button" onClick={handleTap} className="absolute inset-0 h-full w-full" aria-label="تشغيل/إيقاف">
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.posterUrl || undefined}
          className="relative h-full w-full object-cover"
          loop
          muted={muted}
          playsInline
          preload="metadata"
        />
      </button>

      {/* Pause indicator */}
      {paused && active && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-black/40 flex items-center justify-center">
            <Play className="h-8 w-8 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Double-tap heart */}
      {showHeart && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Heart className="h-24 w-24 text-white fill-white animate-ping" />
        </div>
      )}

      {/* Mute toggle */}
      <button
        onClick={onToggleMute}
        aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
        className="absolute top-3 end-3 z-20 h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* Gradient for legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Right interaction rail */}
      <div className="absolute bottom-24 end-3 z-20 flex flex-col items-center gap-5 text-white">
        <RailButton
          onClick={() => toggleLike(reel.id)}
          label="إعجاب"
          count={formatCount(reel.likes)}
        >
          <Heart className={cn('h-7 w-7', reel.liked && 'fill-red-500 text-red-500')} />
        </RailButton>
        <RailButton onClick={() => onOpenComments(reel.id)} label="تعليق" count={formatCount(commentCount)}>
          <MessageCircle className="h-7 w-7" />
        </RailButton>
        <RailButton onClick={handleShare} label="مشاركة" count={formatCount(reel.shares)}>
          <Share2 className="h-7 w-7" />
        </RailButton>
        <RailButton onClick={() => toggleSave(reel.id)} label="حفظ">
          <Bookmark className={cn('h-7 w-7', reel.saved && 'fill-[#C9A227] text-[#C9A227]')} />
        </RailButton>
        {reel.track && (
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A227] to-[#2D5A27] flex items-center justify-center animate-spin-slow">
            <Music className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Bottom-left author + caption */}
      <div className="absolute bottom-20 start-3 end-16 z-20 text-white space-y-2" dir="rtl">
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9 border-2 border-white">
            <AvatarImage src={reel.ownerAvatar} alt={reel.ownerNameAr} />
            <AvatarFallback className="bg-[#2D5A27] text-white text-xs font-arabic">
              {reel.ownerNameAr[0]}
            </AvatarFallback>
          </Avatar>
          <span className="font-arabic font-bold text-sm">{reel.ownerNameAr}</span>
        </div>
        {reel.caption && <p className="font-arabic text-sm leading-relaxed line-clamp-2">{reel.caption}</p>}
        {reel.track && (
          <div className="flex items-center gap-1.5 text-xs text-white/90">
            <Music className="h-3.5 w-3.5" />
            <span className="font-arabic truncate max-w-[200px]">
              {reel.track.title} • {reel.track.artist}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function RailButton({
  onClick,
  label,
  count,
  children,
}: {
  onClick: () => void
  label: string
  count?: string
  children: React.ReactNode
}) {
  return (
    <button onClick={onClick} aria-label={label} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
      {children}
      {count !== undefined && <span className="text-xs font-semibold drop-shadow">{count}</span>}
    </button>
  )
}

export function ReelsTab() {
  const reels = useReelsStore((s) => s.reels)
  const comments = useReelsStore((s) => s.comments)

  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [muted, setMuted] = React.useState(true)
  const [commentsReelId, setCommentsReelId] = React.useState<string | null>(null)
  const [composerOpen, setComposerOpen] = React.useState(false)
  const [feedHeight, setFeedHeight] = React.useState(0)

  // The app shell uses content-flow height, so `h-full` collapses here.
  // Measure the available viewport space below the headers and above the
  // fixed bottom navigation, then size each reel to fill it exactly.
  React.useLayoutEffect(() => {
    const measure = () => {
      const root = rootRef.current
      if (!root) return
      const top = root.getBoundingClientRect().top
      const nav = document.querySelector('nav[aria-label]') as HTMLElement | null
      const navH = nav?.offsetHeight ?? 64
      const h = window.innerHeight - top - navH
      setFeedHeight(Math.max(240, h))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Track which reel is in view using IntersectionObserver.
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const items = Array.from(container.querySelectorAll('[data-reel-index]'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.reelIndex)
            setActiveIndex(idx)
          }
        })
      },
      { root: container, threshold: [0.6] },
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [reels.length])

  const commentCountFor = React.useCallback(
    (reelId: string) => comments.filter((c) => c.reelId === reelId).length,
    [comments],
  )

  return (
    <div ref={rootRef} className="relative w-full bg-black" style={{ height: feedHeight || undefined }}>
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide overscroll-contain"
      >
        {reels.map((reel, i) => (
          <div key={reel.id} data-reel-index={i} className="w-full" style={{ height: feedHeight || '100%' }}>
            <ReelItem
              reel={reel}
              active={i === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onOpenComments={setCommentsReelId}
              commentCount={commentCountFor(reel.id)}
            />
          </div>
        ))}
      </div>

      {/* Create Reel button */}
      <button
        onClick={() => setComposerOpen(true)}
        aria-label="إنشاء Reel"
        className="absolute top-3 start-3 z-20 flex items-center gap-1.5 rounded-full bg-[#2D5A27] px-3.5 py-2 text-white shadow-lg active:scale-95 transition-transform"
      >
        <Plus className="h-4 w-4" />
        <span className="text-xs font-bold font-arabic">إنشاء</span>
      </button>

      {/* Comments sheet */}
      <ReelCommentsSheet reelId={commentsReelId} onClose={() => setCommentsReelId(null)} />

      {/* Composer */}
      <ReelComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  )
}
