'use client'

import * as React from 'react'
import useSWR from 'swr'
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
import { useLanguage } from '@/components/providers/language-provider'
import { cn } from '@/lib/utils'
import { OpportunitiesSlider } from './opportunities-slider'
import { NewsSlider } from './news-slider'
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

// Raw article shape returned by the /api/news route (publishedAt is an ISO string).
interface ApiNewsArticle extends Omit<NewsArticle, 'publishedAt'> {
  publishedAt: string
}

// SWR fetcher for the live news API
const newsFetcher = async (url: string): Promise<NewsArticle[]> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load news')
  const data: { articles: ApiNewsArticle[] } = await res.json()
  return (data.articles ?? []).map((a) => ({ ...a, publishedAt: new Date(a.publishedAt) }))
}

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
    descriptionAr: 'عمل إدخال بيانات عن بعد بدوام ��زئي، ساعات مرنة.',
    applyUrl: 'https://example.com/job3',
  },
]

// Category config
const categoryConfig: Record<NewsCategory, { icon: React.ElementType; labelEn: string; labelAr: string }> = {
  sudan: { icon: MapPin, labelEn: 'Sudan & Arab', labelAr: 'السودان والعرب' },
  sports: { icon: Dribbble, labelEn: 'Sports', labelAr: 'رياضة' },
  economy: { icon: TrendingUp, labelEn: 'Economy', labelAr: 'اقتصاد' },
  world: { icon: Globe, labelEn: 'World', labelAr: 'العالم' },
}

