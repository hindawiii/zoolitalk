'use client'

import * as React from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  Phone,
  Video,
  Send,
  Mic,
  Smile,
  Plus,
  X,
  Reply,
  Forward,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  MapPin,
  Languages,
  Gamepad2,
  Archive,
  BellOff,
  Bell,
  Pin,
  PinOff,
  Pause,
  Play,
  Info,
  Ban,
  Flag,
  FileText,
  Download,
  Megaphone,
  MessageSquare,
  Loader2,
  ImageIcon,
  Search,
  Calendar,
  Users,
  Link2,
  Music,
  PhoneCall,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useChatStore, type Message, type Chat } from '@/lib/stores/chat-store'
import { useUserStore } from '@/lib/stores/user-store'
import { useLanguage } from '@/components/providers/language-provider'
import { useGender } from '@/hooks/use-gender'
import { ChatBackgroundPattern, useChatTheme } from './chat-theme-provider'
import { FlyingEmoji } from './animated-emoji'
import { EmojiPickerSheet } from './emoji-picker-sheet'
import { AttachmentSheet, type AttachmentAction } from './attachment-sheet'
import { ImageViewer } from '@/components/shared/image-viewer'
import { compressImageToLimit } from '@/lib/image-compress'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

// Distinct, accessible colors for group member names (one per sender, deterministic)
const MEMBER_NAME_COLORS = [
  '#D97706', // amber
  '#0E7490', // cyan-700
  '#9333EA', // purple
  '#DC2626', // red
  '#0891B2', // sky
  '#15803D', // green
  '#C2410C', // orange
  '#7C3AED', // violet
  '#BE185D', // pink
  '#4338CA', // indigo
]

function getMemberColor(senderId: string) {
  let hash = 0
  for (let i = 0; i < senderId.length; i++) {
    hash = (hash << 5) - hash + senderId.charCodeAt(i)
    hash |= 0
  }
  return MEMBER_NAME_COLORS[Math.abs(hash) % MEMBER_NAME_COLORS.length]
}

interface ChatViewProps {
  onBack: () => void
  onOpenGames?: () => void
  onOpenProfile?: (userId: string) => void
}

