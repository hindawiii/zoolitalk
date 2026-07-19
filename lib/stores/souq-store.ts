import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, isFirestoreAvailable } from '@/lib/firebase/config'

export type ListingCategory = 
  | 'vehicles' // عربات
  | 'rickshaws' // ركشات
  | 'property' // عقارات
  | 'electronics' // إلكترونيات
  | 'furniture' // أثاث
  | 'clothes' // ملابس
  | 'services' // خدمات
  | 'other' // أخرى

export interface Listing {
  id: string
  sellerId: string
  sellerName: string
  sellerAvatar: string
  sellerPhone: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  category: ListingCategory
  price: number
  currency: 'SDG' | 'USD'
  images: string[]
  location: string
  locationAr: string
  isBarter: boolean // للمقايضة
  barterFor?: string // مقايضة بـ
  isAuction: boolean
  auctionEndTime?: Date
  currentBid?: number
  highestBidderId?: string
  views: number
  isFavorite?: boolean
  timestamp: Date
  status: 'active' | 'sold' | 'expired'
}

export interface Bid {
  id: string
  listingId: string
  bidderId: string
  bidderName: string
  amount: number
  timestamp: Date
}

interface SouqState {
  // Listings
  listings: Listing[]
  setListings: (listings: Listing[]) => void
  addListing: (listing: Listing) => void
  addListingToFirestore: (listing: Omit<Listing, 'id' | 'timestamp' | 'views' | 'status'>) => Promise<void>
  subscribeToFirestoreListings: () => () => void
  updateListing: (id: string, updates: Partial<Listing>) => void

  // Firebase connection status
  firebaseStatus: 'unconfigured' | 'connecting' | 'connected' | 'error'
  firebaseError: string | null
  isLoading: boolean
  
  // Filters
  activeCategory: ListingCategory | 'all'
  setActiveCategory: (category: ListingCategory | 'all') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  showBarterOnly: boolean
  setShowBarterOnly: (show: boolean) => void
  showAuctionsOnly: boolean
  setShowAuctionsOnly: (show: boolean) => void
  
  // Favorites
  favorites: string[]
  toggleFavorite: (listingId: string) => void
  
  // Auctions
  bids: Record<string, Bid[]>
  placeBid: (listingId: string, bid: Bid) => void
  
  // Posting flow
  draftListing: Partial<Listing> | null
  setDraftListing: (draft: Partial<Listing> | null) => void
  postingStep: 1 | 2 | 3
  setPostingStep: (step: 1 | 2 | 3) => void
}

export const useSouqStore = create<SouqState>()(
  persist(
    (set, get) => ({
      listings: [],
      firebaseStatus: 'connecting',
      firebaseError: null,
      isLoading: false,
      setListings: (listings) => set({ listings }),
      addListing: (listing) => set((state) => ({ listings: [listing, ...state.listings] })),

      // Add a new listing to Firestore (source of truth)
      addListingToFirestore: async (listing) => {
        if (!isFirestoreAvailable() || !db) {
          throw new Error('firestore/unconfigured')
        }
        const listingsRef = collection(db, 'listings')
        await addDoc(listingsRef, {
          ...listing,
          views: 0,
          status: 'active',
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
        })
        console.log('[v0] Listing added to Firestore successfully')
      },

      // Subscribe to real-time Firestore listings
      subscribeToFirestoreListings: () => {
        if (!isFirestoreAvailable() || !db) {
          console.warn('[v0] Firestore not configured - no listings available')
          set({ listings: [], isLoading: false, firebaseStatus: 'unconfigured' })
          return () => {}
        }

        console.log('[v0] Subscribing to Firestore listings...')
        set({ isLoading: true, firebaseStatus: 'connecting' })
        const listingsRef = collection(db, 'listings')
        const q = query(listingsRef, orderBy('timestamp', 'desc'))

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const firestoreListings: Listing[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data()
              return {
                id: docSnap.id,
                sellerId: data.sellerId || '',
                sellerName: data.sellerName || '',
                sellerAvatar: data.sellerAvatar || '',
                sellerPhone: data.sellerPhone || '',
                title: data.title || '',
                titleAr: data.titleAr || data.title || '',
                description: data.description || '',
                descriptionAr: data.descriptionAr || data.description || '',
                category: data.category || 'other',
                price: data.price || 0,
                currency: data.currency || 'SDG',
                images: data.images || [],
                location: data.location || '',
                locationAr: data.locationAr || data.location || '',
                isBarter: data.isBarter || false,
                barterFor: data.barterFor,
                isAuction: data.isAuction || false,
                auctionEndTime: data.auctionEndTime?.toDate?.(),
                currentBid: data.currentBid,
                highestBidderId: data.highestBidderId,
                views: data.views || 0,
                timestamp: data.timestamp?.toDate?.() || new Date(),
                status: data.status || 'active',
              }
            })
            set({ listings: firestoreListings, isLoading: false, firebaseStatus: 'connected', firebaseError: null })
          },
          (error) => {
            console.error('[v0] Error subscribing to Firestore listings:', error)
            set({ isLoading: false, firebaseStatus: 'error', firebaseError: error.message })
          },
        )

        return unsubscribe
      },
      updateListing: (id, updates) =>
        set((state) => ({
          listings: state.listings.map(l => (l.id === id ? { ...l, ...updates } : l)),
        })),
      
      activeCategory: 'all',
      setActiveCategory: (activeCategory) => set({ activeCategory }),
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      showBarterOnly: false,
      setShowBarterOnly: (showBarterOnly) => set({ showBarterOnly }),
      showAuctionsOnly: false,
      setShowAuctionsOnly: (showAuctionsOnly) => set({ showAuctionsOnly }),
      
      favorites: [],
      toggleFavorite: (listingId) =>
        set((state) => ({
          favorites: state.favorites.includes(listingId)
            ? state.favorites.filter(id => id !== listingId)
            : [...state.favorites, listingId],
        })),
      
      bids: {},
      placeBid: (listingId, bid) =>
        set((state) => ({
          bids: {
            ...state.bids,
            [listingId]: [...(state.bids[listingId] || []), bid],
          },
          listings: state.listings.map(l =>
            l.id === listingId
              ? { ...l, currentBid: bid.amount, highestBidderId: bid.bidderId }
              : l
          ),
        })),
      
      draftListing: null,
      setDraftListing: (draftListing) => set({ draftListing }),
      postingStep: 1,
      setPostingStep: (postingStep) => set({ postingStep }),
    }),
    {
      name: 'rakobatna-souq-storage',
      storage: createJSONStorage(() => localStorage),
      // Listings come live from Firestore; only keep user-local prefs cached.
      partialize: (state) => ({
        favorites: state.favorites,
        bids: state.bids,
      }),
    }
  )
)

// Category labels
export const categoryLabels: Record<ListingCategory, { en: string; ar: string }> = {
  vehicles: { en: 'Vehicles', ar: 'عربات' },
  rickshaws: { en: 'Rickshaws', ar: 'ركشات' },
  property: { en: 'Property', ar: 'عقارات' },
  electronics: { en: 'Electronics', ar: 'إلكترونيات' },
  furniture: { en: 'Furniture', ar: 'أثاث' },
  clothes: { en: 'Clothes', ar: 'ملابس' },
  services: { en: 'Services', ar: 'خدمات' },
  other: { en: 'Other', ar: 'أخرى' },
}
