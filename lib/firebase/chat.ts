'use client'

/**
 * Firestore-backed chat service.
 *
 * Data model
 * ----------
 * users/{uid}                              -> profile + presence (isOnline, lastSeen)
 * chats/{chatId}                           -> conversation metadata
 * chats/{chatId}/messages/{messageId}      -> messages
 *
 * Chat document shape:
 *   type: 'private' | 'group' | 'channel'
 *   channelMode?: 'broadcast' | 'interactive'
 *   participantIds: string[]                       (used for the "my chats" query)
 *   participantsInfo: { [uid]: { name, avatar, role } }
 *   name, nameAr, avatar                            (groups/channels; private resolves client-side)
 *   admins: string[]
 *   mutedUsers: string[]                            (group admin muting)
 *   lastMessage: string
 *   lastMessageTime: Timestamp
 *   lastSenderId: string
 *   unread: { [uid]: number }
 *   archivedBy / mutedBy / pinnedBy: string[]       (per-user flags)
 *   createdAt: Timestamp
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteField,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  Timestamp,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore'
import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, isFirestoreAvailable } from '@/lib/firebase/config'
import type { Chat, Message, UserLite } from '@/lib/stores/chat-store'

/* --------------------------------- helpers -------------------------------- */

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date()
}

/** Deterministic id for a private chat so both participants resolve the same doc. */
export function privateChatId(a: string, b: string): string {
  return `dm_${[a, b].sort().join('_')}`
}

/** Remove keys with `undefined` values — Firestore rejects them. */
function clean<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as T
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k as keyof T] = v as T[keyof T]
  }
  return out
}

/* ------------------------------- users list ------------------------------- */

/** Live directory of registered users (used for the presence map + new chat). */
export function subscribeToUsers(cb: (users: UserLite[]) => void): Unsubscribe {
  if (!isFirestoreAvailable() || !db) {
    cb([])
    return () => {}
  }
  const q = query(collection(db, 'users'))
  return onSnapshot(
    q,
    (snap) => {
      const users: UserLite[] = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          name: data.name || data.nameAr || 'زول',
          nameAr: data.nameAr || data.name || 'زول',
          avatar: data.avatar || '',
          isOnline: Boolean(data.isOnline),
          lastSeen: data.lastSeen ? toDate(data.lastSeen) : null,
        }
      })
      cb(users)
    },
    (err) => console.error('[v0] subscribeToUsers error:', err),
  )
}

/* -------------------------------- presence -------------------------------- */

export async function setPresence(userId: string, isOnline: boolean): Promise<void> {
  if (!isFirestoreAvailable() || !db || !userId) return
  try {
    await setDoc(
      doc(db, 'users', userId),
      { isOnline, lastSeen: serverTimestamp() },
      { merge: true },
    )
  } catch (err) {
    console.error('[v0] setPresence error:', err)
  }
}

/* ------------------------------ chat mapping ------------------------------ */

/**
 * Map a raw Firestore chat document into the client `Chat` shape, resolving the
 * display name / avatar / online-state for private chats from the *other*
 * participant using the presence map.
 */
export function mapChatDoc(
  id: string,
  data: DocumentData,
  currentUserId: string,
  presence: Record<string, boolean>,
): Chat {
  const participantIds: string[] = data.participantIds || []
  const info: Record<string, { name?: string; avatar?: string; role?: string }> =
    data.participantsInfo || {}

  let name = data.name || ''
  let nameAr = data.nameAr || ''
  let avatar = data.avatar || ''
  let isOnline = false

  if (data.type === 'private') {
    const otherId = participantIds.find((p) => p !== currentUserId) || ''
    const other = info[otherId] || {}
    name = other.name || 'زول'
    nameAr = other.name || 'زول'
    avatar = other.avatar || ''
    isOnline = Boolean(presence[otherId])
  }

  const participants = participantIds.map((pid) => ({
    id: pid,
    name: info[pid]?.name || 'زول',
    avatar: info[pid]?.avatar || '',
    role: (info[pid]?.role as 'admin' | 'moderator' | 'member') || 'member',
    isOnline: Boolean(presence[pid]),
  }))

  return {
    id,
    type: data.type || 'private',
    channelMode: data.channelMode,
    name,
    nameAr,
    avatar,
    lastMessage: data.lastMessage || '',
    lastMessageTime: toDate(data.lastMessageTime),
    unreadCount: (data.unread && data.unread[currentUserId]) || 0,
    isOnline,
    participants,
    admins: data.admins || [],
    mutedUsers: data.mutedUsers || [],
    isArchived: (data.archivedBy || []).includes(currentUserId),
    isMuted: (data.mutedBy || []).includes(currentUserId),
    isPinned: (data.pinnedBy || []).includes(currentUserId),
    isBlocked: (data.blockedBy || []).includes(currentUserId),
  }
}

