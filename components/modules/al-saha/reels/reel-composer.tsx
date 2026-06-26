'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, ImageIcon, Music, Type, Sparkles, Gauge, Scissors, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/stores/user-store'
import { useReelsStore, MUSIC_LIBRARY, type ReelTrack } from '@/lib/stores/reels-store'
import { FILTER_CSS, type StoryFilter } from '@/lib/stores/story-store'

interface ReelComposerProps {
  open: boolean
  onClose: () => void
  onPublished?: () => void
}

const FILTERS: { id: StoryFilter; label: string }[] = [
  { id: 'original', label: 'الأصلي' },
  { id: 'warm', label: 'دافئ' },
  { id: 'cool', label: 'بارد' },
  { id: 'bw', label: 'أبيض وأسود' },
  { id: 'vivid', label: 'زاهي' },
]

const SPEEDS = [0.5, 1, 2] as const
type Speed = (typeof SPEEDS)[number]

type Panel = 'none' | 'music' | 'text' | 'filter' | 'speed' | 'trim'

export function ReelComposer({ open, onClose, onPublished }: ReelComposerProps) {
  const { currentUser } = useUserStore()
  const addReel = useReelsStore((s) => s.addReel)

  const [videoUrl, setVideoUrl] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<StoryFilter>('original')
  const [speed, setSpeed] = React.useState<Speed>(1)
  const [track, setTrack] = React.useState<ReelTrack | null>(null)
  const [caption, setCaption] = React.useState('')
  const [overlayText, setOverlayText] = React.useState('')
  const [panel, setPanel] = React.useState<Panel>('none')
  const [trimStart, setTrimStart] = React.useState(0)
  const [trimEnd, setTrimEnd] = React.useState(100)

  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null)
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null)

  const reset = React.useCallback(() => {
    setVideoUrl(null)
    setFilter('original')
    setSpeed(1)
    setTrack(null)
    setCaption('')
    setOverlayText('')
    setPanel('none')
    setTrimStart(0)
    setTrimEnd(100)
  }, [])

  React.useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  React.useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [speed, videoUrl])

  const handleFile = (file?: File) => {
    if (!file) return
    setVideoUrl(URL.createObjectURL(file))
  }

  const handlePublish = () => {
    if (!videoUrl || !currentUser) return
    addReel({
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerNameAr: currentUser.nameAr,
      ownerAvatar: currentUser.avatar,
      videoUrl,
      posterUrl: '',
      caption: caption.trim() || overlayText.trim(),
      track: track ?? undefined,
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
        className="fixed inset-0 z-[120] bg-black flex flex-col"
      >
        <input
          ref={galleryInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
        />

        {!videoUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute top-4 start-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-white text-xl font-bold font-arabic">إنشاء Reel</h2>
            <p className="text-white/60 font-arabic text-sm">صوّر فيديو أو اختر من المعرض</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="h-14 bg-[#2D5A27] hover:bg-[#234720] text-white font-arabic text-base gap-2"
              >
                <Camera className="h-5 w-5" />
                تصوير مباشر
              </Button>
              <Button
                onClick={() => galleryInputRef.current?.click()}
                variant="outline"
                className="h-14 border-white/30 bg-white/5 text-white hover:bg-white/10 font-arabic text-base gap-2"
              >
                <ImageIcon className="h-5 w-5" />
                المعرض
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Top bar */}
            <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3">
              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="h-10 w-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <ToolBtn active={panel === 'trim'} onClick={() => setPanel(panel === 'trim' ? 'none' : 'trim')} label="قص">
                  <Scissors className="h-5 w-5" />
                </ToolBtn>
                <ToolBtn active={panel === 'music'} onClick={() => setPanel(panel === 'music' ? 'none' : 'music')} label="موسيقى">
                  <Music className="h-5 w-5" />
                </ToolBtn>
                <ToolBtn active={panel === 'text'} onClick={() => setPanel(panel === 'text' ? 'none' : 'text')} label="نص">
                  <Type className="h-5 w-5" />
                </ToolBtn>
                <ToolBtn active={panel === 'filter'} onClick={() => setPanel(panel === 'filter' ? 'none' : 'filter')} label="فلتر">
                  <Sparkles className="h-5 w-5" />
                </ToolBtn>
                <ToolBtn active={panel === 'speed'} onClick={() => setPanel(panel === 'speed' ? 'none' : 'speed')} label="سرعة">
                  <Gauge className="h-5 w-5" />
                </ToolBtn>
              </div>
            </div>

            {/* Stage */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <div className="relative w-full h-full max-w-md mx-auto overflow-hidden bg-black" style={{ aspectRatio: '9 / 16' }}>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: FILTER_CSS[filter] }}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                {overlayText && (
                  <div className="absolute inset-x-0 top-1/3 px-6 text-center pointer-events-none">
                    <span
                      className="font-arabic font-bold text-white text-2xl"
                      style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
                    >
                      {overlayText}
                    </span>
                  </div>
                )}
                {track && (
                  <div className="absolute bottom-3 start-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-white">
                    <Music className="h-3.5 w-3.5" />
                    <span className="text-xs font-arabic">{track.title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Panels */}
            <AnimatePresence>
              {panel !== 'none' && (
                <motion.div
                  initial={{ y: 250, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 250, opacity: 0 }}
                  className="absolute bottom-0 inset-x-0 z-40 bg-[#1a1a1a] rounded-t-2xl p-4 max-h-[55%] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-bold font-arabic">
                      {panel === 'music' && 'الموسيقى'}
                      {panel === 'text' && 'إضافة نص'}
                      {panel === 'filter' && 'الفلاتر'}
                      {panel === 'speed' && 'سرعة التشغيل'}
                      {panel === 'trim' && 'قص الفيديو'}
                    </h3>
                    <button onClick={() => setPanel('none')} aria-label="إغلاق" className="text-white/60">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {panel === 'music' && (
                    <div className="space-y-1.5">
                      {MUSIC_LIBRARY.map((tr) => (
                        <button
                          key={tr.id}
                          onClick={() => setTrack(track?.id === tr.id ? null : tr)}
                          className={cn(
                            'flex items-center gap-3 w-full p-2.5 rounded-xl text-start',
                            track?.id === tr.id ? 'bg-[#2D5A27]' : 'bg-white/5 hover:bg-white/10',
                          )}
                        >
                          <span className="h-9 w-9 rounded-lg bg-[#C9A227]/20 flex items-center justify-center">
                            <Music className="h-4 w-4 text-[#C9A227]" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-white font-arabic text-sm truncate">{tr.title}</span>
                            <span className="block text-white/50 text-xs truncate">{tr.artist}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {panel === 'text' && (
                    <textarea
                      autoFocus
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="اكتب نصاً يظهر على الفيديو..."
                      rows={3}
                      className="w-full bg-white/5 text-white rounded-xl p-3 outline-none font-arabic resize-none placeholder:text-white/40"
                    />
                  )}

                  {panel === 'filter' && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      {FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id)}
                          className={cn(
                            'flex-shrink-0 px-4 py-2 rounded-full text-xs font-arabic',
                            filter === f.id ? 'bg-[#2D5A27] text-white' : 'bg-white/15 text-white/80',
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {panel === 'speed' && (
                    <div className="flex gap-2">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpeed(s)}
                          className={cn(
                            'flex-1 py-3 rounded-xl font-bold font-arabic',
                            speed === s ? 'bg-[#2D5A27] text-white' : 'bg-white/10 text-white/70',
                          )}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}

                  {panel === 'trim' && (
                    <div className="space-y-4 pb-2">
                      <p className="text-white/60 text-xs font-arabic">اسحب لتحديد بداية ونهاية المقطع</p>
                      <div className="relative h-12 rounded-lg bg-white/10 overflow-hidden">
                        <div
                          className="absolute inset-y-0 bg-[#2D5A27]/40 border-x-2 border-[#C9A227]"
                          style={{ insetInlineStart: `${trimStart}%`, insetInlineEnd: `${100 - trimEnd}%` }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-white/70 text-xs font-arabic">البداية</label>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, trimEnd - 5)}
                          value={trimStart}
                          onChange={(e) => setTrimStart(Number(e.target.value))}
                          className="w-full accent-[#C9A227]"
                        />
                        <label className="block text-white/70 text-xs font-arabic">النهاية</label>
                        <input
                          type="range"
                          min={Math.min(100, trimStart + 5)}
                          max={100}
                          value={trimEnd}
                          onChange={(e) => setTrimEnd(Number(e.target.value))}
                          className="w-full accent-[#C9A227]"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom publish bar */}
            {panel === 'none' && (
              <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-4 px-4 space-y-3">
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="أضف وصفاً..."
                  className="w-full bg-white/10 text-white rounded-full px-4 py-2.5 outline-none text-sm font-arabic placeholder:text-white/40"
                />
                <Button
                  onClick={handlePublish}
                  className="w-full h-12 bg-[#C9A227] hover:bg-[#A67C00] text-black font-bold font-arabic gap-2"
                >
                  <Check className="h-5 w-5" />
                  نشر
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function ToolBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'h-10 w-10 rounded-full backdrop-blur flex items-center justify-center text-white transition-colors',
        active ? 'bg-[#2D5A27]' : 'bg-black/40',
      )}
    >
      {children}
    </button>
  )
}
