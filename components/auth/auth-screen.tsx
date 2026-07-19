'use client'

import * as React from 'react'
import { Mail, Lock, User, Eye, EyeOff, Coffee, Phone, ArrowRight } from 'lucide-react'
import { RakobaLogo } from '@/components/ui/rakoba-logo'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useUserStore } from '@/lib/stores/user-store'
import { cn } from '@/lib/utils'

type Mode = 'signin' | 'signup'
type Method = 'email' | 'phone'
type PhoneStep = 'enter' | 'otp'

export function AuthScreen() {
  const setAuthenticated = useUserStore((s) => s.setAuthenticated)

  const [mode, setMode] = React.useState<Mode>('signin')
  const [method, setMethod] = React.useState<Method>('email')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  // Shared fields
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  // Phone flow
  const [phone, setPhone] = React.useState('')
  const [phoneStep, setPhoneStep] = React.useState<PhoneStep>('enter')
  const [otp, setOtp] = React.useState('')

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

  function completeAuth() {
    setLoading(true)
    window.setTimeout(() => {
      setAuthenticated(true)
      setLoading(false)
    }, 700)
  }

  function handleEmailSubmit(e: React.FormEvent) {
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
    completeAuth()
  }

  function handlePhoneContinue(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'signup' && !name.trim()) {
      setError('اكتب اسمك يا زول')
      return
    }
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 9) {
      setError('اكتب رقم هاتف صحيح')
      return
    }
    resetErrors()
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setPhoneStep('otp')
    }, 700)
  }

  function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 6) {
      setError('اكتب رمز التحقق كامل')
      return
    }
    resetErrors()
    completeAuth()
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

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/30 font-arabic">
        {/* ---------- Welcome hero (moved to top) ---------- */}
        <div className="auth-hero rakoba-pattern relative flex flex-col items-center gap-2 px-6 pb-6 pt-7 text-center">
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <RakobaLogo size="sm" />
            <span className="auth-neon text-sm font-extrabold tracking-wide text-white">راكوبتنا</span>
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

              <div className="flex w-full items-center gap-2 rounded-xl border border-input bg-muted/60 px-3 py-2.5 transition-colors focus-within:border-primary focus-within:bg-muted">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <input
                  dir="ltr"
                  type="tel"
                  inputMode="tel"
                  placeholder="9x xxx xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="min-w-0 flex-1 bg-transparent text-left text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <span className="shrink-0 rounded-md bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  249+
                </span>
              </div>

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
                  +249 {phone}
                </span>
              </p>

              <div dir="ltr">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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

              <button
                type="button"
                onClick={() => {
                  setPhoneStep('enter')
                  setOtp('')
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
              <SocialRow />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Sub-components ---------- */

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

const SOCIALS = [
  { src: '/brand/google.svg', label: 'Google' },
  { src: '/brand/facebook.svg', label: 'Facebook' },
  { src: '/brand/github.svg', label: 'GitHub' },
  { src: '/brand/linkedin.svg', label: 'LinkedIn' },
]

function SocialRow() {
  return (
    <div className="flex items-center justify-center gap-3">
      {SOCIALS.map((s) => (
        <button
          key={s.label}
          type="button"
          aria-label={`المتابعة عبر ${s.label}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-muted/40 transition-all hover:border-primary hover:bg-muted active:scale-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.src || '/placeholder.svg'} alt="" className="h-5 w-5" />
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