/** Subscribe to all chats the user participates in. */
export function subscribeToChats(
  currentUserId: string,
  presenceRef: () => Record<string, boolean>,
  cb: (chats: Chat[]) => void,
): Unsubscribe {
  if (!isFirestoreAvailable() || !db || !currentUserId) {
    cb([])
    return () => {}
  }
  const q = query(
    collection(db, 'chats'),
    where('participantIds', 'array-contains', currentUserId),
  )
  return onSnapshot(
    q,
    (snap) => {
      const chats = snap.docs.map((d) =>
        mapChatDoc(d.id, d.data(), currentUserId, presenceRef()),
      )
      cb(chats)
    },
    (err) => console.error('[v0] subscribeToChats error:', err),
  )
}

/* ------------------------------ message mapping --------------------------- */

function mapMessageDoc(id: string, data: DocumentData): Message {
  return {
    id,
    chatId: data.chatId,
    senderId: data.senderId,
    senderName: data.senderName || '',
    senderAvatar: data.senderAvatar || '',
    content: data.content || '',
    type: data.type || 'text',
    systemEvent: data.systemEvent,
    voiceDuration: data.voiceDuration,
    voiceUrl: data.voiceUrl,
    imageUrl: data.imageUrl,
    stickerUrl: data.stickerUrl,
    videoUrl: data.videoUrl,
    videoThumbnail: data.videoThumbnail,
    videoDuration: data.videoDuration,
    documentName: data.documentName,
    documentType: data.documentType,
    documentSize: data.documentSize,
    location: data.location
      ? { ...data.location, expiresAt: data.location.expiresAt ? toDate(data.location.expiresAt) : undefined }
      : undefined,
    timestamp: toDate(data.timestamp),
    status: data.status || 'sent',
    replyTo: data.replyTo,
    isEdited: data.isEdited,
    deletedForEveryone: data.deletedForEveryone,
    deletedFor: data.deletedFor || [],
    translatedContent: data.translatedContent,
    originalLanguage: data.originalLanguage,
    reactions: data.reactions || {},
    comments: (data.comments || []).map((c: DocumentData) => ({
      ...c,
      timestamp: toDate(c.timestamp),
    })),
    readBy: data.readBy || [],
  }
}

/** Subscribe to the latest messages of a chat (oldest -> newest). */
export function subscribeToMessages(
  chatId: string,
  cb: (messages: Message[]) => void,
  max = 200,
): Unsubscribe {
  if (!isFirestoreAvailable() || !db || !chatId) {
    cb([])
    return () => {}
  }
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(max),
  )
  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs
        .map((d) => mapMessageDoc(d.id, d.data()))
        .reverse() // back to chronological order
      cb(messages)
    },
    (err) => console.error('[v0] subscribeToMessages error:', err),
  )
}

/* ------------------------------ typing state ------------------------------ */

export async function setTyping(
  chatId: string,
  userId: string,
  isTyping: boolean,
): Promise<void> {
  if (!isFirestoreAvailable() || !db || !chatId || !userId) return
  try {
    const tRef = doc(db, 'chats', chatId, 'typing', userId)
    if (isTyping) {
      await setDoc(tRef, { at: serverTimestamp() })
    } else {
      await setDoc(tRef, { at: null })
    }
  } catch (err) {
    console.error('[v0] setTyping error:', err)
  }
}

