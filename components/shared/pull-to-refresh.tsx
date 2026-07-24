'use client'

import * as React from 'react'
import { Loader2, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  /** Called when the user pulls past the threshold and releases. */
  onRefresh: () => void | Promise<void>
  children: React.ReactNode
  className?: string
}

const THRESHOLD = 70 // px the user must pull before a refresh fires
const MAX_PULL = 120 // px cap on how far the indicator travels

/**
 * Pull-to-refresh for an in-app scroll container.
 *
 * The browser's native pull-to-refresh only fires at the very top of the
 * document, not inside a nested scroll area like our main content — which is
 * why the gesture felt broken. This component owns the scroll container and
 * implements the gesture itself: it only engages when the content is already
 * scrolled to the top, so normal scrolling is never blocked.
 */
export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const startYRef = React.useRef<number | null>(null)
  const [pull, setPull] = React.useState(0)
  const [refreshing, setRefreshing] = React.useState(false)

  function handleTouchStart(e: React.TouchEvent) {
    const el = containerRef.current
    if (!el || refreshing) return
    // Only start tracking a pull when we're at the very top.
    if (el.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY
    } else {
      startYRef.current = null
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startYRef.current === null || refreshing) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta <= 0) {
      setPull(0)
      return
    }
    // Apply resistance so the pull feels natural and is capped.
    const resisted = Math.min(MAX_PULL, delta * 0.5)
    setPull(resisted)
  }

  async function handleTouchEnd() {
    if (startYRef.current === null) return
    startYRef.current = null
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPull(THRESHOLD)
      try {
        await onRefresh()
      } finally {
        // Give a brief beat so the spinner is visible before resetting.
        setTimeout(() => {
          setRefreshing(false)
          setPull(0)
        }, 400)
      }
    } else {
      setPull(0)
    }
  }

  const ready = pull >= THRESHOLD

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn('relative overflow-y-auto overflow-x-hidden', className)}
    >
      {/* Pull indicator */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-center"
        style={{
          height: pull,
          opacity: pull > 0 ? 1 : 0,
          transition: startYRef.current === null ? 'height 0.25s ease, opacity 0.25s ease' : 'none',
        }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-primary shadow-md ring-1 ring-border">
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowDown
              className={cn('h-4 w-4 transition-transform', ready && 'rotate-180')}
            />
          )}
        </span>
      </div>

      {/* Content shifts down while pulling for tactile feedback */}
      <div
        style={{
          transform: pull > 0 ? `translateY(${pull}px)` : undefined,
          transition: startYRef.current === null ? 'transform 0.25s ease' : 'none',
        }}
        className="h-full min-h-full w-full max-w-full overflow-x-hidden"
      >
        {children}
      </div>
    </div>
  )
}
