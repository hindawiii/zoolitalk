import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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

interface ChatState {
  // Chats list
  chats: Chat[]
  setChats: (chats: Chat[]) => void
  addChat: (chat: Chat) => void
  
  // Active chat
  activeChatId: string | null
  setActiveChatId: (id: string | null) => void
  
  // Messages (keyed by chatId)
  messages: Record<string, Message[]>
  addMessage: (chatId: string, message: Message) => void
  // Incoming message from someone else (drives unread + notifications)
  receiveMessage: (chatId: string, message: Message) => void
  editMessage: (chatId: string, messageId: string, newContent: string) => void
  deleteMessage: (chatId: string, messageId: string) => void
  deleteMessageForEveryone: (chatId: string, messageId: string) => void
  deleteMessageForMe: (chatId: string, messageId: string, userId: string) => void
  
  // Typing indicators
  typingUsers: Record<string, string[]>
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void

  // Unread tracking
  markChatRead: (chatId: string) => void

  // New-message notification (for global toast / sound / vibration)
  notification: ChatNotification | null
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
}

// Demo chats data
const demoChats: Chat[] = [
  {
    id: 'chat-1',
    type: 'private',
    name: 'Fatima',
    nameAr: 'فاطمة',
    avatar: '/avatars/fatima.jpg',
    lastMessage: 'ياهلاً! كيفك اليوم؟',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 'chat-2',
    type: 'group',
    name: 'Khartoum Friends',
    nameAr: 'شلة الخرطوم',
    avatar: '/avatars/group1.jpg',
    lastMessage: 'الجبنة جاهزة يا جماعة!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
    unreadCount: 5,
    admins: ['user-1'],
    participants: [
      { id: 'user-1', name: 'Ahmed', avatar: '/avatars/ahmed.jpg', role: 'admin', isOnline: true },
      { id: 'user-2', name: 'Fatima', avatar: '/avatars/fatima.jpg', role: 'member', isOnline: true },
      { id: 'user-3', name: 'Omar', avatar: '/avatars/omar.jpg', role: 'moderator', isOnline: false },
    ],
  },
  {
    id: 'chat-channel-1',
    type: 'channel',
    channelMode: 'interactive',
    name: 'Sudan News',
    nameAr: 'أخبار السودان',
    avatar: '',
    lastMessage: 'تغطية مباشرة لأهم الأحداث',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 20),
    unreadCount: 3,
    admins: ['user-1'],
    participants: [
      { id: 'user-1', name: 'Ahmed', avatar: '/avatars/ahmed.jpg', role: 'admin', isOnline: true },
      { id: 'user-2', name: 'Fatima', avatar: '/avatars/fatima.jpg', role: 'member', isOnline: true },
      { id: 'user-3', name: 'Omar', avatar: '/avatars/omar.jpg', role: 'member', isOnline: false },
    ],
  },
  {
    id: 'chat-3',
    type: 'private',
    name: 'Omar Hassan',
    nameAr: 'عمر حسن',
    avatar: '/avatars/omar.jpg',
    lastMessage: 'شفت الماتش؟',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 'chat-4',
    type: 'private',
    name: 'Fouad',
    nameAr: 'فؤاد',
    avatar: '/avatars/fouad.jpg',
    lastMessage: 'يا هنداوي الراكوبة الليلة منورة',
    lastMessageTime: new Date(),
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'chat-5',
    type: 'private',
    name: 'Saif',
    nameAr: 'سيف',
    avatar: '/avatars/saif.jpg',
    lastMessage: 'التعديلات الأخيرة ضابطة شديد',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 15),
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: 'chat-6',
    type: 'private',
    name: 'Tiben',
    nameAr: 'تبن',
    avatar: '/avatars/tiben.jpg',
    lastMessage: 'مشتاقين يا زولي',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60),
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 'chat-7',
    type: 'private',
    name: 'Amin',
    nameAr: 'أمين',
    avatar: '/avatars/amin.jpg',
    lastMessage: 'كيف الأمور في البرمجة؟',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 120),
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'chat-8',
    type: 'private',
    name: 'Sharaf El-Din',
    nameAr: 'شرف الدين',
    avatar: '/avatars/sharaf.jpg',
    lastMessage: 'نتلاقى في الجبنة بكرة',
    lastMessageTime: new Date(),
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 'chat-9',
    type: 'private',
    name: 'Arafa',
    nameAr: 'عرفة',
    avatar: '/avatars/arafa.jpg',
    lastMessage: 'رسلت ليك الملف الشغالين عليهو',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: 3,
    isOnline: true,
  },
  {
    id: 'chat-10',
    type: 'private',
    name: 'Al-Jack Akomju',
    nameAr: 'الجاك أكمجو',
    avatar: '/avatars/jack.jpg',
    lastMessage: 'تسلم يا حبيبنا',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 45),
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'chat-11',
    type: 'private',
    name: 'Hamed Idress',
    nameAr: 'حامد إدريس',
    avatar: '/avatars/hamed.jpg',
    lastMessage: 'الخدمة دي ممتازة جداً',
    lastMessageTime: new Date(),
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 'chat-12',
    type: 'private',
    name: 'Anas',
    nameAr: 'أنس',
    avatar: '/avatars/anas.jpg',
    lastMessage: 'وينك مختفي؟',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 3),
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'chat-13',
    type: 'private',
    name: 'Yaseen Siraj',
    nameAr: 'ياسين سراج',
    avatar: '/avatars/yaseen.jpg',
    lastMessage: 'يا هنداوي الموقع شغال حلاوة',
    lastMessageTime: new Date(),
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'chat-14',
    type: 'private',
    name: 'Noni',
    nameAr: 'نوني',
    avatar: '/avatars/noni.jpg',
    lastMessage: 'شكراً على المساعدة',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 10),
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: 'chat-15',
    type: 'private',
    name: 'Mandela',
    nameAr: 'مانديلا',
    avatar: '/avatars/mandela.jpg',
    lastMessage: 'الحرية والعدالة يا شباب',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 'chat-16',
    type: 'private',
    name: 'Mogtaba',
    nameAr: 'مجتبى',
    avatar: '/avatars/mogtaba.jpg',
    lastMessage: 'تم تطبيق كل التعديلات المطلوب',
    lastMessageTime: new Date(),
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'chat-17',
    type: 'private',
    name: 'Walaa',
    nameAr: 'ولاء',
    avatar: '/avatars/walaa.jpg',
    lastMessage: 'بالتوفيق في "راكوبتنا"',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 2),
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'chat-18',
    type: 'private',
    name: 'Abdo',
    nameAr: 'عبدو',
    avatar: '/avatars/abdo.jpg',
    lastMessage: 'تسلم يا جاكي',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 45),
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'chat-19',
    type: 'private',
    name: 'Ahmed Alnzier',
    nameAr: 'احمد النذير',
    avatar: '/avatars/ahmed.jpg',
    lastMessage: 'ابشر بالخير ان شاءالله',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 45),
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'chat-20',
    type: 'private',
    name: ' Mohamed Faisal',
    nameAr: 'محمد فيصل',
    avatar: '/avatars/mohamed.jpg',
    lastMessage: 'اسمعني انا جاي عليكم البيت',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 45),
    unreadCount: 0,
    isOnline: true,
  },
]

