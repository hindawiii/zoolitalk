'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarHeart,
  Plus,
  CalendarDays,
  Bell,
  BellOff,
  Lock,
  Pencil,
  Trash2,
  ChevronDown,
  X,
  PartyPopper,
} from 'lucide-react'
import {
  useOccasionsStore,
  getOccasionDate,
  getDaysUntil,
  type Occasion,
  type OccasionColor,
  type OccasionCategory,
} from '@/lib/stores/occasions-store'
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'

const GREEN = '#2D5A27'
const GOLD = '#C9A227'

const stripeColors: Record<OccasionColor, string> = {
  red: '#C0392B',
  black: '#1F2933',
  white: '#E8E2D2',
  green: GREEN,
  gold: GOLD,
}

const categoryLabels: Record<OccasionCategory, { ar: string; en: string }> = {
  sudanese: { ar: 'مناسبة وطنية', en: 'National' },
  islamic: { ar: 'عيد إسلامي', en: 'Islamic' },
  world: { ar: 'مناسبة عالمية', en: 'World' },
  personal: { ar: 'شخصية', en: 'Personal' },
  birthday: { ar: 'عيد ميلاد', en: 'Birthday' },
  anniversary: { ar: 'ذكرى خاصة', en: 'Anniversary' },
  family: { ar: 'مناسبة عائلية', en: 'Family' },
}

