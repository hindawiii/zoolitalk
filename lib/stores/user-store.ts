import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirestoreAvailable } from '@/lib/firebase/config'
import type { FirebaseUser } from '@/lib/firebase/auth'
import * as social from '@/lib/firebase/social'

// Firestore rejects `undefined` field values, which was throwing during the
// very first sign-in (the base profile has an undefined `gender`). Strip any
// undefined keys before writing so profile creation/sync succeeds.
function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value
  }
  return out as Partial<T>
}

export type Gender = 'male' | 'female'
export type SocialStatus = 'single' | 'taken' | 'engaged' | 'married' | 'complicated' | 'gave_up'
export type ProfessionalStatus = 'student' | 'employee' | 'freelancer' | 'unemployed'
export type UserRank = 'lion' | 'knight' | 'advisor' | 'newbie'

export interface User {
  id: string
  username?: string
  name: string
  nameAr: string
  nickname?: string // اللقب - e.g., "هنداوي"
  email: string
  phone: string
  avatar: string
  coverPhoto: string
  bio: string
  bioAr: string
  zoolPoints: number
  followers: number
  following: number
  postsCount: number
  isOnline: boolean
  lastSeen: Date | null
  isVerified?: boolean
  location?: string
  // Gender for Arabic feminization
  gender?: Gender
  // New Sudanese Identity Fields
  socialStatus?: SocialStatus
  professionalStatus?: ProfessionalStatus
  rank?: UserRank
  rankTitle?: string // أسد/لبوة، فارس/فارسة، ناصح/ناصحة، راسطة
  // Gifts received
  gifts?: ReceivedGift[]
  // Featured posts (highlights)
  featuredPosts?: FeaturedPost[]
}

export interface ReceivedGift {
  id: string
  giftType: string
  giftName: string
  giftNameAr: string
  giftEmoji: string
  senderName?: string
  senderNameAr?: string
  isPrivate: boolean // فاعل خير
  receivedAt: Date
}

export interface FeaturedPost {
  id: string
  thumbnail: string
  likes: number
  comments: number
}

export interface BlockedUser {
  id: string
  name: string
  avatar: string
  blockedAt: Date
}

interface UserState {
  // Current user
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  updateProfile: (updates: Partial<User>) => void
  
  // Sync profile to Firestore
  syncProfileToFirestore: () => Promise<void>
  fetchUserProfile: (userId: string) => Promise<User | null>
  
  // Viewed user profile (for viewing other users)
  viewedUser: User | null
  setViewedUser: (user: User | null) => void
  loadUserProfile: (userId: string) => Promise<void>
  
  // Authentication
  isAuthenticated: boolean
  setAuthenticated: (auth: boolean) => void
  // True until the first Firebase auth-state callback resolves
  authLoading: boolean
  // Build/load the real profile from a signed-in Firebase user
  hydrateFromFirebaseUser: (fbUser: FirebaseUser) => Promise<void>
  // Create a local session when Firebase is not configured (demo mode)
  hydrateDemoUser: (info: { name?: string; email?: string; phone?: string }) => void
  // Clear session (on sign-out / no user)
  clearAuth: () => void
  
  // Blocked users
  blockedUsers: BlockedUser[]
  blockUser: (user: BlockedUser) => void
  unblockUser: (userId: string) => void
  isBlocked: (userId: string) => boolean
  
  // Zool Points
  addZoolPoints: (points: number) => void
  
  // Following
  followUser: (userId: string) => void
  unfollowUser: (userId: string) => void
  toggleFollow: (userId: string) => Promise<void>
  isFollowing: (userId: string) => boolean
  hydrateFollowing: () => Promise<void>
  followingIds: string[]
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // No demo user. The real profile is loaded from Firebase/Firestore.
      currentUser: null,
      setCurrentUser: (currentUser) => set({ currentUser }),
      updateProfile: (updates) => {
        set((state) => ({
          currentUser: state.currentUser 
            ? { ...state.currentUser, ...updates }
            : null
        }))
        // Auto-sync to Firestore when profile is updated
        const { syncProfileToFirestore } = get()
        syncProfileToFirestore()
      },
      
