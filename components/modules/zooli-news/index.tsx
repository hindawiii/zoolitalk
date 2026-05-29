'use client'

import * as React from 'react'
import Image from 'next/image'
import { 
  TrendingUp, 
  Cloud, 
  Globe, 
  Dribbble,
  DollarSign,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  Share2,
  Bookmark,
  Sun,
  CloudRain,
  Wind,
  Banknote,
  Calculator,
  ArrowRight,
  GraduationCap,
  Briefcase,
  MapPin,
  Calendar,
  Wifi
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'
import { OpportunitiesSlider } from './opportunities-slider'
import { OpportunityDetailSheet } from './opportunity-detail-sheet'
import type { Opportunity } from '@/lib/types/opportunities'

// Types
interface NewsArticle {
  id: string
  title: string
  titleAr: string
  summary: string
  summaryAr: string
  content: string
  contentAr: string
  image: string
  source: string
  sourceAr: string
  category: NewsCategory
  publishedAt: Date
  url: string
}

type NewsCategory = 'sudan' | 'sports' | 'economy' | 'world'

interface CurrencyRate {
  code: string
  flag: string
  nameEn: string
  nameAr: string
  buyRate: number
  sellRate: number
  change24h: number
}

interface WeatherData {
  city: string
  cityAr: string
  temp: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'windy'
  humidity: number
}

interface Scholarship {
  id: string
  title: string
  titleAr: string
  country: string
  countryAr: string
  fullyFunded: boolean
  deadline: string
  deadlineAr: string
  description: string
  descriptionAr: string
  url: string
}

interface Job {
  id: string
  role: string
  roleAr: string
  company: string
  companyAr: string
  isRemote: boolean
  salaryRange: string
  salaryRangeAr: string
  description: string
  descriptionAr: string
  applyUrl: string
}

// News Articles Array - Ready for RSS feed integration
// To connect to a real RSS feed, replace this array with fetched data
// Suggested RSS sources: Sudan Tribune, SUNA News, Al Rakoba
const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Sudan Peace Talks Progress in Jeddah',
    titleAr: 'تقدم مباحثات السلام السودانية في جدة',
    summary: 'International mediators report significant progress in the latest round of peace negotiations.',
    summaryAr: 'أفاد الوسطاء الدوليون بتحقيق تقدم كبير في الجولة الأخيرة من مفاوضات السلام.',
    content: 'Full article content here...',
    contentAr: 'محتوى المقال الكامل هنا...',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
    source: 'Sudan Tribune',
    sourceAr: 'سودان تريبيون',
    category: 'sudan',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    url: 'https://example.com/article1',
  },
  {
    id: '2',
    title: 'Al Hilal Wins Championship Title',
    titleAr: 'الهلال يفوز بلقب البطولة',
    summary: 'Al Hilal FC secures another league championship with dominant performance.',
    summaryAr: 'نادي الهلال يحرز لقب الدوري مجدداً بأداء مميز.',
    content: 'Full article content here...',
    contentAr: 'محتوى المقال الكامل هنا...',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    source: 'Sudan Sports',
    sourceAr: 'سودان سبورت',
    category: 'sports',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    url: 'https://example.com/article2',
  },
  {
    id: '3',
    title: 'Central Bank Announces New Economic Measures',
    titleAr: 'البنك المركزي يعلن عن إجراءات اقتصادية جديدة',
    summary: 'New policies aim to stabilize the Sudanese Pound and boost foreign investment.',
    summaryAr: 'السياسات الجديدة تهدف لتحقيق استقرار الجنيه السوداني وجذب الاستثمار الأجنبي.',
    content: 'Full article content here...',
    contentAr: 'محتوى المقال الكامل هنا...',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    source: 'Sudan Economy',
    sourceAr: 'اقتصاد السودان',
    category: 'economy',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    url: 'https://example.com/article3',
  },
  {
    id: '4',
    title: 'UN General Assembly Discusses Regional Stability',
    titleAr: 'الجمعية العامة للأمم المتحدة تناقش الاستقرار الإقليمي',
    summary: 'World leaders gather to address humanitarian and security challenges.',
    summaryAr: 'قادة العالم يجتمعون لمعالجة التحديات الإنسانية والأمنية.',
    content: 'Full article content here...',
    contentAr: 'محتوى المقال الكامل هنا...',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    source: 'World News',
    sourceAr: 'أخبار العالم',
    category: 'world',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    url: 'https://example.com/article4',
  },
]