export function subscribeToTyping(
  chatId: string,
  cb: (userIds: string[]) => void,
): Unsubscribe {
  if (!isFirestoreAvailable() || !db || !chatId) {
    cb([])
    return () => {}
  }
  return onSnapshot(
    collection(db, 'chats', chatId, 'typing'),
    (snap) => {
      const now = Date.now()
      const ids = snap.docs
        .filter((d) => {
          const at = d.data().at
          if (!at) return false
          const t = at instanceof Timestamp ? at.toMillis() : 0
          return now - t < 8000 // consider typing "fresh" for 8s
        })
        .map((d) => d.id)
      cb(ids)
    },
    (err) => console.error('[v0] subscribeToTyping error:', err),
  )
}

/* --------------------------- create conversations ------------------------- */

/** Ensure a private (1:1) chat exists between two users; returns its id. */
export async function createOrGetPrivateChat(
  me: UserLite,
  other: UserLite,
): Promise<string> {
  if (!isFirestoreAvailable() || !db) throw new Error('firestore/unavailable')
  const id = privateChatId(me.id, other.id)
  const chatRef = doc(db, 'chats', id)
  const snap = await getDoc(chatRef)
  if (!snap.exists()) {
    await setDoc(chatRef, {
      type: 'private',
      participantIds: [me.id, other.id],
      participantsInfo: {
        [me.id]: { name: me.name, avatar: me.avatar, role: 'member' },
        [other.id]: { name: other.name, avatar: other.avatar, role: 'member' },
      },
      admins: [],
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      lastSenderId: '',
      unread: { [me.id]: 0, [other.id]: 0 },
      archivedBy: [],
      mutedBy: [],
      pinnedBy: [],
      blockedBy: [],
      createdAt: serverTimestamp(),
    })
  }
  return id
}

/** Create a group or channel with the given members. */
export async function createGroupOrChannel(params: {
  type: 'group' | 'channel'
  channelMode?: 'broadcast' | 'interactive'
  name: string
  creator: UserLite
  members: UserLite[]
}): Promise<string> {
  if (!isFirestoreAvailable() || !db) throw new Error('firestore/unavailable')
  const { type, channelMode, name, creator, members } = params
  const all = [creator, ...members.filter((m) => m.id !== creator.id)]
  const participantsInfo: Record<string, { name: string; avatar: string; role: string }> = {}
  for (const u of all) {
    participantsInfo[u.id] = {
      name: u.name,
      avatar: u.avatar,
      role: u.id === creator.id ? 'admin' : 'member',
    }
  }
  const unread: Record<string, number> = {}
  for (const u of all) unread[u.id] = 0

  const chatRef = await addDoc(collection(db, 'chats'), clean({
    type,
    channelMode: type === 'channel' ? channelMode || 'broadcast' : undefined,
    name,
    nameAr: name,
    avatar: '',
    participantIds: all.map((u) => u.id),
    participantsInfo,
    admins: [creator.id],
    mutedUsers: [],
    lastMessage: type === 'channel' ? 'تم إنشاء القناة' : 'تم إنشاء المجموعة',
    lastMessageTime: serverTimestamp(),
    lastSenderId: creator.id,
    unread,
    archivedBy: [],
    mutedBy: [],
    pinnedBy: [],
    blockedBy: [],
    createdAt: serverTimestamp(),
  }))

  // Opening system message
  await addDoc(collection(db, 'chats', chatRef.id, 'messages'), clean({
    chatId: chatRef.id,
    senderId: 'system',
    senderName: '',
    senderAvatar: '',
    content:
      type === 'channel'
        ? `أنشأ ${creator.name} القناة "${name}"`
        : `أنشأ ${creator.name} المجموعة "${name}"`,
    type: 'system',
    systemEvent: 'create',
    timestamp: serverTimestamp(),
    status: 'sent',
    readBy: [creator.id],
  }))

  return chatRef.id
}

/* --------------------------------- media ---------------------------------- */

