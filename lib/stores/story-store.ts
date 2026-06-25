'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ----- Types -----

export type StoryFilter = 'original' | 'warm' | 'cool' | 'bw' | 'vivid'

export type StoryReaction = 'heart' | 'celebrate' | 'haha' | 'fire' | 'clap' | 'zool'

export interface StoryTextOverlay {
  id: string
  text: string
  xPct: number // 0..100 (center anchor)
  yPct: number
  color: string
  bold: boolean
  italic: boolean
  size: number // px
}

export type StickerType = 'emoji' | 'poll' | 'question' | 'countdown' | 'music'

export interface StorySticker {
  id: string
  type: StickerType
  xPct: number
  yPct: number
  emoji?: string
  // poll
  question?: string
  options?: string[]
  // countdown
  label?: string
  targetAt?: number
  // music
  trackName?: string
}

export interface Story {
  id: string
  ownerId: string
  ownerName: string
  ownerNameAr: string
  ownerAvatar: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  filter: StoryFilter
  texts: StoryTextOverlay[]
  stickers: StorySticker[]
  drawingUrl?: string // transparent PNG of pen strokes
  createdAt: number
  expiresAt: number
  reactions: Record<StoryReaction, number>
  viewed: boolean
}

export interface Highlight {
  id: string
  title: string
  coverUrl: string
  storyIds: string[]
}

export interface StoryGroup {
  ownerId: string
  ownerName: string
  ownerNameAr: string
  ownerAvatar: string
  stories: Story[]
  allViewed: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000

export const REACTION_EMOJI: Record<StoryReaction, string> = {
  heart: '❤️',
  celebrate: '🎉',
  haha: '😂',
  fire: '🔥',
  clap: '👏',
  zool: '💚',
}

export const FILTER_CSS: Record<StoryFilter, string> = {
  original: 'none',
  warm: 'sepia(0.3) saturate(1.4) hue-rotate(-12deg) brightness(1.03)',
  cool: 'saturate(1.2) hue-rotate(18deg) brightness(1.05) contrast(1.02)',
  bw: 'grayscale(1) contrast(1.12)',
  vivid: 'saturate(1.8) contrast(1.18)',
}

const emptyReactions = (): Record<StoryReaction, number> => ({
  heart: 0,
  celebrate: 0,
  haha: 0,
  fire: 0,
  clap: 0,
  zool: 0,
})

// ----- Demo data -----

const now = Date.now()

const demoStories: Story[] = [
  {
    id: 'story-demo-1',
    ownerId: 'user-2',
    ownerName: 'Fatima Ali',
    ownerNameAr: 'فاطمة علي',
    ownerAvatar: '/avatars/fatima.jpg',
    mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900',
    mediaType: 'image',
    filter: 'warm',
    texts: [{ id: 't1', text: 'غروب على النيل', xPct: 50, yPct: 22, color: '#FFFFFF', bold: true, italic: false, size: 30 }],
    stickers: [],
    createdAt: now - 1000 * 60 * 60 * 2,
    expiresAt: now - 1000 * 60 * 60 * 2 + DAY_MS,
    reactions: { heart: 12, celebrate: 3, haha: 0, fire: 5, clap: 2, zool: 4 },
    viewed: false,
  },
  {
    id: 'story-demo-2',
    ownerId: 'user-3',
    ownerName: 'Omar Hassan',
    ownerNameAr: 'عمر حسن',
    ownerAvatar: '/avatars/omar.jpg',
    mediaUrl: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=900',
    mediaType: 'image',
    filter: 'vivid',
    texts: [{ id: 't1', text: 'الهلال كسب! 🦁', xPct: 50, yPct: 80, color: '#C9A227', bold: true, italic: false, size: 28 }],
    stickers: [{ id: 's1', type: 'emoji', xPct: 30, yPct: 40, emoji: '🔥' }],
    createdAt: now - 1000 * 60 * 60 * 5,
    expiresAt: now - 1000 * 60 * 60 * 5 + DAY_MS,
    reactions: { heart: 30, celebrate: 14, haha: 2, fire: 22, clap: 9, zool: 6 },
    viewed: false,
  },
]

const demoArchived: Story[] = [
  {
    id: 'story-arch-1',
    ownerId: 'user-1',
    ownerName: 'Hindawi',
    ownerNameAr: 'هنداوي',
    ownerAvatar: '/avatars/default.jpg',
    mediaUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900',
    mediaType: 'image',
    filter: 'cool',
    texts: [{ id: 't1', text: 'ذكريات', xPct: 50, yPct: 50, color: '#FFFFFF', bold: true, italic: true, size: 34 }],
    stickers: [],
    createdAt: now - DAY_MS * 5,
    expiresAt: now - DAY_MS * 4,
    reactions: { heart: 18, celebrate: 4, haha: 1, fire: 7, clap: 3, zool: 9 },
    viewed: true,
  },
  {
    id: 'story-arch-2',
    ownerId: 'user-1',
    ownerName: 'Hindawi',
    ownerNameAr: 'هنداوي',
    ownerAvatar: '/avatars/default.jpg',
    mediaUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900',
    mediaType: 'image',
    filter: 'original',
    texts: [],
    stickers: [],
    createdAt: now - DAY_MS * 9,
    expiresAt: now - DAY_MS * 8,
    reactions: { heart: 41, celebrate: 12, haha: 5, fire: 19, clap: 8, zool: 14 },
    viewed: true,
  },
]

// ----- Store -----

interface StoryState {
  stories: Story[]
  archived: Story[]
  highlights: Highlight[]