// Sudanese Currency Rates (against SDG - Sudanese Pound)
// These rates can be connected to a real API like Bankak or parallel market sources
const mockCurrencyRates: CurrencyRate[] = [
  { code: 'USD', flag: '🇺🇸', nameEn: 'US Dollar', nameAr: 'دولار أمريكي', buyRate: 601.50, sellRate: 605.00, change24h: 0.85 },
  { code: 'SAR', flag: '🇸🇦', nameEn: 'Saudi Riyal', nameAr: 'ريال سعودي', buyRate: 160.25, sellRate: 161.50, change24h: -0.32 },
  { code: 'AED', flag: '🇦🇪', nameEn: 'UAE Dirham', nameAr: 'درهم إماراتي', buyRate: 163.75, sellRate: 165.00, change24h: 0.45 },
  { code: 'EUR', flag: '🇪🇺', nameEn: 'Euro', nameAr: 'يورو', buyRate: 652.00, sellRate: 658.00, change24h: 1.12 },
  { code: 'GBP', flag: '🇬🇧', nameEn: 'British Pound', nameAr: 'جنيه إسترليني', buyRate: 762.50, sellRate: 770.00, change24h: 0.68 },
  { code: 'QAR', flag: '🇶🇦', nameEn: 'Qatari Riyal', nameAr: 'ريال قطري', buyRate: 165.00, sellRate: 166.50, change24h: 0.22 },
  { code: 'KWD', flag: '🇰🇼', nameEn: 'Kuwaiti Dinar', nameAr: 'دينار كويتي', buyRate: 1960.00, sellRate: 1980.00, change24h: 0.15 },
  { code: 'EGP', flag: '🇪🇬', nameEn: 'Egyptian Pound', nameAr: 'جنيه مصري', buyRate: 12.25, sellRate: 12.50, change24h: -0.45 },
  { code: 'DZD', flag: '🇩🇿', nameEn: 'Algerian Dinar', nameAr: 'دينار جزائري', buyRate: 4.45, sellRate: 4.55, change24h: -0.18 },
  { code: 'MAD', flag: '🇲🇦', nameEn: 'Moroccan Dirham', nameAr: 'درهم مغربي', buyRate: 60.50, sellRate: 61.25, change24h: 0.33 },
]

// Weather data - can be connected to OpenWeatherMap API or similar
// Default to Port Sudan for coastal Sudan weather
const mockWeather: WeatherData = {
  city: 'Port Sudan',
  cityAr: 'بورتسودان',
  temp: 34,
  condition: 'sunny',
  humidity: 65,
}