const personalCategories: OccasionCategory[] = ['personal', 'birthday', 'anniversary', 'family']

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function toInputValue(occasion: Occasion): string {
  const date = getOccasionDate(occasion)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatGregorian(date: Date, isRTL: boolean): string {
  return new Intl.DateTimeFormat(isRTL ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatHijri(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return ''
  }
}

export function OccasionsTab() {
  const { isRTL } = useLanguage()
  const occasions = useOccasionsStore((s) => s.occasions)
  const deleteOccasion = useOccasionsStore((s) => s.deleteOccasion)
  const toggleNotifications = useOccasionsStore((s) => s.toggleNotifications)
  const markNotified = useOccasionsStore((s) => s.markNotified)
  const notifiedKeys = useOccasionsStore((s) => s.notifiedKeys)

  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Occasion | null>(null)
  const [showPast, setShowPast] = React.useState(false)
  // Recompute "today" reference whenever the tab mounts so day counts stay fresh.
  const [now] = React.useState(() => new Date())

  const { upcoming, past } = React.useMemo(() => {
    const withDays = occasions.map((o) => ({ occasion: o, days: getDaysUntil(o, now) }))
    const upcoming = withDays.filter((x) => x.days >= 0).sort((a, b) => a.days - b.days)
    const past = withDays.filter((x) => x.days < 0).sort((a, b) => b.days - a.days)
    return { upcoming, past }
  }, [occasions, now])

  // Notification engine: early reminder (<=3 days), daily countdown, and day-of alert.
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    if (Notification.permission !== 'granted') return

    const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    upcoming.forEach(({ occasion, days }) => {
      if (!occasion.notificationsEnabled) return
      if (days > 3) return
      const key = `${occasion.id}-${todayKey}`
      if (notifiedKeys[key]) return
      const name = isRTL ? occasion.nameAr : occasion.name
      const body =
        days === 0
          ? isRTL
            ? `اليوم هو ${name}! 🎉`
            : `Today is ${name}! 🎉`
          : isRTL
            ? `متبقي ${days} ${days === 1 ? 'يوم' : 'أيام'} على ${name}`
            : `${days} day${days === 1 ? '' : 's'} until ${name}`
      try {
        new Notification(isRTL ? 'المناسبات' : 'Occasions', { body })
        markNotified(key)
      } catch {
        /* ignore */
      }
    })
  }, [upcoming, notifiedKeys, isRTL, markNotified, now])

  const openAdd = () => {
    setEditing(null)
    setEditorOpen(true)
  }
  const openEdit = (occasion: Occasion) => {
    setEditing(occasion)
    setEditorOpen(true)
  }

  return (
    <div className="h-full flex flex-col bg-[#FBF7EF] dark:bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#FBF7EF]/85 dark:bg-background/85 backdrop-blur-xl border-b border-[#C9A227]/20">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: `${GREEN}1A` }}
          >
            <CalendarHeart className="h-5 w-5" style={{ color: GREEN }} />
          </span>
          <h2 className={cn('text-lg font-bold', isRTL && 'font-arabic')} style={{ color: GREEN }}>
            {isRTL ? 'المناسبات القادمة' : 'Upcoming Occasions'}
          </h2>
        </div>
        <button
          onClick={openAdd}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform active:scale-95',
            isRTL && 'font-arabic'
          )}
          style={{ backgroundColor: GREEN }}
        >
          <Plus className="h-4 w-4" />
          {isRTL ? 'إضافة مناسبة' : 'Add'}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {upcoming.length === 0 && (
          <div className={cn('py-16 text-center text-muted-foreground', isRTL && 'font-arabic')}>
            <CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-40" />
            {isRTL ? 'لا توجد مناسبات قادمة' : 'No upcoming occasions'}
          </div>
        )}

        <AnimatePresence initial={false}>
          {upcoming.map(({ occasion, days }) => (
            <OccasionCard
              key={occasion.id}
              occasion={occasion}
              days={days}
              isRTL={isRTL}
              onEdit={() => openEdit(occasion)}
              onDelete={() => deleteOccasion(occasion.id)}
              onToggleNotifications={() => toggleNotifications(occasion.id)}
            />
          ))}
        </AnimatePresence>

        {/* Past occasions (collapsible) */}
        {past.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowPast((v) => !v)}
              className={cn(
                'flex w-full items-center justify-between rounded-2xl bg-card/60 px-4 py-3 text-sm font-medium text-muted-foreground',
                isRTL && 'font-arabic'
              )}
            >
              <span>
                {isRTL ? 'مناسبات سابقة' : 'Past occasions'} ({past.length})
              </span>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', showPast && 'rotate-180')}
              />
            </button>
            <AnimatePresence initial={false}>
              {showPast && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-3">
                    {past.map(({ occasion, days }) => (
                      <OccasionCard
                        key={occasion.id}
                        occasion={occasion}
                        days={days}
                        isRTL={isRTL}
                        isPast
                        onEdit={() => openEdit(occasion)}
                        onDelete={() => deleteOccasion(occasion.id)}
                        onToggleNotifications={() => toggleNotifications(occasion.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <OccasionEditor
        open={editorOpen}
        occasion={editing}
        isRTL={isRTL}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  )
}

interface CardProps {
  occasion: Occasion
  days: number
  isRTL: boolean
  isPast?: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleNotifications: () => void
}

function OccasionCard({
  occasion,
  days,
  isRTL,
  isPast,
  onEdit,
  onDelete,
  onToggleNotifications,
}: CardProps) {
  const [revealed, setRevealed] = React.useState(false)
  const date = getOccasionDate(occasion)
  const stripe = stripeColors[occasion.color]
  const name = isRTL ? occasion.nameAr : occasion.name
  const canSwipe = !occasion.isBuiltIn
  // RTL reveals actions on the right side; LTR on the left. Drag direction flips accordingly.
  const actionsWidth = 132

  const daysLabel = (() => {
    if (days === 0) return isRTL ? 'اليوم 🎉' : 'Today 🎉'
    if (days > 0) return isRTL ? `${days} ${days === 1 ? 'يوم' : 'أيام'}` : `${days}d`
    const abs = Math.abs(days)
    return isRTL ? `منذ ${abs} ${abs === 1 ? 'يوم' : 'أيام'}` : `${abs}d ago`
  })()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isPast ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Action buttons behind the card (personal occasions only) */}
      {canSwipe && (
        <div
          className={cn('absolute inset-y-0 flex items-stretch', isRTL ? 'right-0' : 'left-0')}
          style={{ width: actionsWidth }}
        >
          <button
            onClick={onEdit}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-white',
              isRTL && 'font-arabic'
            )}
            style={{ backgroundColor: GOLD }}
          >
            <Pencil className="h-4 w-4" />
            {isRTL ? 'تعديل' : 'Edit'}
          </button>
          <button
            onClick={onDelete}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-white',
              isRTL && 'font-arabic'
            )}
            style={{ backgroundColor: '#C0392B' }}
          >
            <Trash2 className="h-4 w-4" />
            {isRTL ? 'حذف' : 'Delete'}
          </button>
        </div>
      )}

      {/* Foreground card */}
      <motion.div
        drag={canSwipe ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        animate={{ x: revealed ? (isRTL ? -actionsWidth : actionsWidth) : 0 }}
        onDragEnd={(_, info) => {
          const threshold = 50
          if (isRTL) {
            setRevealed(info.offset.x < -threshold)
          } else {
            setRevealed(info.offset.x > threshold)
          }
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="relative flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-card"
        onClick={() => {
          if (occasion.isBuiltIn) onEdit()
        }}
      >
        {/* Colored side stripe */}
        <span
          className={cn(
            'absolute inset-y-2 w-1.5 rounded-full',
            isRTL ? 'right-0' : 'left-0'
          )}
          style={{
            backgroundColor: stripe,
            border: occasion.color === 'white' ? '1px solid rgba(0,0,0,0.1)' : undefined,
          }}
        />

        <span
          className="ms-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${GREEN}14` }}
        >
          <CalendarDays className="h-5 w-5" style={{ color: GREEN }} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={cn('truncate font-semibold', isRTL && 'font-arabic')} style={{ color: GREEN }}>
              {name}
            </p>
            {occasion.isBuiltIn && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          </div>
          <p className={cn('truncate text-xs text-muted-foreground', isRTL && 'font-arabic')}>
            {formatGregorian(date, isRTL)}
            <span className="mx-1 opacity-50">•</span>
            {categoryLabels[occasion.category][isRTL ? 'ar' : 'en']}
          </p>
        </div>

        {/* Notification toggle (personal) */}
        {canSwipe && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleNotifications()
            }}
            className="shrink-0 rounded-full p-2 transition-colors hover:bg-muted"
            aria-label={occasion.notificationsEnabled ? 'Disable alerts' : 'Enable alerts'}
          >
            {occasion.notificationsEnabled ? (
              <Bell className="h-4 w-4" style={{ color: GOLD }} />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Days remaining */}
        <div className="shrink-0 text-center">
          <p
            className={cn('text-base font-bold leading-none', isRTL && 'font-arabic')}
            style={{ color: days === 0 ? GOLD : GREEN }}
          >
            {daysLabel}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface EditorProps {
  open: boolean
  occasion: Occasion | null
  isRTL: boolean
  onClose: () => void
}

function OccasionEditor({ open, occasion, isRTL, onClose }: EditorProps) {
  const addOccasion = useOccasionsStore((s) => s.addOccasion)
  const updateOccasion = useOccasionsStore((s) => s.updateOccasion)

  const isEdit = !!occasion
  const isBuiltIn = !!occasion?.isBuiltIn

  const [name, setName] = React.useState('')
  const [dateValue, setDateValue] = React.useState('')
  const [category, setCategory] = React.useState<OccasionCategory>('personal')
  const [notify, setNotify] = React.useState(true)

  React.useEffect(() => {
    if (!open) return
    if (occasion) {
      setName(isRTL ? occasion.nameAr : occasion.name)
      setDateValue(toInputValue(occasion))
      setCategory(occasion.category)
      setNotify(occasion.notificationsEnabled)
    } else {
      const today = new Date()
      setName('')
      setDateValue(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`)
      setCategory('personal')
      setNotify(true)
    }
  }, [open, occasion, isRTL])

  const hijriPreview = React.useMemo(() => {
    if (!dateValue) return ''
    const [y, m, d] = dateValue.split('-').map(Number)
    if (!y || !m || !d) return ''
    return formatHijri(new Date(y, m - 1, d))
  }, [dateValue])

  const handleSave = () => {
    if (!dateValue) return
    const [y, m, d] = dateValue.split('-').map(Number)
    const trimmed = name.trim()

    if (occasion) {
      // Built-in: only the date (and notification flag) is editable.
      if (isBuiltIn) {
        updateOccasion(occasion.id, {
          month: m - 1,
          day: d,
          year: occasion.recurring ? undefined : y,
          notificationsEnabled: notify,
        })
      } else {
        updateOccasion(occasion.id, {
          name: trimmed || occasion.name,
          nameAr: trimmed || occasion.nameAr,
          month: m - 1,
          day: d,
          year: y,
          category,
          notificationsEnabled: notify,
        })
      }
    } else {
      if (!trimmed) return
      addOccasion({
        name: trimmed,
        nameAr: trimmed,
        month: m - 1,
        day: d,
        year: y,
        color: 'gold',
        category,
        isBuiltIn: false,
        recurring: category === 'birthday' || category === 'anniversary',
        notificationsEnabled: notify,
      })
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? 'rtl' : 'ltr'}
            className="w-full max-w-md rounded-t-3xl bg-[#FBF7EF] p-5 shadow-2xl dark:bg-background sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className={cn('text-lg font-bold', isRTL && 'font-arabic')} style={{ color: GREEN }}>
                {isEdit
                  ? isRTL
                    ? 'تعديل المناسبة'
                    : 'Edit Occasion'
                  : isRTL
                    ? 'إضافة مناسبة'
                    : 'Add Occasion'}
              </h3>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className={cn('text-sm font-medium', isRTL && 'font-arabic')} style={{ color: GREEN }}>
                  {isRTL ? 'اسم المناسبة' : 'Occasion name'}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isBuiltIn}
                  placeholder={isRTL ? 'مثال: عيد ميلاد ماما' : 'e.g. Mom’s birthday'}
                  className={cn(
                    'w-full rounded-xl border border-[#C9A227]/30 bg-white px-4 py-3 text-sm outline-none focus:border-[#2D5A27] disabled:opacity-60 dark:bg-card',
                    isRTL && 'font-arabic'
                  )}
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className={cn('text-sm font-medium', isRTL && 'font-arabic')} style={{ color: GREEN }}>
                  {isRTL ? 'التاريخ (ميلادي)' : 'Date (Gregorian)'}
                </label>
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="w-full rounded-xl border border-[#C9A227]/30 bg-white px-4 py-3 text-sm outline-none focus:border-[#2D5A27] dark:bg-card"
                />
                {hijriPreview && (
                  <p className={cn('text-xs text-muted-foreground', isRTL && 'font-arabic')}>
                    {isRTL ? 'الموافق هجرياً: ' : 'Hijri: '}
                    {hijriPreview}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className={cn('text-sm font-medium', isRTL && 'font-arabic')} style={{ color: GREEN }}>
                  {isRTL ? 'نوع المناسبة' : 'Occasion type'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as OccasionCategory)}
                  disabled={isBuiltIn}
                  className={cn(
                    'w-full rounded-xl border border-[#C9A227]/30 bg-white px-4 py-3 text-sm outline-none focus:border-[#2D5A27] disabled:opacity-60 dark:bg-card',
                    isRTL && 'font-arabic'
                  )}
                >
                  {(isBuiltIn ? ([occasion!.category] as OccasionCategory[]) : personalCategories).map(
                    (c) => (
                      <option key={c} value={c}>
                        {categoryLabels[c][isRTL ? 'ar' : 'en']}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Notifications */}
              <button
                onClick={() => setNotify((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-[#C9A227]/30 bg-white px-4 py-3 dark:bg-card"
              >
                <span className={cn('flex items-center gap-2 text-sm font-medium', isRTL && 'font-arabic')} style={{ color: GREEN }}>
                  <Bell className="h-4 w-4" style={{ color: GOLD }} />
                  {isRTL ? 'تفعيل التنبيهات' : 'Enable alerts'}
                </span>
                <span
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  )}
                  style={{ backgroundColor: notify ? GREEN : '#cbd5e1' }}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      notify ? (isRTL ? 'translate-x-1' : 'translate-x-6') : isRTL ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </span>
              </button>

              {isBuiltIn && (
                <p className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', isRTL && 'font-arabic')}>
                  <Lock className="h-3.5 w-3.5" />
                  {isRTL
                    ? 'مناسبة مدمجة — يمكنك تحديث تاريخها فقط للسنة الجديدة.'
                    : 'Built-in occasion — you can only update its date.'}
                </p>
              )}

              {/* Save */}
              <button
                onClick={handleSave}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition-transform active:scale-[0.98]',
                  isRTL && 'font-arabic'
                )}
                style={{ backgroundColor: GREEN }}
              >
                <PartyPopper className="h-4 w-4" />
                {isRTL ? 'حفظ المناسبة' : 'Save occasion'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
