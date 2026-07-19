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
  parentId: string | null // null = top-level comment, otherwise the comment being replied to
  authorId: string
  authorName: string
  authorNameAr: string
  authorAvatar: string
  text: string
  mentions: string[] // usernames mentioned
  createdAt: number
  likes: number
  likedByMe: boolean
}

export interface CommentThread extends ReelComment {
  replies: ReelComment[]
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

// ----- Reference data -----

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

const demoReels: Reel[] = []

const demoComments: ReelComment[] = []

// ----- Store -----

interface ReelsState {
  reels: Reel[]
  comments: ReelComment[]

  addReel: (reel: Omit<Reel, 'id' | 'likes' | 'shares' | 'liked' | 'saved' | 'createdAt'>) => string
  toggleLike: (id: string) => void
  toggleSave: (id: string) => void
  shareReel: (id: string) => void
  addComment: (
    comment: Omit<ReelComment, 'id' | 'createdAt' | 'likes' | 'likedByMe' | 'mentions' | 'parentId'> & {
      mentions?: string[]
      parentId?: string | null
    },
  ) => void
  toggleCommentLike: (commentId: string) => void
  getComments: (reelId: string) => ReelComment[]
  getCommentThreads: (reelId: string) => CommentThread[]
  getCommentCount: (reelId: string) => number
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
          parentId: comment.parentId ?? null,
          mentions: comment.mentions ?? [],
          createdAt: Date.now(),
          likes: 0,
          likedByMe: false,
        }
        set((state) => ({ comments: [...state.comments, newComment] }))

        // Notify every mentioned user (skip self-mentions).
        const reel = get().reels.find((r) => r.id === comment.reelId)
        ;(newComment.mentions ?? []).forEach((username) => {
          const target = MENTION_USERS.find((u) => u.username === username)
          if (!target || target.id === comment.authorId) return
          useReelNotificationsStore.getState().push({
            type: 'mention',
            recipientId: target.id,
            actorId: comment.authorId,
            actorName: comment.authorNameAr,
            actorAvatar: comment.authorAvatar,
            reelId: comment.reelId,
            reelPoster: reel?.posterUrl ?? '',
            commentText: newComment.text,
          })
        })
      },

      toggleCommentLike: (commentId) =>
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId
              ? { ...c, likedByMe: !c.likedByMe, likes: c.likes + (c.likedByMe ? -1 : 1) }
              : c,
          ),
        })),

      getComments: (reelId) =>
        get()
          .comments.filter((c) => c.reelId === reelId)
          .sort((a, b) => a.createdAt - b.createdAt),

      getCommentThreads: (reelId) => {
        const all = get()
          .comments.filter((c) => c.reelId === reelId)
          .sort((a, b) => a.createdAt - b.createdAt)
        const tops = all.filter((c) => !c.parentId)
        return tops.map((t) => ({
          ...t,
          replies: all.filter((c) => c.parentId === t.id),
        }))
      },

      getCommentCount: (reelId) => get().comments.filter((c) => c.reelId === reelId).length,
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

// Resolve a mentioned @username to a known user (for navigation).
export function resolveMention(username: string): MentionUser | undefined {
  return MENTION_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase())
}

// ----- Mention notifications -----

export interface ReelNotification {
  id: string
  type: 'mention'
  recipientId: string
  actorId: string
  actorName: string
  actorAvatar: string
  reelId: string
  reelPoster: string
  commentText: string
  createdAt: number
  read: boolean
}

interface ReelNotificationsState {
  notifications: ReelNotification[]
  push: (n: Omit<ReelNotification, 'id' | 'createdAt' | 'read'>) => void
  markAllRead: () => void
  unreadCount: (recipientId: string) => number
  forUser: (recipientId: string) => ReelNotification[]
}

export const useReelNotificationsStore = create<ReelNotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      push: (n) =>
        set((state) => ({
          notifications: [
            { ...n, id: `rn-${Date.now()}`, createdAt: Date.now(), read: false },
            ...state.notifications,
          ].slice(0, 50),
        })),
      markAllRead: () =>
        set((state) => ({ notifications: state.notifications.map((x) => ({ ...x, read: true })) })),
      unreadCount: (recipientId) =>
        get().notifications.filter((x) => x.recipientId === recipientId && !x.read).length,
      forUser: (recipientId) =>
        get()
          .notifications.filter((x) => x.recipientId === recipientId)
          .sort((a, b) => b.createdAt - a.createdAt),
    }),
    {
      name: 'rakobatna-reel-notifications',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
