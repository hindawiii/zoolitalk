'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Grid3X3, 
  Heart, 
  Bookmark, 
  Share2,
  Camera,
  MapPin,
  Calendar,
  Link2,
  Edit3,
  Award,
  ShieldCheck,
  MoreHorizontal,
  ImagePlus,
  Gift,
  Star,
  MessageCircle,
  Eye,
  EyeOff,
  Briefcase,
  GraduationCap,
  Sparkles,
  Crown,
  Sword,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useUserStore, type SocialStatus, type ProfessionalStatus, type ReceivedGift, type UserRank, type Gender, type User } from '@/lib/stores/user-store'
import { useAppStore } from '@/lib/stores/app-store'
import { useChatStore } from '@/lib/stores/chat-store'
import { useLanguage } from '@/components/providers/language-provider'
import { useGender } from '@/hooks/use-gender'
import { SOCIAL_STATUS_LABELS, PROFESSIONAL_STATUS_LABELS, RANK_LABELS } from '@/lib/gender-utils'
import { cn } from '@/lib/utils'

// Professional Status Icons (labels come from gender-utils)
const professionalStatusIcons: Record<ProfessionalStatus, React.ElementType> = {
  student: GraduationCap,
  employee: Briefcase,
  freelancer: Sparkles,
  unemployed: Star,
}

// Rank configurations with animation styles (titles come from gender-utils based on user gender)
const rankConfig: Record<UserRank, { gradient: string; animation: string; glowColor: string }> = {
  lion: {
    gradient: 'from-yellow-400 via-amber-500 to-yellow-600',
    animation: 'animate-spin-slow',
    glowColor: 'shadow-amber-500/50',
  },
  knight: {
    gradient: 'from-[#2D5A27] via-emerald-500 to-[#2D5A27]',
    animation: 'animate-pulse',
    glowColor: 'shadow-emerald-500/50',
  },
  advisor: {
    gradient: 'from-blue-400 via-indigo-500 to-blue-600',
    animation: '',
    glowColor: 'shadow-blue-500/50',
  },
  newbie: {
    gradient: 'from-gray-300 via-gray-400 to-gray-500',
    animation: '',
    glowColor: '',
  },
}

// Gift categories
const RAKOBA_GIFTS = {
  heritage: [
    { id: 'jabana', name: 'Jabana', nameAr: 'جبنة', emoji: '☕' },
    { id: 'markoub', name: 'Markoub', nameAr: 'مركوب', emoji: '👞' },
    { id: 'akkaz', name: 'Akkaz', nameAr: 'عكاز', emoji: '🦯' },
  ],
  flowers: [
    { id: 'jasmine', name: 'Jasmine', nameAr: 'ياسمين', emoji: '🌸' },
    { id: 'red-rose', name: 'Red Rose', nameAr: 'ورد أحمر', emoji: '🌹' },
    { id: 'sunflower', name: 'Sunflower', nameAr: 'دوار الشمس', emoji: '🌻' },
  ],
  luxury: [
    { id: 'gold-ring', name: 'Gold Ring', nameAr: 'خاتم ذهب', emoji: '💍' },
    { id: 'diamond', name: 'Diamond', nameAr: 'ألماس', emoji: '💎' },
    { id: 'car', name: 'Car', nameAr: 'سيارة', emoji: '🚗' },
  ],
}

// Gallery item type
interface GalleryItem {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnail: string
  likes: number
}