export default function ZooliNews() {
  const { isRTL, t } = useLanguage()
  const [activeCategory, setActiveCategory] = React.useState<NewsCategory | 'all'>('all')
  const [selectedArticle, setSelectedArticle] = React.useState<NewsArticle | null>(null)
  const [mainTab, setMainTab] = React.useState<'news' | 'opportunities'>('news')

  // Live news from official global sources, auto-refreshing every 5 minutes
  const { data: newsData, isLoading: isNewsLoading, isValidating, mutate } = useSWR<NewsArticle[]>(
    '/api/news?category=all',
    newsFetcher,
    {
      refreshInterval: 5 * 60 * 1000,
      revalidateOnFocus: true,
      dedupingInterval: 60 * 1000,
    },
  )
  const articles = newsData ?? []
  
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
    ? articles 
    : articles.filter(n => n.category === activeCategory)

  const handleRefresh = async () => {
    await mutate()
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
            disabled={isValidating}
            aria-label={isRTL ? 'تحديث الأخبار' : 'Refresh news'}
          >
            <RefreshCw className={cn('h-5 w-5', isValidating && 'animate-spin')} />
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
          <OpportunitiesSlider 
            onOpportunityClick={handleOpportunityClick}
            onViewAll={() => setMainTab('opportunities')}
          />
          
          {/* News Slider - Smart Cards for Mobile */}
          <NewsSlider
            news={filteredNews}
            categoryConfig={categoryConfig}
            onArticleClick={setSelectedArticle}
            onViewAll={() => setMainTab('news')}
            formatTimeAgo={formatTimeAgo}
          />
          
          <div className="px-3 sm:px-4 space-y-3 sm:space-y-4">
          {/* Main Content Tabs */}
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'news' | 'opportunities')} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-3 sm:mb-4 h-10 sm:h-11">
              <TabsTrigger value="news" className={cn('gap-1.5 sm:gap-2 text-xs sm:text-sm', isRTL && 'font-arabic')}>
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isRTL ? 'آخر الأخبار' : 'Latest News'}
              </TabsTrigger>
              <TabsTrigger value="opportunities" className={cn('gap-1.5 sm:gap-2 text-xs sm:text-sm', isRTL && 'font-arabic')}>
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isRTL ? 'الفرص' : 'Opportunities'}
              </TabsTrigger>
            </TabsList>

            {/* Latest News Tab */}
            <TabsContent value="news" className="mt-0">
              {/* Loading skeleton */}
              {isNewsLoading && articles.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'rounded-xl overflow-hidden border border-border/50 bg-card',
                        i === 0 && 'col-span-2 md:col-span-2',
                      )}
                    >
                      <div className={cn('bg-muted animate-pulse', i === 0 ? 'aspect-video' : 'aspect-[4/3]')} />
                      <div className="p-2.5 space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Globe className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className={cn('font-semibold text-base sm:text-lg mb-1', isRTL && 'font-arabic')}>
                    {isRTL ? 'لا توجد أخبار حالياً' : 'No news yet'}
                  </h3>
                  <p className={cn('text-sm text-muted-foreground max-w-xs', isRTL && 'font-arabic')}>
                    {isRTL ? 'تعذر تحميل الأخبار، حاول التحديث لاحقاً' : 'Could not load news, try refreshing later'}
                  </p>
                </div>
              ) : (
              /* News Grid - Tiles Layout for Mobile */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {filteredNews.map((article, idx) => (
                  <Card 
                    key={article.id}
                    className={cn(
                      'overflow-hidden cursor-pointer hover:shadow-md transition-shadow',
                      idx === 0 && 'col-span-2 sm:col-span-2 md:col-span-2'
                    )}
                    onClick={() => setSelectedArticle(article)}
                  >
                    {idx === 0 ? (
                      // Featured article (first one) - larger tile
                      <div>
                        <div className="relative aspect-[16/9] sm:aspect-video bg-secondary">
                          <Image
                            src={article.image}
                            alt={isRTL ? article.titleAr : article.title}
                            fill
                            className="object-cover"
                          />
                          <Badge 
                            className="absolute top-2 start-2 sm:top-3 sm:start-3 bg-primary text-[10px] sm:text-xs"
                          >
                            {isRTL ? categoryConfig[article.category].labelAr : categoryConfig[article.category].labelEn}
                          </Badge>
                        </div>
                        <CardContent className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
                          <h3 className={cn(
                            'font-semibold text-sm sm:text-lg line-clamp-2',
                            isRTL && 'font-arabic'
                          )}>
                            {isRTL ? article.titleAr : article.title}
                          </h3>
                          <p className={cn(
                            'text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block',
                            isRTL && 'font-arabic'
                          )}>
                            {isRTL ? article.summaryAr : article.summary}
                          </p>
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                            <span className={cn(isRTL && 'font-arabic')}>{isRTL ? article.sourceAr : article.source}</span>
                            <span>{formatTimeAgo(article.publishedAt)}</span>
                          </div>
                        </CardContent>
                      </div>
                    ) : (
                      // Regular article - small tile
                      <div>
                        <div className="relative aspect-[4/3] bg-secondary">
                          <Image
                            src={article.image}
                            alt={isRTL ? article.titleAr : article.title}
                            fill
                            className="object-cover"
                          />
                          <Badge 
                            variant="secondary" 
                            className="absolute top-1.5 start-1.5 text-[9px] sm:text-[10px] px-1.5 py-0.5"
                          >
                            {isRTL ? categoryConfig[article.category].labelAr : categoryConfig[article.category].labelEn}
                          </Badge>
                        </div>
                        <CardContent className="p-2 sm:p-3" dir={isRTL ? 'rtl' : 'ltr'}>
                          <h3 className={cn(
                            'font-medium text-[11px] sm:text-sm line-clamp-2 mb-1.5 sm:mb-2',
                            isRTL && 'font-arabic'
                          )}>
                            {isRTL ? article.titleAr : article.title}
                          </h3>
                          <div className="flex items-center justify-between text-[9px] sm:text-xs text-muted-foreground">
                            <span className={cn('truncate max-w-[50%]', isRTL && 'font-arabic')}>
                              {isRTL ? article.sourceAr : article.source}
                            </span>
                            <span className="flex-shrink-0">{formatTimeAgo(article.publishedAt)}</span>
                          </div>
                        </CardContent>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
              )}
            </TabsContent>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities" className="mt-0 space-y-5">
              {/* Scholarships Section */}
              <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className={cn('font-semibold text-base sm:text-lg', isRTL && 'font-arabic')}>
                    {isRTL ? 'المنح الدراسية' : 'Scholarships'}
                  </h3>
                </div>
                
                {mockScholarships.map((scholarship) => (
                  <Card key={scholarship.id} className="border-primary/20 hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <h4 className={cn('font-semibold text-sm sm:text-base leading-snug line-clamp-2', isRTL && 'font-arabic')}>
                          {isRTL ? scholarship.titleAr : scholarship.title}
                        </h4>
                        {scholarship.fullyFunded && (
                          <Badge className="bg-green-500 hover:bg-green-600 shrink-0 w-fit text-[11px] sm:text-xs">
                            {isRTL ? 'ممولة بالكامل' : 'Fully Funded'}
                          </Badge>
                        )}
                      </div>
                      
                      <p className={cn('text-xs sm:text-sm text-muted-foreground line-clamp-2', isRTL && 'font-arabic')}>
                        {isRTL ? scholarship.descriptionAr : scholarship.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground">
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
                          className="flex-1 gap-1.5 text-xs sm:text-sm h-9 sm:h-10"
                          onClick={() => window.open(scholarship.url, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {isRTL ? 'التفاصيل' : 'Details'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-1.5 text-xs sm:text-sm h-9 sm:h-10 text-green-600 border-green-600 hover:bg-green-50 px-3"
                          onClick={() => shareToWhatsApp(isRTL ? scholarship.titleAr : scholarship.title, 'scholarship')}
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{isRTL ? 'واتساب' : 'WhatsApp'}</span>
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
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  <h3 className={cn('font-semibold text-base sm:text-lg', isRTL && 'font-arabic')}>
                    {isRTL ? 'فرص العمل' : 'Jobs'}
                  </h3>
                </div>
                
                {mockJobs.map((job) => (
                  <Card key={job.id} className="border-accent/20 hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className={cn('font-semibold text-sm sm:text-base leading-snug', isRTL && 'font-arabic')}>
                            {isRTL ? job.roleAr : job.role}
                          </h4>
                          <p className={cn('text-xs sm:text-sm text-muted-foreground', isRTL && 'font-arabic')}>
                            {isRTL ? job.companyAr : job.company}
                          </p>
                        </div>
                        <Badge 
                          variant={job.isRemote ? 'default' : 'secondary'}
                          className={cn('w-fit text-[11px] sm:text-xs', job.isRemote && 'bg-blue-500 hover:bg-blue-600')}
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
                      
                      <p className={cn('text-xs sm:text-sm text-muted-foreground line-clamp-2', isRTL && 'font-arabic')}>
                        {isRTL ? job.descriptionAr : job.description}
                      </p>
                      
                      <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-accent">
                        <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>{isRTL ? job.salaryRangeAr : job.salaryRange}</span>
                      </div>
                      
                      <div className="flex gap-2 pt-1">
                        <Button 
                          size="sm" 
                          className="flex-1 gap-1.5 text-xs sm:text-sm h-9 sm:h-10 bg-accent hover:bg-accent/90"
                          onClick={() => window.open(job.applyUrl, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {isRTL ? 'تقدم الآن' : 'Apply Now'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-1.5 text-xs sm:text-sm h-9 sm:h-10 text-green-600 border-green-600 hover:bg-green-50 px-3"
                          onClick={() => shareToWhatsApp(isRTL ? job.roleAr : job.role, 'job')}
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{isRTL ? 'واتساب' : 'WhatsApp'}</span>
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
