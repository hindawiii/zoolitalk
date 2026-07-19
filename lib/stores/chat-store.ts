import { create } from 'zustand'
import { useUserStore } from '@/lib/stores/user-store'
import * as chatService from '@/lib/firebase/chat'

export interface Message {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  type: 'text' | 'voice' | 'image' | 'sticker' | 'location' | 'video' | 'document' | 'system'
  // System event (join/leave) for groups
  systemEvent?: 'join' | 'leave' | 'create'
  voiceDuration?: number
  voiceUrl?: string
  imageUrl?: string
  stickerUrl?: string
  // Video
  videoUrl?: string
  videoThumbnail?: string
  videoDuration?: number
  // Document
  documentName?: string
  documentType?: string
  documentSize?: string
  // Location sharing
  location?: {
    lat: number
    lng: number
    isLive: boolean
    expiresAt?: Date
    duration?: number // in minutes: 15, 60, or 480
  }
  timestamp: Date
  status: 'sending' | 'sent' | 'delivered' | 'read'
  replyTo?: string
  isEdited?: boolean
  // Delete tracking
  deletedForEveryone?: boolean
  deletedFor?: string[] // User IDs who deleted this message for themselves
  // Translation
  translatedContent?: string
  originalLanguage?: string
  // Channel reactions (interactive channels): emoji -> list of userIds
  reactions?: Record<string, string[]>
  // Channel comments (interactive channels)
  comments?: ChannelComment[]
  // Read receipts
  readBy?: string[]
}

export interface ChannelComment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: Date
}

// A lightweight notification payload surfaced when a message arrives
// while the user is outside of the relevant chat.
export interface ChatNotification {
  id: string
  chatId: string
  senderName: string
  senderAvatar: string
  preview: string
}

export interface Chat {
  id: string
  type: 'private' | 'group' | 'channel'
  // Channel posting mode: 'broadcast' = admins only, 'interactive' = members can react/comment
  channelMode?: 'broadcast' | 'interactive'
  name: string
  nameAr: string
  avatar: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  isOnline?: boolean
  participants?: ChatParticipant[]
  // For groups (Janba)
  admins?: string[]
  mutedUsers?: string[]
  // Archive and Mute
  isArchived?: boolean
  isMuted?: boolean
  mutedUntil?: Date
  // Pinned
  isPinned?: boolean
  // Blocked (private chats)
  isBlocked?: boolean
}

export interface ChatParticipant {
  id: string
  name: string
  avatar: string
  role: 'admin' | 'moderator' | 'member'
  isOnline: boolean
}

// A registered user in the directory (for presence + starting new chats)
export interface UserLite {
  id: string
  name: string
  nameAr: string
  avatar: string
  isOnline: boolean
  lastSeen: Date | null
}

interface ChatState {
  // Chats list (mapped from Firestore for the current user)
  chats: Chat[]
  setChats: (chats: Chat[]) => void
  addChat: (chat: Chat) => void

  // Registered users directory + presence map
  usersDirectory: UserLite[]
  setUsersDirectory: (users: UserLite[]) => void
  presence: Record<string, boolean>
  setPresence: (presence: Record<string, boolean>) => void

  // Active chat
  activeChatId: string | null
  setActiveChatId: (id: string | null) => void

  // Messages (keyed by chatId) — reconciled from Firestore + optimistic pending
  messages: Record<string, Message[]>
  _server: Record<string, Message[]>
  _pending: Record<string, Message[]>
  _translations: Record<string, { translatedContent: string; originalLanguage: string }>
  // Replace the server snapshot for a chat (called by the sync layer)
  setMessagesForChat: (chatId: string, messages: Message[]) => void

  addMessage: (chatId: string, message: Message) => void
  editMessage: (chatId: string, messageId: string, newContent: string) => void
  deleteMessage: (chatId: string, messageId: string) => void
  deleteMessageForEveryone: (chatId: string, messageId: string) => void
  deleteMessageForMe: (chatId: string, messageId: string, userId: string) => void

  // Typing indicators
  typingUsers: Record<string, string[]>
  setTypingForChat: (chatId: string, userIds: string[]) => void
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void

  // Unread tracking
  markChatRead: (chatId: string) => void

  // New-message notification (for global toast / sound / vibration)
  notification: ChatNotification | null
  pushNotification: (n: ChatNotification) => void
  clearNotification: () => void

  // Channel comments (interactive channels)
  addChannelComment: (chatId: string, messageId: string, comment: ChannelComment) => void

  // Archive and Mute
  archiveChat: (chatId: string) => void
  unarchiveChat: (chatId: string) => void
  muteChat: (chatId: string, until?: Date) => void
  unmuteChat: (chatId: string) => void
  pinChat: (chatId: string) => void
  unpinChat: (chatId: string) => void

  // Conversation management
  clearChat: (chatId: string) => void
  blockChat: (chatId: string) => void
  unblockChat: (chatId: string) => void

  // Admin actions (for Janba/groups)
  muteUser: (chatId: string, userId: string) => void
  unmuteUser: (chatId: string, userId: string) => void
  kickUser: (chatId: string, userId: string) => void
  promoteUser: (chatId: string, userId: string, role: 'admin' | 'moderator') => void

