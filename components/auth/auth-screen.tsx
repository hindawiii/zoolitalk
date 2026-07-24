'use client'

import * as React from 'react'
import { Mail, Lock, User, Eye, EyeOff, Coffee, Phone, ArrowRight } from 'lucide-react'
import { RakobaLogo } from '@/components/ui/rakoba-logo'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { CountryCodePicker } from '@/components/auth/country-code-picker'
import { DEFAULT_COUNTRY, findCountryByIso, type Country } from '@/lib/data/countries'
import { useUserStore } from '@/lib/stores/user-store'
import { cn } from '@/lib/utils'
import {
  isFirebaseConfigured,
  emailSignIn,
  emailSignUp,
  googleSignIn,
  facebookSignIn,
  sendPhoneCode,
  confirmPhoneCode,
  resetRecaptcha,
  authErrorMessage,
  setAuthPersistence,
  type ConfirmationResult,
} from '@/lib/firebase/auth'

const REMEMBER_KEY = 'rakobatna-remember-session'

type Mode = 'signin' | 'signup'
type Method = 'email' | 'phone'
type PhoneStep = 'enter' | 'otp'

const RESEND_SECONDS = 45
const RECAPTCHA_ID = 'rakoba-recaptcha'

export function AuthScreen() {
  const setAuthenticated = useUserStore((s) => s.setAuthenticated)
  const hydrateDemoUser = useUserStore((s) => s.hydrateDemoUser)

  const [mode, setMode] = React.useState<Mode>('signin')
  const [method, setMethod] = React.useState<Method>('email')
  const [showPassword, setShowPassword] = React.useState(false)
  // "Remember me" — true keeps the user signed in across app restarts,
  // false signs them out when they close the app. Defaults to keeping the
  // session (most people expect to stay signed in), and is remembered locally.
  const [remember, setRemember] = React.useState(true)
  const [loading, setLoading] = React.useState(false)

  // Restore the user's previous "remember me" preference.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(REMEMBER_KEY)
      if (stored !== null) setRemember(stored === 'true')
    } catch {
      /* ignore storage errors */
    }
  }, [])

  // Persist the session-length choice and apply it to Firebase immediately.
  function updateRemember(next: boolean) {
    setRemember(next)
    try {
      window.localStorage.setItem(REMEMBER_KEY, String(next))
    } catch {
      /* ignore storage errors */
    }
    void setAuthPersistence(next)
  }
  const [socialLoading, setSocialLoading] = React.useState<'google' | 'facebook' | null>(null)
  const [error, setError] = React.useState('')

  // Demo-mode profile step: when Firebase is not configured, social login
  // asks for a display name instead of silently opening the app.
  const [demoProvider, setDemoProvider] = React.useState<'google' | 'facebook' | null>(null)
  const [demoName, setDemoName] = React.useState('')

  // Shared fields
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  // Phone flow
  const [phone, setPhone] = React.useState('')
  const [country, setCountry] = React.useState<Country>(DEFAULT_COUNTRY)
  const [detectingCountry, setDetectingCountry] = React.useState(true)
  const [phoneStep, setPhoneStep] = React.useState<PhoneStep>('enter')
  const [otp, setOtp] = React.useState('')
  const [resendIn, setResendIn] = React.useState(0)
  const confirmationRef = React.useRef<ConfirmationResult | null>(null)

  // Geo-detect the visitor's country once so the picker defaults sensibly.
  React.useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 4000)

    async function detect() {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
        if (!res.ok) throw new Error('geo lookup failed')
        const data = (await res.json()) as { country_code?: string }
        const detected = findCountryByIso(data.country_code)
        if (!cancelled && detected) setCountry(detected)
      } catch {
        /* keep the default country (Sudan) on any failure */
      } finally {
        window.clearTimeout(timeout)
        if (!cancelled) setDetectingCountry(false)
      }
    }

    detect()
    return () => {
      cancelled = true
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [])

  // Countdown for the resend button
  React.useEffect(() => {
    if (resendIn <= 0) return
    const t = window.setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [resendIn])

  function resetErrors() {
    setError('')
  }

  function switchMode(next: Mode) {
    setMode(next)
    resetErrors()
    setPhoneStep('enter')
    setOtp('')
  }

  function switchMethod(next: Method) {
    setMethod(next)
    resetErrors()
    setPhoneStep('enter')
    setOtp('')
  }

  function completeAuth(demoInfo?: { name?: string; email?: string; phone?: string }) {
    if (isFirebaseConfigured) {
      // The Firebase auth watcher (in app/page.tsx) will load the real
      // profile and flip isAuthenticated once it's ready. Show the loader
      // meanwhile to avoid a flash back to this screen.
      useUserStore.setState({ authLoading: true })
    } else {
      // Demo mode only (Firebase keys not set): build a real local user so
      // publishing posts/stories/listings works instead of silently failing.
      hydrateDemoUser(demoInfo ?? {})
      setAuthenticated(true)
    }
  }

  const configured = isFirebaseConfigured

  /* ---------------- Email / Password ---------------- */
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'signup' && !name.trim()) {
      setError('اكتب اسمك يا زول')
      return
    }
    if (!email.trim() || !password.trim()) {
      setError('من فضلك دخّل البريد وكلمة السر')
      return
    }
    resetErrors()
    setLoading(true)

    // Demo fallback when Firebase keys are not set yet
    if (!configured) {
      window.setTimeout(() => {
        setLoading(false)
        completeAuth()
      }, 700)
      return
    }

    try {
      await setAuthPersistence(remember)
      if (mode === 'signup') {
        await emailSignUp(email.trim(), password, name.trim())
      } else {
        await emailSignIn(email.trim(), password)
      }
      completeAuth()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- Social ---------------- */
  async function handleSocial(provider: 'google' | 'facebook') {
    resetErrors()

    if (!configured) {
      setSocialLoading(provider)
      window.setTimeout(() => {
        setSocialLoading(null)
        completeAuth()
      }, 700)
      return
    }

    setSocialLoading(provider)
    try {
      await setAuthPersistence(remember)
      if (provider === 'google') await googleSignIn()
      else await facebookSignIn()
      completeAuth()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSocialLoading(null)
    }
  }

  /* ---------------- Phone ---------------- */
  function toE164(raw: string) {
    const digits = raw.replace(/\D/g, '').replace(/^0+/, '')
    return `+${country.dial}${digits}`
  }

  async function requestCode() {
    const digits = phone.replace(/\D/g, '').replace(/^0+/, '')
    if (digits.length < 6) {
      setError('اكتب رقم هاتف صحيح')
      return false
    }
    resetErrors()

    if (!configured) {
      // Demo fallback
      return new Promise<boolean>((resolve) => {
        window.setTimeout(() => resolve(true), 700)
      })
    }

    try {
      await setAuthPersistence(remember)
      resetRecaptcha()
      const confirmation = await sendPhoneCode(toE164(phone), RECAPTCHA_ID)
      confirmationRef.current = confirmation
      return true
    } catch (err) {
      resetRecaptcha()
      setError(authErrorMessage(err))
      return false
    }
  }

  async function handlePhoneContinue(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'signup' && !name.trim()) {
      setError('اكتب اسمك يا زول')
      return
    }
    setLoading(true)
    const ok = await requestCode()
    setLoading(false)
    if (ok) {
      setPhoneStep('otp')
      setResendIn(RESEND_SECONDS)
    }
  }

  async function handleResend() {
    if (resendIn > 0 || loading) return
    setLoading(true)
    setOtp('')
    const ok = await requestCode()
    setLoading(false)
    if (ok) setResendIn(RESEND_SECONDS)
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 6) {
      setError('اكتب رمز التحقق كامل')
      return
    }
    resetErrors()
    setLoading(true)

    if (!configured) {
      window.setTimeout(() => {
        setLoading(false)
        completeAuth()
      }, 700)
      return
    }

    try {
      if (!confirmationRef.current) {
        setError('انتهت الجلسة، اطلب رمز جديد')
        setPhoneStep('enter')
        setOtp('')
        setResendIn(0)
        setLoading(false)
        return
      }
      await confirmPhoneCode(
        confirmationRef.current,
        otp,
        isSignup ? name.trim() : undefined,
      )
      completeAuth()
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code)
          : ''
      setError(authErrorMessage(err))
      // Clear the wrong code so the user can retype it.
      setOtp('')
      // If the code expired, send them back to request a fresh one.
      if (code === 'auth/code-expired') {
        confirmationRef.current = null
        setPhoneStep('enter')
        setResendIn(0)
      }
    } finally {
      setLoading(false)
    }
  }

  const isSignup = mode === 'signup'

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background px-4 py-6">
      {/* Sudanese pattern backdrop */}
      <div className="rakoba-pattern pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      {/* Invisible reCAPTCHA mount point (required by Firebase phone auth) */}
      <div id={RECAPTCHA_ID} />

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/30 font-arabic">
        {/* ---------- Welcome hero (top) ---------- */}
        <div className="auth-hero rakoba-pattern relative flex flex-col items-center gap-2 px-6 pb-6 pt-7 text-center">
          <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-sm">
            <RakobaLogo size="sm" />
            <span className="text-base font-extrabold tracking-wide text-primary">راكوبتنا</span>
          </div>
          <h1 className="text-balance text-xl font-extrabold text-white">أهلاً بيك في راكوبتنا</h1>
          <p className="max-w-[18rem] text-pretty text-[13px] leading-relaxed text-white/85">
            سجّل وانضم لأكبر راكوبة رقمية سودانية
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/75">
            <Coffee className="h-3.5 w-3.5" />
            <span>اتفضّل استريّح في الراكوبة</span>
          </div>
        </div>

        {/* ---------- Body ---------- */}
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
          {/* Mode switch */}
          <div className="flex rounded-full border border-border bg-muted/60 p-1" role="tablist">
            <SegmentButton active={!isSignup} onClick={() => switchMode('signin')}>
              تسجيل الدخول
            </SegmentButton>
            <SegmentButton active={isSignup} onClick={() => switchMode('signup')}>
              حساب جديد
            </SegmentButton>
          </div>

          {/* Method toggle */}
          <div className="flex items-center justify-center gap-1 text-xs">
            <MethodTab active={method === 'email'} onClick={() => switchMethod('email')} icon={<Mail className="h-3.5 w-3.5" />}>
              البريد الإلكتروني
            </MethodTab>
            <MethodTab active={method === 'phone'} onClick={() => switchMethod('phone')} icon={<Phone className="h-3.5 w-3.5" />}>
              رقم الهاتف
            </MethodTab>
          </div>

          {/* ---------- Email form ---------- */}
          {method === 'email' && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
              {isSignup && (
                <FieldInput
                  icon={<User className="h-4 w-4" />}
                  type="text"
                  placeholder="اسمك يا زول"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
              )}
              <FieldInput
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <FieldInput
                icon={<Lock className="h-4 w-4" />}
                type={showPassword ? 'text' : 'password'}
                placeholder="كلمة السر"
                value={password}
                onChange={setPassword}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {!isSignup && (
                <button
                  type="button"
                  className="self-start text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  نسيت كلمة السر؟
                </button>
              )}

              <RememberChoice value={remember} onChange={updateRemember} />

              {error && <ErrorText>{error}</ErrorText>}

              <SubmitButton loading={loading}>{isSignup ? 'إنشاء الحساب' : 'دخول'}</SubmitButton>
            </form>
          )}

          {/* ---------- Phone form ---------- */}
          {method === 'phone' && phoneStep === 'enter' && (
            <form onSubmit={handlePhoneContinue} className="flex flex-col gap-3">
              {isSignup && (
                <FieldInput
                  icon={<User className="h-4 w-4" />}
                  type="text"
                  placeholder="اسمك يا زول"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
              )}

              <div className="flex w-full items-center gap-1.5 rounded-xl border border-input bg-muted/60 px-2 py-1.5 transition-colors focus-within:border-primary focus-within:bg-muted">
                <CountryCodePicker
                  value={country}
                  onChange={(c) => {
                    setCountry(c)
                    if (error) resetErrors()
                  }}
                  detecting={detectingCountry}
                />
                <span className="h-6 w-px shrink-0 bg-border" aria-hidden />
                <input
                  dir="ltr"
                  type="tel"
                  inputMode="tel"
                  placeholder="9x xxx xxxx"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (error) resetErrors()
                  }}
                  autoComplete="tel"
                  className="min-w-0 flex-1 bg-transparent px-1 text-left text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              <RememberChoice value={remember} onChange={updateRemember} />

              {error && <ErrorText>{error}</ErrorText>}

              <SubmitButton loading={loading}>
                <span className="flex items-center gap-2">
                  إرسال رمز التحقق
                  <ArrowRight className="h-4 w-4" />
                </span>
              </SubmitButton>
            </form>
          )}

          {method === 'phone' && phoneStep === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="flex flex-col items-center gap-3">
              <p className="text-center text-xs text-muted-foreground">
                أرسلنا رمز مكوّن من 6 أرقام إلى
                <span dir="ltr" className="mx-1 font-semibold text-foreground">
                  +{country.dial} {phone}
                </span>
              </p>

              <div dir="ltr">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(v) => {
                    setOtp(v)
                    if (error) resetErrors()
                  }}
                >
                  <InputOTPGroup className="gap-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-11 w-9 rounded-lg border-input text-base"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && <ErrorText>{error}</ErrorText>}

              <SubmitButton loading={loading}>تأكيد الرمز</SubmitButton>

              {/* Resend code */}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0 || loading}
                className={cn(
                  'text-xs font-semibold transition-colors',
                  resendIn > 0 || loading
                    ? 'cursor-not-allowed text-muted-foreground'
                    : 'text-primary hover:underline',
                )}
              >
                {resendIn > 0 ? `إعادة إرسال الرمز بعد ${resendIn} ثانية` : 'لم يصلك الرمز؟ إعادة الإرسال'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPhoneStep('enter')
                  setOtp('')
                  setResendIn(0)
                  resetErrors()
                }}
                className="text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                تغيير رقم الهاتف
              </button>
            </form>
          )}

          {/* ---------- Social ---------- */}
          {!(method === 'phone' && phoneStep === 'otp') && (
            <>
              <Divider>أو تابع عبر</Divider>
              <SocialRow onSelect={handleSocial} loading={socialLoading} />
            </>
          )}

          {!configured && (
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              وضع تجريبي: لتفعيل الدخول الحقيقي أضف مفاتيح Firebase في إعدادات المشروع.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Sub-components ---------- */

function RememberChoice({
  value,
  onChange,
}: {
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
      <div className="flex flex-col text-right">
        <span className="text-[13px] font-semibold text-foreground">
          {value ? 'إبقني مسجّلاً دائماً' : 'سجّل خروجي عند الإغلاق'}
        </span>
        <span className="text-[11px] leading-relaxed text-muted-foreground">
          {value
            ? 'ما تحتاج تسجّل دخول كل مرة تفتح التطبيق'
            : 'راح نطلب منك تسجيل الدخول كل مرة تقفل التطبيق'}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label="حفظ تسجيل الدخول"
        onClick={() => onChange(!value)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          value ? 'bg-primary' : 'bg-muted-foreground/40',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            value ? 'left-0.5' : 'left-[22px]',
          )}
        />
      </button>
    </div>
  )
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex-1 rounded-full py-2 text-sm font-bold transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function MethodTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition-all',
        active
          ? 'bg-secondary text-secondary-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-xs font-medium text-destructive">{children}</p>
}

const SOCIALS: { id: 'google' | 'facebook'; src: string; label: string }[] = [
  { id: 'google', src: '/brand/google.svg', label: 'Google' },
  { id: 'facebook', src: '/brand/facebook.svg', label: 'Facebook' },
]

function SocialRow({
  onSelect,
  loading,
}: {
  onSelect: (provider: 'google' | 'facebook') => void
  loading: 'google' | 'facebook' | null
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      {SOCIALS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          disabled={loading !== null}
          aria-label={`المتابعة عبر ${s.label}`}
          className="flex h-11 min-w-24 items-center justify-center gap-2 rounded-xl border border-input bg-muted/40 px-4 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-muted active:scale-95 disabled:opacity-60"
        >
          {loading === s.id ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src || '/placeholder.svg'} alt="" className="h-5 w-5" />
              {s.label}
            </>
          )}
        </button>
      ))}
    </div>
  )
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full items-center gap-3 text-[11px] text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function FieldInput({
  icon,
  trailing,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  icon: React.ReactNode
  trailing?: React.ReactNode
  type: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
}) {
  return (
    <div className="flex w-full items-center gap-2 rounded-xl border border-input bg-muted/60 px-3 py-2.5 transition-colors focus-within:border-primary focus-within:bg-muted">
      <span className="text-muted-foreground">{icon}</span>
      <input
        dir="rtl"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="min-w-0 flex-1 bg-transparent text-right text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      {trailing}
    </div>
  )
}

function SubmitButton({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
      ) : (
        children
      )}
    </button>
  )
}
