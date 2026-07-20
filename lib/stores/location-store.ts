import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type LocationStatus =
  | 'idle' // not requested yet
  | 'prompting' // waiting for the browser permission dialog / fix
  | 'granted' // we have coordinates
  | 'denied' // user refused permission
  | 'unavailable' // no geolocation support or hardware failure

export interface Coords {
  lat: number
  lng: number
  accuracy?: number
}

interface LocationState {
  status: LocationStatus
  coords: Coords | null
  city: string | null
  cityAr: string | null
  error: string | null
  lastUpdated: number | null
  /** Ask the browser for the user's current position (one-shot). */
  requestLocation: () => Promise<Coords | null>
  /** Straight-line distance (km) from the user to a target point. */
  distanceKm: (lat: number, lng: number) => number | null
  clear: () => void
}

/** Haversine great-circle distance in kilometers. */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Reverse-geocode coordinates into a human-readable city using the free
 * BigDataCloud client endpoint (no API key required). Best-effort only.
 */
async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ city: string; cityAr: string } | null> {
  try {
    const [en, ar] = await Promise.all([
      fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      ).then((r) => (r.ok ? r.json() : null)),
      fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`,
      ).then((r) => (r.ok ? r.json() : null)),
    ])
    const city =
      en?.city || en?.locality || en?.principalSubdivision || en?.countryName || ''
    const cityAr =
      ar?.city || ar?.locality || ar?.principalSubdivision || ar?.countryName || city
    if (!city && !cityAr) return null
    return { city: city || cityAr, cityAr: cityAr || city }
  } catch {
    return null
  }
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      coords: null,
      city: null,
      cityAr: null,
      error: null,
      lastUpdated: null,

      requestLocation: () => {
        // Guard: geolocation must exist and requires a secure context.
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
          set({ status: 'unavailable', error: 'المتصفح لا يدعم تحديد الموقع' })
          return Promise.resolve(null)
        }

        set({ status: 'prompting', error: null })

        return new Promise<Coords | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const coords: Coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
              }
              set({
                coords,
                status: 'granted',
                error: null,
                lastUpdated: Date.now(),
              })
              // Resolve non-city name in the background so callers aren't blocked.
              void reverseGeocode(coords.lat, coords.lng).then((place) => {
                if (place) set({ city: place.city, cityAr: place.cityAr })
              })
              resolve(coords)
            },
            (err) => {
              const denied = err.code === err.PERMISSION_DENIED
              set({
                status: denied ? 'denied' : 'unavailable',
                error: denied
                  ? 'تم رفض إذن الموقع. فعّله من إعدادات المتصفح.'
                  : 'تعذّر تحديد موقعك، حاول مرة أخرى.',
              })
              resolve(null)
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5 * 60 * 1000, // accept a cached fix up to 5 min old
            },
          )
        })
      },

      distanceKm: (lat, lng) => {
        const { coords } = get()
        if (!coords) return null
        return haversineKm(coords.lat, coords.lng, lat, lng)
      },

      clear: () =>
        set({
          status: 'idle',
          coords: null,
          city: null,
          cityAr: null,
          error: null,
          lastUpdated: null,
        }),
    }),
    {
      name: 'rakobatna-location-storage',
      storage: createJSONStorage(() => localStorage),
      // Cache the last known fix so features work instantly on return visits.
      partialize: (state) => ({
        coords: state.coords,
        city: state.city,
        cityAr: state.cityAr,
        status: state.status === 'granted' ? 'granted' : 'idle',
        lastUpdated: state.lastUpdated,
      }),
    },
  ),
)

/** Format a km distance the Sudanese way (متر / كم). */
export function formatDistanceAr(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} متر`
  if (km < 10) return `${km.toFixed(1)} كم`
  return `${Math.round(km)} كم`
}
