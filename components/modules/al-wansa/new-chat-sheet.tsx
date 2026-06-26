'use client'

import * as React from 'react'
import {
  MessageCircle,
  Users,
  Megaphone,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useChatStore, type Chat } from '@/lib/stores/chat-store'
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'

interface NewChatSheetProps {
  open: boolean
  onClose: () => void
}

type Mode = 'menu' | 'private' | 'group' | 'channel'

interface ContactOption {
  id: string
  name: string
  nameAr: string
  avatar: string
  isOnline?: boolean
}

// Build the contact pool from existing private chats so avatars/names stay consistent.
function useContacts(): ContactOption[] {
  const chats = useChatStore((s) => s.chats)
  return React.useMemo(
    () =>
      chats
        .filter((c) => c.type === 'private')
        .map((c) => ({
          id: c.id,
          name: c.name,
          nameAr: c.nameAr,
          avatar: c.avatar,
          isOnline: c.isOnline,
        })),
    [chats],
  )
}

export function NewChatSheet({ open, onClose }: NewChatSheetProps) {
  const { isRTL } = useLanguage()
  const { setActiveChatId, addChat } = useChatStore()
  const contacts = useContacts()

  const [mode, setMode] = React.useState<Mode>('menu')
  const [query, setQuery] = React.useState('')
  const [groupName, setGroupName] = React.useState('')
  const [selected, setSelected] = React.useState<string[]>([])
  const [channelMode, setChannelMode] = React.useState<'broadcast' | 'interactive'>('broadcast')

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight
  const BackArrow = isRTL ? ArrowRight : ArrowLeft

  // Reset internal state whenever the sheet is re-opened.
  React.useEffect(() => {
    if (open) {
      setMode('menu')
      setQuery('')
      setGroupName('')
      setSelected([])
      setChannelMode('broadcast')
    }
  }, [open])

  const filteredContacts = React.useMemo(() => {
    if (!query.trim()) return contacts
    const q = query.toLowerCase()
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.nameAr.includes(q),
    )
  }, [contacts, query])

  const startPrivateChat = (contactId: string) => {
    setActiveChatId(contactId)
    onClose()
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const createGroupOrChannel = () => {
    if (selected.length === 0) return
    const isChannel = mode === 'channel'
    const fallbackName = isChannel
      ? isRTL
        ? 'قناة جديدة'
        : 'New Channel'
      : isRTL
        ? 'مجموعة جديدة'
        : 'New Group'
    const name = groupName.trim() || fallbackName
    const participants = selected
      .map((id) => contacts.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({
        id: c!.id,
        name: c!.name,
        avatar: c!.avatar,
        role: 'member' as const,
        isOnline: c!.isOnline ?? false,
      }))

    const newChat: Chat = {
      id: `chat-${isChannel ? 'channel' : 'group'}-${Date.now()}`,
      type: isChannel ? 'channel' : 'group',
      ...(isChannel ? { channelMode } : {}),
      name,
      nameAr: name,
      avatar: '',
      lastMessage: isChannel
        ? isRTL
          ? 'تم إنشاء القناة'
          : 'Channel created'
        : isRTL
          ? 'تم إنشاء المجموعة'
          : 'Group created',
      lastMessageTime: new Date(),
      unreadCount: 0,
      admins: ['user-1'],
      participants,
    }
    addChat(newChat)
    setActiveChatId(newChat.id)
    onClose()
  }

  const menuOptions = [
    {
      id: 'private' as const,
      icon: MessageCircle,
      label: isRTL ? 'محادثة جديدة' : 'New Chat',
      desc: isRTL ? 'ابدأ ونسة مع شخص' : 'Start a chat with someone',
    },
    {
      id: 'group' as const,
      icon: Users,
      label: isRTL ? 'مجموعة جديدة' : 'New Group',
      desc: isRTL ? 'اجمع أصدقاءك في جنبة' : 'Bring friends together',
    },
    {
      id: 'channel' as const,
      icon: Megaphone,
      label: isRTL ? 'قناة جديدة' : 'New Channel',
      desc: isRTL ? 'انشر للجمهور' : 'Broadcast to an audience',
    },
  ]

  const title =
    mode === 'menu'
      ? isRTL
        ? 'بدء محادثة جديدة'
        : 'Start a new chat'
      : mode === 'private'
        ? isRTL
          ? 'اختر جهة اتصال'
          : 'Choose a contact'
        : mode === 'group'
          ? isRTL
            ? 'مجموعة جديدة'
            : 'New Group'
          : isRTL
            ? 'قناة جديدة'
            : 'New Channel'

  const isMultiSelect = mode === 'group' || mode === 'channel'

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh] rounded-t-3xl bg-[#FAF6EE] dark:bg-background">
        <DrawerHeader className="px-4 pb-2">
          <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            {mode !== 'menu' && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setMode('menu')}
                aria-label={isRTL ? 'رجوع' : 'Back'}
              >
                <BackArrow className="h-5 w-5" />
              </Button>
            )}
            <DrawerTitle
              className={cn(
                'flex-1 text-lg font-bold text-[#2D5A27] dark:text-foreground',
                mode === 'menu' ? 'text-center' : isRTL ? 'text-right' : 'text-left',
                isRTL && 'font-arabic',
              )}
            >
              {title}
            </DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6">
          {mode === 'menu' ? (
            <div className="space-y-2">
              {menuOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    onClick={() => setMode(opt.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl bg-white/70 p-3 text-start shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-card/60 dark:hover:bg-card',
                      isRTL && 'flex-row-reverse text-right',
                    )}
                  >
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#2D5A27]/10 text-[#2D5A27]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={cn(
                          'block font-bold text-[#2D5A27] dark:text-foreground',
                          isRTL && 'font-arabic',
                        )}
                      >
                        {opt.label}
                      </span>
                      <span
                        className={cn(
                          'block truncate text-sm text-muted-foreground',
                          isRTL && 'font-arabic',
                        )}
                      >
                        {opt.desc}
                      </span>
                    </span>
                    <ChevronIcon className="h-4 w-4 flex-shrink-0 text-[#C9A227]" />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {isMultiSelect && (
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={
                    mode === 'group'
                      ? isRTL
                        ? 'اسم المجموعة'
                        : 'Group name'
                      : isRTL
                        ? 'اسم القناة'
                        : 'Channel name'
                  }
                  className={cn(
                    'h-11 rounded-2xl border-[#2D5A27]/15 bg-white/70 dark:bg-card/60',
                    isRTL && 'text-right font-arabic',
                  )}
                />
              )}

              {/* Channel interaction mode selector */}
              {mode === 'channel' && (
                <div className="space-y-2">
                  <p className={cn('text-sm font-semibold text-[#2D5A27] dark:text-foreground', isRTL && 'font-arabic text-right')}>
                    {isRTL ? 'طريقة التفاعل' : 'Interaction mode'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      {
                        key: 'broadcast' as const,
                        label: isRTL ? 'بث فقط' : 'Broadcast',
                        desc: isRTL ? 'المشرف فقط ينشر' : 'Only admins post',
                      },
                      {
                        key: 'interactive' as const,
                        label: isRTL ? 'تفاعلي' : 'Interactive',
                        desc: isRTL ? 'الأعضاء يتفاعلون ويعلقون' : 'Members react & comment',
                      },
                    ]).map((opt) => {
                      const active = channelMode === opt.key
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setChannelMode(opt.key)}
                          className={cn(
                            'rounded-2xl border-2 p-3 text-start transition-colors',
                            active
                              ? 'border-[#2D5A27] bg-[#2D5A27]/10'
                              : 'border-transparent bg-white/70 dark:bg-card/60',
                            isRTL && 'text-right',
                          )}
                        >
                          <span className={cn('block font-bold text-[#2D5A27] dark:text-foreground', isRTL && 'font-arabic')}>
                            {opt.label}
                          </span>
                          <span className={cn('block text-xs text-muted-foreground', isRTL && 'font-arabic')}>
                            {opt.desc}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isRTL ? 'ابحث عن جهة اتصال...' : 'Search contacts...'}
                  className="h-11 rounded-2xl bg-white/70 ps-10 pe-4 dark:bg-card/60"
                />
              </div>

              <ScrollArea className="h-[45vh]">
                <div className="space-y-1 pe-1">
                  {filteredContacts.length === 0 ? (
                    <p
                      className={cn(
                        'py-10 text-center text-sm text-muted-foreground',
                        isRTL && 'font-arabic',
                      )}
                    >
                      {isRTL ? 'لا توجد جهات اتصال' : 'No contacts found'}
                    </p>
                  ) : (
                    filteredContacts.map((contact) => {
                      const isSelected = selected.includes(contact.id)
                      return (
                        <button
                          key={contact.id}
                          onClick={() =>
                            isMultiSelect
                              ? toggleSelect(contact.id)
                              : startPrivateChat(contact.id)
                          }
                          className={cn(
                            'flex w-full items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-white dark:hover:bg-card',
                            isSelected && 'bg-[#2D5A27]/10',
                            isRTL && 'flex-row-reverse',
                          )}
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={contact.avatar || '/placeholder.svg'} alt={contact.name} />
                              <AvatarFallback className="bg-[#2D5A27]/10 text-[#2D5A27]">
                                {(isRTL ? contact.nameAr : contact.name)[0]}
                              </AvatarFallback>
                            </Avatar>
                            {contact.isOnline && (
                              <span className="absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                            )}
                          </div>
                          <span
                            className={cn(
                              'flex-1 truncate font-semibold text-foreground',
                              isRTL ? 'text-right font-arabic' : 'text-left',
                            )}
                          >
                            {isRTL ? contact.nameAr : contact.name}
                          </span>
                          {isMultiSelect ? (
                            <span
                              className={cn(
                                'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                isSelected
                                  ? 'border-[#2D5A27] bg-[#2D5A27] text-white'
                                  : 'border-muted-foreground/30',
                              )}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5" />}
                            </span>
                          ) : (
                            <ChevronIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </ScrollArea>

              {isMultiSelect && (
                <Button
                  onClick={createGroupOrChannel}
                  disabled={selected.length === 0}
                  className={cn(
                    'h-12 w-full rounded-2xl bg-[#2D5A27] text-white hover:bg-[#2D5A27]/90',
                    isRTL && 'font-arabic',
                  )}
                >
                  {mode === 'group'
                    ? isRTL
                      ? `إنشاء المجموعة (${selected.length})`
                      : `Create Group (${selected.length})`
                    : isRTL
                      ? `إنشاء القناة (${selected.length})`
                      : `Create Channel (${selected.length})`}
                </Button>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
