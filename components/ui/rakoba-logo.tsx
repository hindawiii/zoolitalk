'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface RakobaLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Wraps the mark in a subtle themed rounded frame that matches the
   * forest-green / brown brand palette.
   */
  framed?: boolean
}

const SIZE_PX: Record<NonNullable<RakobaLogoProps['size']>, number> = {
  sm: 36,
  md: 48,
  lg: 72,
  xl: 120,
}

const FRAME_PAD: Record<NonNullable<RakobaLogoProps['size']>, string> = {
  sm: 'p-[3px] rounded-xl',
  md: 'p-1 rounded-xl',
  lg: 'p-1.5 rounded-2xl',
  xl: 'p-2 rounded-3xl',
}

export function RakobaLogo({ className, size = 'md', framed = false }: RakobaLogoProps) {
  const px = SIZE_PX[size]

  const img = (
    <Image
      src="/brand/rakobatna-mark-v2.png"
      alt="راكوبتنا"
      width={px}
      height={px}
      priority
      sizes={`${px}px`}
      className={cn(
        'select-none object-contain',
        framed ? 'rounded-lg' : 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]',
        !framed && className,
      )}
      style={{ width: px, height: px }}
    />
  )

  if (!framed) return img

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center bg-primary/10 ring-1 ring-primary/30 shadow-sm',
        FRAME_PAD[size],
        className,
      )}
    >
      {img}
    </span>
  )
}
