'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, MapPin, ChevronDown, Flame, Users } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFeedStore } from '@/lib/stores/feed-store'
import { cn } from '@/lib/utils'

const cities = [
  { id: 'all', label: 'كل السودان' },
  { id: 'الخرطوم', label: 'الخرطوم' },
  { id: 'بورتسودان', label: 'بورتسودان' },
  { id: 'كسلا', label: 'كسلا' },
  { id: 'ود_مدني', label: 'ود مدني' },
  { id: 'الأبيض', label: 'الأبيض' },
  { id: 'نيالا', label: 'نيالا' },
]

export function TrendsTab() {
  const { trends } = useFeedStore()
  const [selectedCity, setSelectedCity] = React.useState('all')

  const filteredTrends = React.useMemo(() => {
    if (selectedCity === 'all') return trends
    return trends.filter((trend) => !trend.city || trend.city === selectedCity)
  }, [trends, selectedCity])

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <div dir="rtl" className="flex flex-col h-full w-full bg-[#F5F5DC] dark:bg-background overflow-hidden">
      {/* City Filter Header */}
      <div className="flex-shrink-0 px-3 py-3 bg-white dark:bg-card border-b border-[#2D5A27]/10">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2 flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-[#2D5A27]" />
            <h2 className="text-base font-bold font-arabic text-[#2D5A27]">الترندات</h2>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-arabic border-[#2D5A27]/20 hover:bg-[#2D5A27]/10 text-xs px-2"
              >
                <MapPin className="h-3.5 w-3.5 text-[#2D5A27]" />
                <span className="truncate max-w-[80px]">{cities.find((c) => c.id === selectedCity)?.label}</span>
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-arabic">
              {cities.map((city) => (
                <DropdownMenuItem
                  key={city.id}
                  onClick={() => setSelectedCity(city.id)}
                  className={cn(
                    'cursor-pointer',
                    selectedCity === city.id && 'bg-[#2D5A27]/10 text-[#2D5A27]'
                  )}
                >
                  {city.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Trends List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredTrends.map((trend, index) => (
            <motion.div
              key={trend.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-card rounded-xl p-3 border border-[#2D5A27]/10 hover:border-[#2D5A27]/30 transition-colors cursor-pointer"
            >
              <div className="flex flex-row items-start gap-3 w-full">
                {/* Rank */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#2D5A27]/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#2D5A27]">{index + 1}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-row items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold font-arabic text-foreground text-start">
                      #{trend.tagAr}
                    </h3>
                    {trend.isHot && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="flex flex-row items-center gap-0.5 px-1.5 py-0.5 bg-red-500/10 rounded-full"
                      >
                        <Flame className="h-2.5 w-2.5 text-red-500" />
                        <span className="text-[9px] font-bold text-red-500 font-arabic">ساخن</span>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex flex-row items-center gap-2 mt-1 flex-wrap">
                    <div className="flex flex-row items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="text-[10px] font-arabic">
                        {formatCount(trend.zoolsCount)} زول
                      </span>
                    </div>
                    {trend.city && (
                      <div className="flex flex-row items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="text-[10px] font-arabic">{trend.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hot Indicator */}
                {trend.isHot && (
                  <div className="flex-shrink-0">
                    <motion.div
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0 rgba(239, 68, 68, 0.4)',
                          '0 0 0 6px rgba(239, 68, 68, 0)',
                        ]
                      }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-2.5 h-2.5 rounded-full bg-red-500"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {filteredTrends.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground font-arabic">ما في ترندات في الموقع ده حالياً</p>
            </div>
          )}
          
          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </ScrollArea>
    </div>
  )
}
