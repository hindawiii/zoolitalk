'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { FeedTab } from './tabs/feed-tab'
import { TrendsTab } from './tabs/trends-tab'
import { RadarTab } from './tabs/radar-tab'
import { ReelsTab } from './reels/reels-tab'

type SegmentId = 'feed' | 'trends' | 'radar' | 'reels'

interface Segment {
  id: SegmentId
  label: string
}

const segments: Segment[] = [
  { id: 'feed', label: 'الساحة' },
  { id: 'trends', label: 'نبض الشارع' },
  { id: 'radar', label: 'الرادار' },
  { id: 'reels', label: 'Reels' },
]

export default function AlSaha() {
  const [activeSegment, setActiveSegment] = React.useState<SegmentId>('feed')

  const renderSegmentContent = () => {
    switch (activeSegment) {
      case 'feed':
        return <FeedTab />
      case 'trends':
        return <TrendsTab />
      case 'radar':
        return <RadarTab />
      case 'reels':
        return <ReelsTab />
      default:
        return <FeedTab />
    }
  }

  const activeIndex = segments.findIndex((s) => s.id === activeSegment)

  return (
    <div dir="rtl" className="flex flex-col h-full w-full bg-[#F5F5DC] dark:bg-background overflow-hidden">
      {/* Sticky Header - unified cream/green theme */}
      <div className="flex-shrink-0 bg-white/90 dark:bg-card/90 backdrop-blur-md border-b border-[#2D5A27]/15 shadow-sm">
        {/* Title Bar */}
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-xl font-bold text-[#2D5A27] dark:text-primary font-arabic">
            الساحة
          </h1>
        </div>

        {/* Segmented Control */}
        <div className="px-3 pb-2.5">
          <div className="relative flex bg-[#F5F5DC] dark:bg-secondary/40 rounded-xl p-1 border border-[#2D5A27]/10">
            {/* Active Tab Indicator - sliding green pill */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg bg-[#2D5A27] shadow-sm"
              style={{ width: `calc(${100 / segments.length}% - 6px)` }}
              animate={{
                right: `calc(${activeIndex} * (${100 / segments.length}%) + 3px)`,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />

            {/* Segment Buttons */}
            {segments.map((segment) => (
              <button
                key={segment.id}
                onClick={() => setActiveSegment(segment.id)}
                className={cn(
                  'relative z-10 flex-1 py-2 text-xs sm:text-sm font-bold font-arabic transition-colors duration-200 rounded-lg text-center',
                  activeSegment === segment.id
                    ? 'text-[#F5F0E1]'
                    : 'text-[#2D5A27]/60 dark:text-foreground/60 hover:text-[#2D5A27]'
                )}
              >
                {segment.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Segment Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSegment}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {renderSegmentContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
