'use client'

import { Suspense, useEffect, useState } from 'react'
import { AppShell } from '@/components/shell/app-shell'
import { AuthScreen } from '@/components/auth/auth-screen'
import { useUserStore } from '@/lib/stores/user-store'
import { watchAuth } from '@/lib/firebase/auth'

// Loading fallback
function AppLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-arabic">جاري التحميل...</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const authLoading = useUserStore((s) => s.authLoading)
  const hydrateFromFirebaseUser = useUserStore((s) => s.hydrateFromFirebaseUser)
  const clearAuth = useUserStore((s) => s.clearAuth)
  const [mounted, setMounted] = useState(false)

  // Avoid a hydration flash: wait for the persisted store to rehydrate
  useEffect(() => {
    setMounted(true)
  }, [])

  // Subscribe to Firebase auth state. This is the single source of truth for
  // whether the user is signed in, and it loads their real profile.
  useEffect(() => {
    const unsubscribe = watchAuth((fbUser) => {
      if (fbUser) {
        void hydrateFromFirebaseUser(fbUser)
      } else {
        clearAuth()
      }
    })
    return unsubscribe
  }, [hydrateFromFirebaseUser, clearAuth])

  // Wait for mount and for Firebase to report the initial auth state
  if (!mounted || authLoading) {
    return <AppLoader />
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <Suspense fallback={<AppLoader />}>
      <AppShell />
    </Suspense>
  )
}