  // Voice note recording
  isRecording: boolean
  recordingDuration: number
  setRecording: (isRecording: boolean) => void
  setRecordingDuration: (duration: number) => void

  // Location sharing
  shareLocation: (chatId: string, userId: string, userName: string, userAvatar: string, lat: number, lng: number, isLive: boolean, duration?: number) => void
  stopLiveLocation: (chatId: string, messageId: string) => void

  // Translation
  translateMessage: (chatId: string, messageId: string, translatedContent: string, originalLanguage: string) => void

  // Channel reactions (interactive channels)
  toggleReaction: (chatId: string, messageId: string, emoji: string, userId: string) => void

  // Games
  activeGame: string | null
  setActiveGame: (game: string | null) => void

  // Reset everything (on sign-out)
  resetChats: () => void
}

const currentUserId = () => useUserStore.getState().currentUser?.id || ''

/**
 * Merge the server snapshot with any still-unconfirmed optimistic messages and
 * apply local translations, producing the array components render.
 */
function reconcile(
  server: Message[],
  pending: Message[],
  translations: Record<string, { translatedContent: string; originalLanguage: string }>,
): Message[] {
  const serverIds = new Set(server.map((m) => m.id))
  const stillPending = pending.filter((m) => !serverIds.has(m.id))
  const merged = [...server, ...stillPending].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )
  return merged.map((m) => {
    const t = translations[m.id]
    return t ? { ...m, translatedContent: t.translatedContent, originalLanguage: t.originalLanguage } : m
  })
}