/** Upload a data: URL (e.g. a compressed image) and return a download URL. */
export async function uploadDataUrl(path: string, dataUrl: string): Promise<string> {
  if (!storage) throw new Error('storage/unavailable')
  const storageRef = ref(storage, path)
  await uploadString(storageRef, dataUrl, 'data_url')
  return getDownloadURL(storageRef)
}

/** Upload a blob (e.g. a recorded voice note) and return a download URL. */
export async function uploadBlob(path: string, blob: Blob): Promise<string> {
  if (!storage) throw new Error('storage/unavailable')
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob)
  return getDownloadURL(storageRef)
}

/* -------------------------------- messages -------------------------------- */

/**
 * Persist a message to Firestore. Media (data:/blob: URLs) is uploaded to
 * Firebase Storage first so it syncs across devices. Uses the provided
 * client id as the document id so optimistic UI updates reconcile cleanly.
 */
export async function sendMessage(chat: Chat, message: Message): Promise<void> {
  if (!isFirestoreAvailable() || !db) throw new Error('firestore/unavailable')
  const chatId = chat.id

  let imageUrl = message.imageUrl
  let voiceUrl = message.voiceUrl

  // Upload image if it's an inline data URL.
  if (imageUrl && imageUrl.startsWith('data:')) {
    imageUrl = await uploadDataUrl(`chats/${chatId}/${message.id}-image`, imageUrl)
  }
  // Upload voice note if it's a local blob URL.
  if (voiceUrl && voiceUrl.startsWith('blob:')) {
    const blob = await (await fetch(voiceUrl)).blob()
    voiceUrl = await uploadBlob(`chats/${chatId}/${message.id}-voice.webm`, blob)
  }

  const msgRef = doc(db, 'chats', chatId, 'messages', message.id)
  await setDoc(msgRef, clean({
    chatId,
    senderId: message.senderId,
    senderName: message.senderName,
    senderAvatar: message.senderAvatar,
    content: message.content || '',
    type: message.type,
    systemEvent: message.systemEvent,
    voiceDuration: message.voiceDuration,
    voiceUrl,
    imageUrl,
    stickerUrl: message.stickerUrl,
    videoUrl: message.videoUrl,
    videoThumbnail: message.videoThumbnail,
    videoDuration: message.videoDuration,
    documentName: message.documentName,
    documentType: message.documentType,
    documentSize: message.documentSize,
    location: message.location
      ? clean({
          lat: message.location.lat,
          lng: message.location.lng,
          isLive: message.location.isLive,
          duration: message.location.duration,
          expiresAt: message.location.expiresAt
            ? Timestamp.fromDate(new Date(message.location.expiresAt))
            : undefined,
        })
      : undefined,
    timestamp: serverTimestamp(),
    status: 'sent',
    replyTo: message.replyTo,
    reactions: {},
    readBy: [message.senderId],
  }))

  // Update the parent chat's last-message + bump unread for everyone else.
  const preview =
    message.content ||
    (message.type === 'location'
      ? '📍 موقع'
      : message.type === 'voice'
        ? '🎤 رسالة صوتية'
        : message.type === 'image'
          ? '📷 صورة'
          : message.type === 'document'
            ? '📄 مستند'
            : 'رسالة جديدة')

  const others = (chat.participants || [])
    .map((p) => p.id)
    .filter((pid) => pid && pid !== message.senderId)

  const unreadUpdates: Record<string, unknown> = {}
  for (const pid of others) unreadUpdates[`unread.${pid}`] = increment(1)

  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: preview,
    lastMessageTime: serverTimestamp(),
    lastSenderId: message.senderId,
    [`unread.${message.senderId}`]: 0,
    ...unreadUpdates,
  })
}

export async function markChatRead(chatId: string, userId: string): Promise<void> {
  if (!isFirestoreAvailable() || !db || !chatId || !userId) return
  try {
    await updateDoc(doc(db, 'chats', chatId), { [`unread.${userId}`]: 0 })
  } catch (err) {
    console.error('[v0] markChatRead error:', err)
  }
}

