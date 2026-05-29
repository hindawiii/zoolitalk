import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Language = 'ar' | 'en'
export type TabId = 'wansa' | 'saha' | 'souq' | 'news' | 'profile'
export type GameId = 'siga' | 'card-50' | 'crossword' | 'ludo' | 'dominoes'

export interface MinimizedGame {
  id: GameId
  name: string
  nameAr: string
  icon: string
  state?: Record<string, unknown> // Game-specific state
}

interface AppState {
  // Language & RTL
  language: Language
  setLanguage: (lang: Language) => void
  
  // Navigation
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  
  // Profile viewing (for viewing other users' profiles)
  viewingUserId: string | null
  setViewingUserId: (userId: string | null) => void
  openUserProfile: (userId: string) => void
  
  // Settings drawer
  isSettingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  
  // Gift overlay
  activeGift: GiftType | null
  giftSender: string | null
  showGift: (gift: GiftType, sender: string) => void
  hideGift: () => void
  triggerGift: (gift: GiftType, sender: string) => void
  
  // Data saver mode
  dataSaverEnabled: boolean
  setDataSaver: (enabled: boolean) => void
  
  // Online status visibility
  showOnlineStatus: boolean
  setShowOnlineStatus: (show: boolean) => void
  
  // Minimized game (Gamza multitasking)
  minimizedGame: MinimizedGame | null
  minimizeGame: (game: MinimizedGame) => void
  restoreGame: () => MinimizedGame | null
  closeMinimizedGame: () => void
}

export type GiftType = 'jabana' | 'crown' | 'shield' | 'heart' | 'star' | string

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Language defaults to Arabic
      language: 'ar',
      setLanguage: (language) => set({ language }),
      
      // Default tab is Al-Wansa (chat)
      activeTab: 'wansa',
      setActiveTab: (activeTab) => set({ activeTab }),
      
      // Profile viewing
      viewingUserId: null,
      setViewingUserId: (viewingUserId) => set({ viewingUserId }),
      openUserProfile: (userId) => {
        set({ viewingUserId: userId, activeTab: 'profile' })
      },
      
      // Settings drawer
      isSettingsOpen: false,
      setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
      
      // Gift overlay
      activeGift: null,
      giftSender: null,
      showGift: (gift, sender) => set({ activeGift: gift, giftSender: sender }),
      hideGift: () => set({ activeGift: null, giftSender: null }),
      triggerGift: (gift, sender) => {
        set({ activeGift: gift, giftSender: sender })
        // Auto-hide after animation
        setTimeout(() => set({ activeGift: null, giftSender: null }), 4000)
      },
      
      // Data saver (default on for Sudan's network conditions)
      dataSaverEnabled: true,
      setDataSaver: (dataSaverEnabled) => set({ dataSaverEnabled }),
      
      // Online status
      showOnlineStatus: true,
      setShowOnlineStatus: (showOnlineStatus) => set({ showOnlineStatus }),
      
      // Minimized game
      minimizedGame: null,
      minimizeGame: (game) => set({ minimizedGame: game }),
      restoreGame: () => {
        const { minimizedGame } = get()
        set({ minimizedGame: null })
        return minimizedGame
      },
      closeMinimizedGame: () => set({ minimizedGame: null }),
    }),
    {
      name: 'rakobatna-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        activeTab: state.activeTab,
        dataSaverEnabled: state.dataSaverEnabled,
        showOnlineStatus: state.showOnlineStatus,
      }),
    }
  )
)
