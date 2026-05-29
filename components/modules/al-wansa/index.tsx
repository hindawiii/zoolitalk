'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Moon, Gamepad2, Archive } from 'lucide-react'
import { ChatList } from './chat-list'
import { ChatView } from './chat-view'
import { ChatThemeProvider } from './chat-theme-provider'
import { GamesMenu } from './games-menu'
import { OccasionsHub } from './occasions-hub'
import { ReligiousAssistant } from './religious-assistant'
import { ContactManager } from './contact-manager'
import { DocumentScanner } from './document-scanner'
import { useChatStore } from '@/lib/stores/chat-store'
import { useAppStore } from '@/lib/stores/app-store'
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'

type TabId = 'messages' | 'islamic' | 'games' | 'archive'

interface Tab {
  id: TabId
  labelAr: string
  labelEn: string
  icon: React.ComponentType<{ className?: string }>
}

// RTL order: Messages (right) -> Islamic -> Games -> Archive (left)
// Array is reversed so flex-row-reverse displays correctly
const tabs: Tab[] = [
  { id: 'archive', labelAr: 'الأرشيف', labelEn: 'Archive', icon: Archive },
  { id: 'games', labelAr: 'الألعاب', labelEn: 'Games', icon: Gamepad2 },
  { id: 'islamic', labelAr: 'إسلاميات', labelEn: 'Islamic', icon: Moon },
  { id: 'messages', labelAr: 'الرسائل', labelEn: 'Messages', icon: MessageCircle },
]

