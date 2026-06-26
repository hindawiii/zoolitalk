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
import { useChatStore, type Message } from '@/lib/stores/chat-store'
import { useUserStore } from '@/lib/stores/user-store'
import { useLanguage } from '@/components/providers/language-provider'
import { useGender } from '@/hooks/use-gender'
import { ChatBackgroundPattern, useChatTheme } from './chat-theme-provider'
import { FlyingEmoji } from './animated-emoji'
import { EmojiPickerSheet } from './emoji-picker-sheet'
import { AttachmentSheet, type AttachmentAction } from './attachment-sheet'
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
  const [viewerMessage, setViewerMessage] = React.useState<Message | null>(null)

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

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Recording timer
  React.useEffect(() => {
    if (isRecording) {
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
  }, [isRecording, recordingDuration, setRecordingDuration])

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

  // Voice recording handlers
  const startRecording = () => {
    setRecording(true)
  }

  const cancelRecording = () => {
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
      timestamp: new Date(),
      status: 'sending',
    }

    addMessage(activeChatId, newMessage)
    setRecording(false)
  }

  // Handle swipe to cancel
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isRTL ? info.offset.x > 100 : info.offset.x < -100) {
      cancelRecording()
    }
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
          onClick={() => chat.type === 'private' && chat.participants?.[0] && onOpenProfile?.(chat.participants[0])}
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
            {chat.type === 'channel' ? (
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
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-52" dir={isRTL ? 'rtl' : 'ltr'}>
              {/* Chat info */}
              <DropdownMenuItem
                onClick={() => setShowChatInfo(true)}
                className={cn('gap-3', isRTL && 'flex-row-reverse')}
              >
                <Info className="h-4 w-4" />
                <span className={cn(isRTL && 'font-arabic')}>
                  {isRTL ? 'معلومات المحادثة' : 'Chat info'}
                </span>
              </DropdownMenuItem>

              {/* Pin/Unpin */}
              <DropdownMenuItem 
                onClick={() => chat.isPinned ? unpinChat(chat.id) : pinChat(chat.id)}
                className={cn('gap-3', isRTL && 'flex-row-reverse')}
              >
                {chat.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                <span className={cn(isRTL && 'font-arabic')}>
                  {chat.isPinned ? (isRTL ? 'إلغاء التثبيت' : 'Unpin') : (isRTL ? 'تثبيت' : 'Pin')}
                </span>
              </DropdownMenuItem>
              
              {/* Mute/Unmute */}
              <DropdownMenuItem 
                onClick={() => chat.isMuted ? unmuteChat(chat.id) : muteChat(chat.id)}
                className={cn('gap-3', isRTL && 'flex-row-reverse')}
              >
                {chat.isMuted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                <span className={cn(isRTL && 'font-arabic')}>
                  {chat.isMuted ? (isRTL ? 'إلغاء الكتم' : 'Unmute') : t('chat.mute')}
                </span>
              </DropdownMenuItem>
              
              {/* Archive */}
              <DropdownMenuItem 
                onClick={() => archiveChat(chat.id)}
                className={cn('gap-3', isRTL && 'flex-row-reverse')}
              >
                <Archive className="h-4 w-4" />
                <span className={cn(isRTL && 'font-arabic')}>{isRTL ? 'أرشفة' : 'Archive'}</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Games */}
              <DropdownMenuItem 
                onClick={onOpenGames}
                className={cn('gap-3', isRTL && 'flex-row-reverse')}
              >
                <Gamepad2 className="h-4 w-4" />
                <span className={cn(isRTL && 'font-arabic')}>{isRTL ? 'الألعاب' : 'Games'}</span>
              </DropdownMenuItem>
              
              {chat.type === 'group' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className={cn(isRTL && 'font-arabic')}>{t('chat.kick')}</DropdownMenuItem>
                  <DropdownMenuItem className={cn(isRTL && 'font-arabic')}>{t('chat.promote')}</DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {/* Clear conversation */}
              <DropdownMenuItem
                onClick={() => setShowClearDialog(true)}
                className={cn('gap-3', isRTL && 'flex-row-reverse')}
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
                  className={cn('gap-3', isRTL && 'flex-row-reverse')}
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
                className={cn('text-destructive gap-3', isRTL && 'flex-row-reverse')}
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
          {chatMessages.map((message, index) => {
            const isSent = message.senderId === currentUser?.id
            const isGroup = chat.type === 'group'
            const showAvatar = !isSent && (
              index === 0 || chatMessages[index - 1]?.senderId !== message.senderId
            )
            // Show sender name in group bubbles when a new sender's run begins
            const showSenderName = isGroup && !isSent && (
              index === 0 || chatMessages[index - 1]?.senderId !== message.senderId
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
            const prev = chatMessages[index - 1]
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
                  onToggleReaction={(emoji) =>
                    chat && currentUser && toggleReaction(chat.id, message.id, emoji, currentUser.id)
                  }
                  onLongPress={() => setSelectedMessage(message)}
                  onReply={() => setReplyingTo(message)}
                  onSwipeReply={() => setReplyingTo(message)}
                  onOpenMedia={(m) => setViewerMessage(m)}
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
          <motion.div
            className="flex items-center gap-3"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
          >
            <div className="recording-pulse w-3 h-3 bg-destructive rounded-full" />
            <span className="text-destructive font-mono">
              {formatRecordingTime(recordingDuration)}
            </span>
            <span className={cn('flex-1 text-sm text-muted-foreground', isRTL && 'font-arabic')}>
              {t('chat.slideCancel')}
            </span>
            <Button
              size="icon"
              className="rounded-full bg-primary hover:bg-primary/90"
              onClick={sendVoiceNote}
            >
              <Send className="h-5 w-5" />
            </Button>
          </motion.div>
        ) : (
          <div className="flex items-end gap-2">
            {/* Attachment "+" button - opens attachment bottom sheet */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-10 w-10 flex-shrink-0 rounded-full text-muted-foreground transition-transform',
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
            <div className="flex flex-1 items-end gap-1 rounded-3xl bg-secondary/50 px-3 py-1.5">
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
                className="flex-shrink-0 rounded-full bg-green-700 text-white hover:bg-green-800"
                onClick={handleSend}
                aria-label={isRTL ? 'إ��سال' : 'Send'}
              >
                <Send className={cn('h-5 w-5', isRTL && 'rotate-180')} />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                {/* Speech-to-Text */}
                <Button
                  size="icon"
                  variant={isListening ? 'default' : 'ghost'}
                  className={cn('flex-shrink-0 rounded-full', isListening && 'recording-pulse')}
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
        className="hidden"
        onChange={() => {
          // Reset so selecting the same file again re-triggers change
          if (fileInputRef.current) fileInputRef.current.value = ''
        }}
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
  onToggleReaction?: (emoji: string) => void
  onLongPress: () => void
  onReply: () => void
  onSwipeReply: () => void
  onOpenImage: (url: string) => void
  chatMessages: Message[]
}

function MessageBubble({ message, isSent, showAvatar, showSenderName, currentUserId, channelInteractive, onToggleReaction, onLongPress, onSwipeReply, onOpenImage, chatMessages }: MessageBubbleProps) {
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
          'flex gap-2',
          // In RTL: sent messages should justify-end (right), received justify-start (left)
          // In LTR: sent messages should justify-end (right), received justify-start (left)
          isSent ? 'justify-end' : 'justify-start',
          // Flex direction for avatar positioning
          isSent ? 'flex-row-reverse' : 'flex-row'
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
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
          <div className="flex flex-col gap-1">
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
            'chat-bubble',
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
    { icon: Reply, label: t('chat.reply'), onClick: onReply },
    { icon: Forward, label: t('chat.forward'), onClick: () => {} },
    { icon: Copy, label: t('chat.copy'), onClick: () => navigator.clipboard.writeText(message.content) },
    { icon: Languages, label: isRTL ? 'ترجمة' : 'Translate', onClick: handleTranslate },
    ...(isSent ? [
      { icon: Edit2, label: t('chat.edit'), onClick: () => {} },
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
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-card rounded-xl p-2 min-w-[200px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick()
              onClose()
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              'hover:bg-secondary',
              isRTL && 'flex-row-reverse'
            )}
          >
            <action.icon className="h-5 w-5" />
            <span className={cn(isRTL && 'font-arabic')}>{action.label}</span>
          </button>
        ))}
        
        {/* Delete options */}
        <div className="border-t mt-1 pt-1">
          <button
            onClick={() => onDeleteForMe(message)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              'hover:bg-secondary text-muted-foreground',
              isRTL && 'flex-row-reverse'
            )}
          >
            <Trash2 className="h-5 w-5" />
            <span className={cn(isRTL && 'font-arabic')}>
              {isRTL ? 'حذف لي' : 'Delete for me'}
            </span>
          </button>
          
          {isSent && (
            <button
              onClick={() => onDeleteForEveryone(message)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                'hover:bg-destructive/10 text-destructive',
                isRTL && 'flex-row-reverse'
              )}
            >
              <Trash2 className="h-5 w-5" />
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
              : (isRTL ? 'سيتم حذف هذه الرسالة لك فقط' : 'This message will only be deleted for you')
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