export function ChatView({ onBack, onOpenGames, onOpenProfile }: ChatViewProps) {
  const { 
    activeChatId, 
    chats, 
    messages, 
    addMessage, 
    isRecording, 
    setRecording, 
    recordingDuration, 
    setRecordingDuration,
    archiveChat,
    muteChat,
    unmuteChat,
    pinChat,
    unpinChat,
    shareLocation,
    clearChat,
    blockChat,
    unblockChat,
    toggleReaction,
    typingUsers,
    setTyping,
    markChatRead,
    addChannelComment,
  } = useChatStore()
  const { currentUser } = useUserStore()
  const { t, language, isRTL } = useLanguage()
  const { interaction, greeting } = useGender()
  const { setBackground, backgrounds } = useChatTheme()
  
  const [inputValue, setInputValue] = React.useState('')
  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null)
  const [replyingTo, setReplyingTo] = React.useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [showAttachments, setShowAttachments] = React.useState(false)
  const [flyingEmoji, setFlyingEmoji] = React.useState<string | null>(null)
  const [showLocationSheet, setShowLocationSheet] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ message: Message; type: 'me' | 'everyone' } | null>(null)
  const [showWallpaperPicker, setShowWallpaperPicker] = React.useState(false)
  const [showChatInfo, setShowChatInfo] = React.useState(false)
  const [showClearDialog, setShowClearDialog] = React.useState(false)
  const [showBlockDialog, setShowBlockDialog] = React.useState(false)
  const [showReportDialog, setShowReportDialog] = React.useState(false)
  // Fullscreen image viewer (opened by tapping an image message)
  const [imageViewerUrl, setImageViewerUrl] = React.useState<string | null>(null)
  // "Compressing image..." indicator while preparing an image for sending
  const [isCompressing, setIsCompressing] = React.useState(false)
  // Pagination: how many of the latest messages are currently rendered
  const [visibleCount, setVisibleCount] = React.useState(50)
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false)
  // Channel comments sheet target (interactive channels)
  const [commentsTarget, setCommentsTarget] = React.useState<Message | null>(null)
  // Friend profile bottom sheet (opened from the header)
  const [showProfile, setShowProfile] = React.useState(false)
  // In-conversation message search screen
  const [showMessageSearch, setShowMessageSearch] = React.useState(false)
  // Active call bottom sheet ('voice' | 'video' | null)
  const [callType, setCallType] = React.useState<'voice' | 'video' | null>(null)
  // Voice recording preview (blob URL) shown before sending
  const [recordedAudio, setRecordedAudio] = React.useState<string | null>(null)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const recordedChunksRef = React.useRef<Blob[]>([])

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const recordingTimerRef = React.useRef<number | null>(null)

  const chat = chats.find((c) => c.id === activeChatId)
  const chatMessages = messages[activeChatId || ''] || []

  // Channel posting permissions
  const isChannel = chat?.type === 'channel'
  const isChannelAdmin = (chat?.admins?.includes(currentUser?.id || '')) ?? false
  const canPost = !isChannel || isChannelAdmin
  const channelInteractive = isChannel && chat?.channelMode === 'interactive'

  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  // The Radix ScrollArea forwards its ref to the (overflow-hidden) root, so the
  // actual scrollable element is the inner viewport. Grab it on demand.
  const getViewport = React.useCallback(
    () => scrollRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null,
    [],
  )

  // Only the latest `visibleCount` messages are rendered (pagination).
  const visibleMessages = React.useMemo(
    () => chatMessages.slice(Math.max(0, chatMessages.length - visibleCount)),
    [chatMessages, visibleCount],
  )
  const hasOlderMessages = chatMessages.length > visibleMessages.length

  // Users currently typing in this chat (excluding ourselves)
  const othersTyping = React.useMemo(
    () => (typingUsers[activeChatId || ''] || []).filter((id) => id !== currentUser?.id),
    [typingUsers, activeChatId, currentUser?.id],
  )

  const prevCountRef = React.useRef(0)
  const prevScrollHeightRef = React.useRef(0)

  // When switching chats: reset pagination, mark as read, jump to bottom.
  React.useEffect(() => {
    if (!activeChatId) return
    setVisibleCount(50)
    setIsLoadingOlder(false)
    markChatRead(activeChatId)
    prevCountRef.current = 0
    requestAnimationFrame(() => {
      const vp = getViewport()
      if (vp) vp.scrollTop = vp.scrollHeight
    })
  }, [activeChatId, markChatRead, getViewport])

  // Keep the unread counter cleared while new messages stream into the open chat.
  React.useEffect(() => {
    if (activeChatId) markChatRead(activeChatId)
  }, [activeChatId, chatMessages.length, markChatRead])

  // Auto-scroll to bottom when a NEW message is appended (not when loading
  // older history, which would otherwise yank the view downward).
  React.useEffect(() => {
    const vp = getViewport()
    if (!vp) return

    if (isLoadingOlder) return

    const grew = visibleMessages.length > prevCountRef.current
    const nearBottom = vp.scrollHeight - vp.scrollTop - vp.clientHeight < 240

    if (prevCountRef.current === 0 || (grew && nearBottom)) {
      vp.scrollTop = vp.scrollHeight
    }
    prevCountRef.current = visibleMessages.length
  }, [visibleMessages.length, isLoadingOlder, getViewport])

  // Load 50 older messages when the user scrolls near the top.
  React.useEffect(() => {
    const vp = getViewport()
    if (!vp) return

    const handleScroll = () => {
      if (vp.scrollTop < 60 && hasOlderMessages && !isLoadingOlder) {
        setIsLoadingOlder(true)
        prevScrollHeightRef.current = vp.scrollHeight
        // Simulate fetching a page of older messages.
        window.setTimeout(() => {
          setVisibleCount((c) => c + 50)
          setIsLoadingOlder(false)
          // Preserve the scroll position after prepending older messages.
          requestAnimationFrame(() => {
            const v = getViewport()
            if (v) v.scrollTop = v.scrollHeight - prevScrollHeightRef.current
          })
        }, 600)
      }
    }

    vp.addEventListener('scroll', handleScroll, { passive: true })
    return () => vp.removeEventListener('scroll', handleScroll)
  }, [getViewport, hasOlderMessages, isLoadingOlder])

  // Demo-only: occasionally show the other participant "typing" in the open
  // private chat so the header typing indicator is observable. Each burst
  // clears itself after ~3 seconds.
  React.useEffect(() => {
    if (!activeChatId || chat?.type !== 'private') return
    const peerId = `peer-${activeChatId}`
    let clearTimer: number | undefined

    const startTyping = () => {
      setTyping(activeChatId, peerId, true)
      clearTimer = window.setTimeout(() => {
        setTyping(activeChatId, peerId, false)
      }, 3000)
    }

    const interval = window.setInterval(startTyping, 12000)
    return () => {
      window.clearInterval(interval)
      if (clearTimer) window.clearTimeout(clearTimer)
      setTyping(activeChatId, peerId, false)
    }
  }, [activeChatId, chat?.type, setTyping])

  // Recording timer — runs only while actively capturing (paused in preview)
  React.useEffect(() => {
    if (isRecording && !recordedAudio) {
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(recordingDuration + 1)
      }, 1000)
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [isRecording, recordedAudio, recordingDuration, setRecordingDuration])

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Date separator label ("Today" / "Yesterday" / full date)
  const formatDateLabel = (date: Date) => {
    const d = new Date(date)
    if (isToday(d)) return isRTL ? 'اليوم' : 'Today'
    if (isYesterday(d)) return isRTL ? 'أمس' : 'Yesterday'
    return format(d, 'PPP', { locale: language === 'ar' ? ar : enUS })
  }

  const handleSend = () => {
    if (!inputValue.trim() || !currentUser || !activeChatId) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: activeChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: inputValue.trim(),
      type: 'text',
      timestamp: new Date(),
      status: 'sending',
      replyTo: replyingTo?.id,
    }

    addMessage(activeChatId, newMessage)
    setInputValue('')
    setReplyingTo(null)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Voice recording handlers (real MediaRecorder with preview before sending)
  const startRecording = async () => {
    setRecordedAudio(null)
    recordedChunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
          setRecordedAudio(URL.createObjectURL(blob))
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecordingDuration(0)
      setRecording(true)
    } catch {
      alert(isRTL ? 'لا يمكن الوصول للميكروفون' : 'Cannot access microphone')
    }
  }

  // Stop capturing so the recorded clip can be previewed before sending.
  const stopRecordingForPreview = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    mediaRecorderRef.current = null
    recordedChunksRef.current = []
    setRecordedAudio(null)
    setRecording(false)
  }

  const sendVoiceNote = () => {
    if (!currentUser || !activeChatId) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: activeChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: '',
      type: 'voice',
      voiceDuration: recordingDuration,
      voiceUrl: recordedAudio ?? undefined,
      timestamp: new Date(),
      status: 'sending',
    }

    addMessage(activeChatId, newMessage)
    mediaRecorderRef.current = null
    recordedChunksRef.current = []
    setRecordedAudio(null)
    setRecording(false)
  }

  // Handle swipe to cancel
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isRTL ? info.offset.x > 100 : info.offset.x < -100) {
      cancelRecording()
    }
  }

  // Mic button: short tap = speech-to-text, long-press = record a voice note.
  const micPressTimer = React.useRef<number | null>(null)
  const micLongPressed = React.useRef(false)
  const handleMicDown = () => {
    micLongPressed.current = false
    micPressTimer.current = window.setTimeout(() => {
      micLongPressed.current = true
      startRecording()
    }, 350)
  }
  const handleMicUp = () => {
    if (micPressTimer.current) window.clearTimeout(micPressTimer.current)
  }
  const handleMicClick = () => {
    if (micLongPressed.current) {
      micLongPressed.current = false
      return
    }
    startSpeechToText()
  }

  // Speech-to-text handler
  const startSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(isRTL ? 'المتصفح لا يدعم التعرف على الصوت' : 'Speech recognition not supported')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = language === 'ar' ? 'ar-SD' : 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('')
      setInputValue(transcript)
    }

    recognition.start()
  }

  // Share location
  const handleShareLocation = (isLive: boolean, duration?: number) => {
    if (!currentUser || !activeChatId) return
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          shareLocation(
            activeChatId,
            currentUser.id,
            currentUser.name,
            currentUser.avatar,
            position.coords.latitude,
            position.coords.longitude,
            isLive,
            duration
          )
          setShowLocationSheet(false)
        },
        () => {
          alert(isRTL ? 'لا يمكن الوصول للموقع' : 'Cannot access location')
        }
      )
    }
  }

  // Emoji handler
  const handleEmojiSelect = (emoji: string) => {
    setInputValue((prev) => prev + emoji)
    setFlyingEmoji(emoji)
  }

  // Attachment bottom-sheet handler
  const handleAttachment = (action: AttachmentAction) => {
    setShowAttachments(false)
    switch (action) {
      case 'location':
        handleShareLocation(false)
        break
      case 'audio':
        startRecording()
        break
      case 'gallery':
      case 'camera':
      case 'document':
      case 'contact':
      default:
        // Trigger the native file picker for media/document/contact actions
        fileInputRef.current?.click()
        break
    }
  }

  // Compress a selected image (target max 2MB) then send it as an image message.
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset so selecting the same file again re-triggers change
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file || !currentUser || !activeChatId) return

    if (!file.type.startsWith('image/')) {
      alert(isRTL ? 'يرجى اختيار صورة' : 'Please choose an image')
      return
    }

    setIsCompressing(true)
    try {
      const imageUrl = await compressImageToLimit(file, 2 * 1024 * 1024)
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        chatId: activeChatId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        content: '',
        type: 'image',
        imageUrl,
        timestamp: new Date(),
        status: 'sending',
        replyTo: replyingTo?.id,
      }
      addMessage(activeChatId, newMessage)
      setReplyingTo(null)
    } catch (err) {
      console.log('[v0] Image compression failed:', err)
      alert(isRTL ? 'تعذر معالجة الصورة' : 'Could not process the image')
    } finally {
      setIsCompressing(false)
    }
  }

  if (!chat) return null

  return (
    <div className="flex flex-col h-full max-h-full bg-background w-full max-w-full overflow-hidden relative">
      {/* Background Pattern - Click to change wallpaper */}
      <div 
        className="absolute inset-0 cursor-pointer pointer-events-none" 
        onClick={() => setShowWallpaperPicker(true)}
        aria-label={isRTL ? 'تغيير الخلفية' : 'Change wallpaper'}
      >
        <ChatBackgroundPattern />
      </div>
      
      {/* Header - Fixed at top */}
      <header className="flex items-center gap-3 px-2 py-2 bg-card/95 backdrop-blur-sm border-b relative z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <BackIcon className="h-5 w-5" />
        </Button>
        
        {/* Clickable Avatar + Name to open profile */}
        <button 
          className="flex items-center gap-3 flex-1 min-w-0 hover:bg-secondary/50 rounded-lg p-1 -m-1 transition-colors"
          onClick={() => setShowProfile(true)}
        >
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={chat.avatar} alt={chat.name} />
              <AvatarFallback>{(isRTL ? chat.nameAr : chat.name)[0]}</AvatarFallback>
            </Avatar>
            {chat.isOnline && chat.type === 'private' && (
              <span className="absolute bottom-0 end-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0 text-start">
            <h3 className={cn('font-semibold truncate', isRTL && 'font-arabic')}>
              {isRTL ? chat.nameAr : chat.name}
            </h3>
            {othersTyping.length > 0 ? (
              <div className={cn('flex items-center gap-1.5', isRTL && 'flex-row-reverse')}>
                <span className={cn('text-xs text-muted-foreground', isRTL && 'font-arabic')}>
                  {isRTL ? 'جاري الكتابة' : 'typing'}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="typing-dot h-1 w-1 rounded-full bg-muted-foreground" />
                  <span className="typing-dot h-1 w-1 rounded-full bg-muted-foreground" style={{ animationDelay: '0.2s' }} />
                  <span className="typing-dot h-1 w-1 rounded-full bg-muted-foreground" style={{ animationDelay: '0.4s' }} />
                </span>
              </div>
            ) : chat.type === 'channel' ? (
              <p className={cn('text-xs text-muted-foreground truncate', isRTL && 'font-arabic')}>
                {(() => {
                  const count = chat.participants?.length ?? 0
                  if (isRTL) return `${count} ${count === 1 ? 'مشترك' : 'مشترك'}`
                  return `${count} ${count === 1 ? 'subscriber' : 'subscribers'}`
                })()}
              </p>
            ) : chat.type === 'group' ? (
              <p className={cn('text-xs text-muted-foreground truncate', isRTL && 'font-arabic')}>
                {(() => {
                  const count = chat.participants?.length ?? 0
                  if (isRTL) return `${count} ${count === 1 ? 'عضو' : 'أعضاء'}`
                  return `${count} ${count === 1 ? 'member' : 'members'}`
                })()}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {chat.isOnline ? t('chat.online') : t('chat.offline')}
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCallType('voice')} aria-label={isRTL ? 'مكالمة صوتية' : 'Voice call'}>
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCallType('video')} aria-label={isRTL ? 'مكالمة فيديو' : 'Video call'}>
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isRTL ? 'start' : 'end'}
              className="w-48 rounded-2xl border-border/50 bg-card/85 p-1 backdrop-blur-xl"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Chat info */}
              <DropdownMenuItem
                onClick={() => setShowChatInfo(true)}
                className={cn('gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]', isRTL && 'flex-row-reverse')}
              >
                <Info className="h-4 w-4" />
                <span className={cn(isRTL && 'font-arabic')}>
                  {isRTL ? 'معلومات المحادثة' : 'Chat info'}
                </span>
              </DropdownMenuItem>

              {/* Pin/Unpin */}
              <DropdownMenuItem
                onClick={() => (chat.isPinned ? unpinChat(chat.id) : pinChat(chat.id))}
                className={cn('gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]', isRTL && 'flex-row-reverse')}
              >
                {chat.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                <span className={cn(isRTL && 'font-arabic')}>
                  {chat.isPinned ? (isRTL ? 'إلغاء التثبيت' : 'Unpin') : (isRTL ? 'تثبيت' : 'Pin')}
                </span>
              </DropdownMenuItem>

              {/* Mute/Unmute */}
              <DropdownMenuItem
                onClick={() => (chat.isMuted ? unmuteChat(chat.id) : muteChat(chat.id))}
                className={cn('gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]', isRTL && 'flex-row-reverse')}
              >
                {chat.isMuted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                <span className={cn(isRTL && 'font-arabic')}>
                  {chat.isMuted ? (isRTL ? 'إلغاء الكتم' : 'Unmute') : (isRTL ? 'كتم' : 'Mute')}
                </span>
              </DropdownMenuItem>

              {/* Archive */}
              <DropdownMenuItem
                onClick={() => archiveChat(chat.id)}
                className={cn('gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]', isRTL && 'flex-row-reverse')}
              >
                <Archive className="h-4 w-4" />
                <span className={cn(isRTL && 'font-arabic')}>{isRTL ? 'أرشفة' : 'Archive'}</span>
              </DropdownMenuItem>

              {/* Games */}
              <DropdownMenuItem
                onClick={onOpenGames}
                className={cn('gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]', isRTL && 'flex-row-reverse')}
              >
                <Gamepad2 className="h-4 w-4" />
                <span className={cn(isRTL && 'font-arabic')}>{isRTL ? 'الألعاب' : 'Games'}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              {/* Clear conversation */}
              <DropdownMenuItem
                onClick={() => setShowClearDialog(true)}
                className={cn('gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]', isRTL && 'flex-row-reverse')}
              >
                <Trash2 className="h-4 w-4" />
                <span className={cn(isRTL && 'font-arabic')}>
                  {isRTL ? 'مسح المحادثة' : 'Clear chat'}
                </span>
              </DropdownMenuItem>

              {/* Block / Unblock (private chats only) */}
              {chat.type === 'private' && (
                <DropdownMenuItem
                  onClick={() => (chat.isBlocked ? unblockChat(chat.id) : setShowBlockDialog(true))}
                  className={cn('gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]', isRTL && 'flex-row-reverse')}
                >
                  <Ban className="h-4 w-4" />
                  <span className={cn(isRTL && 'font-arabic')}>
                    {chat.isBlocked
                      ? (isRTL ? 'إلغاء حظر المستخدم' : 'Unblock user')
                      : (isRTL ? 'حظر المستخدم' : 'Block user')}
                  </span>
                </DropdownMenuItem>
              )}

              {/* Report */}
              <DropdownMenuItem
                onClick={() => setShowReportDialog(true)}
                className={cn('gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-destructive focus:text-destructive', isRTL && 'flex-row-reverse')}
              >
                <Flag className="h-4 w-4" />
                <span className={cn(isRTL && 'font-arabic')}>
                  {isRTL ? 'الإبلاغ' : 'Report'}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages - Scrollable area with padding for fixed input */}
      <div className="flex-1 overflow-hidden relative z-0 min-h-0">
        <ScrollArea ref={scrollRef} className="h-full p-4">
          <div className="space-y-4">
          {/* Loading older messages spinner (pagination) */}
          {isLoadingOlder && (
            <div className="flex justify-center py-2">
              <span className="flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 shadow-sm backdrop-blur-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[#2D5A27]" />
                <span className={cn('text-xs text-[#2D5A27]', isRTL && 'font-arabic')}>
                  {isRTL ? 'جاري تحميل الرسائل القديمة...' : 'Loading older messages...'}
                </span>
              </span>
            </div>
          )}
          {visibleMessages.map((message, index) => {
            const isSent = message.senderId === currentUser?.id
            const isGroup = chat.type === 'group'
            const showAvatar = !isSent && (
              index === 0 || visibleMessages[index - 1]?.senderId !== message.senderId
            )
            // Show sender name in group bubbles when a new sender's run begins
            const showSenderName = isGroup && !isSent && (
              index === 0 || visibleMessages[index - 1]?.senderId !== message.senderId
            )

            // System (join/leave/create) events: centered gray text
            if (message.type === 'system') {
              return (
                <div key={message.id} className="flex justify-center py-1">
                  <span className={cn(
                    'text-[11px] text-muted-foreground bg-muted/60 backdrop-blur-sm px-3 py-1 rounded-full max-w-[80%] text-center',
                    isRTL && 'font-arabic'
                  )}>
                    {message.content}
                  </span>
                </div>
              )
            }

            // Don't show deleted messages
            if (message.deletedForEveryone) {
              return (
                <div key={message.id} className="flex justify-center">
                  <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    {isRTL ? 'تم حذف هذه الرسالة' : 'This message was deleted'}
                  </span>
                </div>
              )
            }
            
            // Don't show if deleted for current user
            if (message.deletedFor?.includes(currentUser?.id || '')) {
              return null
            }

            // Date separator when the day changes
            const prev = visibleMessages[index - 1]
            const showDate =
              index === 0 ||
              !prev ||
              !isSameDay(new Date(prev.timestamp), new Date(message.timestamp))

            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <div className="flex justify-center py-1">
                    <span className={cn(
                      'text-[11px] text-muted-foreground bg-muted/60 backdrop-blur-sm px-3 py-1 rounded-full',
                      isRTL && 'font-arabic'
                    )}>
                      {formatDateLabel(message.timestamp)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isSent={isSent}
                  showAvatar={showAvatar}
                  showSenderName={showSenderName}
                  currentUserId={currentUser?.id}
                  channelInteractive={channelInteractive}
                  showCommentsButton={channelInteractive && (chat.admins?.includes(message.senderId) ?? false)}
                  onToggleReaction={(emoji) =>
                    chat && currentUser && toggleReaction(chat.id, message.id, emoji, currentUser.id)
                  }
                  onLongPress={() => setSelectedMessage(message)}
                  onReply={() => setReplyingTo(message)}
                  onSwipeReply={() => setReplyingTo(message)}
                  onOpenImage={(url) => setImageViewerUrl(url)}
                  onOpenComments={() => setCommentsTarget(message)}
                  chatMessages={chatMessages}
                />
              </React.Fragment>
            )
          })}
          </div>
        </ScrollArea>
      </div>

      {/* Reply preview - positioned above input */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t bg-secondary/30 relative z-10 flex-shrink-0"
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <Reply className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary">{replyingTo.senderName}</p>
                <p className="text-sm text-muted-foreground truncate">{replyingTo.content}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReplyingTo(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area - Fixed in flex layout at bottom */}
      <div 
        className="p-3 border-t bg-card/95 backdrop-blur-sm z-20 flex-shrink-0 w-full"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {!canPost ? (
          <div className={cn('flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground', isRTL && 'font-arabic')}>
            <Megaphone className="h-4 w-4" />
            <span>
              {channelInteractive
                ? isRTL
                  ? 'يمكنك التفاعل فقط — النشر للمشرفين'
                  : 'You can only react — admins post'
                : isRTL
                  ? 'النشر مقصور على المشرفين'
                  : 'Only admins can post'}
            </span>
          </div>
        ) : isRecording ? (
          recordedAudio ? (
            /* Preview phase: playable clip before sending */
            <div className="flex items-center gap-2 rounded-2xl bg-secondary/40 p-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 flex-shrink-0 rounded-full text-destructive hover:bg-destructive/10"
                onClick={cancelRecording}
                aria-label={isRTL ? 'إلغاء' : 'Cancel'}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <audio src={recordedAudio} controls className="h-9 min-w-0 flex-1" />
              <Button
                size="icon"
                className="h-12 w-12 flex-shrink-0 rounded-full bg-[#2D5A27] text-white shadow-md transition-all duration-300 hover:bg-[#24491f] active:scale-95"
                onClick={sendVoiceNote}
                aria-label={isRTL ? 'إرسال' : 'Send'}
              >
                <Send className={cn('h-5 w-5', isRTL && 'rotate-180')} />
              </Button>
            </div>
          ) : (
            /* Recording phase: timer + animated waveform + cancel + stop */
            <div className="flex items-center gap-2 rounded-2xl bg-secondary/30 p-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 flex-shrink-0 rounded-full text-destructive hover:bg-destructive/10"
                onClick={cancelRecording}
                aria-label={isRTL ? 'إلغاء التسجيل' : 'Cancel recording'}
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="recording-pulse h-3 w-3 flex-shrink-0 rounded-full bg-destructive" />
              <span className="flex-shrink-0 font-mono text-sm text-destructive">
                {formatRecordingTime(recordingDuration)}
              </span>
              {/* Animated waveform */}
              <div className="flex flex-1 items-center justify-center gap-0.5 overflow-hidden">
                {Array.from({ length: 24 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-1 rounded-full bg-[#2D5A27]/60"
                    animate={{ height: ['20%', '90%', '35%', '70%', '20%'] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.05, ease: 'easeInOut' }}
                    style={{ height: '20%' }}
                  />
                ))}
              </div>
              <Button
                size="icon"
                className="h-12 w-12 flex-shrink-0 rounded-full bg-[#2D5A27] text-white shadow-md transition-all duration-300 hover:bg-[#24491f] active:scale-95"
                onClick={stopRecordingForPreview}
                aria-label={isRTL ? 'إيقاف' : 'Stop'}
              >
                <Check className="h-5 w-5" />
              </Button>
            </div>
          )
        ) : (
          <div className="flex items-end gap-2">
            {/* Attachment "+" button - opens attachment bottom sheet */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-12 w-12 flex-shrink-0 rounded-full text-muted-foreground transition-all duration-300',
                showAttachments && 'bg-secondary rotate-45 text-primary'
              )}
              onClick={() => {
                setShowEmojiPicker(false)
                setShowAttachments((v) => !v)
              }}
              aria-label={isRTL ? 'إضافة مرفق' : 'Add attachment'}
            >
              <Plus className="h-6 w-6" />
            </Button>

            {/* Multiline message field with emoji button inside */}
            <div className="flex min-h-12 flex-1 items-center gap-1 rounded-3xl border border-[#2D5A27]/15 bg-background px-3 py-1.5 shadow-sm transition-all duration-300 focus-within:border-[#2D5A27]/40">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                placeholder={isRTL ? 'اكتب رسالة...' : (t('chat.typeMessage') as string)}
                className={cn(
                  'max-h-28 flex-1 resize-none border-none bg-transparent py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground',
                  isRTL && 'font-arabic text-right'
                )}
              />
              {/* Emoji Picker Toggle */}
              <button
                type="button"
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground',
                  showEmojiPicker && 'text-primary'
                )}
                onClick={() => {
                  setShowAttachments(false)
                  setShowEmojiPicker((v) => !v)
                }}
                aria-label={isRTL ? 'إيموجي' : 'Emoji'}
              >
                {showEmojiPicker ? <X className="h-5 w-5" /> : <Smile className="h-5 w-5" />}
              </button>
            </div>

            {inputValue.trim() ? (
              <Button
                size="icon"
                className="h-12 w-12 flex-shrink-0 rounded-full bg-[#2D5A27] text-white shadow-md transition-all duration-300 hover:bg-[#24491f] active:scale-95"
                onClick={handleSend}
                aria-label={isRTL ? 'إرسال' : 'Send'}
              >
                <Send className={cn('h-5 w-5', isRTL && 'rotate-180')} />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                {/* Speech-to-Text */}
                <Button
                  size="icon"
                  variant={isListening ? 'default' : 'ghost'}
                  className={cn('h-12 w-12 flex-shrink-0 rounded-full text-[#C9A227] transition-all duration-300 hover:bg-[#C9A227]/10 active:scale-95', isListening && 'recording-pulse')}
                  onClick={startSpeechToText}
                  aria-label={isRTL ? 'تسجيل صوتي' : 'Voice'}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Context Menu */}
      <AnimatePresence>
        {selectedMessage && (
          <MessageContextMenu
            message={selectedMessage}
            onClose={() => setSelectedMessage(null)}
            onReply={() => {
              setReplyingTo(selectedMessage)
              setSelectedMessage(null)
            }}
            onDeleteForMe={(msg) => {
              setDeleteTarget({ message: msg, type: 'me' })
              setShowDeleteDialog(true)
              setSelectedMessage(null)
            }}
            onDeleteForEveryone={(msg) => {
              setDeleteTarget({ message: msg, type: 'everyone' })
              setShowDeleteDialog(true)
              setSelectedMessage(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* Flying Emoji */}
      <AnimatePresence>
        {flyingEmoji && (
          <FlyingEmoji emoji={flyingEmoji} onComplete={() => setFlyingEmoji(null)} />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <DeleteMessageDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        deleteTarget={deleteTarget}
      />

      {/* Hidden file input for media / document / contact attachments */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Attachment Bottom Sheet (colored circular icons) */}
      <AnimatePresence>
        {showAttachments && (
          <AttachmentSheet
            isRTL={isRTL}
            onClose={() => setShowAttachments(false)}
            onSelect={handleAttachment}
          />
        )}
      </AnimatePresence>

      {/* Searchable, categorized Emoji Picker (bottom sheet) */}
      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPickerSheet
            isRTL={isRTL}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={handleEmojiSelect}
          />
        )}
      </AnimatePresence>

      {/* Channel Comments Sheet (interactive channels) */}
      <AnimatePresence>
        {commentsTarget && activeChatId && (
          <ChannelCommentsSheet
            chatId={activeChatId}
            messageId={commentsTarget.id}
            onClose={() => setCommentsTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Active Call Bottom Sheet (voice / video) */}
      <AnimatePresence>
        {callType && (
          <CallSheet
            type={callType}
            name={isRTL ? chat.nameAr : chat.name}
            avatar={chat.avatar}
            onClose={() => setCallType(null)}
          />
        )}
      </AnimatePresence>

      {/* Friend Profile Bottom Sheet (opened from header) */}
      <AnimatePresence>
        {showProfile && (
          <ProfileSheet
            chat={chat}
            messages={chatMessages}
            onClose={() => setShowProfile(false)}
            onOpenImage={(url) => setImageViewerUrl(url)}
            onVoiceCall={() => {
              setShowProfile(false)
              setCallType('voice')
            }}
            onVideoCall={() => {
              setShowProfile(false)
              setCallType('video')
            }}
            onMute={() => (chat.isMuted ? unmuteChat(chat.id) : muteChat(chat.id))}
            onBlock={() => (chat.isBlocked ? unblockChat(chat.id) : setShowBlockDialog(true))}
            onReport={() => setShowReportDialog(true)}
            onSearch={() => {
              setShowProfile(false)
              setShowMessageSearch(true)
            }}
          />
        )}
      </AnimatePresence>

      {/* In-conversation Message Search */}
      <AnimatePresence>
        {showMessageSearch && (
          <MessageSearchSheet
            messages={chatMessages}
            currentUserId={currentUser?.id}
            onClose={() => setShowMessageSearch(false)}
          />
        )}
      </AnimatePresence>

      {/* Wallpaper Picker Sheet */}
      <AnimatePresence>
        {showWallpaperPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowWallpaperPicker(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 inset-x-0 bg-card rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn('text-lg font-semibold', isRTL && 'font-arabic')}>
                  {isRTL ? 'خلفية المحادثة' : 'Chat Wallpaper'}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowWallpaperPicker(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {backgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      setBackground(bg.id)
                      setShowWallpaperPicker(false)
                    }}
                    className="aspect-video rounded-lg border-2 border-transparent hover:border-primary transition-colors overflow-hidden relative"
                  >
                    <div
                      className="w-full h-full bg-background"
                      style={{ backgroundImage: bg.pattern }}
                    />
                    <span className={cn(
                      'absolute bottom-1 inset-x-1 text-xs text-center bg-black/50 text-white rounded px-1 py-0.5',
                      isRTL && 'font-arabic'
                    )}>
                      {isRTL ? bg.nameAr : bg.name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Message Bubble Component with Swipe to Reply
interface MessageBubbleProps {
  message: Message
  isSent: boolean
  showAvatar: boolean
  showSenderName?: boolean
  currentUserId?: string
  channelInteractive?: boolean
  showCommentsButton?: boolean
  onToggleReaction?: (emoji: string) => void
  onOpenComments?: () => void
  onLongPress: () => void
  onReply: () => void
  onSwipeReply: () => void
  onOpenImage: (url: string) => void
  chatMessages: Message[]
}

function MessageBubble({ message, isSent, showAvatar, showSenderName, currentUserId, channelInteractive, showCommentsButton, onToggleReaction, onOpenComments, onLongPress, onSwipeReply, onOpenImage, chatMessages }: MessageBubbleProps) {
  const { language, isRTL } = useLanguage()
  const longPressTimer = React.useRef<number | null>(null)
  const controls = useAnimation()
  const [showReplyIcon, setShowReplyIcon] = React.useState(false)

  const handleTouchStart = () => {
    longPressTimer.current = window.setTimeout(onLongPress, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80
    const swipeDirection = isRTL ? -info.offset.x : info.offset.x
    
    if (swipeDirection > threshold) {
      onSwipeReply()
    }
    
    await controls.start({ x: 0 })
    setShowReplyIcon(false)
  }

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeDirection = isRTL ? -info.offset.x : info.offset.x
    setShowReplyIcon(swipeDirection > 30)
  }

  const formatMessageTime = (date: Date) => {
    return format(date, 'p', { locale: language === 'ar' ? ar : enUS })
  }

  const StatusIcon = message.status === 'read' ? CheckCheck : 
                     message.status === 'delivered' ? CheckCheck : Check

  // Find reply message
  const replyMessage = message.replyTo 
    ? chatMessages.find(m => m.id === message.replyTo) 
    : null

  return (
    <div className="relative">
      {/* Reply Icon */}
      <AnimatePresence>
        {showReplyIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 z-10',
              isSent ? (isRTL ? 'right-full mr-2' : 'left-full ml-2') : (isRTL ? 'left-full ml-2' : 'right-full mr-2')
            )}
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Reply className="h-4 w-4 text-primary" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={cn(
          'flex items-end gap-2',
          // WhatsApp-style physical layout (independent of RTL):
          // own messages on the LEFT, received messages on the RIGHT.
          isSent ? 'justify-start flex-row' : 'justify-end flex-row-reverse',
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault()
          onLongPress()
        }}
      >
        {/* Avatar (for received messages) */}
        {!isSent && (
          <div className="w-8 flex-shrink-0">
            {showAvatar && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                <AvatarFallback>{message.senderName[0]}</AvatarFallback>
              </Avatar>
            )}
          </div>
        )}

        {/* Sticker: large image, no bubble */}
        {message.type === 'sticker' ? (
          <div className="message-in flex flex-col gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.stickerUrl || message.imageUrl || '/placeholder.svg'}
              alt={isRTL ? 'ملصق' : 'Sticker'}
              className="w-32 h-32 object-contain select-none"
              draggable={false}
            />
            <div className={cn('flex items-center gap-1', isSent ? 'justify-end' : 'justify-start')}>
              <span className="text-[10px] text-muted-foreground">
                {formatMessageTime(message.timestamp)}
              </span>
              {isSent && (
                <StatusIcon className={cn('h-3 w-3', message.status === 'read' ? 'text-blue-500' : 'text-muted-foreground')} />
              )}
            </div>
          </div>
        ) : (
        /* Bubble */
        <div
          className={cn(
            'chat-bubble message-in',
            isSent ? 'chat-bubble-sent' : 'chat-bubble-received',
            (message.type === 'image' || message.type === 'video') && 'overflow-hidden p-1',
            isRTL && 'text-right'
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Sender name (groups, received messages only) */}
          {showSenderName && (
            <p
              className={cn('mb-0.5 text-xs font-semibold leading-tight', isRTL && 'font-arabic')}
              style={{ color: getMemberColor(message.senderId) }}
            >
              {message.senderName}
            </p>
          )}

          {/* Reply Preview */}
          {replyMessage && (
            <div className={cn(
              'mb-2 pb-2 border-b text-sm opacity-80',
              isSent ? 'border-primary-foreground/20' : 'border-secondary-foreground/20'
            )}>
              <p className="font-medium text-xs">{replyMessage.senderName}</p>
              <p className="truncate">{replyMessage.content}</p>
            </div>
          )}
          
          {message.type === 'voice' ? (
            <VoiceMessagePlayer message={message} isSent={isSent} />
          ) : message.type === 'location' ? (
            <LocationMessage message={message} isSent={isSent} />
          ) : message.type === 'image' ? (
            <button
              type="button"
              onClick={() => onOpenImage(message.imageUrl || '')}
              className="block w-44 max-w-full overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl || '/placeholder.svg'}
                alt={message.content || (isRTL ? 'صورة' : 'Image')}
                className="w-full h-auto object-cover"
              />
            </button>
          ) : message.type === 'video' ? (
            <button
              type="button"
              onClick={() => message.videoUrl && onOpenImage(message.videoThumbnail || message.videoUrl)}
              className="relative block w-44 max-w-full overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.videoThumbnail || '/placeholder.svg'}
                alt={message.content || (isRTL ? 'فيديو' : 'Video')}
                className="w-full h-auto object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white">
                  <Play className="h-5 w-5 translate-x-0.5" />
                </span>
              </span>
              {message.videoDuration ? (
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {Math.floor(message.videoDuration / 60)}:
                  {(message.videoDuration % 60).toString().padStart(2, '0')}
                </span>
              ) : null}
            </button>
          ) : message.type === 'document' ? (
            <div className={cn('flex items-center gap-3 min-w-[180px] py-1', isRTL && 'flex-row-reverse text-right')}>
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-current/15">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm font-medium', isRTL && 'font-arabic')}>
                  {message.documentName || (isRTL ? 'مستند' : 'Document')}
                </p>
                <p className="text-[11px] opacity-70">
                  {[message.documentType, message.documentSize].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Download className="h-4 w-4 flex-shrink-0 opacity-70" />
            </div>
          ) : (
            <>
              <p className={cn(isRTL && 'font-arabic')}>{message.content}</p>
              {message.translatedContent && (
                <p className={cn('mt-2 pt-2 border-t text-sm opacity-80', isRTL && 'font-arabic')}>
                  {message.translatedContent}
                </p>
              )}
            </>
          )}

          {/* Caption for media */}
          {(message.type === 'image' || message.type === 'video') && message.content && (
            <p className={cn('px-1 pt-1 text-sm', isRTL && 'font-arabic text-right')}>{message.content}</p>
          )}

          {/* Time and status */}
          <div className={cn(
            'flex items-center gap-1 mt-1',
            (message.type === 'image' || message.type === 'video') && 'px-1 pb-0.5',
            isSent ? 'justify-end' : 'justify-start'
          )}>
            <span className="text-[10px] opacity-70">
              {formatMessageTime(message.timestamp)}
            </span>
            {isSent && (
              <StatusIcon className={cn(
                'h-3 w-3',
                message.status === 'read' ? 'text-blue-400' : 'opacity-70'
              )} />
            )}
            {message.isEdited && (
              <span className="text-[10px] opacity-50">
                {isRTL ? 'معدل' : 'edited'}
              </span>
            )}
          </div>

          {/* Reaction chips */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className={cn('flex flex-wrap gap-1 pt-1.5', isSent ? 'justify-end' : 'justify-start')}>
              {Object.entries(message.reactions).map(([emoji, users]) => {
                const reacted = !!currentUserId && users.includes(currentUserId)
                return (
                  <button
                    key={emoji}
                    type="button"
                    disabled={!channelInteractive}
                    onClick={() => onToggleReaction?.(emoji)}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors',
                      reacted ? 'bg-primary/20 ring-1 ring-primary/40' : 'bg-background/40',
                      channelInteractive ? 'cursor-pointer hover:bg-background/70' : 'cursor-default',
                    )}
                  >
                    <span>{emoji}</span>
                    <span className="opacity-80">{users.length}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Quick react bar (interactive channels) */}
          {channelInteractive && (
            <div className={cn('flex gap-1 pt-1.5', isSent ? 'justify-end' : 'justify-start')}>
              {['👍', '❤️', '🔥', '😂', '😮'].map((emoji) => {
                const reacted = !!currentUserId && message.reactions?.[emoji]?.includes(currentUserId)
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onToggleReaction?.(emoji)}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm transition-transform hover:scale-110 active:scale-95',
                      reacted ? 'bg-primary/20' : 'bg-background/30',
                    )}
                    aria-label={`React ${emoji}`}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          )}

          {/* Comments button (channels — admin posts) */}
          {showCommentsButton && (
            <div className={cn('pt-1.5', isSent ? 'flex justify-end' : 'flex justify-start')}>
              <button
                type="button"
                onClick={onOpenComments}
                className={cn(
                  'flex items-center gap-1.5 rounded-full bg-background/40 px-3 py-1 text-xs transition-colors hover:bg-background/70',
                  isRTL && 'flex-row-reverse font-arabic',
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{isRTL ? 'تعليقات' : 'Comments'}</span>
                {message.comments && message.comments.length > 0 && (
                  <span className="opacity-80">{message.comments.length}</span>
                )}
              </button>
            </div>
          )}
        </div>
        )}
      </motion.div>
    </div>
  )
}

// Voice Message Player
function VoiceMessagePlayer({ message, isSent }: { message: Message; isSent: boolean }) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  return (
    <div className="flex items-center gap-2 min-w-[150px]">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-full"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <div className="flex-1 h-1 bg-current/30 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-current/70"
          initial={{ width: '0%' }}
          animate={{ width: isPlaying ? '100%' : `${progress}%` }}
          transition={{ duration: message.voiceDuration || 5 }}
        />
      </div>
      <span className="text-xs opacity-70">
        {Math.floor((message.voiceDuration || 0) / 60)}:
        {((message.voiceDuration || 0) % 60).toString().padStart(2, '0')}
      </span>
    </div>
  )
}

// Location Message
function LocationMessage({ message, isSent }: { message: Message; isSent: boolean }) {
  const { isRTL } = useLanguage()
  
  if (!message.location) return null
  
  return (
    <div className="min-w-[180px]">
      <div className="w-full h-24 bg-muted/50 rounded-lg flex items-center justify-center mb-2">
        <MapPin className="h-8 w-8 text-primary" />
      </div>
      <div className="flex items-center gap-2">
        {message.location.isLive && (
          <span className="recording-pulse w-2 h-2 bg-green-500 rounded-full" />
        )}
        <span className="text-sm">
          {message.location.isLive 
            ? (isRTL ? 'موقع مباشر' : 'Live Location')
            : (isRTL ? 'الموقع' : 'Location')
          }
        </span>
        {message.location.duration && (
          <span className="text-xs opacity-70">
            ({message.location.duration} {isRTL ? 'دقيقة' : 'min'})
          </span>
        )}
      </div>
    </div>
  )
}

// Message Context Menu
interface MessageContextMenuProps {
  message: Message
  onClose: () => void
  onReply: () => void
  onDeleteForMe: (message: Message) => void
  onDeleteForEveryone: (message: Message) => void
}

function MessageContextMenu({ message, onClose, onReply, onDeleteForMe, onDeleteForEveryone }: MessageContextMenuProps) {
  const { t, isRTL } = useLanguage()
  const { translateMessage } = useChatStore()
  const { currentUser } = useUserStore()

  const isSent = message.senderId === currentUser?.id

  const handleTranslate = async () => {
    // Mock translation - in production, use a translation API
    const translatedContent = isRTL 
      ? 'Translated to English...' 
      : 'تمت الترجمة للعربية...'
    translateMessage(message.chatId, message.id, translatedContent, isRTL ? 'ar' : 'en')
    onClose()
  }

  const actions = [
    { icon: Reply, label: isRTL ? 'رد' : 'Reply', onClick: onReply },
    { icon: Copy, label: isRTL ? 'نسخ' : 'Copy', onClick: () => navigator.clipboard.writeText(message.content) },
    { icon: Forward, label: isRTL ? 'تحويل' : 'Forward', onClick: () => {} },
    { icon: Languages, label: isRTL ? 'ترجمة' : 'Translate', onClick: handleTranslate },
    ...(isSent ? [
      { icon: Edit2, label: isRTL ? 'تعديل' : 'Edit', onClick: () => {} },
    ] : []),
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="min-w-[190px] space-y-0.5 rounded-2xl border border-border/40 bg-card/80 p-2 shadow-xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick()
              onClose()
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors',
              'hover:bg-secondary/70',
              isRTL && 'flex-row-reverse'
            )}
          >
            <action.icon className="h-4 w-4 flex-shrink-0" />
            <span className={cn(isRTL && 'font-arabic')}>{action.label}</span>
          </button>
        ))}

        {/* Delete options */}
        <div className="mt-1 border-t border-border/40 pt-1">
          <button
            onClick={() => onDeleteForMe(message)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors',
              'text-muted-foreground hover:bg-secondary/70',
              isRTL && 'flex-row-reverse'
            )}
          >
            <Trash2 className="h-4 w-4 flex-shrink-0" />
            <span className={cn(isRTL && 'font-arabic')}>
              {isRTL ? 'حذف لي' : 'Delete for me'}
            </span>
          </button>

          {isSent && (
            <button
              onClick={() => onDeleteForEveryone(message)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors',
                'text-destructive hover:bg-destructive/10',
                isRTL && 'flex-row-reverse'
              )}
            >
              <Trash2 className="h-4 w-4 flex-shrink-0" />
              <span className={cn(isRTL && 'font-arabic')}>
                {isRTL ? 'حذف للجميع' : 'Delete for everyone'}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Delete Message Dialog
function DeleteMessageDialog({ 
  open, 
  onOpenChange, 
  deleteTarget 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  deleteTarget: { message: Message; type: 'me' | 'everyone' } | null
}) {
  const { deleteMessageForMe, deleteMessageForEveryone } = useChatStore()
  const { currentUser } = useUserStore()
  const { isRTL } = useLanguage()

  const handleDelete = () => {
    if (!deleteTarget || !currentUser) return

    if (deleteTarget.type === 'me') {
      deleteMessageForMe(deleteTarget.message.chatId, deleteTarget.message.id, currentUser.id)
    } else {
      deleteMessageForEveryone(deleteTarget.message.chatId, deleteTarget.message.id)
    }
    
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(isRTL && 'font-arabic text-right')}>
            {isRTL ? 'حذف الرسالة' : 'Delete Message'}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn(isRTL && 'font-arabic text-right')}>
            {deleteTarget?.type === 'everyone'
              ? (isRTL ? 'سيتم حذف هذه الرسالة للجميع' : 'This message will be deleted for everyone')
              : (isRTL ? 'سيتم حذ�� هذه الرسالة لك فقط' : 'This message will only be deleted for you')
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={cn(isRTL && 'flex-row-reverse')}>
          <AlertDialogCancel className={cn(isRTL && 'font-arabic')}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className={cn('bg-destructive hover:bg-destructive/90', isRTL && 'font-arabic')}>
            {isRTL ? 'حذف' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Channel Comments Sheet (interactive channels)
function ChannelCommentsSheet({
  chatId,
  messageId,
  onClose,
}: {
  chatId: string
  messageId: string
  onClose: () => void
}) {
  const { language, isRTL } = useLanguage()
  const { messages, addChannelComment } = useChatStore()
  const { currentUser } = useUserStore()
  const [value, setValue] = React.useState('')
  const listEndRef = React.useRef<HTMLDivElement>(null)

  // Read the live message so newly added comments render immediately.
  const message = (messages[chatId] || []).find((m) => m.id === messageId)
  const comments = message?.comments || []

  React.useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  const handleAdd = () => {
    const text = value.trim()
    if (!text || !currentUser) return
    addChannelComment(chatId, messageId, {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: text,
      timestamp: new Date(),
    })
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as any).isComposing && e.keyCode !== 229) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute inset-x-0 bottom-0 flex max-h-[75vh] flex-col rounded-t-2xl bg-card"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className={cn('text-base font-semibold', isRTL && 'font-arabic')}>
            {isRTL ? `التعليقات (${comments.length})` : `Comments (${comments.length})`}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Comments list */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {comments.length === 0 ? (
            <div className={cn('py-10 text-center text-sm text-muted-foreground', isRTL && 'font-arabic')}>
              {isRTL ? 'لا توجد تعليقات بعد. كن أول من يعلّق!' : 'No comments yet. Be the first!'}
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                  <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                </Avatar>
                <div className={cn('min-w-0 flex-1 rounded-2xl bg-secondary/50 px-3 py-2', isRTL && 'text-right')}>
                  <div className={cn('flex items-baseline gap-2', isRTL && 'flex-row-reverse')}>
                    <span className={cn('text-sm font-semibold', isRTL && 'font-arabic')}>{comment.userName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(comment.timestamp), 'p', { locale: language === 'ar' ? ar : enUS })}
                    </span>
                  </div>
                  <p className={cn('mt-0.5 break-words text-sm leading-relaxed', isRTL && 'font-arabic')}>
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={listEndRef} />
        </div>

        {/* Add comment */}
        <div className="flex items-end gap-2 border-t p-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0))' }}>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={isRTL ? 'أضف تعليقًا...' : 'Add a comment...'}
            className={cn(
              'max-h-24 min-h-12 flex-1 resize-none rounded-3xl border border-[#2D5A27]/15 bg-background px-4 py-3 text-sm leading-relaxed shadow-sm outline-none transition-all duration-300 focus:border-[#2D5A27]/40 placeholder:text-muted-foreground',
              isRTL && 'font-arabic text-right',
            )}
          />
          <Button
            size="icon"
            className="h-12 w-12 flex-shrink-0 rounded-full bg-[#2D5A27] text-white shadow-md transition-all duration-300 hover:bg-[#24491f] active:scale-95 disabled:opacity-50"
            onClick={handleAdd}
            disabled={!value.trim()}
            aria-label={isRTL ? 'إرسال التعليق' : 'Send comment'}
          >
            <Send className={cn('h-5 w-5', isRTL && 'rotate-180')} />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Active Call Bottom Sheet (voice / video)
// ---------------------------------------------------------------------------
function CallSheet({
  type,
  name,
  avatar,
  onClose,
}: {
  type: 'voice' | 'video'
  name: string
  avatar: string
  onClose: () => void
}) {
  const { isRTL } = useLanguage()
  const [seconds, setSeconds] = React.useState(0)
  const [connecting, setConnecting] = React.useState(true)

  React.useEffect(() => {
    const connectTimer = window.setTimeout(() => setConnecting(false), 2500)
    return () => window.clearTimeout(connectTimer)
  }, [])

  React.useEffect(() => {
    if (connecting) return
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [connecting])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const status = connecting
    ? type === 'video'
      ? isRTL ? 'جاري بدء مكالمة فيديو...' : 'Starting video call...'
      : isRTL ? 'جاري الاتصال...' : 'Calling...'
    : fmt(seconds)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-[#2D5A27] p-6 pb-10 text-white"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-white/40">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-white/20 text-white text-xl">{name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className={cn('text-lg font-bold', isRTL && 'font-arabic')}>{name}</h3>
            <p className={cn('mt-1 flex items-center justify-center gap-2 text-sm text-white/80', isRTL && 'font-arabic')}>
              {connecting && (
                <span className="flex gap-1">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: '0.2s' }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: '0.4s' }} />
                </span>
              )}
              {status}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              {type === 'video' ? <Video className="h-5 w-5" /> : <PhoneCall className="h-5 w-5" />}
            </span>
            <button
              onClick={onClose}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive shadow-lg transition-transform active:scale-95"
              aria-label={isRTL ? 'إنهاء المكالمة' : 'End call'}
            >
              <Phone className="h-6 w-6 rotate-[135deg]" />
            </button>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              <Mic className="h-5 w-5" />
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Friend Profile Bottom Sheet
// ---------------------------------------------------------------------------
type MediaKind = 'image' | 'video' | 'document' | 'link' | 'audio'

function ProfileSheet({
  chat,
  messages,
  onClose,
  onOpenImage,
  onVoiceCall,
  onVideoCall,
  onMute,
  onBlock,
  onReport,
  onSearch,
}: {
  chat: Chat
  messages: Message[]
  onClose: () => void
  onOpenImage: (url: string) => void
  onVoiceCall: () => void
  onVideoCall: () => void
  onMute: () => void
  onBlock: () => void
  onReport: () => void
  onSearch: () => void
}) {
  const { language, isRTL } = useLanguage()
  const [tab, setTab] = React.useState<'info' | 'media'>('info')
  const [mediaKind, setMediaKind] = React.useState<MediaKind>('image')

  const name = isRTL ? chat.nameAr : chat.name
  const totalMessages = messages.length
  const firstMessageDate = messages[0]?.timestamp

  // Collect shared media of the selected kind.
  const mediaItems = React.useMemo(() => {
    const urlRe = /(https?:\/\/[^\s]+)/i
    switch (mediaKind) {
      case 'image':
        return messages.filter((m) => m.type === 'image' && m.imageUrl).map((m) => m.imageUrl!)
      case 'video':
        return messages.filter((m) => m.type === 'video').map((m) => m.videoThumbnail || m.videoUrl || '')
      case 'document':
        return messages.filter((m) => m.type === 'document')
      case 'audio':
        return messages.filter((m) => m.type === 'voice')
      case 'link':
        return messages.filter((m) => m.type === 'text' && urlRe.test(m.content))
      default:
        return []
    }
  }, [messages, mediaKind])

  const mediaTabs: { id: MediaKind; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'image', label: isRTL ? 'صور' : 'Photos', icon: ImageIcon },
    { id: 'video', label: isRTL ? 'فيديوهات' : 'Videos', icon: Video },
    { id: 'document', label: isRTL ? 'مستندات' : 'Docs', icon: FileText },
    { id: 'link', label: isRTL ? 'روابط' : 'Links', icon: Link2 },
    { id: 'audio', label: isRTL ? 'صوتيات' : 'Audio', icon: Music },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-card"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="relative flex flex-col items-center gap-2 border-b px-4 pb-4 pt-6">
          <Button variant="ghost" size="icon" className="absolute end-3 top-3" onClick={onClose} aria-label={isRTL ? 'إغلاق' : 'Close'}>
            <X className="h-5 w-5" />
          </Button>
          <Avatar className="h-20 w-20">
            <AvatarImage src={chat.avatar} alt={name} />
            <AvatarFallback className="text-xl">{name[0]}</AvatarFallback>
          </Avatar>
          <h3 className={cn('text-lg font-bold', isRTL && 'font-arabic')}>{name}</h3>
          <p className={cn('text-sm text-muted-foreground', isRTL && 'font-arabic')}>
            {chat.isOnline ? (isRTL ? 'متصل الآن' : 'Online') : (isRTL ? 'آخر ظهور قريباً' : 'Last seen recently')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['info', 'media'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-colors',
                tab === id ? 'border-b-2 border-[#2D5A27] text-[#2D5A27]' : 'text-muted-foreground',
                isRTL && 'font-arabic',
              )}
            >
              {id === 'info' ? (isRTL ? 'معلومات' : 'Info') : (isRTL ? 'الوسائط' : 'Media')}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'info' ? (
            <div className="space-y-4">
              {/* Stats */}
              <div className="space-y-2">
                <div className={cn('flex items-center gap-3 rounded-xl bg-secondary/40 p-3', isRTL && 'flex-row-reverse text-right')}>
                  <MessageSquare className="h-5 w-5 flex-shrink-0 text-[#2D5A27]" />
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', isRTL && 'font-arabic')}>{isRTL ? 'الرسائل المشتركة' : 'Shared messages'}</p>
                    <p className="text-xs text-muted-foreground">{totalMessages}</p>
                  </div>
                </div>
                <div className={cn('flex items-center gap-3 rounded-xl bg-secondary/40 p-3', isRTL && 'flex-row-reverse text-right')}>
                  <Calendar className="h-5 w-5 flex-shrink-0 text-[#2D5A27]" />
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', isRTL && 'font-arabic')}>{isRTL ? 'بداية المحادثة' : 'Chat started'}</p>
                    <p className="text-xs text-muted-foreground">
                      {firstMessageDate ? format(new Date(firstMessageDate), 'PP', { locale: language === 'ar' ? ar : enUS }) : '—'}
                    </p>
                  </div>
                </div>
                <div className={cn('flex items-center gap-3 rounded-xl bg-secondary/40 p-3', isRTL && 'flex-row-reverse text-right')}>
                  <Users className="h-5 w-5 flex-shrink-0 text-[#2D5A27]" />
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', isRTL && 'font-arabic')}>{isRTL ? 'الأصدقاء المشتركون' : 'Mutual friends'}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'لا يوجد' : 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                <ProfileAction icon={Phone} label={isRTL ? 'مكالمة صوتية' : 'Voice call'} onClick={onVoiceCall} />
                <ProfileAction icon={Video} label={isRTL ? 'مكالمة فيديو' : 'Video call'} onClick={onVideoCall} />
                <ProfileAction icon={chat.isMuted ? Bell : BellOff} label={chat.isMuted ? (isRTL ? 'إلغاء الكتم' : 'Unmute') : (isRTL ? 'كتم الإشعارات' : 'Mute')} onClick={onMute} active={chat.isMuted} />
                <ProfileAction icon={Ban} label={chat.isBlocked ? (isRTL ? 'إلغاء الحظر' : 'Unblock') : (isRTL ? 'حظر' : 'Block')} onClick={onBlock} active={chat.isBlocked} danger />
              </div>
              <ProfileAction icon={Flag} label={isRTL ? 'إبلاغ' : 'Report'} onClick={onReport} danger full />
            </div>
          ) : (
            <div>
              {/* Sub tabs */}
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {mediaTabs.map((mt) => {
                  const Icon = mt.icon
                  return (
                    <button
                      key={mt.id}
                      onClick={() => setMediaKind(mt.id)}
                      className={cn(
                        'flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        mediaKind === mt.id ? 'bg-[#2D5A27] text-white' : 'bg-secondary/50 text-muted-foreground',
                        isRTL && 'font-arabic',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {mt.label}
                    </button>
                  )
                })}
              </div>

              {mediaItems.length === 0 ? (
                <p className={cn('py-10 text-center text-sm text-muted-foreground', isRTL && 'font-arabic')}>
                  {isRTL ? 'لا توجد وسائط' : 'No media'}
                </p>
              ) : mediaKind === 'image' || mediaKind === 'video' ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {(mediaItems as string[]).map((url, i) => (
                    <button
                      key={i}
                      onClick={() => onOpenImage(url)}
                      className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url || '/placeholder.svg'} alt="" className="h-full w-full object-cover" />
                      {mediaKind === 'video' && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="h-6 w-6 text-white" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(mediaItems as Message[]).map((m) => (
                    <div key={m.id} className={cn('flex items-center gap-3 rounded-xl bg-secondary/40 p-3', isRTL && 'flex-row-reverse text-right')}>
                      {mediaKind === 'document' ? <FileText className="h-5 w-5 flex-shrink-0 text-[#2D5A27]" /> :
                       mediaKind === 'audio' ? <Music className="h-5 w-5 flex-shrink-0 text-[#2D5A27]" /> :
                       <Link2 className="h-5 w-5 flex-shrink-0 text-[#2D5A27]" />}
                      <p className={cn('min-w-0 flex-1 truncate text-sm', isRTL && 'font-arabic')}>
                        {mediaKind === 'document' ? (m.documentName || (isRTL ? 'مستند' : 'Document')) :
                         mediaKind === 'audio' ? (isRTL ? 'رسالة صوتية' : 'Voice message') :
                         m.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search in messages */}
        <div className="border-t p-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0))' }}>
          <button
            onClick={onSearch}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2D5A27] py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]',
              isRTL && 'font-arabic flex-row-reverse',
            )}
          >
            <Search className="h-4 w-4" />
            {isRTL ? 'البحث في الرسائل' : 'Search in messages'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ProfileAction({
  icon: Icon,
  label,
  onClick,
  active,
  danger,
  full,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  active?: boolean
  danger?: boolean
  full?: boolean
}) {
  const { isRTL } = useLanguage()
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors',
        full && 'col-span-2 flex-row gap-2',
        danger ? 'border-destructive/30 text-destructive hover:bg-destructive/10' : 'border-border hover:bg-secondary/50',
        active && !danger && 'border-[#2D5A27] bg-[#2D5A27]/10 text-[#2D5A27]',
        isRTL && 'font-arabic',
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// In-conversation Message Search
// ---------------------------------------------------------------------------
function MessageSearchSheet({
  messages,
  currentUserId,
  onClose,
}: {
  messages: Message[]
  currentUserId?: string
  onClose: () => void
}) {
  const { language, isRTL } = useLanguage()
  const [query, setQuery] = React.useState('')

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return messages.filter(
      (m) => m.type === 'text' && !m.deletedForEveryone && m.content.toLowerCase().includes(q),
    )
  }, [messages, query])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col bg-card"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Search header */}
      <div className="flex items-center gap-2 border-b p-3">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={isRTL ? 'رجوع' : 'Back'}>
          {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </Button>
        <div className="flex flex-1 items-center gap-2 rounded-full border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isRTL ? 'ابحث في الرسائل...' : 'Search messages...'}
            className={cn('flex-1 bg-transparent text-sm outline-none', isRTL && 'font-arabic text-right')}
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label={isRTL ? 'مسح' : 'Clear'}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3">
        {query.trim() === '' ? (
          <p className={cn('py-10 text-center text-sm text-muted-foreground', isRTL && 'font-arabic')}>
            {isRTL ? 'اكتب للبحث في هذه المحادثة' : 'Type to search this conversation'}
          </p>
        ) : results.length === 0 ? (
          <p className={cn('py-10 text-center text-sm text-muted-foreground', isRTL && 'font-arabic')}>
            {isRTL ? 'لا توجد نتائج' : 'No results'}
          </p>
        ) : (
          <div className="space-y-2">
            {results.map((m) => {
              const isSent = m.senderId === currentUserId
              return (
                <div key={m.id} className={cn('rounded-xl bg-secondary/40 p-3', isRTL && 'text-right')}>
                  <div className={cn('flex items-baseline justify-between gap-2', isRTL && 'flex-row-reverse')}>
                    <span className={cn('text-xs font-semibold text-[#2D5A27]', isRTL && 'font-arabic')}>
                      {isSent ? (isRTL ? 'أنت' : 'You') : m.senderName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(m.timestamp), 'PP p', { locale: language === 'ar' ? ar : enUS })}
                    </span>
                  </div>
                  <p className={cn('mt-1 text-sm', isRTL && 'font-arabic')}>{m.content}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
