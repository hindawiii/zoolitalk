'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, MapPin, Calendar, ChevronLeft, ChevronRight, Verified } from 'lucide-react'
import {
  type Opportunity,
  DEMO_OPPORTUNITIES,
  getCategoryIcon,
  getCategoryLabel,
  formatDeadline,
  getDeadlineStatus,
} from '@/lib/types/opportunities'
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'

interface OpportunitiesSliderProps {
  onOpportunityClick: (opportunity: Opportunity) => void
  onViewAll?: () => void
}

export function OpportunitiesSlider({ onOpportunityClick, onViewAll }: OpportunitiesSliderProps) {
  const { isRTL } = useLanguage()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollStart, setCanScrollStart] = React.useState(false)
  const [canScrollEnd, setCanScrollEnd] = React.useState(true)
  
  // Filter featured opportunities
  const featuredOpportunities = DEMO_OPPORTUNITIES.filter((opp) => opp.isFeatured)
  
  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    const isRtlScroll = isRTL
    
    if (isRtlScroll) {
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
  
  if (featuredOpportunities.length === 0) return null
  
  return (
    <div className="relative w-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-3 sm:px-4 mb-3',
        isRTL ? 'font-arabic' : ''
      )}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <h2 className="font-semibold text-sm sm:text-base text-foreground">
            {isRTL ? 'الفرص' : 'Opportunities'}
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
        {featuredOpportunities.map((opp, index) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            index={index}
            onClick={() => onOpportunityClick(opp)}
          />
        ))}
      </div>
    </div>
  )
}

interface OpportunityCardProps {
  opportunity: Opportunity
  index: number
  onClick: () => void
}

function OpportunityCard({ opportunity, index, onClick }: OpportunityCardProps) {
  const { isRTL } = useLanguage()
  const deadlineStatus = getDeadlineStatus(opportunity.deadline)
  
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'relative flex-shrink-0 w-[200px] sm:w-56 rounded-xl sm:rounded-2xl overflow-hidden text-start',
        'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500',
        'shadow-lg hover:shadow-xl transition-shadow'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id={`pattern-${opportunity.id}`} patternUnits="userSpaceOnUse" width="20" height="20">
            <circle cx="10" cy="10" r="1" fill="white" />
          </pattern>
          <rect fill={`url(#pattern-${opportunity.id})`} width="100%" height="100%" />
        </svg>
      </div>
      
      <div className="relative p-3 sm:p-4">
        {/* Featured badge */}
        <div className="absolute top-2 end-2 sm:top-2 sm:end-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 sm:px-2 sm:py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {isRTL ? 'مميز' : 'Featured'}
          </span>
        </div>
        
        {/* Category icon */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2.5 sm:mb-3">
          <span className="text-base sm:text-xl">{getCategoryIcon(opportunity.category)}</span>
        </div>
        
        {/* Title */}
        <h3 className={cn(
          'font-semibold text-white text-[13px] sm:text-base leading-snug line-clamp-2 mb-1.5 sm:mb-2',
          isRTL ? 'font-arabic' : ''
        )}>
          {isRTL ? opportunity.titleAr : opportunity.title}
        </h3>
        
        {/* Organization */}
        <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
          <span className={cn(
            'text-white/90 text-[11px] sm:text-sm line-clamp-1',
            isRTL ? 'font-arabic' : ''
          )}>
            {isRTL ? opportunity.organizationAr : opportunity.organization}
          </span>
          {opportunity.isVerified && (
            <Verified className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-200 flex-shrink-0" />
          )}
        </div>
        
        {/* Meta info */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-white/80 text-[10px] sm:text-xs">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            <span className={cn('truncate max-w-[70px] sm:max-w-none', isRTL ? 'font-arabic' : '')}>
              {isRTL ? opportunity.locationAr : opportunity.location}
            </span>
          </div>
          
          <div className={cn(
            'flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0',
            deadlineStatus === 'closing-soon'
              ? 'bg-red-500/20 text-white'
              : 'bg-white/20 text-white'
          )}>
            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="truncate max-w-[55px] sm:max-w-none">{formatDeadline(opportunity.deadline, isRTL)}</span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
