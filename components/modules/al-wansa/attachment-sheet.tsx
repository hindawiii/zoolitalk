'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ImageIcon, Camera, FileText, MapPin, User, Mic, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AttachmentAction = 'gallery' | 'camera' | 'document' | 'location' | 'contact' | 'audio'

interface AttachmentItem {
  action: AttachmentAction
  label: string
  labelAr: string
  icon: LucideIcon
  color: string
}

const ATTACHMENT_ITEMS: AttachmentItem[] = [
  { action: 'gallery', label: 'Gallery', labelAr: 'معرض', icon: ImageIcon, color: 'bg-green-500' },
  { action: 'camera', label: 'Camera', labelAr: 'كاميرا', icon: Camera, color: 'bg-blue-500' },
  { action: 'document', label: 'Document', labelAr: 'مستند', icon: FileText, color: 'bg-violet-500' },
  { action: 'location', label: 'Location', labelAr: 'موقع', icon: MapPin, color: 'bg-orange-500' },
  { action: 'contact', label: 'Contact', labelAr: 'جهة اتصال', icon: User, color: 'bg-amber-400' },
  { action: 'audio', label: 'Audio', labelAr: 'صوت', icon: Mic, color: 'bg-red-500' },
]

interface AttachmentSheetProps {
  onSelect: (action: AttachmentAction) => void
  onClose: () => void
  isRTL: boolean
}

export function AttachmentSheet({ onSelect, onClose, isRTL }: AttachmentSheetProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="absolute bottom-0 inset-x-0 rounded-t-3xl bg-card p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-muted-foreground/30" />
        <div className="grid grid-cols-3 gap-y-6 gap-x-4">
          {ATTACHMENT_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.action}
                onClick={() => onSelect(item.action)}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full text-white shadow-sm transition-transform active:scale-90',
                    item.color
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className={cn('text-xs text-foreground', isRTL && 'font-arabic')}>
                  {isRTL ? item.labelAr : item.label}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