export async function editMessage(
  chatId: string,
  messageId: string,
  newContent: string,
): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    content: newContent,
    isEdited: true,
  })
}

export async function deleteMessageForEveryone(
  chatId: string,
  messageId: string,
): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    deletedForEveryone: true,
    content: '',
    imageUrl: deleteField(),
    voiceUrl: deleteField(),
  })
}

export async function deleteMessageForMe(
  chatId: string,
  messageId: string,
  userId: string,
): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    deletedFor: arrayUnion(userId),
  })
}

export async function toggleReaction(
  chatId: string,
  messageId: string,
  emoji: string,
  userId: string,
  currentlyReacted: boolean,
): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    [`reactions.${emoji}`]: currentlyReacted ? arrayRemove(userId) : arrayUnion(userId),
  })
}

export async function addChannelComment(
  chatId: string,
  messageId: string,
  comment: { id: string; userId: string; userName: string; userAvatar: string; content: string },
): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    comments: arrayUnion({ ...comment, timestamp: Timestamp.now() }),
  })
}

export async function markMessageRead(
  chatId: string,
  messageId: string,
  userId: string,
): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  try {
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      readBy: arrayUnion(userId),
      status: 'read',
    })
  } catch {
    /* ignore */
  }
}

/* -------------------------- per-user chat flags --------------------------- */

async function toggleArrayFlag(
  chatId: string,
  field: string,
  userId: string,
  add: boolean,
): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  await updateDoc(doc(db, 'chats', chatId), {
    [field]: add ? arrayUnion(userId) : arrayRemove(userId),
  })
}

export const archiveChat = (chatId: string, userId: string) =>
  toggleArrayFlag(chatId, 'archivedBy', userId, true)
export const unarchiveChat = (chatId: string, userId: string) =>
  toggleArrayFlag(chatId, 'archivedBy', userId, false)
export const muteChat = (chatId: string, userId: string) =>
  toggleArrayFlag(chatId, 'mutedBy', userId, true)
export const unmuteChat = (chatId: string, userId: string) =>
  toggleArrayFlag(chatId, 'mutedBy', userId, false)
export const pinChat = (chatId: string, userId: string) =>
  toggleArrayFlag(chatId, 'pinnedBy', userId, true)
export const unpinChat = (chatId: string, userId: string) =>
  toggleArrayFlag(chatId, 'pinnedBy', userId, false)
export const blockChat = (chatId: string, userId: string) =>
  toggleArrayFlag(chatId, 'blockedBy', userId, true)
export const unblockChat = (chatId: string, userId: string) =>
  toggleArrayFlag(chatId, 'blockedBy', userId, false)

/** Remove all messages of a chat (clear conversation). */
export async function clearChat(chatId: string): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  const msgs = await getDocs(collection(db, 'chats', chatId, 'messages'))
  const batch = writeBatch(db)
  msgs.forEach((m) => batch.delete(m.ref))
  batch.update(doc(db, 'chats', chatId), { lastMessage: '' })
  await batch.commit()
}

/* --------------------------- group admin actions -------------------------- */

export async function muteUser(chatId: string, userId: string): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  await updateDoc(doc(db, 'chats', chatId), { mutedUsers: arrayUnion(userId) })
}
export async function unmuteUser(chatId: string, userId: string): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  await updateDoc(doc(db, 'chats', chatId), { mutedUsers: arrayRemove(userId) })
}
export async function kickUser(chatId: string, userId: string): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  await updateDoc(doc(db, 'chats', chatId), {
    participantIds: arrayRemove(userId),
    [`participantsInfo.${userId}`]: deleteField(),
    [`unread.${userId}`]: deleteField(),
  })
}
export async function promoteUser(
  chatId: string,
  userId: string,
  role: 'admin' | 'moderator',
): Promise<void> {
  if (!isFirestoreAvailable() || !db) return
  await updateDoc(doc(db, 'chats', chatId), {
    [`participantsInfo.${userId}.role`]: role,
    ...(role === 'admin' ? { admins: arrayUnion(userId) } : {}),
  })
}
