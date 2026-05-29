'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  X,
  MapPin,
  Calendar,
  Briefcase,
  ExternalLink,
  Verified,
  Users,
  Eye,
  Check,
  Clock,
  Building2,
  Link2,
} from 'lucide-react'
import {
  type Opportunity,
  getCategoryIcon,
  getCategoryLabel,
  formatDeadline,
  getDeadlineStatus,
} from '@/lib/types/opportunities'
import { useLanguage } from '@/components/providers/language-provider'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface OpportunityDetailSheetProps {
  opportunity: Opportunity | null
  isOpen: boolean
  onClose: () => void
}

export function OpportunityDetailSheet({
  opportunity,
  isOpen,
  onClose,
}: OpportunityDetailSheetProps) {
  const { isRTL } = useLanguage()
  
  if (!opportunity) return null
  
  const deadlineStatus = getDeadlineStatus(opportunity.deadline)
  
  const handleApply = () => {
    if (opportunity.applicationType === 'external' && opportunity.applicationUrl) {
      window.open(opportunity.applicationUrl, '_blank')
    } else {
      toast.success(
        isRTL ? 'تم تقديم طلبك!' : 'Application submitted!',
        {
          description: isRTL
            ? 'سنتواصل معك قريباً'
            : 'We will contact you soon',
        }
      )
    }
  }
  
  const handleVisitSource = () => {
    if (opportunity.sourceUrl) {
      window.open(opportunity.sourceUrl, '_blank')
    }
  }
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-3xl flex flex-col p-0"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Cover image / header */}
        <div className="relative h-40 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex-shrink-0">
          {opportunity.coverImage ? (
            <img
              src={opportunity.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-30">{getCategoryIcon(opportunity.category)}</span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 end-4 rounded-full bg-black/20 hover:bg-black/40 text-white"
          >
            <X className="w-5 h-5" />
          </Button>
          
          {/* Status badge */}
          <div className="absolute top-4 start-4">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
              deadlineStatus === 'closing-soon'
                ? 'bg-red-500 text-white'
                : deadlineStatus === 'closed'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary text-primary-foreground'
            )}>
              <Clock className="w-4 h-4" />
              {deadlineStatus === 'closed'
                ? (isRTL ? 'انتهى' : 'Closed')
                : deadlineStatus === 'closing-soon'
                  ? (isRTL ? 'ينتهي قريباً' : 'Closing Soon')
                  : (isRTL ? 'متاح' : 'Open')
              }
            </span>
          </div>
          
          {/* Category */}
          <div className="absolute bottom-4 start-4 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-xl">{getCategoryIcon(opportunity.category)}</span>
            </div>
            <span className={cn(
              'text-white text-sm font-medium',
              isRTL ? 'font-arabic' : ''
            )}>
              {getCategoryLabel(opportunity.category, isRTL)}
            </span>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Title and organization */}
            <div>
              <h2 className={cn(
                'text-xl font-bold text-foreground mb-2',
                isRTL ? 'font-arabic' : ''
              )}>
                {isRTL ? opportunity.titleAr : opportunity.title}
              </h2>
              
              <div className="flex items-center gap-2">
                {opportunity.organizationLogo ? (
                  <img
                    src={opportunity.organizationLogo}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={cn(
                  'text-muted-foreground',
                  isRTL ? 'font-arabic' : ''
                )}>
                  {isRTL ? opportunity.organizationAr : opportunity.organization}
                </span>
                {opportunity.isVerified && (
                  <Verified className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </div>
            
            {/* Info grid - 3 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoCard
                icon={<MapPin className="w-5 h-5" />}
                label={isRTL ? 'الموقع' : 'Location'}
                value={isRTL ? opportunity.locationAr : opportunity.location}
                isRTL={isRTL}
              />
              <InfoCard
                icon={<Calendar className="w-5 h-5" />}
                label={isRTL ? 'الموعد النهائي' : 'Deadline'}
                value={formatDeadline(opportunity.deadline, isRTL)}
                isHighlight={deadlineStatus === 'closing-soon'}
                isRTL={isRTL}
              />
              <InfoCard
                icon={<Briefcase className="w-5 h-5" />}
                label={isRTL ? 'النوع' : 'Type'}
                value={getCategoryLabel(opportunity.category, isRTL)}
                isRTL={isRTL}
              />
            </div>
            
            {/* Stats */}
            {(opportunity.applicants || opportunity.views > 0) && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {opportunity.applicants && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>
                      {isRTL
                        ? `${opportunity.applicants} متقدم`
                        : `${opportunity.applicants} applicants`
                      }
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>
                    {isRTL
                      ? `${opportunity.views} مشاهدة`
                      : `${opportunity.views} views`
                    }
                  </span>
                </div>
              </div>
            )}
            
            {/* Description */}
            <div>
              <h3 className={cn(
                'font-semibold text-foreground mb-2',
                isRTL ? 'font-arabic' : ''
              )}>
                {isRTL ? 'الوصف' : 'Description'}
              </h3>
              <p className={cn(
                'text-muted-foreground leading-relaxed',
                isRTL ? 'font-arabic' : ''
              )}>
                {isRTL ? opportunity.descriptionAr : opportunity.description}
              </p>
            </div>
            
            {/* Requirements */}
            {opportunity.requirements && opportunity.requirements.length > 0 && (
              <div>
                <h3 className={cn(
                  'font-semibold text-foreground mb-2',
                  isRTL ? 'font-arabic' : ''
                )}>
                  {isRTL ? 'المتطلبات' : 'Requirements'}
                </h3>
                <ul className="space-y-2">
                  {(isRTL ? opportunity.requirementsAr : opportunity.requirements)?.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className={isRTL ? 'font-arabic' : ''}>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Benefits */}
            {opportunity.benefits && opportunity.benefits.length > 0 && (
              <div>
                <h3 className={cn(
                  'font-semibold text-foreground mb-2',
                  isRTL ? 'font-arabic' : ''
                )}>
                  {isRTL ? 'المميزات' : 'Benefits'}
                </h3>
                <ul className="space-y-2">
                  {(isRTL ? opportunity.benefitsAr : opportunity.benefits)?.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className={isRTL ? 'font-arabic' : ''}>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Source verification */}
            {opportunity.isVerified && opportunity.sourceUrl && (
              <button
                onClick={handleVisitSource}
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <Link2 className="w-5 h-5 text-muted-foreground" />
                <div className={cn('flex-1 text-start', isRTL ? 'font-arabic' : '')}>
                  <p className="text-sm font-medium text-foreground">
                    {isRTL ? 'المصدر والتحقق' : 'Source & Verification'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? opportunity.sourceNameAr : opportunity.sourceName}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </ScrollArea>
        
        {/* Sticky action buttons */}
        <div className="border-t border-border p-4 flex gap-3 bg-card">
          {opportunity.applicationType === 'external' ? (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleVisitSource}
              >
                <ExternalLink className="w-4 h-4 me-2" />
                {isRTL ? 'الموقع الرسمي' : 'Official Site'}
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={handleApply}
                disabled={deadlineStatus === 'closed'}
              >
                {isRTL ? 'تقديم الآن' : 'Apply Now'}
              </Button>
            </>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleApply}
              disabled={deadlineStatus === 'closed'}
            >
              {isRTL ? 'تقديم في التطبيق' : 'Apply in App'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface InfoCardProps {
  icon: React.ReactNode
  label: string
  value: string
  isHighlight?: boolean
  isRTL: boolean
}

function InfoCard({ icon, label, value, isHighlight, isRTL }: InfoCardProps) {
  return (
    <div className={cn(
      'p-3 rounded-xl text-center',
      isHighlight ? 'bg-red-500/10' : 'bg-muted/50'
    )}>
      <div className={cn(
        'flex justify-center mb-1',
        isHighlight ? 'text-red-500' : 'text-muted-foreground'
      )}>
        {icon}
      </div>
      <p className={cn(
        'text-xs text-muted-foreground mb-0.5',
        isRTL ? 'font-arabic' : ''
      )}>
        {label}
      </p>
      <p className={cn(
        'text-sm font-medium line-clamp-1',
        isHighlight ? 'text-red-500' : 'text-foreground',
        isRTL ? 'font-arabic' : ''
      )}>
        {value}
      </p>
    </div>
  )
}
