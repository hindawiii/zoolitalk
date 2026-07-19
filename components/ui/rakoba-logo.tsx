'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface RakobaLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE_PX: Record<NonNullable<RakobaLogoProps['size']>, number> = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 80,
}

export function RakobaLogo({ className, size = 'md' }: RakobaLogoProps) {
  const px = SIZE_PX[size]

  return (
    <Image
      src="/brand/rakobatna-logo.png"
      alt="راكوبتنا"
      width={px}
      height={px}
      priority
      className={cn('object-contain', className)}
      style={{ width: px, height: px }}
    />
  )
}
