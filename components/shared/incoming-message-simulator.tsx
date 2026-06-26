'use client'

import * as React from 'react'
import { useChatStore, type Message } from '@/lib/stores/chat-store'

/**
 * Demo-only helper that simulates other people sending messages so the
 * notification toast, sound/vibration, unread badges and typing indicator can
 * be experienced without a real backend.
 *
 * It periodically picks a private chat the user is NOT currently viewing,
 * shows a typing indicator for a couple of seconds, then delivers a message
 * via the store's `receiveMessage` action.
 *
 * Renders nothing.
 */

const REPLIES = [
  'ياخي وينك من زمان؟',
  'سمعت الخبر؟',
  'الجبنة الليلة عندنا، لا تتأخر',
  'شفت رسالتي القبل داك؟',
  'كيف الأحوال يا زول؟',
  'تعال نتقابل بكرة إن شاء الله',
  'الله يديك العافية',
  'محتاج منك خدمة صغيرة',
  'الماتش بدأ، تعال بسرعة',
  'تسلم يا حبيبنا، وصلني الملف',
  'مشتاقين والله',
  'أها قول لي أخبارك شنو',
]

export function IncomingMessageSimulator() {
  React.useEffect(() => {
    let typingTimeout: number | undefined
    let messageTimeout: number | undefined

    const tick = () => {
      const { chats, activeChatId, setTyping, receiveMessage } = useChatStore.getState()

      // Eligible: private chats that aren't the one being viewed.
      const candidates = chats.filter(
        (c) => c.type === 'private' && c.id !== activeChatId && !c.isArchived
      )
      if (candidates.length === 0) return

      const chat = candidates[Math.floor(Math.random() * candidates.length)]
      const senderId = `peer-${chat.id}`

      // Show "typing..." first.
      setTyping(chat.id, senderId, true)

      typingTimeout = window.setTimeout(() => {
        const content = REPLIES[Math.floor(Math.random() * REPLIES.length)]
        const message: Message = {
          id: `msg-in-${Date.now()}`,
          chatId: chat.id,
          senderId,
          senderName: chat.nameAr || chat.name,
          senderAvatar: chat.avatar,
          content,
          type: 'text',
          timestamp: new Date(),
          status: 'delivered',
        }
        // receiveMessage clears the typing flag for this sender.
        receiveMessage(chat.id, message)
      }, 2500)
    }

    // Kick off the first simulated message a little after load, then repeat
    // on a randomized interval so it feels organic.
    const schedule = () => {
      const delay = 18000 + Math.random() * 22000 // 18s – 40s
      messageTimeout = window.setTimeout(() => {
        tick()
        schedule()
      }, delay)
    }

    schedule()

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout)
      if (messageTimeout) clearTimeout(messageTimeout)
    }
  }, [])

  return null
}
