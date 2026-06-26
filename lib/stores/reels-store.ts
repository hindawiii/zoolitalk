'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ----- Types -----

export interface MentionUser {
  id: string
  username: string
  name: string
  nameAr: string
  avatar: string
}

export interface ReelComment {
  id: string
  reelId: string
  authorId: string
  authorName: string
  authorNameAr: string
  authorAvatar: string
  text: string
  mentions: string[] // usernames mentioned
  createdAt: number
  likes: number
}

export interface ReelTrack {
  id: string
  title: string
  artist: string
}

export interface Reel {
  id: string
  ownerId: string
  ownerName: string
  ownerNameAr: string
  ownerAvatar: string
  videoUrl: string
  posterUrl: string
  caption: string
  track?: ReelTrack
  likes: number
  shares: number
  liked: boolean
  saved: boolean
  createdAt: number
}

// ----- Demo data -----

// Public sample portrait/landscape videos (loop fine for a demo feed).
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
]

const POSTERS = [
  'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=600',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600',
]

export const MUSIC_LIBRARY: ReelTrack[] = [
  { id: 'tr-1', title: 'إيقاع سوداني', artist: 'فرقة النيل' },
  { id: 'tr-2', title: 'الجراري', artist: 'تراث' },
  { id: 'tr-3', title: 'سمر الليالي', artist: 'محمد وردي' },
  { id: 'tr-4', title: 'Afro Beat', artist: 'Khartoum Sounds' },
  { id: 'tr-5', title: 'Lo-Fi Chill', artist: 'Studio Mix' },
]

export const MENTION_USERS: MentionUser[] = [
  { id: 'user-2', username: 'fatima_ali', name: 'Fatima Ali', nameAr: 'فاطمة علي', avatar: '/avatars/fatima.jpg' },
  { id: 'user-3', username: 'omar_hassan', name: 'Omar Hassan', nameAr: 'عمر حسن', avatar: '/avatars/omar.jpg' },
  { id: 'user-4', username: 'sara_m', name: 'Sara Mohamed', nameAr: 'سارة محمد', avatar: '/avatars/sara.jpg' },
  { id: 'user-5', username: 'ahmed_k', name: 'Ahmed Khalid', nameAr: 'أحمد خالد', avatar: '/avatars/ahmed.jpg' },
  { id: 'user-1', username: 'hindawiii', name: 'Hindawi', nameAr: 'هنداوي', avatar: '/avatars/default.jpg' },
]

const now = Date.now()

const demoReels: Reel[] = [
  {
    id: 'reel-1',
    ownerId: 'user-2',
    ownerName: 'Fatima Ali',
    ownerNameAr: 'فاطمة علي',
    ownerAvatar: '/avatars/fatima.jpg',
    videoUrl: SAMPLE_VIDEOS[0],
    posterUrl: POSTERS[0],
    caption: 'جولة في شوارع الخرطوم 🌆 #السودان #ريلز',
    track: MUSIC_LIBRARY[0],
    likes: 1240,
    shares: 87,
    liked: false,
    saved: false,
    createdAt: now - 1000 * 60 * 30,
  },
  {
    id: 'reel-2',
    ownerId: 'user-3',
    ownerName: 'Omar Hassan',
    ownerNameAr: 'عمر حسن',
    ownerAvatar: '/avatars/omar.jpg',
    videoUrl: SAMPLE_VIDEOS[1],
    posterUrl: POSTERS[1],
    caption: 'لحظات لا تُنسى من المباراة أمس 🦁⚽',
    track: MUSIC_LIBRARY[3],
    likes: 3420,
    shares: 210,
    liked: true,
    saved: false,
    createdAt: now - 1000 * 60 * 60 * 3,
  },
  {
    id: 'reel-3',
    ownerId: 'user-4',
    ownerName: 'Sara Mohamed',
    ownerNameAr: 'سارة محمد',
    ownerAvatar: '/avatars/sara.jpg',
    videoUrl: SAMPLE_VIDEOS[2],
    posterUrl: POSTERS[2],
    caption: 'وصفة الجبنة على الطريقة السودانية ☕✨',
    track: MUSIC_LIBRARY[2],
    likes: 845,
    shares: 33,
    liked: false,
    saved: true,
    createdAt: now - 1000 * 60 * 60 * 8,
  },
  {
    id: 'reel-4',
    ownerId: 'user-5',
    ownerName: 'Ahmed Khalid',
    ownerNameAr: 'أحمد خالد',
    ownerAvatar: '/avatars/ahmed.jpg',
    videoUrl: SAMPLE_VIDEOS[3],
    posterUrl: POSTERS[3],
    caption: 'غروب على النيل يستحق المشاهدة 🌅',
    likes: 2100,
    shares: 154,
    liked: false,
    saved: false,
    createdAt: now - 1000 * 60 * 60 * 20,
  },
]

