'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface RakobaLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE_PX: Record<NonNullable<RakobaLogoProps['size']>, number> = {
  sm: 36,
  md: 48,
  lg: 72,
  xl: 120,
}

export function RakobaLogo({ className, size = 'md' }: RakobaLogoProps) {
  const px = SIZE_PX[size]

  return (
    <Image
      src="/brand/rakobatna-mark.png"
      alt="راكوبتنا"
      width={px}
      height={px}
      priority
      quality={90}
      sizes={`${px}px`}
      className={cn(
        'select-none object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]',
        className,
      )}
      style={{ width: px, height: px }}
    />
  )
}