export const useChatStore = create<ChatState>()((set, get) => ({
  chats: [],
  setChats: (chats) => set({ chats }),
  addChat: (chat) =>
    set((state) =>
      state.chats.some((c) => c.id === chat.id)
        ? state
        : { chats: [chat, ...state.chats] },
    ),

  usersDirectory: [],
  setUsersDirectory: (usersDirectory) => set({ usersDirectory }),
  presence: {},
  setPresence: (presence) => set({ presence }),

  activeChatId: null,
  setActiveChatId: (activeChatId) => set({ activeChatId }),

  messages: {},
  _server: {},
  _pending: {},
  _translations: {},

  setMessagesForChat: (chatId, serverMsgs) =>
    set((state) => {
      const serverIds = new Set(serverMsgs.map((m) => m.id))
      // Drop optimistic messages that are now confirmed on the server.
      const pending = (state._pending[chatId] || []).filter((m) => !serverIds.has(m.id))
      return {
        _server: { ...state._server, [chatId]: serverMsgs },
        _pending: { ...state._pending, [chatId]: pending },
        messages: {
          ...state.messages,
          [chatId]: reconcile(serverMsgs, pending, state._translations),
        },
      }
    }),

  addMessage: (chatId, message) => {
    const chat = get().chats.find((c) => c.id === chatId)
    // Optimistic append so the sender sees the message immediately.
    set((state) => {
      const pending = [...(state._pending[chatId] || []), { ...message, status: 'sending' as const }]
      return {
        _pending: { ...state._pending, [chatId]: pending },
        messages: {
          ...state.messages,
          [chatId]: reconcile(state._server[chatId] || [], pending, state._translations),
        },
        // Optimistically bump this chat to the top of the list.
        chats: state.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                lastMessage: message.content || (message.type === 'image' ? '📷 صورة' : message.type === 'voice' ? '🎤 رسالة صوتية' : message.type === 'location' ? '📍 موقع' : c.lastMessage),
                lastMessageTime: message.timestamp,
              }
            : c,
        ),
      }
    })
    if (chat) {
      chatService.sendMessage(chat, message).catch((err) => {
        console.error('[v0] sendMessage failed:', err)
      })
    }
  },

  editMessage: (chatId, messageId, newContent) => {
    void chatService.editMessage(chatId, messageId, newContent)
  },
  deleteMessage: (chatId, messageId) => {
    void chatService.deleteMessageForEveryone(chatId, messageId)
  },
  deleteMessageForEveryone: (chatId, messageId) => {
    void chatService.deleteMessageForEveryone(chatId, messageId)
  },
  deleteMessageForMe: (chatId, messageId, userId) => {
    void chatService.deleteMessageForMe(chatId, messageId, userId || currentUserId())
  },

  typingUsers: {},
  setTypingForChat: (chatId, userIds) =>
    set((state) => ({ typingUsers: { ...state.typingUsers, [chatId]: userIds } })),
  setTyping: (chatId, userId, isTyping) => {
    void chatService.setTyping(chatId, userId || currentUserId(), isTyping)
  },

  markChatRead: (chatId) => {
    const uid = currentUserId()
    // Optimistic local reset.
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)),
    }))
    void chatService.markChatRead(chatId, uid)
  },

  notification: null,
  pushNotification: (notification) => set({ notification }),
  clearNotification: () => set({ notification: null }),

  addChannelComment: (chatId, messageId, comment) => {
    void chatService.addChannelComment(chatId, messageId, {
      id: comment.id,
      userId: comment.userId,
      userName: comment.userName,
      userAvatar: comment.userAvatar,
      content: comment.content,
    })
  },

  archiveChat: (chatId) => {
    set((state) => ({ chats: state.chats.map((c) => (c.id === chatId ? { ...c, isArchived: true } : c)) }))
    void chatService.archiveChat(chatId, currentUserId())
  },
  unarchiveChat: (chatId) => {
    set((state) => ({ chats: state.chats.map((c) => (c.id === chatId ? { ...c, isArchived: false } : c)) }))
    void chatService.unarchiveChat(chatId, currentUserId())
  },
  muteChat: (chatId, until) => {
    set((state) => ({ chats: state.chats.map((c) => (c.id === chatId ? { ...c, isMuted: true, mutedUntil: until } : c)) }))
    void chatService.muteChat(chatId, currentUserId())
  },
  unmuteChat: (chatId) => {
    set((state) => ({ chats: state.chats.map((c) => (c.id === chatId ? { ...c, isMuted: false, mutedUntil: undefined } : c)) }))
    void chatService.unmuteChat(chatId, currentUserId())
  },
  pinChat: (chatId) => {
    set((state) => ({ chats: state.chats.map((c) => (c.id === chatId ? { ...c, isPinned: true } : c)) }))
    void chatService.pinChat(chatId, currentUserId())
  },
  unpinChat: (chatId) => {
    set((state) => ({ chats: state.chats.map((c) => (c.id === chatId ? { ...c, isPinned: false } : c)) }))
    void chatService.unpinChat(chatId, currentUserId())
  },

  clearChat: (chatId) => {
    set((state) => ({
      _server: { ...state._server, [chatId]: [] },
      _pending: { ...state._pending, [chatId]: [] },
      messages: { ...state.messages, [chatId]: [] },
    }))
    void chatService.clearChat(chatId)
  },
  blockChat: (chatId) => {
    set((state) => ({ chats: state.chats.map((c) => (c.id === chatId ? { ...c, isBlocked: true } : c)) }))
    void chatService.blockChat(chatId, currentUserId())
  },
  unblockChat: (chatId) => {
    set((state) => ({ chats: state.chats.map((c) => (c.id === chatId ? { ...c, isBlocked: false } : c)) }))
    void chatService.unblockChat(chatId, currentUserId())
  },

  muteUser: (chatId, userId) => {
    void chatService.muteUser(chatId, userId)
  },
  unmuteUser: (chatId, userId) => {
    void chatService.unmuteUser(chatId, userId)
  },
  kickUser: (chatId, userId) => {
    void chatService.kickUser(chatId, userId)
  },
  promoteUser: (chatId, userId, role) => {
    void chatService.promoteUser(chatId, userId, role)
  },

  isRecording: false,
  recordingDuration: 0,
  setRecording: (isRecording) => set({ isRecording, recordingDuration: 0 }),
  setRecordingDuration: (recordingDuration) => set({ recordingDuration }),

  shareLocation: (chatId, userId, userName, userAvatar, lat, lng, isLive, duration) => {
    const expiresAt = isLive && duration ? new Date(Date.now() + duration * 60 * 1000) : undefined
    const message: Message = {
      id: `msg-loc-${Date.now()}`,
      chatId,
      senderId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      content: isLive ? 'Live location' : 'Location',
      type: 'location',
      location: { lat, lng, isLive, expiresAt, duration },
      timestamp: new Date(),
      status: 'sending',
    }
    get().addMessage(chatId, message)
  },
  stopLiveLocation: (chatId, messageId) =>
    set((state) => {
      const apply = (arr: Message[]) =>
        arr.map((m) => (m.id === messageId && m.location ? { ...m, location: { ...m.location, isLive: false } } : m))
      return {
        _server: { ...state._server, [chatId]: apply(state._server[chatId] || []) },
        messages: { ...state.messages, [chatId]: apply(state.messages[chatId] || []) },
      }
    }),

  translateMessage: (chatId, messageId, translatedContent, originalLanguage) =>
    set((state) => {
      const translations = { ...state._translations, [messageId]: { translatedContent, originalLanguage } }
      return {
        _translations: translations,
        messages: {
          ...state.messages,
          [chatId]: reconcile(state._server[chatId] || [], state._pending[chatId] || [], translations),
        },
      }
    }),

  toggleReaction: (chatId, messageId, emoji, userId) => {
    const uid = userId || currentUserId()
    const msg = (get().messages[chatId] || []).find((m) => m.id === messageId)
    const currentlyReacted = Boolean(msg?.reactions?.[emoji]?.includes(uid))
    void chatService.toggleReaction(chatId, messageId, emoji, uid, currentlyReacted)
  },

  activeGame: null,
  setActiveGame: (activeGame) => set({ activeGame }),

  resetChats: () =>
    set({
      chats: [],
      messages: {},
      _server: {},
      _pending: {},
      _translations: {},
      typingUsers: {},
      activeChatId: null,
      notification: null,
      usersDirectory: [],
      presence: {},
    }),
}))
