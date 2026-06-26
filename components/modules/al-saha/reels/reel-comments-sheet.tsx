'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Send, CornerUpLeft, BellRing } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserStore } from '@/lib/stores/user-store'
import { useAppStore } from '@/lib/stores/app-store'
import {
  useReelsStore,
  extractMentions,
  resolveMention,
  MENTION_USERS,
  type CommentThread,
  type ReelComment,
} from '@/lib/stores/reels-store'
import { cn } from '@/lib/utils'

interface ReelCommentsSheetProps {
  reelId: string | null
  onClose: () => void
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'الآن'
  if (m < 60) return `${m} د`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} س`
  return `${Math.floor(h / 24)} يوم`
}

// Render comment text, turning @mentions into tappable green links that
// navigate to the mentioned user's profile.
function CommentText({ text, onMention }: { text: string; onMention: (username: string) => void }) {
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g)
  return (
    <span className="font-arabic text-sm text-foreground/90 leading-relaxed">
      {parts.map((part, i) => {
        if (!part.startsWith('@')) return <React.Fragment key={i}>{part}</React.Fragment>
        const username = part.slice(1)
        const known = resolveMention(username)
        if (!known) {
          return (
            <span key={i} className="text-[#2D5A27] dark:text-[#7BB573] font-semibold">
              {part}
            </span>
          )
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onMention(username)}
            className="text-[#2D5A27] dark:text-[#7BB573] font-semibold hover:underline"
          >
            {part}
          </button>
        )
      })}
    </span>
  )
}

function CommentRow({
  comment,
  isReply,
  onReply,
  onMention,
}: {
  comment: ReelComment
  isReply?: boolean
  onReply: (c: ReelComment) => void
  onMention: (username: string) => void
}) {
  const toggleCommentLike = useReelsStore((s) => s.toggleCommentLike)
  return (
    <div className={cn('flex gap-2.5', isReply && 'ms-11')}>
      <Avatar className={cn('flex-shrink-0', isReply ? 'h-7 w-7' : 'h-9 w-9')}>
        <AvatarImage src={comment.authorAvatar} alt={comment.authorNameAr} />
        <AvatarFallback className="bg-[#2D5A27] text-white text-xs font-arabic">
          {comment.authorNameAr[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-arabic font-semibold text-sm">{comment.authorNameAr}</span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
        </div>
        <CommentText text={comment.text} onMention={onMention} />
        <button
          type="button"
          onClick={() => onReply(comment)}
          className="mt-1 flex items-center gap-1 text-[11px] font-arabic text-muted-foreground hover:text-foreground"
        >
          <CornerUpLeft className="h-3 w-3" />
          رد
        </button>
      </div>
      <button
        type="button"
        onClick={() => toggleCommentLike(comment.id)}
        className="flex flex-col items-center gap-0.5 self-start pt-1"
        aria-label="إعجاب بالتعليق"
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-colors',
            comment.likedByMe ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
          )}
        />
        {comment.likes > 0 && (
          <span className={cn('text-[10px]', comment.likedByMe ? 'text-red-500' : 'text-muted-foreground')}>
            {comment.likes}
          </span>
        )}
      </button>
    </div>
  )
}

export function ReelCommentsSheet({ reelId, onClose }: ReelCommentsSheetProps) {
  const { currentUser } = useUserStore()
  const openUserProfile = useAppStore((s) => s.openUserProfile)
  const getCommentThreads = useReelsStore((s) => s.getCommentThreads)
  const allComments = useReelsStore((s) => s.comments)
  const addComment = useReelsStore((s) => s.addComment)

  const [value, setValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // Mention dropdown state
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null)
  // Reply target (null = top-level comment)
  const [replyingTo, setReplyingTo] = React.useState<ReelComment | null>(null)
  // Transient confirmation toast after a mention notification is sent
  const [mentionToast, setMentionToast] = React.useState<string | null>(null)

  const threads = React.useMemo<CommentThread[]>(
    () => (reelId ? getCommentThreads(reelId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reelId, allComments],
  )

  const totalCount = React.useMemo(
    () => threads.reduce((acc, t) => acc + 1 + t.replies.length, 0),
    [threads],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setValue(text)
    const match = text.match(/@([a-zA-Z0-9_]*)$/)
    setMentionQuery(match ? match[1] : null)
  }

  const mentionResults = React.useMemo(() => {
    if (mentionQuery === null) return []
    const q = mentionQuery.toLowerCase()
    return MENTION_USERS.filter(
      (u) => u.username.toLowerCase().includes(q) || u.nameAr.includes(mentionQuery),
    ).slice(0, 5)
  }, [mentionQuery])

  const pickMention = (username: string) => {
    setValue((prev) => prev.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `))
    setMentionQuery(null)
    inputRef.current?.focus()
  }

  const startReply = (c: ReelComment) => {
    const username = MENTION_USERS.find((u) => u.id === c.authorId)?.username
    setReplyingTo(c)
    setValue(username ? `@${username} ` : '')
    setMentionQuery(null)
    inputRef.current?.focus()
  }

  const goToProfile = (username: string) => {
    const user = resolveMention(username)
    if (!user) return
    onClose()
    openUserProfile(user.id)
  }

  const submit = () => {
    if (!value.trim() || !reelId || !currentUser) return
    const mentions = extractMentions(value)
    addComment({
      reelId,
      parentId: replyingTo ? replyingTo.parentId ?? replyingTo.id : null,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorNameAr: currentUser.nameAr,
      authorAvatar: currentUser.avatar,
      text: value.trim(),
      mentions,
    })
    // Confirm that mentioned users were notified.
    const notified = mentions
      .map((m) => resolveMention(m))
      .filter((u) => u && u.id !== currentUser.id) as ReturnType<typeof resolveMention>[]
    if (notified.length > 0) {
      setMentionToast(`تم إشعار ${notified.map((u) => `@${u!.username}`).join('، ')}`)
      setTimeout(() => setMentionToast(null), 2600)
    }
    setValue('')
    setMentionQuery(null)
    setReplyingTo(null)
  }

  return (
    <AnimatePresence>
      {reelId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[130] bg-black/50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            dir="rtl"
            className="fixed inset-x-0 bottom-0 z-[131] h-[68vh] rounded-t-3xl bg-white dark:bg-card flex flex-col overflow-hidden"
          >
            {/* Handle + header */}
            <div className="flex-shrink-0 pt-2.5 pb-3 border-b border-border/60">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center justify-between px-4">
                <h3 className="font-bold font-arabic text-[#2D5A27] dark:text-primary">
                  التعليقات <span className="text-muted-foreground">({totalCount})</span>
                </h3>
                <button
                  onClick={onClose}
                  aria-label="إغلاق"
                  className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <p className="font-arabic font-bold">لا توجد تعليقات بعد</p>
                  <p className="font-arabic text-sm mt-1">كن أول من يعلّق</p>
                </div>
              ) : (
                threads.map((t) => (
                  <div key={t.id} className="space-y-3">
                    <CommentRow comment={t} onReply={startReply} onMention={goToProfile} />
                    {t.replies.map((r) => (
                      <CommentRow key={r.id} comment={r} isReply onReply={startReply} onMention={goToProfile} />
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Mention notification confirmation toast */}
            <AnimatePresence>
              {mentionToast && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex-shrink-0 mx-4 mb-1 flex items-center gap-2 rounded-xl bg-[#2D5A27]/10 px-3 py-2 text-[#2D5A27] dark:text-[#7BB573]"
                >
                  <BellRing className="h-4 w-4 flex-shrink-0" />
                  <span className="font-arabic text-xs font-semibold truncate">{mentionToast}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mention dropdown */}
            <AnimatePresence>
              {mentionResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex-shrink-0 border-t border-border/60 bg-secondary/40 max-h-44 overflow-y-auto"
                >
                  {mentionResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => pickMention(u.username)}
                      className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-secondary text-start"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar} alt={u.nameAr} />
                        <AvatarFallback className="bg-[#2D5A27] text-white text-xs font-arabic">
                          {u.nameAr[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-arabic text-sm font-semibold truncate">{u.nameAr}</p>
                        <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reply context bar */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-shrink-0 flex items-center justify-between px-4 py-1.5 bg-secondary/50 border-t border-border/60"
                >
                  <span className="font-arabic text-xs text-muted-foreground truncate">
                    الرد على <span className="font-semibold text-foreground">{replyingTo.authorNameAr}</span>
                  </span>
                  <button
                    onClick={() => {
                      setReplyingTo(null)
                      setValue('')
                    }}
                    aria-label="إلغاء الرد"
                    className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-border/60 p-3 flex items-center gap-2 bg-white dark:bg-card">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.nameAr} />
                <AvatarFallback className="bg-[#2D5A27] text-white text-xs font-arabic">
                  {currentUser?.nameAr?.[0] ?? 'ز'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center gap-2 bg-secondary rounded-full px-4 py-1.5">
                <input
                  ref={inputRef}
                  value={value}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder={replyingTo ? 'اكتب رداً...' : 'أضف تعليقاً... استخدم @ للإشارة'}
                  className="flex-1 bg-transparent outline-none text-sm font-arabic placeholder:text-muted-foreground"
                />
              </div>
              <button
                onClick={submit}
                disabled={!value.trim()}
                aria-label="إرسال"
                className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0',
                  value.trim() ? 'bg-[#2D5A27] text-white' : 'bg-secondary text-muted-foreground',
                )}
              >
                <Send className="h-4 w-4 -scale-x-100" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
