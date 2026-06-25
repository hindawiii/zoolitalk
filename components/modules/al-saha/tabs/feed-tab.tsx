'use client'

import * as React from 'react'
import { Plus, Camera, Video, Wifi, WifiOff, AlertCircle, Database } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PostCard } from '../post-card'
import { CreatePostSheet } from '../create-post-sheet'
import { StoryBar } from '../stories/story-bar'
import { useFeedStore } from '@/lib/stores/feed-store'
import { useUserStore } from '@/lib/stores/user-store'
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'

export function FeedTab() {
  const { posts, isLoading, subscribeToFirestorePosts, firebaseStatus, firebaseError } = useFeedStore()
  const { currentUser } = useUserStore()
  const { isRTL } = useLanguage()
  const [showCreatePost, setShowCreatePost] = React.useState(false)

  // Subscribe to Firestore posts on mount
  React.useEffect(() => {
    const unsubscribe = subscribeToFirestorePosts()
    return () => unsubscribe()
  }, [subscribeToFirestorePosts])
  
  // Connection status display
  const getStatusConfig = () => {
    switch (firebaseStatus) {
      case 'connected':
        return { 
          icon: Wifi, 
          text: isRTL ? 'متصل بالخادم' : 'Connected', 
          color: 'text-green-600 bg-green-100 dark:bg-green-900/30' 
        }
      case 'connecting':
        return { 
          icon: Database, 
          text: isRTL ? 'جاري الاتصال...' : 'Connecting...', 
          color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' 
        }
      case 'error':
        return { 
          icon: AlertCircle, 
          text: isRTL ? 'خطأ في الاتصال' : 'Connection Error', 
          color: 'text-red-600 bg-red-100 dark:bg-red-900/30' 
        }
      case 'unconfigured':
      default:
        return { 
          icon: WifiOff, 
          text: isRTL ? 'وضع تجريبي' : 'Demo Mode', 
          color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' 
        }
    }
  }
  
  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <ScrollArea className="flex-1 w-full">
        <div className="w-full">
          {/* Firebase Connection Status - Dev indicator */}
          {process.env.NODE_ENV === 'development' && (
            <div dir="rtl" className={cn(
              'flex flex-row items-center justify-center gap-2 py-1.5 text-xs font-medium w-full',
              statusConfig.color
            )}>
              <StatusIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className={cn(isRTL && 'font-arabic')}>{statusConfig.text}</span>
            </div>
          )}
          
          {/* Firebase Error Alert */}
          {firebaseStatus === 'error' && firebaseError && (
            <Alert variant="destructive" className="mx-3 mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className={cn(isRTL && 'font-arabic')}>
                {isRTL ? 'خطأ في الاتصال' : 'Connection Error'}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {firebaseError}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Demo Mode Notice */}
          {firebaseStatus === 'unconfigured' && (
            <div dir="rtl" className="mx-3 mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className={cn('text-xs text-blue-700 dark:text-blue-300 text-center', isRTL && 'font-arabic')}>
                {isRTL 
                  ? 'Firebase تعمل في وضع تجريبي - قم بتكوين'
                  : 'Running in demo mode - configure Firebase'}
              </p>
            </div>
          )}
          
          {/* Create Post Prompt */}
          <div dir="rtl" className="p-3 border-b border-[#2D5A27]/10 bg-white dark:bg-card w-full">
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full flex flex-row items-center gap-2 p-2.5 rounded-xl bg-[#F5F5DC] dark:bg-secondary/50 hover:bg-[#eaeacc] dark:hover:bg-secondary transition-colors"
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
                <AvatarFallback className="bg-[#2D5A27]/10 text-[#2D5A27] text-sm">
                  {currentUser?.nameAr?.[0] || 'ز'}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-start text-muted-foreground font-arabic text-sm truncate min-w-0">
                شنو الجديد يا زول؟
              </span>
              <div className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-full bg-[#2D5A27]/10 text-[#2D5A27]">
                <Plus className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* Stories Row - unified cream/green theme (full system added separately) */}
          <StoryBar />

          {/* Posts Feed */}
          <div className="divide-y divide-[#2D5A27]/10 w-full max-w-full">
            {posts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-card overflow-hidden w-full max-w-full">
                <PostCard post={post} />
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="jabana-loader w-12 h-12">
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  <ellipse cx="32" cy="48" rx="20" ry="12" fill="currentColor" className="text-[#2D5A27]" />
                  <path d="M12 48 Q8 32 18 26 L46 26 Q56 32 52 48" fill="currentColor" className="text-[#2D5A27]" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Bottom padding for scroll */}
          <div className="h-4" />
        </div>
      </ScrollArea>

      {/* Create Post Sheet */}
      <CreatePostSheet open={showCreatePost} onOpenChange={setShowCreatePost} />
    </div>
  )
}
