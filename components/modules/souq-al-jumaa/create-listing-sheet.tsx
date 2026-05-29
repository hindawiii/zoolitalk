'use client'

import * as React from 'react'
import { X, ImagePlus, Trash2, RefreshCw } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSouqStore, type ListingCategory, categoryLabels } from '@/lib/stores/souq-store'
import { useUserStore } from '@/lib/stores/user-store'
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'

interface CreateListingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2 | 3

export function CreateListingSheet({ open, onOpenChange }: CreateListingSheetProps) {
  const { isRTL, t } = useLanguage()
  const { addListing } = useSouqStore()
  const { currentUser } = useUserStore()
  
  const [step, setStep] = React.useState<Step>(1)
  const [images, setImages] = React.useState<string[]>([])
  const [title, setTitle] = React.useState('')
  const [titleAr, setTitleAr] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [descriptionAr, setDescriptionAr] = React.useState('')
  const [category, setCategory] = React.useState<ListingCategory>('electronics')
  const [price, setPrice] = React.useState('')
  const [location, setLocation] = React.useState('')
  const [locationAr, setLocationAr] = React.useState('')
  const [isBarter, setIsBarter] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setStep(1)
    setImages([])
    setTitle('')
    setTitleAr('')
    setDescription('')
    setDescriptionAr('')
    setCategory('electronics')
    setPrice('')
    setLocation('')
    setLocationAr('')
    setIsBarter(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (images.length >= 10) return
      
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const canProceedStep1 = images.length > 0
  const canProceedStep2 = (title.trim() || titleAr.trim()) && (description.trim() || descriptionAr.trim())
  const canSubmit = price && Number(price) > 0

  const handleSubmit = async () => {
    if (!currentUser || !canSubmit) return
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    addListing({
      title,
      titleAr,
      description,
      descriptionAr,
      price: Number(price),
      category,
      images,
      location,
      locationAr,
      isBarter,
      seller: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
      },
    })
    
    setIsSubmitting(false)
    resetForm()
    onOpenChange(false)
  }

  const stepTitles = {
    1: isRTL ? 'إضافة صور' : 'Add Photos',
    2: isRTL ? 'وصف المنتج' : 'Product Details',
    3: isRTL ? 'السعر والموقع' : 'Price & Location',
  }

  return (
    <Sheet open={open} onOpenChange={(value) => {
      if (!value) resetForm()
      onOpenChange(value)
    }}>
      <SheetContent side={isRTL ? 'right' : 'left'} className="w-full sm:max-w-md p-0" dir={isRTL ? 'rtl' : 'ltr'}>
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className={cn(isRTL && 'font-arabic')}>
              {isRTL ? 'إضافة إعلان جديد' : 'New Listing'}
            </SheetTitle>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'w-8 h-1 rounded-full transition-colors',
                    s <= step ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>
          <p className={cn('text-sm text-muted-foreground', isRTL && 'font-arabic')}>
            {stepTitles[step]}
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          <div className="p-4">
            {/* Step 1: Photos */}
            {step === 1 && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                
                {/* Image Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                          {isRTL ? 'رئيسية' : 'Main'}
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {images.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs">{images.length}/10</span>
                    </button>
                  )}
                </div>

                <p className={cn('text-sm text-muted-foreground text-center', isRTL && 'font-arabic')}>
                  {isRTL 
                    ? 'أضف حتى 10 صور. الصورة الأولى ستكون الرئيسية.'
                    : 'Add up to 10 photos. First photo will be the cover.'}
                </p>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label className={cn(isRTL && 'font-arabic')}>
                    {isRTL ? 'الفئة' : 'Category'}
                  </Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ListingCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(categoryLabels) as ListingCategory[]).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {isRTL ? categoryLabels[cat].ar : categoryLabels[cat].en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label className={cn(isRTL && 'font-arabic')}>
                    {isRTL ? 'العنوان' : 'Title'}
                  </Label>
                  <Input
                    value={isRTL ? titleAr : title}
                    onChange={(e) => isRTL ? setTitleAr(e.target.value) : setTitle(e.target.value)}
                    placeholder={isRTL ? 'مثال: آيفون 15 برو ماكس' : 'e.g. iPhone 15 Pro Max'}
                    className={cn(isRTL && 'font-arabic')}
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className={cn(isRTL && 'font-arabic')}>
                    {isRTL ? 'الوصف' : 'Description'}
                  </Label>
                  <Textarea
                    value={isRTL ? descriptionAr : description}
                    onChange={(e) => isRTL ? setDescriptionAr(e.target.value) : setDescription(e.target.value)}
                    placeholder={isRTL ? 'اوصف المنتج بالتفصيل...' : 'Describe your item...'}
                    className={cn(isRTL && 'font-arabic')}
                    rows={4}
                    maxLength={1000}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Price & Location */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Price */}
                <div className="space-y-2">
                  <Label className={cn(isRTL && 'font-arabic')}>
                    {isRTL ? 'السعر (جنيه سوداني)' : 'Price (SDG)'}
                  </Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    min={0}
                    className="text-lg font-bold"
                  />
                </div>

                {/* Barter Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-accent" />
                    <div>
                      <p className={cn('font-medium', isRTL && 'font-arabic')}>
                        {isRTL ? 'قبول المقايضة' : 'Accept Barter'}
                      </p>
                      <p className={cn('text-xs text-muted-foreground', isRTL && 'font-arabic')}>
                        {isRTL ? 'السماح بتبادل المنتجات' : 'Allow item exchange'}
                      </p>
                    </div>
                  </div>
                  <Switch checked={isBarter} onCheckedChange={setIsBarter} />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label className={cn(isRTL && 'font-arabic')}>
                    {isRTL ? 'الموقع' : 'Location'}
                  </Label>
                  <Input
                    value={isRTL ? locationAr : location}
                    onChange={(e) => isRTL ? setLocationAr(e.target.value) : setLocation(e.target.value)}
                    placeholder={isRTL ? 'مثال: الخرطوم، بحري' : 'e.g. Khartoum, Bahri'}
                    className={cn(isRTL && 'font-arabic')}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-4 border-t bg-background flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              {isRTL ? 'السابق' : 'Back'}
            </Button>
          )}
          
          {step < 3 ? (
            <Button
              className="flex-1"
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              onClick={() => setStep((s) => (s + 1) as Step)}
            >
              {isRTL ? 'التالي' : 'Next'}
            </Button>
          ) : (
            <Button
              className="flex-1"
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting 
                ? (isRTL ? 'جاري النشر...' : 'Publishing...') 
                : (isRTL ? 'نشر الإعلان' : 'Publish Listing')}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
