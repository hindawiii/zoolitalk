'use client'

import * as React from 'react'
import { useChatStore } from '@/lib/stores/chat-store'
import { useUserStore } from '@/lib/stores/user-store'
import {
  subscribeToUsers,
  subscribeToChats,
  subscribeToMessages,
  subscribeToTyping,
  setPresence,
} from '@/lib/firebase/chat'

/**
 * Headless component that keeps the chat store in sync with Firestore:
 * - user directory + presence
 * - the current user's conversations (real-time)
 * - the active conversation's messages + typing indicators
 * - the current user's own online presence (heartbeat)
 *
 * Mounted once inside the authenticated app shell.
 */
export function ChatSync() {
  const currentUserId = useUserStore((s) => s.currentUser?.id)
  const activeChatId = useChatStore((s) => s.activeChatId)

  const setUsersDirectory = useChatStore((s) => s.setUsersDirectory)
  const setPresenceMap = useChatStore((s) => s.setPresence)
  const setChats = useChatStore((s) => s.setChats)
  const setMessagesForChat = useChatStore((s) => s.setMessagesForChat)
  const setTypingForChat = useChatStore((s) => s.setTypingForChat)
  const pushNotification = useChatStore((s) => s.pushNotification)
  const resetChats = useChatStore((s) => s.resetChats)

  // Tracks previous unread counts to detect incoming messages for toasts.
  const prevUnreadRef = React.useRef<Record<string, number>>({})

  /* ------------------------- users directory + presence ------------------- */
  React.useEffect(() => {
    if (!currentUserId) return
    const unsub = subscribeToUsers((users) => {
      const presence: Record<string, boolean> = {}
      for (const u of users) presence[u.id] = u.isOnline
      setUsersDirectory(users)
      setPresenceMap(presence)

      // Refresh online state on already-mapped chats when presence changes.
      const { chats } = useChatStore.getState()
      if (chats.length > 0) {
        setChats(
          chats.map((c) => {
            const participants = (c.participants || []).map((p) => ({
              ...p,
              isOnline: Boolean(presence[p.id]),
            }))
            let isOnline = c.isOnline
            if (c.type === 'private') {
              const other = participants.find((p) => p.id !== currentUserId)
              isOnline = other ? Boolean(presence[other.id]) : false
            }
            return { ...c, participants, isOnline }
          }),
        )
      }
    })
    return unsub
  }, [currentUserId, setUsersDirectory, setPresenceMap, setChats])

  /* ------------------------------- my chats ------------------------------- */
  React.useEffect(() => {
    if (!currentUserId) return
    const unsub = subscribeToChats(
      currentUserId,
      () => useChatStore.getState().presence,
      (chats) => {
        // Detect incoming messages -> notification toast.
        const prev = prevUnreadRef.current
        const next: Record<string, number> = {}
        const { activeChatId: active } = useChatStore.getState()
        for (const c of chats) {
          next[c.id] = c.unreadCount
          const before = prev[c.id] ?? 0
          if (
            c.unreadCount > before &&
            c.id !== active &&
            !c.isMuted
          ) {
            pushNotification({
              id: `notif-${Date.now()}-${c.id}`,
              chatId: c.id,
              senderName: c.nameAr || c.name,
              senderAvatar: c.avatar,
              preview: c.lastMessage,
            })
          }
        }
        prevUnreadRef.current = next
        setChats(chats)
      },
    )
    return unsub
  }, [currentUserId, setChats, pushNotification])

  /* --------------------------- active chat stream ------------------------- */
  React.useEffect(() => {
    if (!activeChatId) return
    const unsubMsgs = subscribeToMessages(activeChatId, (messages) => {
      setMessagesForChat(activeChatId, messages)
    })
    const unsubTyping = subscribeToTyping(activeChatId, (ids) => {
      setTypingForChat(activeChatId, ids)
    })
    return () => {
      unsubMsgs()
      unsubTyping()
    }
  }, [activeChatId, setMessagesForChat, setTypingForChat])

  /* -------------------------------- presence ------------------------------ */
  React.useEffect(() => {
    if (!currentUserId) return

    setPresence(currentUserId, true)
    const heartbeat = window.setInterval(() => {
      setPresence(currentUserId, true)
    }, 30_000)

    const handleVisibility = () => {
      setPresence(currentUserId, document.visibilityState === 'visible')
    }
    const handleUnload = () => {
      setPresence(currentUserId, false)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      window.clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleUnload)
      setPresence(currentUserId, false)
    }
  }, [currentUserId])

  /* ------------------------------- sign-out ------------------------------- */
  // Clear cached chat data when the user signs out.
  React.useEffect(() => {
    if (!currentUserId) {
      resetChats()
      prevUnreadRef.current = {}
    }
  }, [currentUserId, resetChats])

  return null
}
