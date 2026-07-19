'use client'

import * as React from 'react'
import { Mail, Lock, User, Eye, EyeOff, Coffee } from 'lucide-react'
import { RakobaLogo } from '@/components/ui/rakoba-logo'
import { useUserStore } from '@/lib/stores/user-store'
import { cn } from '@/lib/utils'

type Mode = 'signin' | 'signup'

export function AuthScreen() {
  const setAuthenticated = useUserStore((s) => s.setAuthenticated)
  const [mode, setMode] = React.useState<Mode>('signin')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  // Sign-in fields
  const [signInEmail, setSignInEmail] = React.useState('')
  const [signInPassword, setSignInPassword] = React.useState('')
  const [signInError, setSignInError] = React.useState('')

  // Sign-up fields
  const [name, setName] = React.useState('')
  const [signUpEmail, setSignUpEmail] = React.useState('')
  const [signUpPassword, setSignUpPassword] = React.useState('')
  const [signUpError, setSignUpError] = React.useState('')

  function completeAuth() {
    setLoading(true)
    // Simulate a quick auth round-trip, then enter the app
    window.setTimeout(() => {
      setAuthenticated(true)
      setLoading(false)
    }, 700)
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setSignInError('من فضلك دخّل البريد وكلمة السر')
      return
    }
    setSignInError('')
    completeAuth()
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      setSignUpError('كمّل بياناتك يا زول')
      return
    }
    setSignUpError('')
    completeAuth()
  }

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background p-4">
      {/* Sudanese pattern backdrop */}
      <div className="rakoba-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
        aria-hidden
      />

      <div dir="ltr" className={cn('auth-card font-arabic', mode === 'signup' && 'is-signup')}>
        {/* ---------- Sign In form ---------- */}
        <div className="auth-panel auth-panel--signin">
          <form onSubmit={handleSignIn} className="flex w-full max-w-xs flex-col items-center gap-3">
            <h2 className="text-2xl font-extrabold text-foreground">تسجيل الدخول</h2>
            <p className="text-xs text-muted-foreground">ادخل ببريدك وكلمة السر</p>

            <FieldInput
              icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="البريد الإلكتروني"
              value={signInEmail}
              onChange={(v) => setSignInEmail(v)}
              autoComplete="email"
            />
            <FieldInput
              icon={<Lock className="h-4 w-4" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="كلمة السر"
              value={signInPassword}
              onChange={(v) => setSignInPassword(v)}
              autoComplete="current-password"
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

            {signInError && <p className="text-xs font-medium text-destructive">{signInError}</p>}

            <button
              type="button"
              className="self-end text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              نسيت كلمة السر؟
            </button>

            <SubmitButton loading={loading}>دخول</SubmitButton>
          </form>
        </div>

        {/* ---------- Sign Up form ---------- */}
        <div className="auth-panel auth-panel--signup">
          <form onSubmit={handleSignUp} className="flex w-full max-w-xs flex-col items-center gap-3">
            <h2 className="text-2xl font-extrabold text-foreground">إنشاء حساب</h2>
            <p className="text-xs text-muted-foreground">انضم لأكبر راكوبة رقمية</p>

            <FieldInput
              icon={<User className="h-4 w-4" />}
              type="text"
              placeholder="اسمك يا زول"
              value={name}
              onChange={(v) => setName(v)}
              autoComplete="name"
            />
            <FieldInput
              icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="البريد الإلكتروني"
              value={signUpEmail}
              onChange={(v) => setSignUpEmail(v)}
              autoComplete="email"
            />
            <FieldInput
              icon={<Lock className="h-4 w-4" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="كلمة السر"
              value={signUpPassword}
              onChange={(v) => setSignUpPassword(v)}
              autoComplete="new-password"
            />

            {signUpError && <p className="text-xs font-medium text-destructive">{signUpError}</p>}

            <SubmitButton loading={loading}>تسجيل</SubmitButton>
          </form>
        </div>

        {/* ---------- Colored overlay ---------- */}
        <div className="auth-overlay-container">
          <div className="auth-overlay rakoba-pattern">
            {/* Panel shown while in sign-up mode → invites back to sign-in */}
            <div className="auth-overlay-panel auth-overlay-panel--back font-arabic">
              <OverlayContent
                title="أهلاً بعودتك يا زول"
                subtitle="عندك حساب أصلاً؟ ادخل وواصل الونسة معانا"
                buttonLabel="تسجيل الدخول"
                onClick={() => {
                  setMode('signin')
                  setSignUpError('')
                }}
              />
            </div>

            {/* Panel shown while in sign-in mode → invites to sign-up */}
            <div className="auth-overlay-panel auth-overlay-panel--join font-arabic">
              <OverlayContent
                title="أهلاً بيك في راكوبتنا"
                subtitle="ما عندك حساب؟ سجّل وانضم لأكبر راكوبة رقمية سودانية"
                buttonLabel="حساب جديد"
                onClick={() => {
                  setMode('signup')
                  setSignInError('')
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Sub-components ---------- */

function OverlayContent({
  title,
  subtitle,
  buttonLabel,
  onClick,
}: {
  title: string
  subtitle: string
  buttonLabel: string
  onClick: () => void
}) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
        <RakobaLogo size="sm" />
        <span className="auth-neon text-sm font-extrabold tracking-wide text-white">راكوبتنا</span>
      </div>
      <h2 className="text-balance text-2xl font-extrabold text-white">{title}</h2>
      <p className="mt-2 max-w-[16rem] text-pretty text-sm leading-relaxed text-white/85">
        {subtitle}
      </p>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 rounded-full border-2 border-white/80 px-8 py-2 text-sm font-bold text-white transition-all hover:bg-white hover:text-primary active:scale-95"
      >
        {buttonLabel}
      </button>
      <div className="mt-4 flex items-center gap-1.5 text-xs text-white/70">
        <Coffee className="h-3.5 w-3.5" />
        <span>اتفضّل استريّح في الراكوبة</span>
      </div>
    </>
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
