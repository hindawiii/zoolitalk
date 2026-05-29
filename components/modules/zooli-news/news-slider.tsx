'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Globe, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'

interface NewsArticle {
  id: string
  title: string
  titleAr: string
  summary: string
  summaryAr: string
  content: string
  contentAr: string
  image: string
  source: string
  sourceAr: string
  url: string
  category: string
  publishedAt: Date
}

interface NewsSliderProps {
  news: NewsArticle[]
  categoryConfig: Record<string, { labelEn: string; labelAr: string }>
  onArticleClick: (article: NewsArticle) => void
  onViewAll: () => void
  formatTimeAgo: (date: Date) => string
}

export function NewsSlider({ 
  news, 
  categoryConfig, 
  onArticleClick, 
  onViewAll,
  formatTimeAgo 
}: NewsSliderProps) {
  const { isRTL } = useLanguage()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollStart, setCanScrollStart] = React.useState(false)
  const [canScrollEnd, setCanScrollEnd] = React.useState(true)
  
  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    
    if (isRTL) {
      setCanScrollEnd(scrollLeft < 0)
      setCanScrollStart(Math.abs(scrollLeft) < scrollWidth - clientWidth - 10)
    } else {
      setCanScrollStart(scrollLeft > 10)
      setCanScrollEnd(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }
  
  const scroll = (direction: 'start' | 'end') => {
    if (!scrollRef.current) return
    const scrollAmount = 200
    const scrollDirection = direction === 'end' ? 1 : -1
    const rtlMultiplier = isRTL ? -1 : 1
    
    scrollRef.current.scrollBy({
      left: scrollAmount * scrollDirection * rtlMultiplier,
      behavior: 'smooth',
    })
  }
  
  React.useEffect(() => {
    checkScroll()
    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener('scroll', checkScroll)
      return () => ref.removeEventListener('scroll', checkScroll)
    }
  }, [isRTL])
  
  if (news.length === 0) return null
  
  return (
    <div className="relative w-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-3 sm:px-4 mb-3',
        isRTL ? 'font-arabic' : ''
      )}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <h2 className="font-semibold text-sm sm:text-base text-foreground">
            {isRTL ? 'آخر الأخبار' : 'Latest News'}
          </h2>
        </div>
        
        <button 
          onClick={onViewAll}
          className="text-xs sm:text-sm text-primary font-medium flex items-center gap-1 hover:underline"
        >
          {isRTL ? 'عرض الكل' : 'View All'}
          {isRTL ? <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
      </div>
      
      {/* Scroll buttons */}
      {canScrollStart && (
        <button
          onClick={() => scroll('start')}
          className={cn(
            'absolute top-1/2 mt-4 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center hover:bg-background transition-colors',
            isRTL ? 'right-0.5 sm:right-1' : 'left-0.5 sm:left-1'
          )}
        >
          {isRTL ? <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
      )}
      
      {canScrollEnd && (
        <button
          onClick={() => scroll('end')}
          className={cn(
            'absolute top-1/2 mt-4 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center hover:bg-background transition-colors',
            isRTL ? 'left-0.5 sm:left-1' : 'right-0.5 sm:right-1'
          )}
        >
          {isRTL ? <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
      )}
      
      {/* Slider */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide ps-3 pe-3 sm:ps-4 sm:pe-4 pb-2"
      >
        {news.map((article, index) => (
          <NewsCard
            key={article.id}
            article={article}
            index={index}
            isRTL={isRTL}
            categoryConfig={categoryConfig}
            formatTimeAgo={formatTimeAgo}
            onClick={() => onArticleClick(article)}
          />
        ))}
      </div>
    </div>
  )
}

interface NewsCardProps {
  article: NewsArticle
  index: number
  isRTL: boolean
  categoryConfig: Record<string, { labelEn: string; labelAr: string }>
  formatTimeAgo: (date: Date) => string
  onClick: () => void
}

function NewsCard({ article, index, isRTL, categoryConfig, formatTimeAgo, onClick }: NewsCardProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative flex-shrink-0 w-[180px] sm:w-[200px] rounded-xl overflow-hidden text-start',
        'bg-card border border-border/50',
        'shadow-sm hover:shadow-md transition-all'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-secondary">
        <Image
          src={article.image}
          alt={isRTL ? article.titleAr : article.title}
          fill
          className="object-cover"
        />
        <Badge 
          className="absolute top-2 start-2 sm:top-2 sm:start-2 text-[10px] sm:text-[11px] px-2 py-0.5 bg-primary/90"
        >
          {isRTL ? categoryConfig[article.category]?.labelAr : categoryConfig[article.category]?.labelEn}
        </Badge>
      </div>
      
      {/* Content */}
      <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
        <h3 className={cn(
          'font-semibold text-[12px] sm:text-sm leading-snug line-clamp-2',
          isRTL && 'font-arabic'
        )}>
          {isRTL ? article.titleAr : article.title}
        </h3>
        
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
          <span className={cn('truncate max-w-[55%]', isRTL && 'font-arabic')}>
            {isRTL ? article.sourceAr : article.source}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3 sm:w-3 sm:h-3" />
            {formatTimeAgo(article.publishedAt)}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