export default function AlWansa() {
  const { activeChatId, setActiveChatId } = useChatStore()
  const { openUserProfile } = useAppStore()
  const { isRTL } = useLanguage()
  const [activeTab, setActiveTab] = React.useState<TabId>('messages')
  const [showOccasions, setShowOccasions] = React.useState(false)
  const [showContacts, setShowContacts] = React.useState(false)
  const [showScanner, setShowScanner] = React.useState(false)

  const handleStartChat = (contactId: string) => {
    setActiveChatId(`chat-${contactId}`)
    setShowContacts(false)
  }
  
  // Handle opening a user's profile from the chat header
  const handleOpenProfile = (userId: string) => {
    console.log('[v0] Opening profile for user:', userId)
    openUserProfile(userId)
  }

  const handleScanCapture = (imageData: string) => {
    console.log('Document scanned:', imageData.slice(0, 100))
    setShowScanner(false)
  }

  // Get the index for the sliding indicator
  const activeTabIndex = tabs.findIndex(t => t.id === activeTab)

  return (
    <ChatThemeProvider>
      <div className="h-full flex flex-col w-full max-w-full overflow-x-hidden">
        {/* Sticky Tab Navigation Header - Hidden when chat is open */}
        {!activeChatId && (
          <div className="sticky top-0 z-40 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b">
            <div className="relative flex items-center">
              {/* Tabs - reversed for RTL */}
              <div className={cn(
                'flex w-full',
                isRTL && 'flex-row-reverse'
              )}>
                {tabs.map((tab, index) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors relative',
                        isActive 
                          ? 'text-[#2D5A27]' 
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className={cn(
                        'h-5 w-5 transition-transform',
                        isActive && 'scale-110'
                      )} />
                      <span className={cn(
                        'text-xs font-medium',
                        isRTL && 'font-arabic'
                      )}>
                        {isRTL ? tab.labelAr : tab.labelEn}
                      </span>
                    </button>
                  )
                })}
              </div>
              
              {/* Sliding Indicator */}
              <motion.div
                className="absolute bottom-0 h-0.5 bg-[#2D5A27] rounded-full"
                initial={false}
                animate={{
                  width: `${100 / tabs.length}%`,
                  x: isRTL 
                    ? `${(tabs.length - 1 - activeTabIndex) * 100}%`
                    : `${activeTabIndex * 100}%`,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ width: `${100 / tabs.length}%` }}
              />
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* When in active chat view, show ChatView regardless of tab */}
            {activeChatId ? (
              <motion.div
                key="chat-view"
                initial={{ x: isRTL ? '-100%' : '100%' }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? '-100%' : '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="h-full w-full max-w-full"
              >
                <ChatView 
                  onBack={() => setActiveChatId(null)} 
                  onOpenGames={() => setActiveTab('games')}
                  onOpenProfile={handleOpenProfile}
                />
              </motion.div>
            ) : (
              <>
                {/* Messages Tab */}
                {activeTab === 'messages' && (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full w-full max-w-full"
                  >
                    <ChatList showArchived={false} />
                  </motion.div>
                )}

                {/* Islamic Tab */}
                {activeTab === 'islamic' && (
                  <motion.div
                    key="islamic"
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full w-full max-w-full"
                  >
                    <IslamicContent />
                  </motion.div>
                )}

                {/* Games Tab */}
                {activeTab === 'games' && (
                  <motion.div
                    key="games"
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full w-full max-w-full"
                  >
                    <GamesContent />
                  </motion.div>
                )}

                {/* Archive Tab */}
                {activeTab === 'archive' && (
                  <motion.div
                    key="archive"
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full w-full max-w-full"
                  >
                    <ChatList showArchived={true} />
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Occasions Hub */}
        <OccasionsHub 
          isOpen={showOccasions} 
          onClose={() => setShowOccasions(false)} 
        />

        {/* Contact Manager */}
        <ContactManager 
          isOpen={showContacts} 
          onClose={() => setShowContacts(false)}
          onStartChat={handleStartChat}
        />

        {/* Document Scanner */}
        <DocumentScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onCapture={handleScanCapture}
        />
      </div>
    </ChatThemeProvider>
  )
}

// Islamic Content Component (inline for this tab)
function IslamicContent() {
  const { isRTL } = useLanguage()
  const [settings, setSettings] = React.useState({
    azanEnabled: true,
    azanVolume: 0.7,
    dhikrReminders: true,
    salatAlaNabi: true,
    salatAlaNabiInterval: 30,
    selectedAzanStyle: 'mecca' as 'mecca' | 'medina' | 'egypt',
  })
  const [dhikrCounts, setDhikrCounts] = React.useState<Record<number, number>>({})
  const [isPlaying, setIsPlaying] = React.useState<string | null>(null)
  const [showSettings, setShowSettings] = React.useState(false)

  // Prayer times (demo - in production, use an API like Aladhan)
  const prayerTimes = [
    { id: 'fajr', name: 'Fajr', nameAr: 'الفجر', time: '04:45' },
    { id: 'dhuhr', name: 'Dhuhr', nameAr: 'الظهر', time: '12:30' },
    { id: 'asr', name: 'Asr', nameAr: 'العصر', time: '15:45' },
    { id: 'maghrib', name: 'Maghrib', nameAr: 'المغرب', time: '18:30' },
    { id: 'isha', name: 'Isha', nameAr: 'العشاء', time: '20:00' },
  ]

  // Dhikr phrases
  const dhikrPhrases = [
    { id: 1, arabic: 'سبحان الله', transliteration: 'SubhanAllah', meaning: 'Glory be to Allah', count: 33 },
    { id: 2, arabic: 'الحمد لله', transliteration: 'Alhamdulillah', meaning: 'Praise be to Allah', count: 33 },
    { id: 3, arabic: 'الله أكبر', transliteration: 'Allahu Akbar', meaning: 'Allah is Greatest', count: 34 },
    { id: 4, arabic: 'لا إله إلا الله', transliteration: 'La ilaha illallah', meaning: 'There is no god but Allah', count: 100 },
    { id: 5, arabic: 'اللهم صل على محمد', transliteration: 'Allahumma salli ala Muhammad', meaning: 'O Allah, send blessings upon Muhammad', count: 10 },
  ]

  const getCurrentPrayer = () => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    for (let i = prayerTimes.length - 1; i >= 0; i--) {
      if (currentTime >= prayerTimes[i].time) {
        return prayerTimes[i].id
      }
    }
    return prayerTimes[prayerTimes.length - 1].id
  }

  const getNextPrayer = () => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    for (const prayer of prayerTimes) {
      if (currentTime < prayer.time) {
        return prayer
      }
    }
    return prayerTimes[0]
  }

  const incrementDhikr = (id: number) => {
    const dhikr = dhikrPhrases.find(d => d.id === id)
    if (!dhikr) return
    
    setDhikrCounts(prev => {
      const current = prev[id] || 0
      const next = current >= dhikr.count ? 0 : current + 1
      return { ...prev, [id]: next }
    })
  }

  const playAzan = (prayerId: string) => {
    if (isPlaying === prayerId) {
      setIsPlaying(null)
    } else {
      setIsPlaying(prayerId)
      setTimeout(() => setIsPlaying(null), 3000)
    }
  }

  const currentPrayer = getCurrentPrayer()
  const nextPrayer = getNextPrayer()

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Next Prayer Card */}
        <div className="p-4 bg-gradient-to-br from-[#2D5A27]/20 to-[#2D5A27]/5 rounded-2xl">
          <p className={cn('text-sm text-muted-foreground mb-1', isRTL && 'font-arabic')}>
            {isRTL ? 'الصلاة القادمة' : 'Next Prayer'}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={cn('text-2xl font-bold', isRTL && 'font-arabic')}>
                {isRTL ? nextPrayer.nameAr : nextPrayer.name}
              </h3>
              <p className="text-3xl font-mono font-bold text-[#2D5A27]">
                {nextPrayer.time}
              </p>
            </div>
            <button
              onClick={() => playAzan(nextPrayer.id)}
              className={cn(
                'h-14 w-14 rounded-full flex items-center justify-center transition-colors',
                isPlaying === nextPrayer.id 
                  ? 'bg-[#2D5A27] text-white' 
                  : 'bg-[#2D5A27]/10 text-[#2D5A27] hover:bg-[#2D5A27]/20'
              )}
            >
              {isPlaying === nextPrayer.id ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Prayer Times */}
        <div className="space-y-3">
          <h3 className={cn('font-semibold flex items-center gap-2', isRTL && 'font-arabic')}>
            <svg className="h-5 w-5 text-[#2D5A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {isRTL ? 'أوقات الصلاة' : 'Prayer Times'}
          </h3>
          <div className="space-y-2">
            {prayerTimes.map((prayer) => (
              <div
                key={prayer.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl transition-colors',
                  currentPrayer === prayer.id 
                    ? 'bg-[#2D5A27]/10 border border-[#2D5A27]/20' 
                    : 'bg-card'
                )}
              >
                <div className="flex items-center gap-3">
                  <Moon className={cn(
                    'h-5 w-5',
                    currentPrayer === prayer.id ? 'text-[#2D5A27]' : 'text-muted-foreground'
                  )} />
                  <span className={cn('font-medium', isRTL && 'font-arabic')}>
                    {isRTL ? prayer.nameAr : prayer.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold">{prayer.time}</span>
                  {settings.azanEnabled && (
                    <button
                      onClick={() => playAzan(prayer.id)}
                      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      {isPlaying === prayer.id ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M11 5L6 9H2v6h4l5 4V5z" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M11 5L6 9H2v6h4l5 4V5z" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Azan Style Selector */}
        <div className="space-y-3">
          <h3 className={cn('font-semibold', isRTL && 'font-arabic')}>
            {isRTL ? 'نوع الأذان' : 'Azan Style'}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(['mecca', 'medina', 'egypt'] as const).map((style) => (
              <button
                key={style}
                onClick={() => setSettings(s => ({ ...s, selectedAzanStyle: style }))}
                className={cn(
                  'py-2 px-3 rounded-xl text-sm font-medium transition-colors',
                  settings.selectedAzanStyle === style 
                    ? 'bg-[#2D5A27] text-white' 
                    : 'bg-card hover:bg-muted',
                  isRTL && 'font-arabic'
                )}
              >
                {style === 'mecca' ? (isRTL ? 'مكة' : 'Mecca') :
                 style === 'medina' ? (isRTL ? 'المدينة' : 'Medina') :
                 (isRTL ? 'مصر' : 'Egypt')}
              </button>
            ))}
          </div>
        </div>

        {/* Salat ala Nabi Toggle */}
        <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <p className="font-arabic font-semibold text-green-700 dark:text-green-400">
                  صل على النبي
                </p>
                <p className={cn('text-sm text-muted-foreground', isRTL && 'font-arabic')}>
                  {isRTL ? 'تذكير تلقائي' : 'Auto reminder'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, salatAlaNabi: !s.salatAlaNabi }))}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                settings.salatAlaNabi ? 'bg-green-500' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings.salatAlaNabi ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          {settings.salatAlaNabi && (
            <p className="text-center font-arabic text-lg text-green-700 dark:text-green-400 mt-3">
              اللهم صل وسلم على نبينا محمد
            </p>
          )}
        </div>

        {/* Dhikr Counter */}
        <div className="space-y-3">
          <h3 className={cn('font-semibold flex items-center gap-2', isRTL && 'font-arabic')}>
            <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {isRTL ? 'الأذكار' : 'Dhikr Counter'}
          </h3>
          <div className="space-y-2">
            {dhikrPhrases.map((dhikr) => (
              <motion.button
                key={dhikr.id}
                onClick={() => incrementDhikr(dhikr.id)}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 bg-card rounded-xl text-start active:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-arabic font-semibold">{dhikr.arabic}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#2D5A27]">
                      {dhikrCounts[dhikr.id] || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">/ {dhikr.count}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{dhikr.meaning}</p>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#2D5A27]"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${((dhikrCounts[dhikr.id] || 0) / dhikr.count) * 100}%` 
                    }}
                  />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Games Content Component (inline for this tab)
function GamesContent() {
  const { isRTL } = useLanguage()
  const { setActiveGame } = useChatStore()
  const [selectedGame, setSelectedGame] = React.useState<string | null>(null)

  const games = [
    {
      id: 'ludo',
      name: 'Sudanese Ludo',
      nameAr: 'لودو سوداني',
      description: 'Classic Ludo with Sudanese motifs',
      descriptionAr: 'لعبة اللودو الكلاسيكية بزخارف سودانية',
      color: 'bg-[#2D5A27]',
      players: '2-4',
      status: 'available' as const,
    },
    {
      id: 'dominoes',
      name: 'Dominoes',
      nameAr: 'دومينو',
      description: 'Traditional dominoes game',
      descriptionAr: 'لعبة الدومينو التقليدية',
      color: 'bg-amber-600',
      players: '2-4',
      status: 'coming_soon' as const,
    },
    {
      id: 'snakes',
      name: 'Snakes & Ladders',
      nameAr: 'الثعابين والسلالم',
      description: 'Fun for the whole family',
      descriptionAr: 'متعة لكل العائلة',
      color: 'bg-green-600',
      players: '2-6',
      status: 'coming_soon' as const,
    },
    {
      id: 'crosswords',
      name: 'Sudanese Crosswords',
      nameAr: 'الكلمات المتقاطعة',
      description: 'Local proverbs & riddles',
      descriptionAr: 'أمثال وألغاز سودانية',
      color: 'bg-blue-600',
      players: '1-2',
      status: 'coming_soon' as const,
    },
  ]

  const handlePlayGame = (gameId: string) => {
    if (games.find(g => g.id === gameId)?.status === 'coming_soon') {
      return
    }
    setSelectedGame(gameId)
    setActiveGame(gameId)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Gamepad2 className="h-6 w-6 text-[#2D5A27]" />
          <div>
            <h2 className={cn('text-lg font-semibold', isRTL && 'font-arabic')}>
              {isRTL ? 'ألعاب الونسة' : 'Al-Wansa Games'}
            </h2>
            <p className={cn('text-xs text-muted-foreground', isRTL && 'font-arabic')}>
              {isRTL ? 'العب مع أصدقائك' : 'Play with friends'}
            </p>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-2 gap-3">
          {games.map((game) => (
            <motion.button
              key={game.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePlayGame(game.id)}
              className={cn(
                'relative p-4 rounded-2xl text-start transition-all',
                game.status === 'coming_soon' 
                  ? 'bg-muted/50 opacity-60' 
                  : 'bg-card hover:shadow-lg'
              )}
            >
              {game.status === 'coming_soon' && (
                <span className={cn(
                  'absolute top-2 text-[10px] px-2 py-0.5 bg-muted rounded-full',
                  isRTL ? 'left-2' : 'right-2'
                )}>
                  {isRTL ? 'قريباً' : 'Soon'}
                </span>
              )}
              
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', game.color)}>
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              
              <h3 className={cn('font-semibold mb-1', isRTL && 'font-arabic')}>
                {isRTL ? game.nameAr : game.name}
              </h3>
              <p className={cn('text-xs text-muted-foreground mb-2', isRTL && 'font-arabic')}>
                {isRTL ? game.descriptionAr : game.description}
              </p>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>{game.players}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Selected Game (Ludo) */}
        {selectedGame === 'ludo' && (
          <LudoGameInline onClose={() => setSelectedGame(null)} />
        )}
      </div>
    </div>
  )
}

// Inline Ludo Game Component
function LudoGameInline({ onClose }: { onClose: () => void }) {
  const { isRTL } = useLanguage()
  const [diceValue, setDiceValue] = React.useState<number>(1)
  const [isRolling, setIsRolling] = React.useState(false)
  const [currentPlayer, setCurrentPlayer] = React.useState(0)
  const [showEffect, setShowEffect] = React.useState<string | null>(null)
  
  const players = [
    { color: 'bg-red-500', name: 'Player 1', nameAr: 'اللاعب ١' },
    { color: 'bg-blue-500', name: 'Player 2', nameAr: 'اللاعب ٢' },
    { color: 'bg-green-500', name: 'Player 3', nameAr: 'اللاعب ٣' },
    { color: 'bg-yellow-500', name: 'Player 4', nameAr: 'اللاعب ٤' },
  ]

  const soundEffects = {
    kill: ['بلبص!', 'الليلة ما تنوم!'],
    win: ['مكانا!', 'تسلم يا زول!'],
    six: ['سته يا سته!', 'يا سلام!'],
  }

  const rollDice = () => {
    if (isRolling) return
    
    setIsRolling(true)
    
    let rolls = 0
    const maxRolls = 10
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      rolls++
      
      if (rolls >= maxRolls) {
        clearInterval(interval)
        const finalValue = Math.floor(Math.random() * 6) + 1
        setDiceValue(finalValue)
        setIsRolling(false)
        
        if (finalValue === 6) {
          setShowEffect(soundEffects.six[Math.floor(Math.random() * soundEffects.six.length)])
          setTimeout(() => setShowEffect(null), 2000)
        }
        
        if (finalValue !== 6) {
          setTimeout(() => setCurrentPlayer((prev) => (prev + 1) % 4), 500)
        }
      }
    }, 100)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 mt-6"
    >
      {/* Game Header */}
      <div className="flex items-center justify-between">
        <h3 className={cn('font-semibold flex items-center gap-2', isRTL && 'font-arabic')}>
          <Gamepad2 className="h-5 w-5 text-[#2D5A27]" />
          {isRTL ? 'لودو سوداني' : 'Sudanese Ludo'}
        </h3>
        <button 
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Sound Effect Display */}
      <AnimatePresence>
        {showEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-center"
          >
            <span className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-2xl font-bold rounded-full font-arabic shadow-lg">
              {showEffect}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ludo Board */}
      <div className="aspect-square bg-gradient-to-br from-[#2D5A27]/5 to-amber-500/5 rounded-2xl p-4 border-2 border-[#2D5A27]/20 relative">
        {/* Corner homes */}
        <div className="absolute top-4 left-4 w-[38%] h-[38%] bg-red-500/20 rounded-xl border-2 border-red-500/50 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-red-500 rounded-full shadow-sm" />
            ))}
          </div>
        </div>
        <div className="absolute top-4 right-4 w-[38%] h-[38%] bg-blue-500/20 rounded-xl border-2 border-blue-500/50 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-blue-500 rounded-full shadow-sm" />
            ))}
          </div>
        </div>
        <div className="absolute bottom-4 left-4 w-[38%] h-[38%] bg-green-500/20 rounded-xl border-2 border-green-500/50 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-green-500 rounded-full shadow-sm" />
            ))}
          </div>
        </div>
        <div className="absolute bottom-4 right-4 w-[38%] h-[38%] bg-yellow-500/20 rounded-xl border-2 border-yellow-500/50 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm" />
            ))}
          </div>
        </div>

        {/* Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24%] h-[24%] bg-card rounded-xl border-2 border-[#2D5A27]/30 flex items-center justify-center">
          <svg className="h-8 w-8 text-[#2D5A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </div>

      {/* Players */}
      <div className="grid grid-cols-4 gap-2">
        {players.map((player, index) => (
          <div
            key={index}
            className={cn(
              'p-2 rounded-xl text-center transition-all',
              currentPlayer === index ? 'bg-card ring-2 ring-[#2D5A27]' : 'bg-muted/30'
            )}
          >
            <div className={cn('w-6 h-6 rounded-full mx-auto mb-1', player.color)} />
            <p className={cn('text-[10px]', isRTL && 'font-arabic')}>
              {isRTL ? player.nameAr : player.name}
            </p>
            {currentPlayer === index && (
              <svg className="h-3 w-3 mx-auto mt-1 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Dice & Roll Button */}
      <div className="flex items-center justify-center gap-4">
        <motion.div
          animate={isRolling ? { rotate: [0, 360] } : {}}
          transition={{ duration: 0.1, repeat: isRolling ? Infinity : 0 }}
          className="w-16 h-16 bg-card rounded-xl flex items-center justify-center border-2 border-[#2D5A27]/30 shadow-lg"
        >
          <span className="text-3xl font-bold text-[#2D5A27]">{diceValue}</span>
        </motion.div>
        
        <button
          onClick={rollDice}
          disabled={isRolling}
          className={cn(
            'px-8 py-3 rounded-full font-medium transition-colors',
            isRolling 
              ? 'bg-muted text-muted-foreground' 
              : 'bg-[#2D5A27] text-white hover:bg-[#2D5A27]/90',
            isRTL && 'font-arabic'
          )}
        >
          {isRolling ? (isRTL ? 'جاري...' : 'Rolling...') : (isRTL ? 'ارمي النرد' : 'Roll Dice')}
        </button>
      </div>
    </motion.div>
  )
}
