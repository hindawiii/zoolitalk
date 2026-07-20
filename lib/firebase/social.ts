'use client'

/**
 * Firestore-backed social graph (follow / unfollow).
 *
 * Data model
 * ----------
 * follows/{followerId}_{followingId}  -> { followerId, followingId, createdAt }
 * users/{uid}.followers               -> aggregate count
 * users/{uid}.following               -> aggregate count
 *
 * Follower/following counts are kept on the user documents (via increment) so
 * profiles can render them without extra reads.
 */

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirestoreAvailable } from '@/lib/firebase/config'

/** Deterministic id so a follow edge is unique per (follower, following) pair. */
function followEdgeId(followerId: string, followingId: string): string {
  return `${followerId}_${followingId}`
}

/** Whether `followerId` currently follows `followingId`. */
export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (!isFirestoreAvailable() || !db || !followerId || !followingId) return false
  try {
    const snap = await getDoc(doc(db, 'follows', followEdgeId(followerId, followingId)))
    return snap.exists()
  } catch (err) {
    console.error('[v0] isFollowing error:', err)
    return false
  }
}

/** Follow a user and bump both aggregate counts atomically. */
export async function followUser(
  followerId: string,
  followingId: string,
): Promise<void> {
  if (!isFirestoreAvailable() || !db || !followerId || !followingId) return
  if (followerId === followingId) return
  const edgeRef = doc(db, 'follows', followEdgeId(followerId, followingId))
  const existing = await getDoc(edgeRef)
  if (existing.exists()) return // already following — no double count

  const batch = writeBatch(db)
  batch.set(edgeRef, {
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  })
  batch.set(doc(db, 'users', followerId), { following: increment(1) }, { merge: true })
  batch.set(doc(db, 'users', followingId), { followers: increment(1) }, { merge: true })
  await batch.commit()
}

/** Unfollow a user and decrement both aggregate counts atomically. */
export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<void> {
  if (!isFirestoreAvailable() || !db || !followerId || !followingId) return
  const edgeRef = doc(db, 'follows', followEdgeId(followerId, followingId))
  const existing = await getDoc(edgeRef)
  if (!existing.exists()) return // not following — nothing to undo

  const batch = writeBatch(db)
  batch.delete(edgeRef)
  batch.set(doc(db, 'users', followerId), { following: increment(-1) }, { merge: true })
  batch.set(doc(db, 'users', followingId), { followers: increment(-1) }, { merge: true })
  await batch.commit()
}

/** All user ids the given user follows (used to hydrate local state on login). */
export async function fetchFollowingIds(followerId: string): Promise<string[]> {
  if (!isFirestoreAvailable() || !db || !followerId) return []
  try {
    const q = query(collection(db, 'follows'), where('followerId', '==', followerId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data().followingId as string).filter(Boolean)
  } catch (err) {
    console.error('[v0] fetchFollowingIds error:', err)
    return []
  }
}
