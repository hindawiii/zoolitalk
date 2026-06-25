'use client'

import * as React from 'react'
import Image from 'next/image'
import { Plus, MoreVertical, RotateCcw, Trash2, Download, Star, Archive } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useStoryStore, type Story, type StoryGroup } from '@/lib/stores/story-store'
import { StoryViewer } from '@/components/modules/al-saha/stories/story-viewer'
import { cn } from '@/lib/utils'

// Build a single-owner group so the StoryViewer can show an arbitrary set of stories.
function buildGroup(stories: Story[]): StoryGroup[] {
  if (stories.length === 0) return []
  const first = stories[0]
  return [
    {
      ownerId: first.ownerId,
      ownerName: first.ownerName,
      ownerNameAr: first.ownerNameAr,
      ownerAvatar: first.ownerAvatar,
      stories,
      allViewed: true,
    },
  ]
}

async function downloadStory(story: Story) {
  try {
    const res = await fetch(story.mediaUrl, { mode: 'cors' })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `story-${story.id}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('[v0] Failed to download story:', err)
  }
}

// ---------- Highlights row (under avatar) ----------

export function StoryHighlights({ isOwnProfile }: { isOwnProfile: boolean }) {
  const { isRTL } = useLanguage()
  const highlights = useStoryStore((s) => s.highlights)
  const archived = useStoryStore((s) => s.archived)
  const createHighlight = useStoryStore((s) => s.createHighlight)

  const [viewerStories, setViewerStories] = React.useState<Story[] | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [selected, setSelected] = React.useState<string[]>([])

  if (!isOwnProfile && highlights.length === 0) return null

  const openHighlight = (storyIds: string[]) => {
    const stories = storyIds
      .map((id) => archived.find((s) => s.id === id))
      .filter((s): s is Story => Boolean(s))
    if (stories.length > 0) setViewerStories(stories)
  }

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submitHighlight = () => {
    if (!title.trim() || selected.length === 0) return
    createHighlight(title.trim(), selected)
    setTitle('')
    setSelected([])
    setCreateOpen(false)
  }

  return (
    <div className="px-4 py-3 border-t w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-1">
          {isOwnProfile && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
              aria-label={isRTL ? 'إنشاء هايلايت' : 'New highlight'}
            >
              <div className="h-16 w-16 rounded-full border-2 border-dashed border-[#2D5A27]/40 flex items-center justify-center text-[#2D5A27]">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-[11px] font-arabic text-foreground/70">
                {isRTL ? 'جديد' : 'New'}
              </span>
            </button>
          )}
          {highlights.map((h) => (
            <button
              key={h.id}
              onClick={() => openHighlight(h.storyIds)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className="h-16 w-16 rounded-full p-0.5 bg-gradient-to-tr from-[#C9A227] to-[#2D5A27]">
                <div className="relative h-full w-full rounded-full overflow-hidden border-2 border-white dark:border-card">
                  <Image src={h.coverUrl || '/placeholder.svg'} alt={h.title} fill className="object-cover" />
                </div>
              </div>
              <span className="text-[11px] font-arabic text-foreground/80 max-w-[64px] truncate">
                {h.title}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Viewer */}
      {viewerStories && (
        <StoryViewer groups={buildGroup(viewerStories)} initialGroupIndex={0} onClose={() => setViewerStories(null)} />
      )}

      {/* Create highlight dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-arabic text-[#2D5A27]">
              {isRTL ? 'هايلايت جديد' : 'New Highlight'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRTL ? 'اسم الهايلايت' : 'Highlight name'}
              className="font-arabic"
            />
            <div>
              <p className="text-sm text-muted-foreground font-arabic mb-2">
                {isRTL ? 'اختر من الأرشيف' : 'Choose from archive'}
              </p>
              {archived.length === 0 ? (
                <p className="text-xs text-muted-foreground font-arabic">
                  {isRTL ? 'لا توجد قصص في الأرشيف' : 'No archived stories'}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                  {archived.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggleSelect(s.id)}
                      className={cn(
                        'relative aspect-[9/16] rounded-lg overflow-hidden border-2',
                        selected.includes(s.id) ? 'border-[#C9A227]' : 'border-transparent',
                      )}
                    >
                      <Image src={s.mediaUrl || '/placeholder.svg'} alt="" fill className="object-cover" />
                      {selected.includes(s.id) && (
                        <span className="absolute top-1 end-1 h-5 w-5 rounded-full bg-[#C9A227] text-black text-[10px] flex items-center justify-center font-bold">
                          {selected.indexOf(s.id) + 1}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={submitHighlight}
              disabled={!title.trim() || selected.length === 0}
              className="bg-[#2D5A27] hover:bg-[#234720] text-white font-arabic w-full"
            >
              {isRTL ? 'إنشاء' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- Archive tab content ----------

export function StoryArchiveTab({ isOwnProfile }: { isOwnProfile: boolean }) {
  const { isRTL } = useLanguage()
  const archived = useStoryStore((s) => s.archived)
  const highlights = useStoryStore((s) => s.highlights)
  const deleteStory = useStoryStore((s) => s.deleteStory)
  const republishStory = useStoryStore((s) => s.republishStory)
  const createHighlight = useStoryStore((s) => s.createHighlight)
  const addStoryToHighlight = useStoryStore((s) => s.addStoryToHighlight)

  const [viewerStories, setViewerStories] = React.useState<Story[] | null>(null)

  if (archived.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="h-16 w-16 rounded-full bg-[#2D5A27]/10 flex items-center justify-center mb-3">
          <Archive className="h-7 w-7 text-[#2D5A27]" />
        </div>
        <h3 className="font-bold font-arabic text-[#2D5A27]">{isRTL ? 'الأرشيف فارغ' : 'Empty Archive'}</h3>
        <p className="text-sm text-muted-foreground font-arabic mt-1">
          {isRTL ? 'القصص المنتهية تظهر هنا تلقائياً' : 'Expired stories appear here automatically'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 w-full">
      {archived.map((s) => (
        <div key={s.id} className="relative aspect-[9/16] bg-secondary overflow-hidden group">
          <button onClick={() => setViewerStories([s])} className="absolute inset-0" aria-label="عرض القصة">
            <Image src={s.mediaUrl || '/placeholder.svg'} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-1.5 start-1.5 text-[10px] text-white font-arabic">
              {new Date(s.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </button>

          {isOwnProfile && (
            <div className="absolute top-1 end-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-7 w-7 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
                    aria-label={isRTL ? 'خيارات' : 'Options'}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
                  <DropdownMenuItem className="font-arabic" onClick={() => republishStory(s.id)}>
                    <RotateCcw className="h-4 w-4 me-2" />
                    {isRTL ? 'إعادة النشر' : 'Republish'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="font-arabic" onClick={() => downloadStory(s)}>
                    <Download className="h-4 w-4 me-2" />
                    {isRTL ? 'حفظ في المعرض' : 'Save to gallery'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <p className="px-2 py-1 text-[11px] text-muted-foreground font-arabic">
                    {isRTL ? 'إضافة إلى هايلايت' : 'Add to highlight'}
                  </p>
                  {highlights.map((h) => (
                    <DropdownMenuItem
                      key={h.id}
                      className="font-arabic"
                      onClick={() => addStoryToHighlight(h.id, s.id)}
                    >
                      <Star className="h-4 w-4 me-2 text-[#C9A227]" />
                      {h.title}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    className="font-arabic"
                    onClick={() => createHighlight(isRTL ? 'هايلايت' : 'Highlight', [s.id], s.mediaUrl)}
                  >
                    <Plus className="h-4 w-4 me-2" />
                    {isRTL ? 'هايلايت جديد' : 'New highlight'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="font-arabic text-red-600 focus:text-red-600"
                    onClick={() => deleteStory(s.id, { fromArchive: true })}
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    {isRTL ? 'حذف' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      ))}

      {viewerStories && (
        <StoryViewer groups={buildGroup(viewerStories)} initialGroupIndex={0} onClose={() => setViewerStories(null)} />
      )}
    </div>
  )
}
