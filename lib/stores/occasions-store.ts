import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type OccasionColor = 'red' | 'black' | 'white' | 'green' | 'gold'
export type OccasionCategory =
  | 'sudanese'
  | 'islamic'
  | 'world'
  | 'personal'
  | 'birthday'
  | 'anniversary'
  | 'family'

export interface Occasion {
  id: string
  name: string
  nameAr: string
  /** Month 0-11 */
  month: number
  /** Day of month 1-31 */
  day: number
  /** Optional explicit year. Built-in Gregorian holidays recur every year (no year).
   *  Islamic holidays carry a year because they must be updated manually. */
  year?: number
  color: OccasionColor
  category: OccasionCategory
  /** Built-in occasions cannot be deleted (only their date can be edited). */
  isBuiltIn: boolean
  /** Recurring annually (re-computes to next year automatically once passed). */
  recurring: boolean
  notificationsEnabled: boolean
}

interface OccasionsState {
  occasions: Occasion[]
  /** Map of "occasionId-YYYY-MM-DD" -> true, so we don't notify twice for the same event/day. */
  notifiedKeys: Record<string, boolean>
  addOccasion: (occasion: Omit<Occasion, 'id'>) => void
  updateOccasion: (id: string, patch: Partial<Occasion>) => void
  deleteOccasion: (id: string) => void
  toggleNotifications: (id: string) => void
  markNotified: (key: string) => void
}

// Sudanese national holidays (recurring Gregorian)
const sudaneseOccasions: Occasion[] = [
  {
    id: 'sd-independence',
    name: 'Independence Day',
    nameAr: 'عيد الاستقلال',
    month: 0,
    day: 1,
    color: 'red',
    category: 'sudanese',
    isBuiltIn: true,
    recurring: true,
    notificationsEnabled: true,
  },
  {
    id: 'sd-december-revolution',
    name: 'December Revolution',
    nameAr: 'ثورة ديسمبر',
    month: 11,
    day: 19,
    color: 'black',
    category: 'sudanese',
    isBuiltIn: true,
    recurring: true,
    notificationsEnabled: true,
  },
  {
    id: 'sd-mothers-day',
    name: "Mother's Day",
    nameAr: 'يوم الأم',
    month: 2,
    day: 21,
    color: 'white',
    category: 'sudanese',
    isBuiltIn: true,
    recurring: true,
    notificationsEnabled: true,
  },
]

// Islamic holidays — Gregorian dates change yearly, so they carry an explicit year
// and are meant to be updated manually each year. Defaults are approximate for 1447/1448 AH.
const islamicOccasions: Occasion[] = [
  {
    id: 'is-eid-fitr',
    name: 'Eid Al-Fitr',
    nameAr: 'عيد الفطر',
    month: 2,
    day: 20,
    year: 2026,
    color: 'green',
    category: 'islamic',
    isBuiltIn: true,
    recurring: false,
    notificationsEnabled: true,
  },
  {
    id: 'is-arafah',
    name: 'Day of Arafah',
    nameAr: 'يوم عرفة',
    month: 4,
    day: 26,
    year: 2026,
    color: 'green',
    category: 'islamic',
    isBuiltIn: true,
    recurring: false,
    notificationsEnabled: true,
  },
  {
    id: 'is-eid-adha',
    name: 'Eid Al-Adha',
    nameAr: 'عيد الأضحى',
    month: 4,
    day: 27,
    year: 2026,
    color: 'green',
    category: 'islamic',
    isBuiltIn: true,
    recurring: false,
    notificationsEnabled: true,
  },
  {
    id: 'is-hijri-new-year',
    name: 'Hijri New Year',
    nameAr: 'رأس السنة الهجرية',
    month: 5,
    day: 16,
    year: 2026,
    color: 'green',
    category: 'islamic',
    isBuiltIn: true,
    recurring: false,
    notificationsEnabled: true,
  },
  {
    id: 'is-ashura',
    name: 'Ashura',
    nameAr: 'عاشوراء',
    month: 5,
    day: 25,
    year: 2026,
    color: 'black',
    category: 'islamic',
    isBuiltIn: true,
    recurring: false,
    notificationsEnabled: true,
  },
]

