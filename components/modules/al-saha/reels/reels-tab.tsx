'use client'

import * as React from 'react'
import { Clapperboard } from 'lucide-react'

// Placeholder - full implementation added with the Reels system.
export function ReelsTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center px-6 bg-[#F5F5DC] dark:bg-background">
      <div className="p-4 rounded-full bg-[#2D5A27]/10 mb-4">
        <Clapperboard className="h-8 w-8 text-[#2D5A27]" />
      </div>
      <p className="font-arabic text-[#2D5A27] font-bold">Reels</p>
      <p className="font-arabic text-sm text-muted-foreground mt-1">قريباً</p>
    </div>
  )
}
