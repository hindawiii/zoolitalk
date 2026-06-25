'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Type,
  Sticker,
  Pen,
  Eraser,
  Sparkles,
  Check,
  ImageIcon,
  Camera,
  Bold,
  Italic,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/stores/user-store'
import {
  useStoryStore,
  FILTER_CSS,
  type StoryFilter,
  type StoryTextOverlay,
  type StorySticker,
  type StickerType,
} from '@/lib/stores/story-store'

interface StoryComposerProps {
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

const TEXT_COLORS = ['#FFFFFF', '#000000', '#2D5A27', '#C9A227']
const PEN_COLORS = ['#FFFFFF', '#2D5A27', '#C9A227', '#E03131', '#1971C2', '#000000']

const STICKER_OPTIONS: { type: StickerType; icon: string; label: string }[] = [
  { type: 'emoji', icon: '😀', label: 'إيموجي' },
  { type: 'poll', icon: '📊', label: 'استطلاع' },
  { type: 'question', icon: '❓', label: 'سؤال' },
  { type: 'countdown', icon: '⏰', label: 'عد تنازلي' },
  { type: 'music', icon: '🎵', label: 'موسيقى' },
]

const EMOJI_SET = ['❤️', '😂', '🔥', '🎉', '👏', '💚', '😍', '🙏', '⚽', '☕', '🌹', '✨']

type Tool = 'none' | 'text' | 'sticker' | 'pen'

export function StoryComposer({ open, onClose, onPublished }: StoryComposerProps) {
  const { currentUser } = useUserStore()
  const addStory = useStoryStore((s) => s.addStory)

  const [media, setMedia] = React.useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [filter, setFilter] = React.useState<StoryFilter>('original')
  const [texts, setTexts] = React.useState<StoryTextOverlay[]>([])
  const [stickers, setStickers] = React.useState<StorySticker[]>([])
  const [tool, setTool] = React.useState<Tool>('none')

  // text editing
  const [editingText, setEditingText] = React.useState<StoryTextOverlay | null>(null)

  // pen
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const drawingRef = React.useRef(false)
  const [penColor, setPenColor] = React.useState(PEN_COLORS[0])
  const [hasDrawing, setHasDrawing] = React.useState(false)

  const stageRef = React.useRef<HTMLDivElement | null>(null)
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null)
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null)

  const reset = React.useCallback(() => {
    setMedia(null)
    setFilter('original')
    setTexts([])
    setStickers([])
    setTool('none')
    setEditingText(null)
    setHasDrawing(false)
  }, [])

  React.useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  // ----- media picking -----
  const handleFile = (file?: File) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setMedia({ url, type: file.type.startsWith('video') ? 'video' : 'image' })
  }

  // ----- pen drawing -----
  const setupCanvas = React.useCallback(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return
    const rect = stage.getBoundingClientRect()
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width
      canvas.height = rect.height
    }
  }, [])

  React.useEffect(() => {
    if (tool === 'pen') setupCanvas()
  }, [tool, setupCanvas])

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (tool !== 'pen') return
    drawingRef.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 5
    ctx.strokeStyle = penColor
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (tool !== 'pen' || !drawingRef.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawing(true)
  }

  const onPointerUp = () => {
    drawingRef.current = false
  }

  const clearDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
  }

  // ----- text -----
  const addText = () => {
    const t: StoryTextOverlay = {
      id: `txt-${Date.now()}`,
      text: '',
      xPct: 50,
      yPct: 45,
      color: '#FFFFFF',
      bold: true,
      italic: false,
      size: 28,
    }
    setEditingText(t)
    setTool('text')
  }

  const commitText = () => {
    if (!editingText) return
    if (!editingText.text.trim()) {
      setTexts((prev) => prev.filter((t) => t.id !== editingText.id))
    } else {
      setTexts((prev) => {
        const exists = prev.some((t) => t.id === editingText.id)
        return exists ? prev.map((t) => (t.id === editingText.id ? editingText : t)) : [...prev, editingText]
      })
    }
    setEditingText(null)
    setTool('none')
  }

  const updateTextPos = (id: string, xPct: number, yPct: number) =>
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, xPct, yPct } : t)))

  // ----- stickers -----
  const addSticker = (type: StickerType, emoji?: string) => {
    const base: StorySticker = { id: `stk-${Date.now()}`, type, xPct: 50, yPct: 50 }
    if (type === 'emoji') base.emoji = emoji
    if (type === 'poll') {
      base.question = 'سؤالك هنا؟'
      base.options = ['نعم', 'لا']
    }
    if (type === 'question') base.question = 'اسألني أي شيء'
    if (type === 'countdown') {
      base.label = 'العد التنازلي'
      base.targetAt = Date.now() + 1000 * 60 * 60 * 24
    }
    if (type === 'music') base.trackName = 'أغنية مختارة'
    setStickers((prev) => [...prev, base])
    setTool('none')
  }

  const updateStickerPos = (id: string, xPct: number, yPct: number) =>
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, xPct, yPct } : s)))

  const posFromDrag = (clientX: number, clientY: number) => {
    const rect = stageRef.current!.getBoundingClientRect()
    return {
      xPct: Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100)),
      yPct: Math.min(95, Math.max(5, ((clientY - rect.top) / rect.height) * 100)),
    }
  }

  // ----- publish -----
  const handlePublish = () => {
    if (!media || !currentUser) return
    const drawingUrl = hasDrawing ? canvasRef.current?.toDataURL('image/png') : undefined
    addStory({
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerNameAr: currentUser.nameAr,
      ownerAvatar: currentUser.avatar,
      mediaUrl: media.url,
      mediaType: media.type,
      filter,
      texts,
      stickers,
      drawingUrl,
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
        {/* hidden inputs */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
        />

        {/* ---- Media picker state ---- */}
        {!media ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute top-4 start-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-white text-xl font-bold font-arabic">إنشاء قصة</h2>
            <p className="text-white/60 font-arabic text-sm">اختر صورة أو فيديو لبدء قصتك</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="h-14 bg-[#2D5A27] hover:bg-[#234720] text-white font-arabic text-base gap-2"
              >
                <Camera className="h-5 w-5" />
                الكاميرا
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
            {/* ---- Top bar ---- */}
            <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3">
              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="h-10 w-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <ToolButton active={tool === 'text'} onClick={addText} label="نص">
                  <Type className="h-5 w-5" />
                </ToolButton>
                <ToolButton
                  active={tool === 'sticker'}
                  onClick={() => setTool(tool === 'sticker' ? 'none' : 'sticker')}
                  label="ملصقات"
                >
                  <Sticker className="h-5 w-5" />
                </ToolButton>
                <ToolButton
                  active={tool === 'pen'}
                  onClick={() => setTool(tool === 'pen' ? 'none' : 'pen')}
                  label="رسم"
                >
                  <Pen className="h-5 w-5" />
                </ToolButton>
              </div>
            </div>

            {/* ---- Stage ---- */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <div
                ref={stageRef}
                className="relative w-full h-full max-w-md mx-auto overflow-hidden bg-black"
                style={{ aspectRatio: '9 / 16' }}
              >
                {media.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.url || '/placeholder.svg'}
                    alt="story"
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: FILTER_CSS[filter] }}
                  />
                ) : (
                  <video
                    src={media.url}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: FILTER_CSS[filter] }}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                )}

                {/* Text overlays */}
                {texts.map((t) => (
                  <motion.div
                    key={t.id}
                    drag
                    dragMomentum={false}
                    dragConstraints={stageRef}
                    onDragEnd={(_, info) => {
                      const { xPct, yPct } = posFromDrag(info.point.x, info.point.y)
                      updateTextPos(t.id, xPct, yPct)
                    }}
                    onTap={() => {
                      setEditingText(t)
                      setTool('text')
                    }}
                    className="absolute z-10 cursor-move select-none px-2 text-center"
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
                  </motion.div>
                ))}

                {/* Stickers */}
                {stickers.map((s) => (
                  <motion.div
                    key={s.id}
                    drag
                    dragMomentum={false}
                    dragConstraints={stageRef}
                    onDragEnd={(_, info) => {
                      const { xPct, yPct } = posFromDrag(info.point.x, info.point.y)
                      updateStickerPos(s.id, xPct, yPct)
                    }}
                    className="absolute z-10 cursor-move select-none"
                    style={{ left: `${s.xPct}%`, top: `${s.yPct}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <StickerView sticker={s} />
                  </motion.div>
                ))}

                {/* Pen canvas */}
                <canvas
                  ref={canvasRef}
                  className={cn(
                    'absolute inset-0 z-20 touch-none',
                    tool === 'pen' ? 'pointer-events-auto' : 'pointer-events-none',
                  )}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                />
              </div>
            </div>

            {/* ---- Pen color palette ---- */}
            {tool === 'pen' && (
              <div className="absolute bottom-28 inset-x-0 z-30 flex items-center justify-center gap-3 px-4">
                {PEN_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPenColor(c)}
                    aria-label={`لون ${c}`}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-transform',
                      penColor === c ? 'border-white scale-125' : 'border-white/40',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button
                  onClick={clearDrawing}
                  aria-label="مسح الرسم"
                  className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white"
                >
                  <Eraser className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ---- Sticker tray ---- */}
            <AnimatePresence>
              {tool === 'sticker' && (
                <motion.div
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 200, opacity: 0 }}
                  className="absolute bottom-0 inset-x-0 z-40 bg-[#1a1a1a] rounded-t-2xl p-4 max-h-[55%] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-bold font-arabic">الملصقات</h3>
                    <button onClick={() => setTool('none')} aria-label="إغلاق" className="text-white/60">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {STICKER_OPTIONS.filter((o) => o.type !== 'emoji').map((o) => (
                      <button
                        key={o.type}
                        onClick={() => addSticker(o.type)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10"
                      >
                        <span className="text-2xl">{o.icon}</span>
                        <span className="text-[10px] text-white/70 font-arabic">{o.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-white/50 text-xs font-arabic mb-2">إيموجي</p>
                  <div className="grid grid-cols-6 gap-2">
                    {EMOJI_SET.map((e) => (
                      <button
                        key={e}
                        onClick={() => addSticker('emoji', e)}
                        className="text-3xl p-1 rounded-lg hover:bg-white/10"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- Filters + publish bar ---- */}
            {tool === 'none' && (
              <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 mb-4">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={cn(
                        'flex-shrink-0 px-4 py-2 rounded-full text-xs font-arabic transition-colors',
                        filter === f.id ? 'bg-[#2D5A27] text-white' : 'bg-white/15 text-white/80',
                      )}
                    >
                      <Sparkles className="h-3 w-3 inline me-1" />
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="px-4">
                  <Button
                    onClick={handlePublish}
                    className="w-full h-12 bg-[#C9A227] hover:bg-[#A67C00] text-black font-bold font-arabic gap-2"
                  >
                    <Check className="h-5 w-5" />
                    نشر القصة
                  </Button>
                </div>
              </div>
            )}

            {/* ---- Text editor overlay ---- */}
            <AnimatePresence>
              {editingText && tool === 'text' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-black/70 flex flex-col"
                >
                  <div className="flex items-center justify-between p-4">
                    <button onClick={() => setEditingText(null)} className="text-white/70 font-arabic">
                      إلغاء
                    </button>
                    <button onClick={commitText} className="text-[#C9A227] font-bold font-arabic">
                      تم
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-6">
                    <textarea
                      autoFocus
                      value={editingText.text}
                      onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                      placeholder="اكتب هنا..."
                      rows={2}
                      className="w-full bg-transparent text-center resize-none outline-none font-arabic placeholder:text-white/40"
                      style={{
                        color: editingText.color,
                        fontWeight: editingText.bold ? 700 : 400,
                        fontStyle: editingText.italic ? 'italic' : 'normal',
                        fontSize: editingText.size,
                        textShadow: '0 1px 6px rgba(0,0,0,0.5)',
                      }}
                    />
                  </div>
                  {/* text controls */}
                  <div className="p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setEditingText({ ...editingText, bold: !editingText.bold })}
                        className={cn(
                          'h-9 w-9 rounded-full flex items-center justify-center',
                          editingText.bold ? 'bg-white text-black' : 'bg-white/15 text-white',
                        )}
                        aria-label="عريض"
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingText({ ...editingText, italic: !editingText.italic })}
                        className={cn(
                          'h-9 w-9 rounded-full flex items-center justify-center',
                          editingText.italic ? 'bg-white text-black' : 'bg-white/15 text-white',
                        )}
                        aria-label="مائل"
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditingText({ ...editingText, color: c })}
                          aria-label={`لون ${c}`}
                          className={cn(
                            'h-8 w-8 rounded-full border-2',
                            editingText.color === c ? 'border-[#C9A227] scale-110' : 'border-white/40',
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function ToolButton({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center backdrop-blur transition-colors',
        active ? 'bg-[#C9A227] text-black' : 'bg-black/40 text-white',
      )}
    >
      {children}
    </button>
  )
}

export function StickerView({ sticker }: { sticker: StorySticker }) {
  switch (sticker.type) {
    case 'emoji':
      return <span className="text-5xl">{sticker.emoji}</span>
    case 'poll':
      return (
        <div className="bg-white/95 rounded-2xl p-3 w-44 shadow-lg font-arabic">
          <p className="text-sm font-bold text-center text-[#2D5A27] mb-2">{sticker.question}</p>
          <div className="flex flex-col gap-1.5">
            {(sticker.options ?? []).map((o, i) => (
              <div key={i} className="rounded-lg bg-[#F5F5DC] py-1.5 text-center text-sm text-[#2D5A27]">
                {o}
              </div>
            ))}
          </div>
        </div>
      )
    case 'question':
      return (
        <div className="bg-white/95 rounded-2xl p-3 w-44 shadow-lg font-arabic text-center">
          <p className="text-xs text-[#C9A227] font-bold mb-1">سؤال</p>
          <p className="text-sm text-[#2D5A27]">{sticker.question}</p>
        </div>
      )
    case 'countdown':
      return (
        <div className="bg-black/70 rounded-2xl p-3 w-40 shadow-lg font-arabic text-center text-white">
          <p className="text-xs text-[#C9A227] mb-1">{sticker.label}</p>
          <p className="text-lg font-bold tabular-nums">24:00:00</p>
        </div>
      )
    case 'music':
      return (
        <div className="bg-white/95 rounded-full px-3 py-1.5 shadow-lg font-arabic flex items-center gap-1.5">
          <span className="text-lg">🎵</span>
          <span className="text-sm text-[#2D5A27]">{sticker.trackName}</span>
        </div>
      )
    default:
      return null
  }
}