      // Sync current user profile to Firestore
      syncProfileToFirestore: async () => {
        const { currentUser } = get()
        if (!currentUser || !isFirestoreAvailable() || !db) {
          console.log('[v0] Cannot sync profile - no user or Firestore not available')
          return
        }
        
        try {
          const userRef = doc(db, 'users', currentUser.id)
          await setDoc(userRef, {
            ...stripUndefined({
              id: currentUser.id,
              username: currentUser.username,
              name: currentUser.name,
              nameAr: currentUser.nameAr,
              nickname: currentUser.nickname,
              avatar: currentUser.avatar,
              bio: currentUser.bio,
              bioAr: currentUser.bioAr,
              gender: currentUser.gender,
              location: currentUser.location,
              socialStatus: currentUser.socialStatus,
              professionalStatus: currentUser.professionalStatus,
              rank: currentUser.rank,
              rankTitle: currentUser.rankTitle,
              isVerified: currentUser.isVerified,
              isOnline: currentUser.isOnline,
            }),
            lastSeen: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true })
          console.log('[v0] Profile synced to Firestore successfully')
        } catch (error) {
          console.error('[v0] Error syncing profile to Firestore:', error)
        }
      },
      
      // Fetch a user profile from Firestore
      fetchUserProfile: async (userId: string): Promise<User | null> => {
        if (!isFirestoreAvailable() || !db) {
          console.log('[v0] Firestore not available - cannot fetch user profile')
          return null
        }
        
        try {
          const userRef = doc(db, 'users', userId)
          const userDoc = await getDoc(userRef)
          
          if (userDoc.exists()) {
            const data = userDoc.data()
            return {
              id: data.id,
              username: data.username,
              name: data.name,
              nameAr: data.nameAr,
              nickname: data.nickname,
              email: data.email || '',
              phone: data.phone || '',
              avatar: data.avatar,
              coverPhoto: data.coverPhoto || '/covers/default.jpg',
              bio: data.bio,
              bioAr: data.bioAr,
              zoolPoints: data.zoolPoints || 0,
              followers: data.followers || 0,
              following: data.following || 0,
              postsCount: data.postsCount || 0,
              isOnline: data.isOnline || false,
              lastSeen: data.lastSeen?.toDate?.() || null,
              isVerified: data.isVerified,
              location: data.location,
              gender: data.gender,
              socialStatus: data.socialStatus,
              professionalStatus: data.professionalStatus,
              rank: data.rank,
              rankTitle: data.rankTitle,
            } as User
          }
          return null
        } catch (error) {
          console.error('[v0] Error fetching user profile:', error)
          return null
        }
      },
      
      // Viewed user for profile page
      viewedUser: null,
      setViewedUser: (viewedUser) => set({ viewedUser }),
      
      // Load a user profile
      loadUserProfile: async (userId: string) => {
        const { fetchUserProfile, setViewedUser } = get()
        const user = await fetchUserProfile(userId)
        setViewedUser(user)
      },
      
      isAuthenticated: false, // Start at the login screen
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      // Gate the UI until Firebase reports the initial auth state
      authLoading: true,

