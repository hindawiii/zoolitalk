'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserStore } from '@/lib/stores/user-store'
import { useStoryStore } from '@/lib/stores/story-store'
import { StoryComposer } from './story-composer'
import { StoryViewer } from './story-viewer'
import { cn } from '@/lib/utils'

export function StoryBar() {
  const { currentUser } = useUserStore()
  const expireOldStories = useStoryStore((s) => s.expireOldStories)
  const getGroupedStories = useStoryStore((s) => s.getGroupedStories)
  // Subscribe to stories so the bar re-renders on changes
  const stories = useStoryStore((s) => s.stories)

  const [composerOpen, setComposerOpen] = React.useState(false)
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null)

  // Expire stories older than 24h on mount
  React.useEffect(() => {
    expireOldStories()
  }, [expireOldStories])

  const groups = React.useMemo(
    () => getGroupedStories(currentUser?.id ?? ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stories, currentUser?.id],
  )

  const ownHasStory = groups.some((g) => g.ownerId === currentUser?.id)
  const otherGroups = groups.filter((g) => g.ownerId !== currentUser?.id)

  return (
    <div dir="rtl" className="py-3 border-b border-[#2D5A27]/15 bg-white dark:bg-card w-full">
      <div className="flex gap-3 px-3 overflow-x-auto scrollbar-hide w-full">
        {/* Add Story / Own story */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => {
              if (ownHasStory) {
                const idx = groups.findIndex((g) => g.ownerId === currentUser?.id)
                setViewerIndex(idx)
              } else {
                setComposerOpen(true)
              }
            }}
            className="relative"
            aria-label={ownHasStory ? 'عرض قصتك' : 'إضافة قصة'}
          >
            <div
              className={cn(
                'relative p-0.5 rounded-full',
                ownHasStory
                  ? 'bg-gradient-to-tr from-[#C9A227] to-[#2D5A27]'
                  : 'border-2 border-dashed border-[#C9A227]',
              )}
            >
              <Avatar className="h-16 w-16 border-2 border-white dark:border-card">
                <AvatarImage src={currentUser?.avatar || '/placeholder.svg'} />
                <AvatarFallback className="bg-[#2D5A27]/10 text-[#2D5A27]">
                  {currentUser?.nameAr?.[0] || 'ز'}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* + badge */}
            <span
              onClick={(e) => {
                e.stopPropagation()
                setComposerOpen(true)
              }}
              className="absolute bottom-0 left-0 h-5 w-5 rounded-full bg-[#2D5A27] border-2 border-white dark:border-card flex items-center justify-center"
            >
              <Plus className="h-3 w-3 text-white" />
            </span>
          </button>
          <span className="text-[10px] font-arabic text-[#2D5A27] max-w-[64px] truncate">
            {ownHasStory ? 'قصتك' : 'إضافة'}
          </span>
        </div>

        {/* Other users' stories */}
        {otherGroups.map((g) => {
          const idx = groups.findIndex((x) => x.ownerId === g.ownerId)
          return (
            <div key={g.ownerId} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <button onClick={() => setViewerIndex(idx)} aria-label={`قصة ${g.ownerNameAr}`}>
                <div
                  className={cn(
                    'p-0.5 rounded-full',
                    g.allViewed
                      ? 'bg-[#2D5A27]/20'
                      : 'bg-gradient-to-tr from-[#C9A227] to-[#2D5A27]',
                  )}
                >
                  <Avatar className="h-16 w-16 border-2 border-white dark:border-card">
                    <AvatarImage src={g.ownerAvatar || '/placeholder.svg'} />
                    <AvatarFallback className="bg-[#2D5A27]/10 text-[#2D5A27]">
                      {g.ownerNameAr?.[0] || 'ز'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </button>
              <span className="text-[10px] font-arabic text-foreground/80 max-w-[64px] truncate">
                {g.ownerNameAr}
              </span>
            </div>
          )
        })}
      </div>

      {/* Composer */}
      <StoryComposer open={composerOpen} onClose={() => setComposerOpen(false)} />

      {/* Viewer */}
      {viewerIndex !== null && groups[viewerIndex] && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  )
}