  addStory: (story: Omit<Story, 'id' | 'createdAt' | 'expiresAt' | 'reactions' | 'viewed'>) => string
  deleteStory: (id: string, options?: { fromArchive?: boolean }) => void
  reactToStory: (id: string, reaction: StoryReaction) => void
  markGroupViewed: (ownerId: string) => void
  republishStory: (id: string) => void
  expireOldStories: () => void

  // highlights
  createHighlight: (title: string, storyIds: string[], coverUrl?: string) => string
  addStoryToHighlight: (highlightId: string, storyId: string) => void
  removeHighlight: (id: string) => void

  // selectors
  getGroupedStories: (currentUserId: string) => StoryGroup[]
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      stories: demoStories,
      archived: demoArchived,
      highlights: [
        {
          id: 'hl-1',
          title: 'رحلاتي',
          coverUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
          storyIds: ['story-arch-1'],
        },
      ],

      addStory: (story) => {
        const id = `story-${Date.now()}`
        const createdAt = Date.now()
        const newStory: Story = {
          ...story,
          id,
          createdAt,
          expiresAt: createdAt + DAY_MS,
          reactions: emptyReactions(),
          viewed: false,
        }
        set((state) => ({ stories: [newStory, ...state.stories] }))
        return id
      },

      deleteStory: (id, options) =>
        set((state) =>
          options?.fromArchive
            ? { archived: state.archived.filter((s) => s.id !== id) }
            : { stories: state.stories.filter((s) => s.id !== id) },
        ),

      reactToStory: (id, reaction) =>
        set((state) => ({
          stories: state.stories.map((s) =>
            s.id === id ? { ...s, reactions: { ...s.reactions, [reaction]: s.reactions[reaction] + 1 } } : s,
          ),
        })),

      markGroupViewed: (ownerId) =>
        set((state) => {
          // No-op if nothing would change, to avoid render loops.
          const needsUpdate = state.stories.some((s) => s.ownerId === ownerId && !s.viewed)
          if (!needsUpdate) return {}
          return {
            stories: state.stories.map((s) => (s.ownerId === ownerId ? { ...s, viewed: true } : s)),
          }
        }),

      republishStory: (id) => {
        const story = get().archived.find((s) => s.id === id)
        if (!story) return
        const createdAt = Date.now()
        const newStory: Story = {
          ...story,
          id: `story-${createdAt}`,
          createdAt,
          expiresAt: createdAt + DAY_MS,
          reactions: emptyReactions(),
          viewed: false,
        }
        set((state) => ({ stories: [newStory, ...state.stories] }))
      },

      expireOldStories: () => {
        const ts = Date.now()
        const { stories } = get()
        const expired = stories.filter((s) => s.expiresAt <= ts)
        if (expired.length === 0) return
        set((state) => ({
          stories: state.stories.filter((s) => s.expiresAt > ts),
          archived: [...expired.map((s) => ({ ...s, viewed: true })), ...state.archived],
        }))
      },

      createHighlight: (title, storyIds, coverUrl) => {
        const id = `hl-${Date.now()}`
        const cover =
          coverUrl ||
          get().archived.find((s) => s.id === storyIds[0])?.mediaUrl ||
          get().stories.find((s) => s.id === storyIds[0])?.mediaUrl ||
          ''
        set((state) => ({
          highlights: [...state.highlights, { id, title, coverUrl: cover, storyIds }],
        }))
        return id
      },

      addStoryToHighlight: (highlightId, storyId) =>
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === highlightId && !h.storyIds.includes(storyId)
              ? { ...h, storyIds: [...h.storyIds, storyId] }
              : h,
          ),
        })),

      removeHighlight: (id) => set((state) => ({ highlights: state.highlights.filter((h) => h.id !== id) })),

      getGroupedStories: (currentUserId) => {
        const { stories } = get()
        const active = stories.filter((s) => s.expiresAt > Date.now())
        const map = new Map<string, StoryGroup>()
        for (const s of active) {
          let group = map.get(s.ownerId)
          if (!group) {
            group = {
              ownerId: s.ownerId,
              ownerName: s.ownerName,
              ownerNameAr: s.ownerNameAr,
              ownerAvatar: s.ownerAvatar,
              stories: [],
              allViewed: true,
            }
            map.set(s.ownerId, group)
          }
          group.stories.push(s)
          if (!s.viewed) group.allViewed = false
        }
        const groups = Array.from(map.values())
        groups.forEach((g) => g.stories.sort((a, b) => a.createdAt - b.createdAt))
        // Current user first, then unviewed, then viewed
        return groups.sort((a, b) => {
          if (a.ownerId === currentUserId) return -1
          if (b.ownerId === currentUserId) return 1
          if (a.allViewed !== b.allViewed) return a.allViewed ? 1 : -1
          return 0
        })
      },
    }),
    {
      name: 'rakobatna-story-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        stories: state.stories,
        archived: state.archived,
        highlights: state.highlights,
      }),
    },
  ),
)