      // Load (or create) the real profile for a signed-in Firebase user
      hydrateFromFirebaseUser: async (fbUser: FirebaseUser) => {
        const uid = fbUser.uid

        // Fallback profile built purely from the Firebase user, used when
        // Firestore is unavailable or the document does not exist yet.
        const displayName =
          fbUser.displayName?.trim() ||
          fbUser.email?.split('@')[0] ||
          'زول جديد'

        const baseProfile: User = {
          id: uid,
          username: fbUser.email?.split('@')[0] || uid.slice(0, 8),
          name: displayName,
          nameAr: displayName,
          nickname: displayName,
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '',
          avatar: fbUser.photoURL || '/avatars/default.jpg',
          coverPhoto: '/covers/default.jpg',
          bio: '',
          bioAr: '',
          zoolPoints: 0,
          followers: 0,
          following: 0,
          postsCount: 0,
          isOnline: true,
          lastSeen: null,
          isVerified: false,
          location: '',
          gender: undefined,
          rank: 'newbie',
          rankTitle: 'زول جديد',
        }

        // If Firestore isn't available, just use the base profile locally.
        if (!isFirestoreAvailable() || !db) {
          set({ currentUser: baseProfile, isAuthenticated: true, authLoading: false })
          return
        }

        try {
          const userRef = doc(db, 'users', uid)
          const snap = await getDoc(userRef)

          if (snap.exists()) {
            // Merge stored profile over the base so new fields have defaults.
            const data = snap.data()
            const merged: User = {
              ...baseProfile,
              ...data,
              id: uid,
              email: fbUser.email || data.email || '',
              phone: fbUser.phoneNumber || data.phone || '',
              lastSeen: data.lastSeen?.toDate?.() ?? null,
            } as User
            set({ currentUser: merged, isAuthenticated: true, authLoading: false })
            void get().hydrateFollowing()
          } else {
            // First sign-in: create the profile document in Firestore.
            await setDoc(userRef, {
              ...stripUndefined(baseProfile),
              lastSeen: serverTimestamp(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
            set({ currentUser: baseProfile, isAuthenticated: true, authLoading: false })
          }
        } catch (error) {
          console.error('[v0] Error hydrating profile from Firestore:', error)
          set({ currentUser: baseProfile, isAuthenticated: true, authLoading: false })
        }
      },

      // Create a local session when Firebase keys are not configured.
      // This gives the app a real `currentUser` so publishing posts/stories/
      // listings works in demo mode instead of silently aborting.
      hydrateDemoUser: (info) => {
        const displayName =
          info.name?.trim() ||
          info.email?.split('@')[0]?.trim() ||
          'زول جديد'
        const id = `demo_${Date.now().toString(36)}`
        const demoUser: User = {
          id,
          username: info.email?.split('@')[0] || id,
          name: displayName,
          nameAr: displayName,
          nickname: displayName,
          email: info.email || '',
          phone: info.phone || '',
          avatar: '/avatars/default.jpg',
          coverPhoto: '/covers/default.jpg',
          bio: '',
          bioAr: '',
          zoolPoints: 0,
          followers: 0,
          following: 0,
          postsCount: 0,
          isOnline: true,
          lastSeen: null,
          isVerified: false,
          location: '',
          gender: undefined,
          rank: 'newbie',
          rankTitle: 'زول جديد',
        }
        set({ currentUser: demoUser, isAuthenticated: true, authLoading: false })
      },

      // Clear the session when Firebase reports no user
      clearAuth: () =>
        set({ currentUser: null, isAuthenticated: false, authLoading: false }),
      
      blockedUsers: [],
      blockUser: (user) => 
        set((state) => ({
          blockedUsers: [...state.blockedUsers, user]
        })),
      unblockUser: (userId) =>
        set((state) => ({
          blockedUsers: state.blockedUsers.filter(u => u.id !== userId)
        })),
      isBlocked: (userId) => get().blockedUsers.some(u => u.id === userId),
      
      addZoolPoints: (points) =>
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, zoolPoints: state.currentUser.zoolPoints + points }
            : null
        })),
      
      followingIds: [],
      isFollowing: (userId) => get().followingIds.includes(userId),

      // Optimistic local follow (used by toggleFollow after Firestore write).
      followUser: (userId) =>
        set((state) => ({
          followingIds: state.followingIds.includes(userId)
            ? state.followingIds
            : [...state.followingIds, userId],
          currentUser: state.currentUser
            ? { ...state.currentUser, following: state.currentUser.following + 1 }
            : null
        })),
      unfollowUser: (userId) =>
        set((state) => ({
          followingIds: state.followingIds.filter(id => id !== userId),
          currentUser: state.currentUser
            ? { ...state.currentUser, following: Math.max(0, state.currentUser.following - 1) }
            : null
        })),

      // Toggle follow with optimistic UI + Firestore persistence (updates both
      // users' aggregate counts). Rolls back the local state if the write fails.
      toggleFollow: async (userId) => {
        const { currentUser, followingIds, followUser, unfollowUser } = get()
        if (!currentUser || currentUser.id === userId) return
        const wasFollowing = followingIds.includes(userId)

        // Optimistic update
        if (wasFollowing) unfollowUser(userId)
        else followUser(userId)

        try {
          if (wasFollowing) await social.unfollowUser(currentUser.id, userId)
          else await social.followUser(currentUser.id, userId)
        } catch (err) {
          console.error('[v0] toggleFollow failed, rolling back:', err)
          // Roll back on failure
          if (wasFollowing) followUser(userId)
          else unfollowUser(userId)
        }
      },

      // Load the real following list from Firestore after sign-in.
      hydrateFollowing: async () => {
        const { currentUser } = get()
        if (!currentUser) return
        const ids = await social.fetchFollowingIds(currentUser.id)
        set({ followingIds: ids })
      },
    }),
    {
      name: 'rakobatna-user-storage',
      storage: createJSONStorage(() => localStorage),
      // Bumped to wipe old demo-user / stale-auth data from returning users.
      version: 2,
      migrate: () => ({
        currentUser: null,
        isAuthenticated: false,
        blockedUsers: [],
        followingIds: [],
      }),
      // Do NOT persist isAuthenticated — Firebase is the source of truth.
      partialize: (state) => ({
        blockedUsers: state.blockedUsers,
        followingIds: state.followingIds,
      }),
    }
  )
)