// Demo messages
const demoMessages: Record<string, Message[]> = {
  'chat-1': [
    {
      id: 'msg-1',
      chatId: 'chat-1',
      senderId: 'user-2',
      senderName: 'Fatima',
      senderAvatar: '/avatars/fatima.jpg',
      content: 'السلام عليكم!',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      status: 'read',
    },
    {
      id: 'msg-2',
      chatId: 'chat-1',
      senderId: 'user-1',
      senderName: 'Hindawi',
      senderAvatar: '/avatars/hindawi.jpg',
      content: 'وعليكم السلام! في نعمة الحمد لله',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 8),
      status: 'read',
    },
    {
      id: 'msg-3',
      chatId: 'chat-1',
      senderId: 'user-2',
      senderName: 'Fatima Ali',
      senderAvatar: '/avatars/fatima.jpg',
      content: 'ياهلاً! كيفك اليوم؟',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      status: 'delivered',
    },
  ],
  'chat-2': [
    {
      id: 'gmsg-0',
      chatId: 'chat-2',
      senderId: 'system',
      senderName: '',
      senderAvatar: '',
      content: 'أنشأ أحمد المجموعة "شلة الخرطوم"',
      type: 'system',
      systemEvent: 'create',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      status: 'read',
    },
    {
      id: 'gmsg-1',
      chatId: 'chat-2',
      senderId: 'user-1',
      senderName: 'Ahmed',
      senderAvatar: '/avatars/ahmed.jpg',
      content: 'السلام عليكم يا شباب، الجبنة الليلة عندي',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 50),
      status: 'read',
    },
    {
      id: 'gmsg-2',
      chatId: 'chat-2',
      senderId: 'system',
      senderName: '',
      senderAvatar: '',
      content: 'انضم عمر إلى المجموعة',
      type: 'system',
      systemEvent: 'join',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      status: 'read',
    },
    {
      id: 'gmsg-3',
      chatId: 'chat-2',
      senderId: 'user-3',
      senderName: 'Omar',
      senderAvatar: '/avatars/omar.jpg',
      content: 'وعليكم السلام، إن شاء الله نجي',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 40),
      status: 'read',
    },
    {
      id: 'gmsg-4',
      chatId: 'chat-2',
      senderId: 'user-2',
      senderName: 'Fatima',
      senderAvatar: '/avatars/fatima.jpg',
      content: 'الجبنة جاهزة يا جماعة!',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'delivered',
    },
  ],
  'chat-channel-1': [
    {
      id: 'cmsg-1',
      chatId: 'chat-channel-1',
      senderId: 'user-1',
      senderName: 'Ahmed',
      senderAvatar: '/avatars/ahmed.jpg',
      content: 'أهلاً بكم في قناة أخبار السودان. تابعونا لأهم المستجدات.',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      status: 'read',
      reactions: { '👍': ['user-2', 'user-3'], '❤️': ['user-2'] },
    },
    {
      id: 'cmsg-2',
      chatId: 'chat-channel-1',
      senderId: 'user-1',
      senderName: 'Ahmed',
      senderAvatar: '/avatars/ahmed.jpg',
      content: 'تغطية مباشرة لأهم الأحداث الليلة الساعة التاسعة.',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
      status: 'read',
      reactions: { '🔥': ['user-3'] },
    },
  ],
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: demoChats,
      setChats: (chats) => set({ chats }),
      addChat: (chat) =>
        set((state) =>
          state.chats.some((c) => c.id === chat.id)
            ? state
            : { chats: [chat, ...state.chats] }
        ),
      
      activeChatId: null,
      setActiveChatId: (activeChatId) => set({ activeChatId }),
      
      messages: demoMessages,
      addMessage: (chatId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message],
          },
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, lastMessage: message.content || (message.type === 'location' ? '📍 Location' : '🎤 Voice'), lastMessageTime: message.timestamp, unreadCount: 0 }
              : chat
          ),
        })),
      receiveMessage: (chatId, message) =>
        set((state) => {
          const isActive = state.activeChatId === chatId
          const targetChat = state.chats.find((c) => c.id === chatId)
          const preview =
            message.content ||
            (message.type === 'location'
              ? '📍 موقع'
              : message.type === 'voice'
                ? '🎤 رسالة صوتية'
                : message.type === 'image'
                  ? '📷 صورة'
                  : 'رسالة جديدة')
          return {
            messages: {
              ...state.messages,
              [chatId]: [...(state.messages[chatId] || []), message],
            },
            chats: state.chats.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    lastMessage: preview,
                    lastMessageTime: message.timestamp,
                    unreadCount: isActive ? 0 : (chat.unreadCount || 0) + 1,
                  }
                : chat
            ),
            // Clear any typing flag from the sender now that the message arrived
            typingUsers: {
              ...state.typingUsers,
              [chatId]: (state.typingUsers[chatId] || []).filter((id) => id !== message.senderId),
            },
            // Only raise a notification when the user is outside this chat
            // and the chat isn't muted.
            notification:
              isActive || targetChat?.isMuted
                ? state.notification
                : {
                    id: `notif-${Date.now()}`,
                    chatId,
                    senderName: message.senderName,
                    senderAvatar: message.senderAvatar,
                    preview,
                  },
          }
        }),
      editMessage: (chatId, messageId, newContent) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(msg =>
              msg.id === messageId ? { ...msg, content: newContent, isEdited: true } : msg
            ),
          },
        })),
      deleteMessage: (chatId, messageId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).filter(msg => msg.id !== messageId),
          },
        })),
      deleteMessageForEveryone: (chatId, messageId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(msg =>
              msg.id === messageId ? { ...msg, deletedForEveryone: true, content: '' } : msg
            ),
          },
        })),
      deleteMessageForMe: (chatId, messageId, userId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(msg =>
              msg.id === messageId 
                ? { ...msg, deletedFor: [...(msg.deletedFor || []), userId] } 
                : msg
            ),
          },
        })),
      
      typingUsers: {},
      setTyping: (chatId, userId, isTyping) =>
        set((state) => {
          const current = state.typingUsers[chatId] || []
          const updated = isTyping
            ? [...new Set([...current, userId])]
            : current.filter(id => id !== userId)
          return {
            typingUsers: { ...state.typingUsers, [chatId]: updated },
          }
        }),

      // Unread tracking
      markChatRead: (chatId) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
          ),
        })),

      // New-message notification
      notification: null,
      clearNotification: () => set({ notification: null }),

      // Channel comments (interactive channels)
      addChannelComment: (chatId, messageId, comment) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map((msg) =>
              msg.id === messageId
                ? { ...msg, comments: [...(msg.comments || []), comment] }
                : msg
            ),
          },
        })),
      
      // Archive and Mute
      archiveChat: (chatId) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, isArchived: true } : chat
          ),
        })),
      unarchiveChat: (chatId) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, isArchived: false } : chat
          ),
        })),
      muteChat: (chatId, until) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, isMuted: true, mutedUntil: until } : chat
          ),
        })),
      unmuteChat: (chatId) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, isMuted: false, mutedUntil: undefined } : chat
          ),
        })),
      pinChat: (chatId) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, isPinned: true } : chat
          ),
        })),
      unpinChat: (chatId) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, isPinned: false } : chat
          ),
        })),

      clearChat: (chatId) =>
        set((state) => ({
          messages: { ...state.messages, [chatId]: [] },
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, lastMessage: '', unreadCount: 0 } : chat
          ),
        })),

      blockChat: (chatId) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, isBlocked: true } : chat
          ),
        })),

      unblockChat: (chatId) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, isBlocked: false } : chat
          ),
        })),
      
      muteUser: (chatId, userId) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, mutedUsers: [...(chat.mutedUsers || []), userId] }
              : chat
          ),
        })),
      unmuteUser: (chatId, userId) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, mutedUsers: (chat.mutedUsers || []).filter(id => id !== userId) }
              : chat
          ),
        })),
      kickUser: (chatId, userId) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, participants: chat.participants?.filter(p => p.id !== userId) }
              : chat
          ),
        })),
      promoteUser: (chatId, userId, role) =>
        set((state) => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? {
                  ...chat,
                  participants: chat.participants?.map(p =>
                    p.id === userId ? { ...p, role } : p
                  ),
                  admins: role === 'admin'
                    ? [...(chat.admins || []), userId]
                    : chat.admins,
                }
              : chat
          ),
        })),
      
      isRecording: false,
      recordingDuration: 0,
      setRecording: (isRecording) => set({ isRecording, recordingDuration: 0 }),
      setRecordingDuration: (recordingDuration) => set({ recordingDuration }),
      
      // Location sharing
      shareLocation: (chatId, userId, userName, userAvatar, lat, lng, isLive, duration) => {
        const expiresAt = isLive && duration 
          ? new Date(Date.now() + duration * 60 * 1000) 
          : undefined
        
        const message: Message = {
          id: `msg-loc-${Date.now()}`,
          chatId,
          senderId: userId,
          senderName: userName,
          senderAvatar: userAvatar,
          content: isLive ? 'Live location' : 'Location',
          type: 'location',
          location: {
            lat,
            lng,
            isLive,
            expiresAt,
            duration,
          },
          timestamp: new Date(),
          status: 'sending',
        }
        
        get().addMessage(chatId, message)
      },
      stopLiveLocation: (chatId, messageId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(msg =>
              msg.id === messageId && msg.location
                ? { ...msg, location: { ...msg.location, isLive: false } }
                : msg
            ),
          },
        })),
      
      // Translation
      translateMessage: (chatId, messageId, translatedContent, originalLanguage) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(msg =>
              msg.id === messageId
                ? { ...msg, translatedContent, originalLanguage }
                : msg
          ),
        },
      })),

      // Channel reactions (interactive channels)
      toggleReaction: (chatId, messageId, emoji, userId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map((msg) => {
              if (msg.id !== messageId) return msg
              const reactions = { ...(msg.reactions || {}) }
              const users = reactions[emoji] || []
              if (users.includes(userId)) {
                const next = users.filter((u) => u !== userId)
                if (next.length === 0) {
                  delete reactions[emoji]
                } else {
                  reactions[emoji] = next
                }
              } else {
                reactions[emoji] = [...users, userId]
              }
              return { ...msg, reactions }
            }),
          },
        })),

      // Games
      activeGame: null,
      setActiveGame: (game) => set({ activeGame: game }),
    }),
    {
      name: 'rakobatna-chat-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chats: state.chats,
        messages: state.messages,
      }),
      // Ensure the group demo conversation is available for existing users too
      merge: (persisted, current) => {
        const p = (persisted as Partial<ChatState>) || {}
        const mergedMessages = { ...current.messages, ...(p.messages || {}) }
        if (!mergedMessages['chat-2'] || mergedMessages['chat-2'].length === 0) {
          mergedMessages['chat-2'] = demoMessages['chat-2']
        }
        if (!mergedMessages['chat-channel-1'] || mergedMessages['chat-channel-1'].length === 0) {
          mergedMessages['chat-channel-1'] = demoMessages['chat-channel-1']
        }
        // Ensure the demo channel chat exists in the chats list
        const persistedChats = p.chats || current.chats
        const hasChannel = persistedChats.some((c) => c.id === 'chat-channel-1')
        const mergedChats = hasChannel
          ? persistedChats
          : [...persistedChats, current.chats.find((c) => c.id === 'chat-channel-1')!].filter(Boolean)
        return {
          ...current,
          ...p,
          chats: mergedChats,
          messages: mergedMessages,
        }
      },
    }
  )
)