const demoComments: ReelComment[] = [
  {
    id: 'rc-1',
    reelId: 'reel-1',
    authorId: 'user-3',
    authorName: 'Omar Hassan',
    authorNameAr: 'عمر حسن',
    authorAvatar: '/avatars/omar.jpg',
    text: 'ما شاء الله جميل جداً 🔥',
    mentions: [],
    createdAt: now - 1000 * 60 * 20,
    likes: 12,
  },
  {
    id: 'rc-2',
    reelId: 'reel-1',
    authorId: 'user-4',
    authorName: 'Sara Mohamed',
    authorNameAr: 'سارة محمد',
    authorAvatar: '/avatars/sara.jpg',
    text: '@fatima_ali شوفي دي 😍',
    mentions: ['fatima_ali'],
    createdAt: now - 1000 * 60 * 10,
    likes: 4,
  },
]

// ----- Store -----

interface ReelsState {
  reels: Reel[]
  comments: ReelComment[]

  addReel: (reel: Omit<Reel, 'id' | 'likes' | 'shares' | 'liked' | 'saved' | 'createdAt'>) => string
  toggleLike: (id: string) => void
  toggleSave: (id: string) => void
  shareReel: (id: string) => void
  addComment: (
    comment: Omit<ReelComment, 'id' | 'createdAt' | 'likes' | 'mentions'> & { mentions?: string[] },
  ) => void
  getComments: (reelId: string) => ReelComment[]
}

export const useReelsStore = create<ReelsState>()(
  persist(
    (set, get) => ({
      reels: demoReels,
      comments: demoComments,

      addReel: (reel) => {
        const id = `reel-${Date.now()}`
        const newReel: Reel = {
          ...reel,
          id,
          likes: 0,
          shares: 0,
          liked: false,
          saved: false,
          createdAt: Date.now(),
        }
        set((state) => ({ reels: [newReel, ...state.reels] }))
        return id
      },

      toggleLike: (id) =>
        set((state) => ({
          reels: state.reels.map((r) =>
            r.id === id ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) } : r,
          ),
        })),

      toggleSave: (id) =>
        set((state) => ({
          reels: state.reels.map((r) => (r.id === id ? { ...r, saved: !r.saved } : r)),
        })),

      shareReel: (id) =>
        set((state) => ({
          reels: state.reels.map((r) => (r.id === id ? { ...r, shares: r.shares + 1 } : r)),
        })),

      addComment: (comment) => {
        const newComment: ReelComment = {
          ...comment,
          id: `rc-${Date.now()}`,
          mentions: comment.mentions ?? [],
          createdAt: Date.now(),
          likes: 0,
        }
        set((state) => ({ comments: [...state.comments, newComment] }))
      },

      getComments: (reelId) =>
        get()
          .comments.filter((c) => c.reelId === reelId)
          .sort((a, b) => a.createdAt - b.createdAt),
    }),
    {
      name: 'rakobatna-reels-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ reels: state.reels, comments: state.comments }),
    },
  ),
)

// Extract @mentions from a comment string.
export function extractMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_]+)/g) ?? []
  return Array.from(new Set(matches.map((m) => m.slice(1))))
}