// Mock gallery data
const mockGallery: GalleryItem[] = [
  { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200', likes: 234 },
  { id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400', thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200', likes: 567 },
  { id: '3', type: 'image', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400', thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=200', likes: 123 },
  { id: '4', type: 'image', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400', thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200', likes: 890 },
  { id: '5', type: 'image', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400', thumbnail: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=200', likes: 456 },
  { id: '6', type: 'image', url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400', thumbnail: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=200', likes: 678 },
]

// Animated Avatar Frame Component
function AnimatedAvatarFrame({ 
  rank, 
  children 
}: { 
  rank: 'lion' | 'knight' | 'advisor' | 'newbie'
  children: React.ReactNode 
}) {
  const config = rankConfig[rank]
  
  if (rank === 'newbie') {
    return <div className="relative">{children}</div>
  }

  return (
    <div className="relative">
      {/* Animated rotating gradient border */}
      <motion.div
        className={cn(
          'absolute -inset-2 rounded-full bg-gradient-to-r',
          config.gradient,
          'opacity-75 blur-sm',
          config.glowColor,
          'shadow-lg'
        )}
        animate={rank === 'lion' ? { rotate: 360 } : { scale: [1, 1.05, 1] }}
        transition={
          rank === 'lion' 
            ? { duration: 8, repeat: Infinity, ease: 'linear' }
            : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <motion.div
        className={cn(
          'absolute -inset-1.5 rounded-full bg-gradient-to-r',
          config.gradient
        )}
        animate={rank === 'lion' ? { rotate: -360 } : {}}
        transition={
          rank === 'lion'
            ? { duration: 6, repeat: Infinity, ease: 'linear' }
            : {}
        }
      />
      <div className="relative bg-background rounded-full p-1">
        {children}
      </div>
    </div>
  )
}

// Gift Card Component
function GiftCard({ 
  gift, 
  isRTL 
}: { 
  gift: ReceivedGift
  isRTL: boolean 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 min-w-[80px]"
    >
      <span className="text-2xl">{gift.giftEmoji}</span>
      <span className="text-xs font-arabic text-center">
        {isRTL ? gift.giftNameAr : gift.giftName}
      </span>
      <span className="text-[10px] text-muted-foreground font-arabic">
        {gift.isPrivate ? (
          <span className="flex items-center gap-1">
            <EyeOff className="h-3 w-3" />
            {isRTL ? 'فاعل خير' : 'Anonymous'}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {isRTL ? gift.senderNameAr : gift.senderName}
          </span>
        )}
      </span>
    </motion.div>
  )
}

// Featured Post Card Component
function FeaturedPostCard({ 
  post, 
  onClick 
}: { 
  post: { id: string; thumbnail: string; likes: number; comments: number }
  onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative aspect-square w-32 rounded-xl overflow-hidden flex-shrink-0"
      onClick={onClick}
    >
      <Image
        src={post.thumbnail}
        alt="Featured post"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
        <span className="flex items-center gap-1">
          <Heart className="h-3 w-3 fill-white" />
          {post.likes}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          {post.comments}
        </span>
      </div>
    </motion.button>
  )
}

export default function ZoolProfile() {
  const { isRTL, t } = useLanguage()
  const { currentUser, followingIds, updateProfile, viewedUser, setViewedUser, loadUserProfile } = useUserStore()
  const { setSettingsOpen, triggerGift, viewingUserId, setViewingUserId, setActiveTab: setAppActiveTab } = useAppStore()
  const { chats, setActiveChatId } = useChatStore()
  const { socialStatus, professionalStatus, rank } = useGender()
  const [activeTab, setActiveTab] = React.useState('posts')
  const [selectedImage, setSelectedImage] = React.useState<GalleryItem | null>(null)
  const [giftsLoaded, setGiftsLoaded] = React.useState(false)
  const [highlightsLoaded, setHighlightsLoaded] = React.useState(false)
  
  // Determine which user to display
  const isViewingOtherUser = viewingUserId && viewingUserId !== currentUser?.id
  const displayUser = isViewingOtherUser ? viewedUser : currentUser
  const isOwnProfile = !isViewingOtherUser
  
  // Load user profile when viewing another user
  React.useEffect(() => {
    if (isViewingOtherUser && viewingUserId) {
      loadUserProfile(viewingUserId)
    }
  }, [viewingUserId, isViewingOtherUser, loadUserProfile])
  
  // Clean up when leaving profile
  React.useEffect(() => {
    return () => {
      if (isViewingOtherUser) {
        setViewedUser(null)
        setViewingUserId(null)
      }
    }
  }, [isViewingOtherUser, setViewedUser, setViewingUserId])
  
  // Start chat with viewed user
  const handleStartChat = () => {
    if (viewingUserId) {
      // Find existing chat or create new one
      const existingChat = chats.find(c => 
        c.type === 'private' && c.participants?.some(p => p.id === viewingUserId)
      )
      if (existingChat) {
        setActiveChatId(existingChat.id)
      } else {
        setActiveChatId(`chat-${viewingUserId}`)
      }
      setAppActiveTab('wansa')
      setViewingUserId(null)
    }
  }
  
  // Go back to previous view
  const handleGoBack = () => {
    setViewedUser(null)
    setViewingUserId(null)
    setAppActiveTab('wansa')
  }
  
  // Lazy load gifts and highlights
  React.useEffect(() => {
    const giftsTimer = setTimeout(() => setGiftsLoaded(true), 300)
    const highlightsTimer = setTimeout(() => setHighlightsLoaded(true), 500)
    return () => {
      clearTimeout(giftsTimer)
      clearTimeout(highlightsTimer)
    }
  }, [])

  const stats = [
    { label: isRTL ? 'منشورات' : 'Posts', value: mockGallery.length },
    { label: isRTL ? 'متابعين' : 'Followers', value: displayUser?.followers ?? 1234 },
    { label: isRTL ? 'متابَع' : 'Following', value: displayUser?.following ?? followingIds.length },
    { label: isRTL ? 'نقاط' : 'Points', value: displayUser?.zoolPoints ?? 2500 },
  ]
  
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const userRank = displayUser?.rank || 'newbie'
  const rankInfo = rankConfig[userRank]

  // Lightbox for images
  if (selectedImage) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={() => setSelectedImage(null)}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
          onClick={() => setSelectedImage(null)}
        >
          <MoreHorizontal className="h-6 w-6 rotate-90" />
        </Button>
        <Image
          src={selectedImage.url}
          alt="Gallery image"
          width={600}
          height={600}
          className="max-w-full max-h-full object-contain"
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white">
          <Button variant="ghost" className="text-white hover:bg-white/20 gap-2">
            <Heart className="h-5 w-5" />
            {formatNumber(selectedImage.likes)}
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/20">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background w-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          {/* Cover Photo */}
          <div className="relative h-32 sm:h-40 w-full bg-gradient-to-br from-[#2D5A27] via-[#2D5A27]/80 to-emerald-700">
            {displayUser?.coverPhoto && (
              <Image
                src={displayUser.coverPhoto}
                alt="Cover"
                fill
                className="object-cover"
              />
            )}
            
            {/* Back Button (when viewing other user) */}
            {!isOwnProfile && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 bg-background/30 backdrop-blur-sm hover:bg-background/50 start-3"
                onClick={handleGoBack}
              >
                <BackIcon className="h-5 w-5 text-white" />
              </Button>
            )}
            
            {/* Settings Button (own profile only) */}
            {isOwnProfile && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 bg-background/30 backdrop-blur-sm hover:bg-background/50 end-3"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-5 w-5 text-white" />
              </Button>
            )}

            {/* Edit Cover Button (own profile only) */}
            {isOwnProfile && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-3 bg-background/30 backdrop-blur-sm hover:bg-background/50 text-white gap-1.5 end-3"
              >
                <Camera className="h-4 w-4" />
                <span className="text-xs">{isRTL ? 'تغيير' : 'Edit'}</span>
              </Button>
            )}
          </div>

          {/* Profile Header */}
          <div className="relative px-2 sm:px-4 pb-4 w-full">
            {/* Animated Avatar with Rank Frame */}
            <div className="relative -mt-14 sm:-mt-16 mb-3 sm:mb-4 flex justify-center w-full">
              <AnimatedAvatarFrame rank={userRank}>
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-lg">
                  <AvatarImage src={displayUser?.avatar} alt={displayUser?.name} />
                  <AvatarFallback className="text-2xl sm:text-3xl bg-[#2D5A27] text-white font-arabic">
                    {displayUser?.nickname?.[0] || displayUser?.nameAr?.[0] || 'ز'}
                  </AvatarFallback>
                </Avatar>
              </AnimatedAvatarFrame>
              
              {/* Rank Badge */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r',
                      rankInfo.gradient
                    )}
                  >
                    {userRank === 'lion' && <Crown className="h-3 w-3 inline me-1" />}
                    {userRank === 'knight' && <Sword className="h-3 w-3 inline me-1" />}
                    <span className="font-arabic">{rank(userRank)}</span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-arabic">{isRTL ? 'رتبتك بناءً على نشاطك' : 'Your rank based on activity'}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Nickname (اللقب) - Prominent Display */}
            <div className="text-center space-y-1 w-full px-2">
              {displayUser?.nickname && (
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl sm:text-2xl font-bold font-arabic text-[#2D5A27]"
                >
                  {displayUser.nickname}
                </motion.h1>
              )}
              
              <div className="flex items-center justify-center gap-2">
                <p className={cn('text-sm sm:text-base font-medium', isRTL && 'font-arabic')}>
                  {isRTL ? displayUser?.nameAr : displayUser?.name || (isRTL ? 'مستخدم راكوبتنا' : 'Rakobatna User')}
                </p>
                {displayUser?.isVerified && (
                  <ShieldCheck className="h-4 w-4 text-[#2D5A27]" />
                )}
              </div>

              <p className="text-muted-foreground text-xs sm:text-sm">@{displayUser?.username || 'rakobatna_user'}</p>
            </div>

            {/* Status Badges Row */}
            <div className="flex items-center justify-center gap-1 mt-3 flex-wrap w-full">
              {/* Social Status - Dropdown for own profile, Badge for others */}
              {isOwnProfile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 font-arabic text-[10px] h-6 px-2">
                      <Heart className="h-3 w-3 text-pink-500 shrink-0" />
                      <span className="truncate max-w-[60px]">
                        {displayUser?.socialStatus 
                          ? socialStatus(displayUser.socialStatus)
                          : (isRTL ? 'الحالة' : 'Status')
                        }
                      </span>
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="font-arabic">
                    {(Object.keys(SOCIAL_STATUS_LABELS) as SocialStatus[]).map((key) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => updateProfile({ socialStatus: key })}
                        className={displayUser?.socialStatus === key ? 'bg-primary/10' : ''}
                      >
                        {socialStatus(key)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : displayUser?.socialStatus && (
                <Badge variant="secondary" className="gap-1.5 font-arabic text-xs">
                  <Heart className="h-3 w-3 text-pink-500" />
                  {socialStatus(displayUser.socialStatus)}
                </Badge>
              )}

              {/* Professional Status - Dropdown for own profile, Badge for others */}
              {isOwnProfile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 font-arabic text-[10px] h-6 px-2">
                      {displayUser?.professionalStatus && (
                        React.createElement(professionalStatusIcons[displayUser.professionalStatus], {
                          className: 'h-3 w-3 text-[#2D5A27] shrink-0'
                        })
                      )}
                      <span className="truncate max-w-[50px]">
                        {displayUser?.professionalStatus 
                          ? professionalStatus(displayUser.professionalStatus)
                          : (isRTL ? 'المهنة' : 'Work')
                        }
                      </span>
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="font-arabic">
                    {(Object.keys(PROFESSIONAL_STATUS_LABELS) as ProfessionalStatus[]).map((key) => {
                      const Icon = professionalStatusIcons[key]
                      return (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => updateProfile({ professionalStatus: key })}
                          className={displayUser?.professionalStatus === key ? 'bg-primary/10' : ''}
                        >
                          <Icon className="h-4 w-4 me-2" />
                          {professionalStatus(key)}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : displayUser?.professionalStatus && (
                <Badge variant="secondary" className="gap-1.5 font-arabic text-xs">
                  {React.createElement(professionalStatusIcons[displayUser.professionalStatus], {
                    className: 'h-3 w-3 text-[#2D5A27]'
                  })}
                  {professionalStatus(displayUser.professionalStatus)}
                </Badge>
              )}
            </div>

            {/* Bio */}
            {displayUser?.bio && (
              <p className={cn(
                'text-xs sm:text-sm max-w-full mx-auto text-center mt-3 px-4 break-words',
                isRTL && 'font-arabic'
              )}>
                {isRTL ? displayUser.bioAr : displayUser.bio}
              </p>
            )}

            {/* Location & Joined */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground mt-2 flex-wrap w-full px-2">
              {displayUser?.location && (
                <span className="flex items-center gap-1 font-arabic">
                  <MapPin className="h-3 w-3" />
                  {displayUser.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {isRTL ? 'انضم في 2024' : 'Joined 2024'}
              </span>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-0 mt-4 p-1 sm:p-3 rounded-xl bg-secondary/50 w-full">
              {stats.map((stat, idx) => (
                <button
                  key={idx}
                  className="flex flex-col items-center justify-center gap-0 hover:bg-secondary rounded-lg p-0.5 sm:p-2 transition-colors overflow-hidden"
                >
                  <span className="text-xs sm:text-lg font-bold text-[#2D5A27]">
                    {formatNumber(stat.value)}
                  </span>
                  <span className={cn('text-[7px] sm:text-[10px] text-muted-foreground text-center leading-tight', isRTL && 'font-arabic')}>
                    {stat.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1.5 sm:gap-3 mt-4 w-full">
              {isOwnProfile ? (
                <>
                  <Button 
                    className="flex-1 gap-1 sm:gap-2 text-[10px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 min-w-0" 
                    variant="outline"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="font-arabic truncate">{isRTL ? 'تعديل' : 'Edit'}</span>
                  </Button>
                  <Button 
                    className="flex-1 gap-1 sm:gap-2 bg-[#2D5A27] hover:bg-[#2D5A27]/90 text-white text-[10px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 min-w-0"
                    onClick={() => triggerGift('jabana', displayUser?.name || 'User')}
                  >
                    <Gift className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="font-arabic truncate">{isRTL ? 'هدية' : 'Gift'}</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    className="flex-1 gap-1 sm:gap-2 text-[10px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 min-w-0" 
                    variant="outline"
                    onClick={handleStartChat}
                  >
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="font-arabic truncate">{isRTL ? 'مراسلة' : 'Message'}</span>
                  </Button>
                  <Button 
                    className="flex-1 gap-1 sm:gap-2 bg-[#2D5A27] hover:bg-[#2D5A27]/90 text-white text-[10px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 min-w-0"
                    onClick={() => triggerGift('jabana', displayUser?.name || 'User')}
                  >
                    <Gift className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="font-arabic truncate">{isRTL ? 'هدية' : 'Gift'}</span>
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                  <DropdownMenuItem className={cn(isRTL && 'font-arabic')}>
                    <Share2 className="h-4 w-4 me-2" />
                    {isRTL ? 'مشاركة الملف' : 'Share Profile'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className={cn(isRTL && 'font-arabic')}>
                    <Link2 className="h-4 w-4 me-2" />
                    {isRTL ? 'نسخ الرابط' : 'Copy Link'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Al-Saha Museum (Highlights) Section */}
          {highlightsLoaded && displayUser?.featuredPosts && displayUser.featuredPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-3 sm:py-4 border-t w-full"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-bold font-arabic text-[#2D5A27] text-sm sm:text-base">
                  {isRTL ? 'متحف الساحة' : 'Al-Saha Museum'}
                </h3>
                <Star className="h-4 w-4 text-[#2D5A27]" />
              </div>
              <ScrollArea className="w-full" dir="ltr">
                <div className="flex gap-2 sm:gap-3 pb-3 px-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  {displayUser.featuredPosts.map((post) => (
                    <FeaturedPostCard
                      key={post.id}
                      post={post}
                      onClick={() => setSelectedImage({
                        id: post.id,
                        type: 'image',
                        url: post.thumbnail,
                        thumbnail: post.thumbnail,
                        likes: post.likes,
                      })}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-2.5 hover:h-3 transition-all" />
              </ScrollArea>
            </motion.div>
          )}

          {/* Gift Showcase (Karam System) Section */}
          {giftsLoaded && displayUser?.gifts && displayUser.gifts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-3 sm:py-4 border-t w-full"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-bold font-arabic text-[#2D5A27] text-sm sm:text-base">
                  {isRTL ? 'هدايا الكرم' : 'Gift Showcase'}
                </h3>
                <Gift className="h-4 w-4 text-[#2D5A27]" />
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-2 sm:gap-3 pb-2">
                  {displayUser.gifts.map((gift) => (
                    <GiftCard key={gift.id} gift={gift} isRTL={isRTL} />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </motion.div>
          )}

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 border-t w-full">
            <TabsList className="w-full justify-around rounded-none border-b bg-transparent h-12">
              <TabsTrigger 
                value="posts" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D5A27] data-[state=active]:bg-transparent"
              >
                <Grid3X3 className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="likes" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D5A27] data-[state=active]:bg-transparent"
              >
                <Heart className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="saved" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D5A27] data-[state=active]:bg-transparent"
              >
                <Bookmark className="h-5 w-5" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-0 w-full">
              {mockGallery.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5 w-full">
                  {mockGallery.map((item) => (
                    <button
                      key={item.id}
                      className="relative aspect-square bg-secondary overflow-hidden hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(item)}
                    >
                      <Image
                        src={item.thumbnail}
                        alt="Gallery item"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <div className="flex items-center gap-1 text-white text-sm font-medium">
                          <Heart className="h-4 w-4 fill-white" />
                          {formatNumber(item.likes)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={ImagePlus}
                  title={isRTL ? 'لا توجد منشورات' : 'No Posts Yet'}
                  description={isRTL ? 'شارك أول صورة لك!' : 'Share your first photo!'}
                />
              )}
            </TabsContent>

            <TabsContent value="likes" className="mt-0 w-full">
              <EmptyState 
                icon={Heart}
                title={isRTL ? 'لا توجد إعجابات' : 'No Likes Yet'}
                description={isRTL ? 'المنشورات التي أعجبتك ستظهر هنا' : 'Posts you like will appear here'}
              />
            </TabsContent>

            <TabsContent value="saved" className="mt-0 w-full">
              <EmptyState 
                icon={Bookmark}
                title={isRTL ? 'لا توجد محفوظات' : 'No Saved Items'}
                description={isRTL ? 'احفظ المنشورات للرجوع إليها لاحقاً' : 'Save posts to view them later'}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Empty State Component
function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType
  title: string
  description: string 
}) {
  const { isRTL } = useLanguage()
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 rounded-full bg-secondary mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className={cn('font-semibold text-lg', isRTL && 'font-arabic')}>{title}</h3>
      <p className={cn('text-sm text-muted-foreground mt-1', isRTL && 'font-arabic')}>{description}</p>
    </div>
  )
}
