'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmojiCategory {
  id: string
  label: string
  labelAr: string
  icon: string
  emojis: string[]
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'favorites',
    label: 'Favorites',
    labelAr: 'مفضلة',
    icon: '⭐',
    emojis: ['😊', '❤️', '😂', '👍', '🤲', '🙏', '🔥', '🇸🇩', '💚', '✨'],
  },
  {
    id: 'smileys',
    label: 'Smileys',
    labelAr: 'ابتسامات',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '😐',
      '😶', '😏', '😒', '🙄', '😬', '😴', '😪', '😷', '🤒', '🤕',
      '😢', '😭', '😤', '😠', '😡', '🤯', '😳', '🥵', '🥶', '😱',
    ],
  },
  {
    id: 'animals',
    label: 'Animals',
    labelAr: 'حيوانات',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦅', '🦆',
      '🦉', '🐝', '🦋', '🐌', '🐞', '🐢', '🐍', '🦎', '🐙', '🐠',
      '🐬', '🐳', '🐋', '🦈', '🐊', '🐫', '🦒', '🐘', '🦏', '🐪',
    ],
  },
  {
    id: 'food',
    label: 'Food',
    labelAr: 'طعام',
    icon: '🍎',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒',
      '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥕', '🌽',
      '🌶️', '🥔', '🍞', '🧀', '🥚', '🍗', '🍖', '🌭', '🍔', '🍟',
      '🍕', '🥙', '🌮', '🌯', '🍜', '🍲', '🍛', '🍚', '☕', '🍵',
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    labelAr: 'أنشطة',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
      '🥅', '🏒', '🏑', '🥍', '🏏', '⛳', '🏹', '🎣', '🥊', '🥋',
      '🎽', '🛹', '🛼', '🏆', '🏅', '🥇', '🥈', '🥉', '🎮', '🎲',
      '🎯', '🎳', '🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '🎧', '🎬',
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    labelAr: 'سفر',
    icon: '🚗',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '✈️', '🚀', '🚁', '⛵',
      '🚤', '🛳️', '⚓', '🏰', '🕌', '🕍', '⛪', '🗼', '🗽', '🌋',
      '🏔️', '🏕️', '🏖️', '🏝️', '🌴', '🌵', '☀️', '🌙', '⭐', '🌺',
    ],
  },
  {
    id: 'objects',
    label: 'Objects',
    labelAr: 'أشياء',
    icon: '💡',
    emojis: [
      '💡', '🔦', '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📸', '📹',
      '🎥', '📺', '📻', '⏰', '⌚', '📚', '📖', '✏️', '🖊️', '📝',
      '💼', '📁', '📌', '📎', '🔑', '🔒', '🔓', '🔔', '🔕', '💎',
      '💰', '💳', '🎁', '🎈', '🎀', '🏮', '🪔', '🕯️', '🧭', '⚙️',
    ],
  },
  {
    id: 'symbols',
    label: 'Symbols',
    labelAr: 'رموز',
    icon: '🏳️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️',
      '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✅', '❌', '⭕',
      '❗', '❓', '💯', '🔥', '✨', '⚡', '🌟', '💫', '☮️', '✝️',
      '☪️', '🕉️', '☸️', '🇸🇩', '🏳️', '🏴', '🚩', '🏁', '🎌', '🏳️‍🌈',
    ],
  },
]

interface EmojiPickerSheetProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  isRTL: boolean
}

export function EmojiPickerSheet({ onSelect, onClose, isRTL }: EmojiPickerSheetProps) {
  const [activeCategory, setActiveCategory] = React.useState('favorites')
  const [search, setSearch] = React.useState('')

  const allEmojis = React.useMemo(
    () => Array.from(new Set(EMOJI_CATEGORIES.flatMap((c) => c.emojis))),
    []
  )

  const isSearching = search.trim().length > 0
  const displayedEmojis = isSearching
    ? allEmojis
    : EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis ?? []

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="absolute bottom-[68px] inset-x-0 bg-card border-t border-border z-30 flex flex-col"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Search bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRTL ? 'ابحث عن إيموجي...' : 'Search emoji...'}
            className={cn(
              'w-full rounded-full bg-secondary/60 border-none py-2 ps-9 pe-3 text-sm outline-none focus:ring-2 focus:ring-primary/40',
              isRTL && 'font-arabic text-right'
            )}
          />
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          aria-label={isRTL ? 'إغلاق' : 'Close'}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-1 p-3 max-h-[200px] overflow-y-auto place-items-center">
        {displayedEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => onSelect(emoji)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl transition-transform hover:scale-125 hover:bg-secondary active:scale-95"
          >
            {emoji}
          </button>
        ))}
        {displayedEmojis.length === 0 && (
          <p className={cn('col-span-8 py-6 text-center text-sm text-muted-foreground', isRTL && 'font-arabic')}>
            {isRTL ? 'لا توجد نتائج' : 'No results'}
          </p>
        )}
      </div>

      {/* Category tabs */}
      {!isSearching && (
        <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              title={isRTL ? cat.labelAr : cat.label}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-colors',
                activeCategory === cat.id ? 'bg-secondary' : 'opacity-60 hover:opacity-100'
              )}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