// Scholarships Data - Sudanese-relevant opportunities
const mockScholarships: Scholarship[] = [
  {
    id: 's1',
    title: 'Qatar University Full Scholarship 2026',
    titleAr: 'منحة جامعة قطر الكاملة 2026',
    country: 'Qatar',
    countryAr: 'قطر',
    fullyFunded: true,
    deadline: 'May 15, 2026',
    deadlineAr: '15 مايو 2026',
    description: 'Full scholarship covering tuition, accommodation, and monthly stipend for undergraduate programs.',
    descriptionAr: 'منحة كاملة تشمل الرسوم الدراسية والسكن وبدل شهري لبرامج البكالوريوس.',
    url: 'https://example.com/qatar-scholarship',
  },
  {
    id: 's2',
    title: 'Türkiye Bursları Scholarship Program',
    titleAr: 'برنامج المنح التركية',
    country: 'Turkey',
    countryAr: 'تركيا',
    fullyFunded: true,
    deadline: 'February 20, 2026',
    deadlineAr: '20 فبراير 2026',
    description: 'Government-funded scholarship for international students including Sudanese nationals.',
    descriptionAr: 'منحة حكومية للطلاب الدوليين بما في ذلك السودانيين.',
    url: 'https://example.com/turkey-scholarship',
  },
  {
    id: 's3',
    title: 'UAE Ministry of Education Scholarship',
    titleAr: 'منحة وزارة التعليم الإماراتية',
    country: 'UAE',
    countryAr: 'الإمارات',
    fullyFunded: false,
    deadline: 'June 30, 2026',
    deadlineAr: '30 يونيو 2026',
    description: 'Partial scholarship for graduate studies in UAE universities.',
    descriptionAr: 'منحة جزئية للدراسات العليا في الجامعات الإماراتية.',
    url: 'https://example.com/uae-scholarship',
  },
]

// Jobs Data - Opportunities for Sudanese professionals
const mockJobs: Job[] = [
  {
    id: 'j1',
    role: 'Frontend Developer',
    roleAr: 'مطور واجهات أمامية',
    company: 'Remote Tech Co.',
    companyAr: 'شركة ريموت تك',
    isRemote: true,
    salaryRange: '$800 - $1,500/mo',
    salaryRangeAr: '800 - 1,500 دولار/شهر',
    description: 'React/Next.js developer position open to Sudanese developers worldwide.',
    descriptionAr: 'وظيفة مطور React/Next.js متاحة للمطورين السودانيين حول العالم.',
    applyUrl: 'https://example.com/job1',
  },
  {
    id: 'j2',
    role: 'Customer Support Specialist',
    roleAr: 'أخصائي دعم العملاء',
    company: 'Gulf Services Ltd',
    companyAr: 'خدمات الخليج المحدودة',
    isRemote: false,
    salaryRange: 'SAR 4,000 - 6,000/mo',
    salaryRangeAr: '4,000 - 6,000 ريال/شهر',
    description: 'Arabic-speaking support role based in Riyadh, Saudi Arabia.',
    descriptionAr: 'وظيفة دعم بالعربية في الرياض، المملكة العربية السعودية.',
    applyUrl: 'https://example.com/job2',
  },
  {
    id: 'j3',
    role: 'Data Entry Specialist',
    roleAr: 'أخصائي إدخال بيانات',
    company: 'Freelance Platform',
    companyAr: 'منصة العمل الحر',
    isRemote: true,
    salaryRange: '$300 - $600/mo',
    salaryRangeAr: '300 - 600 دولار/شهر',
    description: 'Part-time remote data entry work, flexible hours.',
    descriptionAr: 'عمل إدخال بيانات عن بعد بدوام جزئي، ساعات مرنة.',
    applyUrl: 'https://example.com/job3',
  },
]

// Category config
const categoryConfig: Record<NewsCategory, { icon: React.ElementType; labelEn: string; labelAr: string }> = {
  sudan: { icon: Globe, labelEn: 'Sudan', labelAr: 'السودان' },
  sports: { icon: Dribbble, labelEn: 'Sports', labelAr: 'رياضة' },
  economy: { icon: TrendingUp, labelEn: 'Economy', labelAr: 'اقتصاد' },
  world: { icon: Globe, labelEn: 'World', labelAr: 'العالم' },
}

