'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserStore } from '@/lib/stores/user-store'
import { cn } from '@/lib/utils'

// Placeholder StoryBar - full interactive Stories system added separately.
export function StoryBar() {
  const { currentUser } = useUserStore()

  return (
    <div dir="rtl" className="py-3 border-b border-[#2D5A27]/15 bg-white dark:bg-card w-full">
      <div className="flex gap-3 px-3 overflow-x-auto scrollbar-hide w-full">
        {/* Add Story */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="relative p-0.5 rounded-full border-2 border-dashed border-[#C9A227] hover:border-[#A67C00] transition-colors">
            <Avatar className="h-14 w-14">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="bg-[#2D5A27]/10 text-[#2D5A27]">
                <Plus className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="text-[10px] font-arabic text-[#2D5A27]">إضافة</span>
        </div>
      </div>
    </div>
  )
}