// World / humanitarian holidays (recurring Gregorian)
const worldOccasions: Occasion[] = [
  {
    id: 'wd-new-year',
    name: 'New Year',
    nameAr: 'رأس السنة الميلادية',
    month: 0,
    day: 1,
    color: 'red',
    category: 'world',
    isBuiltIn: true,
    recurring: true,
    notificationsEnabled: true,
  },
  {
    id: 'wd-christmas',
    name: 'Christmas',
    nameAr: 'عيد الميلاد',
    month: 11,
    day: 25,
    color: 'red',
    category: 'world',
    isBuiltIn: true,
    recurring: true,
    notificationsEnabled: true,
  },
]

export const defaultOccasions: Occasion[] = [
  ...sudaneseOccasions,
  ...islamicOccasions,
  ...worldOccasions,
]

export const useOccasionsStore = create<OccasionsState>()(
  persist(
    (set) => ({
      occasions: defaultOccasions,
      notifiedKeys: {},
      addOccasion: (occasion) =>
        set((state) => ({
          occasions: [
            ...state.occasions,
            { ...occasion, id: `personal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
          ],
        })),
      updateOccasion: (id, patch) =>
        set((state) => ({
          occasions: state.occasions.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
      deleteOccasion: (id) =>
        set((state) => ({
          // Built-in occasions can never be removed.
          occasions: state.occasions.filter((o) => o.id !== id || o.isBuiltIn),
        })),
      toggleNotifications: (id) =>
        set((state) => ({
          occasions: state.occasions.map((o) =>
            o.id === id ? { ...o, notificationsEnabled: !o.notificationsEnabled } : o
          ),
        })),
      markNotified: (key) =>
        set((state) => ({ notifiedKeys: { ...state.notifiedKeys, [key]: true } })),
    }),
    {
      name: 'rakobatna-occasions-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Merge persisted personal occasions with the latest built-in definitions
      // so built-in occasions stay in sync across app updates while keeping any
      // manual date edits the user made.
      merge: (persisted, current) => {
        const persistedState = (persisted as Partial<OccasionsState>) ?? {}
        const persistedOccasions = persistedState.occasions ?? []
        const personal = persistedOccasions.filter((o) => !o.isBuiltIn)
        const builtIn = defaultOccasions.map((def) => {
          const saved = persistedOccasions.find((o) => o.id === def.id)
          return saved
            ? {
                ...def,
                // preserve user-editable fields
                month: saved.month,
                day: saved.day,
                year: saved.year,
                notificationsEnabled: saved.notificationsEnabled,
              }
            : def
        })
        return {
          ...current,
          ...persistedState,
          occasions: [...builtIn, ...personal],
        }
      },
    }
  )
)

/**
 * Resolve the next relevant calendar date for an occasion.
 * - Recurring occasions roll forward to next year once their date has passed.
 * - Non-recurring (e.g. Islamic, one-off personal) keep their explicit date.
 */
export function getOccasionDate(occasion: Occasion, from: Date = new Date()): Date {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())

  if (occasion.recurring) {
    let candidate = new Date(today.getFullYear(), occasion.month, occasion.day)
    if (candidate < today) {
      candidate = new Date(today.getFullYear() + 1, occasion.month, occasion.day)
    }
    return candidate
  }

  const year = occasion.year ?? today.getFullYear()
  return new Date(year, occasion.month, occasion.day)
}

/** Whole days from today until the occasion date (negative if it already passed). */
export function getDaysUntil(occasion: Occasion, from: Date = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const date = getOccasionDate(occasion, from)
  const ms = date.getTime() - today.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}