export default function ZooliNews() {
  const { isRTL, t } = useLanguage()
  const [activeCategory, setActiveCategory] = React.useState<NewsCategory | 'all'>('all')
  const [selectedArticle, setSelectedArticle] = React.useState<NewsArticle | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [mainTab, setMainTab] = React.useState<'news' | 'opportunities'>('news')
  
  // Opportunities state
  const [selectedOpportunity, setSelectedOpportunity] = React.useState<Opportunity | null>(null)
  const [isOpportunitySheetOpen, setIsOpportunitySheetOpen] = React.useState(false)
  
  const handleOpportunityClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity)
    setIsOpportunitySheetOpen(true)
  }
  
  // Currency Calculator state
  const [calcAmount, setCalcAmount] = React.useState<string>('100')
  const [calcCurrency, setCalcCurrency] = React.useState<string>('USD')
  
  // Share to WhatsApp helper
  const shareToWhatsApp = (title: string, type: 'scholarship' | 'job') => {
    const typeLabel = type === 'scholarship' 
      ? (isRTL ? 'منحة دراسية' : 'scholarship') 
      : (isRTL ? 'فرصة عمل' : 'job opportunity')
    const message = isRTL 
      ? `شوف الـ${typeLabel} دي على راكوبتنا: ${title}` 
      : `Check out this ${typeLabel} on Rakobatna: ${title}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }
  
  // Get selected currency rate
  const selectedRate = mockCurrencyRates.find(r => r.code === calcCurrency)
  const amount = parseFloat(calcAmount) || 0
  
  // Calculate SDG amounts (buyRate = Bankak official, sellRate = Parallel market approximation)
  const bankakResult = amount * (selectedRate?.buyRate || 0)
  const parallelResult = amount * (selectedRate?.sellRate || 0)

  const filteredNews = activeCategory === 'all' 
    ? mockNews 
    : mockNews.filter(n => n.category === activeCategory)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
    if (hours < 1) return isRTL ? 'الآن' : 'Just now'
    if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`
    return isRTL ? `منذ ${Math.floor(hours / 24)} يوم` : `${Math.floor(hours / 24)}d ago`
  }

  const getWeatherIcon = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny': return Sun
      case 'rainy': return CloudRain
      case 'windy': return Wind
      default: return Cloud
    }
  }

  const WeatherIcon = getWeatherIcon(mockWeather.condition)

  // Article Detail View
  if (selectedArticle) {
    return (
      <div className="flex flex-col h-full bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(null)}>
            {isRTL ? <ChevronLeft className="h-5 w-5 rotate-180" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1">
          {/* Article Image */}
          <div className="relative aspect-video bg-secondary">
            <Image
              src={selectedArticle.image}
              alt={isRTL ? selectedArticle.titleAr : selectedArticle.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="p-4 space-y-4">
            {/* Source & Time */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {isRTL ? selectedArticle.sourceAr : selectedArticle.source}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatTimeAgo(selectedArticle.publishedAt)}
              </span>
            </div>

            {/* Title */}
            <h1 className={cn(
              'text-xl sm:text-2xl font-bold leading-tight',
              isRTL && 'font-arabic'
            )}>
              {isRTL ? selectedArticle.titleAr : selectedArticle.title}
            </h1>

            {/* Content */}
            <p className={cn(
              'text-muted-foreground leading-relaxed',
              isRTL && 'font-arabic'
            )}>
              {isRTL ? selectedArticle.summaryAr : selectedArticle.summary}
            </p>

            <Separator />

            <p className={cn(
              'leading-relaxed',
              isRTL && 'font-arabic'
            )}>
              {isRTL ? selectedArticle.contentAr : selectedArticle.content}
            </p>

            {/* Read More */}
            <Button variant="outline" className="w-full gap-2" asChild>
              <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {isRTL ? 'اقرأ المقال كاملاً' : 'Read Full Article'}
              </a>
            </Button>
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full w-full max-w-full bg-background overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="px-4 py-4 border-b space-y-4 w-full">
        <div className="flex items-center justify-between">
          <h1 className={cn('text-xl sm:text-2xl font-bold', isRTL && 'font-arabic')}>
            {isRTL ? 'أخبار راكوبتنا' : 'Rakobatna News'}
          </h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-5 w-5', isRefreshing && 'animate-spin')} />
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as NewsCategory | 'all')}>
          <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide flex-nowrap">
            <TabsTrigger value="all" className={cn('shrink-0', isRTL && 'font-arabic')}>
              {isRTL ? 'الكل' : 'All'}
            </TabsTrigger>
            {(Object.keys(categoryConfig) as NewsCategory[]).map((cat) => {
              const config = categoryConfig[cat]
              return (
                <TabsTrigger key={cat} value={cat} className={cn('shrink-0', isRTL && 'font-arabic')}>
                  {isRTL ? config.labelAr : config.labelEn}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="py-4 space-y-4 w-full max-w-full">
          {/* Al-Foras Opportunities Slider */}
          <OpportunitiesSlider onOpportunityClick={handleOpportunityClick} />
          
          <div className="px-4 space-y-4">
          {/* Quick Currency Calculator */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 w-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className={cn('text-sm sm:text-base flex items-center gap-2', isRTL && 'font-arabic')}>
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Calculator className="h-4 w-4 text-primary" />
                </div>
                {isRTL ? 'حاسبة العملات السريعة' : 'Quick Currency Calculator'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Row */}
              <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder={isRTL ? 'المبلغ' : 'Amount'}
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="text-lg font-semibold h-12 bg-secondary/50 border-border/50"
                  />
                </div>
                <Select value={calcCurrency} onValueChange={setCalcCurrency}>
                  <SelectTrigger className="w-full sm:w-[120px] h-12 bg-secondary/50 border-border/50">
                    <SelectValue>
                      <span className="flex items-center gap-1.5">
                        <span>{selectedRate?.flag}</span>
                        <span className="font-medium">{calcCurrency}</span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {mockCurrencyRates.map((rate) => (
                      <SelectItem key={rate.code} value={rate.code}>
                        <span className="flex items-center gap-2">
                          <span>{rate.flag}</span>
                          <span className="font-medium">{rate.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Arrow indicator */}
              <div className="flex justify-center">
                <div className="p-2 rounded-full bg-accent/20">
                  <ArrowRight className={cn('h-4 w-4 text-accent', isRTL && 'rotate-180')} />
                </div>
              </div>
              
              {/* Results */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {/* Bankak Rate */}
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 min-w-0">
                  <p className={cn('text-xs text-muted-foreground mb-1', isRTL && 'font-arabic')}>
                    {isRTL ? 'سعر بنكك' : 'Bankak Rate'}
                  </p>
                  <p className="text-xl sm:text-lg font-bold text-primary truncate">
                    {bankakResult.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p className={cn('text-xs text-muted-foreground', isRTL && 'font-arabic')}>
                    {isRTL ? 'جنيه سوداني' : 'SDG'}
                  </p>
                </div>
                
                {/* Parallel Market Rate */}
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 min-w-0">
                  <p className={cn('text-xs text-muted-foreground mb-1', isRTL && 'font-arabic')}>
                    {isRTL ? 'السوق الموازي' : 'Parallel Market'}
                  </p>
                  <p className="text-xl sm:text-lg font-bold text-accent truncate">
                    {parallelResult.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p className={cn('text-xs text-muted-foreground', isRTL && 'font-arabic')}>
                    {isRTL ? 'جنيه سوداني' : 'SDG'}
                  </p>
                </div>
              </div>
              
              {/* Rate info */}
              <p className={cn('text-xs text-center text-muted-foreground', isRTL && 'font-arabic')}>
                {isRTL 
                  ? `1 ${selectedRate?.flag} ${calcCurrency} = ${selectedRate?.buyRate.toFixed(2)} (بنكك) / ${selectedRate?.sellRate.toFixed(2)} (موازي) SDG`
                  : `1 ${selectedRate?.flag} ${calcCurrency} = ${selectedRate?.buyRate.toFixed(2)} (Bankak) / ${selectedRate?.sellRate.toFixed(2)} (Parallel) SDG`
                }
              </p>
            </CardContent>
          </Card>

          {/* Sudanese Currency Rates */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <CardTitle className={cn('text-sm flex items-center gap-2', isRTL && 'font-arabic')}>
                  <Banknote className="h-4 w-4 text-accent" />
                  {isRTL ? 'أسعار العملات مقابل الجنيه' : 'Currency Rates (SDG)'}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {isRTL ? 'المصدر: بنكك / السوق الموازي' : 'Source: Bankak / Parallel Market'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-4 overflow-hidden">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" dir="ltr">
                {mockCurrencyRates.map((currency) => (
                  <div 
                    key={currency.code}
                    className="flex-shrink-0 p-2.5 rounded-lg bg-secondary/50 min-w-[100px] sm:min-w-[115px]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1">
                        <span className="text-base">{currency.flag}</span>
                        <span className="font-semibold text-sm">{currency.code}</span>
                      </span>
                      <span className={cn(
                        'text-[10px] font-medium',
                        currency.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                      )}>
                        {currency.change24h >= 0 ? '+' : ''}{currency.change24h.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <div className="flex justify-between">
                        <span>{isRTL ? 'شراء:' : 'Buy:'}</span>
                        <span className="font-medium text-foreground">{currency.buyRate.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isRTL ? 'بيع:' : 'Sell:'}</span>
                        <span className="font-medium text-foreground">{currency.sellRate.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'news' | 'opportunities')} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="news" className={cn('gap-2', isRTL && 'font-arabic')}>
                <Globe className="h-4 w-4" />
                {isRTL ? 'آخر الأخبار' : 'Latest News'}
              </TabsTrigger>
              <TabsTrigger value="opportunities" className={cn('gap-2', isRTL && 'font-arabic')}>
                <Briefcase className="h-4 w-4" />
                {isRTL ? 'الفرص' : 'Opportunities'}
              </TabsTrigger>
            </TabsList>

            {/* Latest News Tab */}
            <TabsContent value="news" className="mt-0 space-y-4">
              {filteredNews.map((article, idx) => (
                <Card 
                  key={article.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedArticle(article)}
                >
                  {idx === 0 ? (
                    // Featured article (first one)
                    <div>
                      <div className="relative aspect-video bg-secondary">
                        <Image
                          src={article.image}
                          alt={isRTL ? article.titleAr : article.title}
                          fill
                          className="object-cover"
                        />
                        <Badge 
                          className="absolute top-3 start-3 bg-primary"
                        >
                          {isRTL ? categoryConfig[article.category].labelAr : categoryConfig[article.category].labelEn}
                        </Badge>
                      </div>
                      <CardContent className="p-4 space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
                        <h3 className={cn(
                          'font-semibold text-lg line-clamp-2',
                          isRTL && 'font-arabic'
                        )}>
                          {isRTL ? article.titleAr : article.title}
                        </h3>
                        <p className={cn(
                          'text-sm text-muted-foreground line-clamp-2',
                          isRTL && 'font-arabic'
                        )}>
                          {isRTL ? article.summaryAr : article.summary}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className={cn(isRTL && 'font-arabic')}>{isRTL ? article.sourceAr : article.source}</span>
                          <span>{formatTimeAgo(article.publishedAt)}</span>
                        </div>
                      </CardContent>
                    </div>
                  ) : (
                    // Regular article
                    <CardContent className="p-3 flex gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-secondary shrink-0">
                        <Image
                          src={article.image}
                          alt={isRTL ? article.titleAr : article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <Badge variant="secondary" className="text-xs mb-1">
                            {isRTL ? categoryConfig[article.category].labelAr : categoryConfig[article.category].labelEn}
                          </Badge>
                          <h3 className={cn(
                            'font-medium text-sm line-clamp-2',
                            isRTL && 'font-arabic'
                          )}>
                            {isRTL ? article.titleAr : article.title}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className={cn(isRTL && 'font-arabic')}>{isRTL ? article.sourceAr : article.source}</span>
                          <span>{formatTimeAgo(article.publishedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities" className="mt-0 space-y-6">
              {/* Scholarships Section */}
              <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h3 className={cn('font-semibold text-lg', isRTL && 'font-arabic')}>
                    {isRTL ? 'المنح الدراسية' : 'Scholarships'}
                  </h3>
                </div>
                
                {mockScholarships.map((scholarship) => (
                  <Card key={scholarship.id} className="border-primary/20 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn('font-semibold line-clamp-2', isRTL && 'font-arabic')}>
                          {isRTL ? scholarship.titleAr : scholarship.title}
                        </h4>
                        {scholarship.fullyFunded && (
                          <Badge className="bg-green-500 hover:bg-green-600 shrink-0">
                            {isRTL ? 'ممولة بالكامل' : 'Fully Funded'}
                          </Badge>
                        )}
                      </div>
                      
                      <p className={cn('text-sm text-muted-foreground line-clamp-2', isRTL && 'font-arabic')}>
                        {isRTL ? scholarship.descriptionAr : scholarship.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className={isRTL ? 'font-arabic' : ''}>
                            {isRTL ? scholarship.countryAr : scholarship.country}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className={isRTL ? 'font-arabic' : ''}>
                            {isRTL ? scholarship.deadlineAr : scholarship.deadline}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-1">
                        <Button 
                          size="sm" 
                          className="flex-1 gap-2"
                          onClick={() => window.open(scholarship.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {isRTL ? 'التفاصيل' : 'Details'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => shareToWhatsApp(isRTL ? scholarship.titleAr : scholarship.title, 'scholarship')}
                        >
                          <Share2 className="h-3 w-3" />
                          {isRTL ? 'واتساب' : 'WhatsApp'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Jobs Section */}
              <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-accent" />
                  <h3 className={cn('font-semibold text-lg', isRTL && 'font-arabic')}>
                    {isRTL ? 'فرص العمل' : 'Jobs'}
                  </h3>
                </div>
                
                {mockJobs.map((job) => (
                  <Card key={job.id} className="border-accent/20 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={cn('font-semibold', isRTL && 'font-arabic')}>
                            {isRTL ? job.roleAr : job.role}
                          </h4>
                          <p className={cn('text-sm text-muted-foreground', isRTL && 'font-arabic')}>
                            {isRTL ? job.companyAr : job.company}
                          </p>
                        </div>
                        <Badge 
                          variant={job.isRemote ? 'default' : 'secondary'}
                          className={cn(job.isRemote && 'bg-blue-500 hover:bg-blue-600')}
                        >
                          {job.isRemote ? (
                            <span className="flex items-center gap-1">
                              <Wifi className="h-3 w-3" />
                              {isRTL ? 'عن بعد' : 'Remote'}
                            </span>
                          ) : (
                            isRTL ? 'محلي' : 'On-site'
                          )}
                        </Badge>
                      </div>
                      
                      <p className={cn('text-sm text-muted-foreground line-clamp-2', isRTL && 'font-arabic')}>
                        {isRTL ? job.descriptionAr : job.description}
                      </p>
                      
                      <div className="flex items-center gap-1 text-sm font-medium text-accent">
                        <DollarSign className="h-4 w-4" />
                        <span>{isRTL ? job.salaryRangeAr : job.salaryRange}</span>
                      </div>
                      
                      <div className="flex gap-2 pt-1">
                        <Button 
                          size="sm" 
                          className="flex-1 gap-2 bg-accent hover:bg-accent/90"
                          onClick={() => window.open(job.applyUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {isRTL ? 'تقدم الآن' : 'Apply Now'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => shareToWhatsApp(isRTL ? job.roleAr : job.role, 'job')}
                        >
                          <Share2 className="h-3 w-3" />
                          {isRTL ? 'واتساب' : 'WhatsApp'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </ScrollArea>
      
      {/* Opportunity Detail Sheet */}
      <OpportunityDetailSheet
        opportunity={selectedOpportunity}
        isOpen={isOpportunitySheetOpen}
        onClose={() => {
          setIsOpportunitySheetOpen(false)
          setSelectedOpportunity(null)
        }}
      />
    </div>
  )
}
