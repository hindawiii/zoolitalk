'use client'

import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut as fbSignOut,
  type ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { isFirebaseConfigured } from '@/lib/firebase/config'

export { isFirebaseConfigured }

/**
 * Control how long the signed-in session survives.
 *
 * - `remember: true`  → browserLocalPersistence: the user stays signed in
 *   across full page reloads AND after closing/reopening the app.
 * - `remember: false` → browserSessionPersistence: the session survives a
 *   refresh within the same tab but is cleared once the app/tab is closed.
 *
 * We set this explicitly (instead of relying on the IndexedDB default) because
 * the default `indexedDBLocalPersistence` can silently fall back to in-memory
 * inside sandboxed/partitioned iframes — which is what made refreshing drop the
 * user back to the login screen. localStorage-based persistence is reliable
 * there, so choosing it keeps people signed in after a refresh.
 */
export async function setAuthPersistence(remember: boolean): Promise<void> {
  if (!auth) return
  try {
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    )
  } catch (err) {
    console.error('[v0] Failed to set auth persistence:', err)
  }
}

/**
 * Translate common Firebase auth error codes into friendly Arabic messages.
 */
export function authErrorMessage(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : ''

  switch (code) {
    case 'auth/invalid-email':
      return 'البريد الإلكتروني غير صحيح'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'البريد أو كلمة السر غير صحيحة'
    case 'auth/email-already-in-use':
      return 'البريد ده مستخدم من قبل'
    case 'auth/weak-password':
      return 'كلمة السر ضعيفة (6 أحرف على الأقل)'
    case 'auth/too-many-requests':
      return 'محاولات كتيرة، جرّب تاني بعد شوية'
    case 'auth/invalid-phone-number':
      return 'رقم الهاتف غير صحيح'
    case 'auth/invalid-verification-code':
      return 'رمز التحقق غير صحيح'
    case 'auth/code-expired':
      return 'انتهت صلاحية الرمز، اطلب رمز جديد'
    case 'auth/popup-closed-by-user':
      return 'تم إغلاق نافذة الدخول'
    case 'auth/account-exists-with-different-credential':
      return 'الحساب موجود بطريقة دخول مختلفة'
    case 'auth/operation-not-allowed':
      return 'طريقة الدخول دي غير مفعّلة في المشروع'
    default:
      return 'حصل خطأ، حاول تاني'
  }
}

/* ----------------------- Email / Password ----------------------- */

export async function emailSignIn(email: string, password: string): Promise<FirebaseUser> {
  if (!auth) throw new Error('auth/unconfigured')
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function emailSignUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<FirebaseUser> {
  if (!auth) throw new Error('auth/unconfigured')
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(cred.user, { displayName })
  }
  return cred.user
}

/* ----------------------- OAuth Providers ----------------------- */

export async function googleSignIn(): Promise<FirebaseUser> {
  if (!auth) throw new Error('auth/unconfigured')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const cred = await signInWithPopup(auth, provider)
  return cred.user
}

export async function facebookSignIn(): Promise<FirebaseUser> {
  if (!auth) throw new Error('auth/unconfigured')
  const provider = new FacebookAuthProvider()
  const cred = await signInWithPopup(auth, provider)
  return cred.user
}

/* ----------------------- Phone (SMS OTP) ----------------------- */

let recaptchaVerifier: RecaptchaVerifier | null = null

/**
 * Create (once) an invisible reCAPTCHA verifier bound to a container element.
 * Firebase phone auth REQUIRES this to prevent abuse.
 */
export function getRecaptcha(containerId: string): RecaptchaVerifier {
  if (!auth) throw new Error('auth/unconfigured')
  if (recaptchaVerifier) return recaptchaVerifier

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  })
  return recaptchaVerifier
}

/** Reset the verifier (needed before re-sending after certain errors). */
export function resetRecaptcha() {
  try {
    recaptchaVerifier?.clear()
  } catch {
    /* ignore */
  }
  recaptchaVerifier = null
}

/**
 * Send an SMS code. `phoneE164` must be in full international format, e.g. +249912345678.
 */
export async function sendPhoneCode(
  phoneE164: string,
  containerId: string,
): Promise<ConfirmationResult> {
  if (!auth) throw new Error('auth/unconfigured')
  const verifier = getRecaptcha(containerId)
  return signInWithPhoneNumber(auth, phoneE164, verifier)
}

/**
 * Confirm an SMS code. On phone sign-up we also persist the display name the
 * user typed, since phone auth does not capture it automatically.
 */
export async function confirmPhoneCode(
  confirmation: ConfirmationResult,
  code: string,
  displayName?: string,
): Promise<FirebaseUser> {
  const cred = await confirmation.confirm(code)
  if (displayName && !cred.user.displayName) {
    try {
      await updateProfile(cred.user, { displayName })
    } catch {
      /* non-fatal: profile will fall back to the phone number */
    }
  }
  return cred.user
}

/* ----------------------- Session ----------------------- */

export async function signOutUser(): Promise<void> {
  if (!auth) return
  await fbSignOut(auth)
}

export function watchAuth(cb: (user: FirebaseUser | null) => void): () => void {
  if (!auth) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(auth, cb)
}

export type { FirebaseUser, ConfirmationResult }
