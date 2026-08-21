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

  // A user's stories can have legacy owner IDs after authentication/profile hydration.
  // Normalize all records belonging to the signed-in user into one group before rendering.
  const ownGroups = groups.filter(
    (group) =>
      group.ownerId === currentUser?.id ||
      (Boolean(currentUser?.nameAr) && group.ownerNameAr === currentUser.nameAr) ||
      (Boolean(currentUser?.avatar) && group.ownerAvatar === currentUser.avatar),
  )
  const ownGroup = ownGroups.length
    ? {
        ...ownGroups[0],
        ownerId: currentUser?.id ?? ownGroups[0].ownerId,
        stories: ownGroups.flatMap((group) => group.stories).sort((a, b) => a.createdAt - b.createdAt),
        allViewed: ownGroups.every((group) => group.allViewed),
      }
    : undefined
  const ownHasStory = Boolean(ownGroup)
  const ownGroupIds = new Set(ownGroups.map((group) => group.ownerId))
  const normalizedGroups = ownGroup ? [ownGroup, ...groups.filter((group) => !ownGroupIds.has(group.ownerId))] : groups
  const otherGroups = normalizedGroups.filter((g) => g.ownerId !== ownGroup?.ownerId)

  // Latest image frame for the current user's own story card (skip videos).
  const ownLatest = ownGroup?.stories?.[ownGroup.stories.length - 1]
  const ownPreview = ownLatest?.mediaType === 'image' ? ownLatest.mediaUrl : undefined

  return (
    <div dir="rtl" className="py-3 border-b border-[#2D5A27]/15 bg-white dark:bg-card w-full">
      <div className="flex gap-2.5 px-3 overflow-x-auto scrollbar-hide w-full">
        {/* Add Story / Own story — Facebook-style rectangular card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (ownHasStory) {
              const idx = normalizedGroups.findIndex((g) => g.ownerId === ownGroup?.ownerId)
              setViewerIndex(idx)
            } else {
              setComposerOpen(true)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (ownHasStory) {
                const idx = normalizedGroups.findIndex((g) => g.ownerId === ownGroup?.ownerId)
                setViewerIndex(idx)
              } else {
                setComposerOpen(true)
              }
            }
          }}
          aria-label={ownHasStory ? 'عرض قصتك' : 'إضافة قصة'}
          className="relative flex-shrink-0 h-40 w-24 overflow-hidden rounded-xl border border-[#2D5A27]/15 bg-[#2D5A27]/5 shadow-sm cursor-pointer"
        >
          {/* Top image / avatar area */}
          <div className="relative h-[68%] w-full overflow-hidden bg-[#2D5A27]/10">
            {ownHasStory && ownPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ownPreview || '/placeholder.svg'} alt="" className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser?.avatar || '/placeholder.svg'}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Bottom label area */}
          <div className="relative flex h-[32%] w-full flex-col items-center justify-end bg-white dark:bg-card pb-1.5">
            <span className="text-[10px] font-arabic font-semibold text-[#2D5A27] max-w-[88px] truncate">
              {ownHasStory ? 'قصتك' : 'إضافة قصة'}
            </span>
          </div>

          {/* + badge (centered on the divider) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setComposerOpen(true)
            }}
            aria-label="إضافة قصة جديدة"
            className="absolute bottom-[26%] left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-[#2D5A27] border-[3px] border-white dark:border-card transition-transform hover:scale-110 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 text-white" />
          </button>
        </div>

        {/* Other users' stories — Facebook-style rectangular cards */}
        {otherGroups.map((g) => {
          const idx = normalizedGroups.findIndex((x) => x.ownerId === g.ownerId)
          const latest = g.stories?.[g.stories.length - 1]
          const preview = latest?.mediaType === 'image' ? latest.mediaUrl : undefined
          return (
            <button
              key={g.ownerId}
              onClick={() => setViewerIndex(idx)}
              aria-label={`قصة ${g.ownerNameAr}`}
              className="relative flex-shrink-0 h-40 w-24 overflow-hidden rounded-xl border border-[#2D5A27]/15 shadow-sm"
            >
              {/* Full-bleed story preview */}
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview || '/placeholder.svg'} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-b from-[#2D5A27]/40 to-[#2D5A27]/80" />
              )}

              {/* Dark gradient for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Author avatar ring (top) */}
              <span
                className={cn(
                  'absolute top-2 right-2 rounded-full p-0.5',
                  g.allViewed
                    ? 'bg-white/60 dark:bg-white/40'
                    : 'bg-gradient-to-tr from-[#C9A227] to-[#2D5A27]',
                )}
              >
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src={g.ownerAvatar || '/placeholder.svg'} />
                  <AvatarFallback className="bg-[#2D5A27]/10 text-[#2D5A27] text-xs">
                    {g.ownerNameAr?.[0] || 'ز'}
                  </AvatarFallback>
                </Avatar>
              </span>

              {/* Name (bottom) */}
              <span className="absolute bottom-1.5 right-0 left-0 px-1.5 text-center text-[10px] font-arabic font-semibold text-white drop-shadow max-w-full truncate">
                {g.ownerNameAr}
              </span>
            </button>
          )
        })}
      </div>

      {/* Composer */}
      <StoryComposer open={composerOpen} onClose={() => setComposerOpen(false)} />

      {/* Viewer */}
      {viewerIndex !== null && normalizedGroups[viewerIndex] && (
        <StoryViewer
          groups={normalizedGroups}
          initialGroupIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  )
}
