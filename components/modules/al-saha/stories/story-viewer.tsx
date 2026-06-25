'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/providers/language-provider'
import {
  useStoryStore,
  FILTER_CSS,
  REACTION_EMOJI,
  type Story,
  type StoryGroup,
  type StoryReaction,
} from '@/lib/stores/story-store'
import { StickerView } from './story-composer'

interface StoryViewerProps {
  groups: StoryGroup[]
  initialGroupIndex: number
  onClose: () => void
}

const STORY_DURATION = 5000 // ms per story

const REACTIONS: StoryReaction[] = ['heart', 'celebrate', 'haha', 'fire', 'clap', 'zool']

interface Bubble {
  id: number
  emoji: string
  x: number
}

export function StoryViewer({ groups, initialGroupIndex, onClose }: StoryViewerProps) {
  const { isRTL } = useLanguage()
  const reactToStory = useStoryStore((s) => s.reactToStory)
  const markGroupViewed = useStoryStore((s) => s.markGroupViewed)

  const [groupIndex, setGroupIndex] = React.useState(initialGroupIndex)
  const [storyIndex, setStoryIndex] = React.useState(0)
  const [progress, setProgress] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const [bubbles, setBubbles] = React.useState<Bubble[]>([])
  const [showCounts, setShowCounts] = React.useState(false)

  const group = groups[groupIndex]
  const story: Story | undefined = group?.stories[storyIndex]

  const rafRef = React.useRef<number | null>(null)
  const startRef = React.useRef<number>(0)
  const elapsedRef = React.useRef<number>(0)

  // mark current owner viewed
  React.useEffect(() => {
    if (group) markGroupViewed(group.ownerId)
  }, [group, markGroupViewed])

  const goToNextStory = React.useCallback(() => {
    if (!group) return
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1)
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1)
      setStoryIndex(0)
    } else {
      onClose()
    }
  }, [group, storyIndex, groupIndex, groups.length, onClose])

  const goToPrevStory = React.useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1)
    } else if (groupIndex > 0) {
      const prev = groups[groupIndex - 1]
      setGroupIndex((i) => i - 1)
      setStoryIndex(prev.stories.length - 1)
    }
  }, [storyIndex, groupIndex, groups])

  // progress timer
  React.useEffect(() => {
    setProgress(0)
    elapsedRef.current = 0
    startRef.current = performance.now()

    const tick = (t: number) => {
      if (paused) {
        startRef.current = t - elapsedRef.current
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      elapsedRef.current = t - startRef.current
      const pct = Math.min(100, (elapsedRef.current / STORY_DURATION) * 100)
      setProgress(pct)
      if (pct >= 100) {
        goToNextStory()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [storyIndex, groupIndex, paused, goToNextStory])

  const handleReact = (reaction: StoryReaction) => {
    if (!story) return
    reactToStory(story.id, reaction)
    const emoji = REACTION_EMOJI[reaction]
    const id = Date.now() + Math.random()
    setBubbles((prev) => [...prev, { id, emoji, x: 20 + Math.random() * 60 }])
    setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 2000)
  }

  // swipe between groups
  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    const threshold = 80
    // In RTL, swipe direction maps reversed for "next"
    if (info.offset.x < -threshold) {
      isRTL ? goToPrevGroupBoundary() : goToNextGroupBoundary()
    } else if (info.offset.x > threshold) {
      isRTL ? goToNextGroupBoundary() : goToPrevGroupBoundary()
    }
  }

  const goToNextGroupBoundary = () => {
    if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1)
      setStoryIndex(0)
    } else {
      onClose()
    }
  }
  const goToPrevGroupBoundary = () => {
    if (groupIndex > 0) {
      setGroupIndex((i) => i - 1)
      setStoryIndex(0)
    }
  }

  if (!group || !story) return null

  const totalReactions = REACTIONS.reduce((sum, r) => sum + story.reactions[r], 0)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        dir="rtl"
        className="fixed inset-0 z-[130] bg-black flex items-center justify-center"
      >
        <motion.div
          key={groupIndex}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0.6, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="relative w-full h-full max-w-md mx-auto bg-black overflow-hidden"
          style={{ aspectRatio: '9 / 16' }}
        >
          {/* Media */}
          {story.mediaType === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={story.mediaUrl || '/placeholder.svg'}
              alt=""
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: FILTER_CSS[story.filter] }}
            />
          ) : (
            <video
              src={story.mediaUrl}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: FILTER_CSS[story.filter] }}
              autoPlay
              loop
              muted={false}
              playsInline
            />
          )}

          {/* Drawing layer */}
          {story.drawingUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.drawingUrl || '/placeholder.svg'} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          )}

          {/* Text overlays */}
          {story.texts.map((t) => (
            <div
              key={t.id}
              className="absolute px-2 text-center pointer-events-none"
              style={{
                left: `${t.xPct}%`,
                top: `${t.yPct}%`,
                transform: 'translate(-50%, -50%)',
                color: t.color,
                fontWeight: t.bold ? 700 : 400,
                fontStyle: t.italic ? 'italic' : 'normal',
                fontSize: t.size,
                textShadow: '0 1px 6px rgba(0,0,0,0.5)',
              }}
            >
              <span className="font-arabic">{t.text}</span>
            </div>
          ))}

          {/* Stickers */}
          {story.stickers.map((s) => (
            <div
              key={s.id}
              className="absolute pointer-events-none"
              style={{ left: `${s.xPct}%`, top: `${s.yPct}%`, transform: 'translate(-50%, -50%)' }}
            >
              <StickerView sticker={s} />
            </div>
          ))}

          {/* Top gradient */}
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Progress bars */}
          <div className="absolute top-2 inset-x-0 px-3 flex gap-1 z-20">
            {group.stories.map((s, i) => (
              <div key={s.id} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{
                    width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Owner header */}
          <div className="absolute top-5 inset-x-0 px-3 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9 border border-white/60">
                <AvatarImage src={story.ownerAvatar || '/placeholder.svg'} />
                <AvatarFallback className="bg-[#2D5A27] text-white text-sm">
                  {story.ownerNameAr?.[0] || 'ز'}
                </AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <p className="text-white text-sm font-bold font-arabic">{story.ownerNameAr}</p>
                <p className="text-white/70 text-[11px]">{timeAgo(story.createdAt, isRTL)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="h-9 w-9 rounded-full bg-black/30 flex items-center justify-center text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tap zones for prev/next + hold to pause */}
          <button
            aria-label="السابق"
            className="absolute inset-y-0 right-0 w-1/3 z-10"
            onClick={goToPrevStory}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerLeave={() => setPaused(false)}
          />
          <button
            aria-label="التالي"
            className="absolute inset-y-0 left-0 w-1/3 z-10"
            onClick={goToNextStory}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerLeave={() => setPaused(false)}
          />

          {/* Floating reaction bubbles */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            <AnimatePresence>
              {bubbles.map((b) => (
                <motion.div
                  key={b.id}
                  initial={{ y: 0, opacity: 1, scale: 0.6 }}
                  animate={{ y: -320, opacity: 0, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                  className="absolute bottom-28 text-4xl"
                  style={{ left: `${b.x}%` }}
                >
                  {b.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Bottom gradient */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          {/* Reactions bar */}
          <div className="absolute bottom-4 inset-x-0 px-4 z-30">
            <AnimatePresence>
              {showCounts && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-3 mx-auto w-fit rounded-2xl bg-black/70 backdrop-blur px-4 py-2 flex items-center gap-3"
                >
                  {REACTIONS.map((r) => (
                    <div key={r} className="flex flex-col items-center">
                      <span className="text-lg">{REACTION_EMOJI[r]}</span>
                      <span className="text-white text-xs tabular-nums">{story.reactions[r]}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-center gap-1.5 rounded-full bg-black/40 backdrop-blur px-2 py-1.5">
              {REACTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleReact(r)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setShowCounts((v) => !v)
                  }}
                  onPointerDown={() => {
                    const timer = setTimeout(() => setShowCounts(true), 450)
                    const clear = () => {
                      clearTimeout(timer)
                      window.removeEventListener('pointerup', clear)
                    }
                    window.addEventListener('pointerup', clear)
                  }}
                  className="text-2xl p-1.5 rounded-full hover:bg-white/10 active:scale-125 transition-transform"
                  aria-label={`تفاعل ${r}`}
                >
                  {REACTION_EMOJI[r]}
                </button>
              ))}
            </div>
            {totalReactions > 0 && (
              <button
                onClick={() => setShowCounts((v) => !v)}
                className="mt-2 mx-auto block text-white/70 text-xs font-arabic"
              >
                {isRTL ? `${totalReactions} تفاعل` : `${totalReactions} reactions`}
              </button>
            )}
          </div>

          {/* Desktop nav arrows */}
          {groupIndex < groups.length - 1 && (
            <button
              onClick={goToNextGroupBoundary}
              aria-label="المجموعة التالية"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 items-center justify-center text-white z-20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {groupIndex > 0 && (
            <button
              onClick={goToPrevGroupBoundary}
              aria-label="المجموعة السابقة"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 items-center justify-center text-white z-20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function timeAgo(ts: number, isRTL: boolean) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return isRTL ? 'الآن' : 'now'
  if (mins < 60) return isRTL ? `${mins} د` : `${mins}m`
  const hours = Math.floor(mins / 60)
  return isRTL ? `${hours} س` : `${hours}h`
}
