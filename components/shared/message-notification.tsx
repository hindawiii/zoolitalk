'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useChatStore } from '@/lib/stores/chat-store'
import { useAppStore } from '@/lib/stores/app-store'
import { useLanguage } from '@/components/providers/language-provider'
import { playNotificationSound, vibrateDevice } from '@/lib/notification-feedback'
import { cn } from '@/lib/utils'

/**
 * Global, app-wide toast that appears at the bottom of the screen whenever a
 * new message arrives while the user is outside that conversation. It plays a
 * short sound, vibrates the device, shows the sender + preview, auto-dismisses
 * after 4 seconds, and opens the chat when tapped.
 */
export function MessageNotification() {
  const { notification, clearNotification, setActiveChatId, markChatRead } = useChatStore()
  const { setActiveTab } = useAppStore()
  const { isRTL } = useLanguage()

  const timerRef = React.useRef<number | null>(null)

  // Play sound + vibration whenever a new notification appears, then start the
  // auto-dismiss countdown.
  React.useEffect(() => {
    if (!notification) return

    playNotificationSound()
    vibrateDevice()

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      clearNotification()
    }, 4000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [notification, clearNotification])

  const handleOpen = () => {
    if (!notification) return
    setActiveTab('wansa')
    setActiveChatId(notification.chatId)
    markChatRead(notification.chatId)
    clearNotification()
  }

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          className="fixed inset-x-0 bottom-20 z-[120] flex justify-center px-4"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <button
            type="button"
            onClick={handleOpen}
            className={cn(
              'flex w-full max-w-md items-center gap-3 rounded-2xl border border-border/60 bg-card/95 p-3 text-start shadow-lg backdrop-blur-xl',
              'transition-transform active:scale-[0.98]',
              isRTL && 'flex-row-reverse text-right'
            )}
          >
            <Avatar className="h-11 w-11 flex-shrink-0">
              <AvatarImage src={notification.senderAvatar || '/placeholder.svg'} alt={notification.senderName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {notification.senderName?.[0] || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm font-semibold text-foreground', isRTL && 'font-arabic')}>
                {notification.senderName}
              </p>
              <p className={cn('truncate text-sm text-muted-foreground', isRTL && 'font-arabic')}>
                {notification.preview}
              </p>
            </div>

            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                clearNotification()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  clearNotification()
                }
              }}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
              aria-label={isRTL ? 'إغلاق' : 'Dismiss'}
            >
              <X className="h-4 w-4" />
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
