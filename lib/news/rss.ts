// RSS news aggregator - fetches real news from official global Arabic sources.
// Content is refreshed automatically via Next.js fetch revalidation (see revalidate below).

export type NewsCategory = 'sudan' | 'sports' | 'economy' | 'world'

export interface NewsArticle {
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
  publishedAt: string // ISO string (serialisable across the network)
  url: string
}

interface FeedSource {
  url: string
  source: string
  sourceAr: string
}

// Official global news sources (Arabic editions) per category.
// Sudan + all Arab countries share the same "sudan" corner.
const FEEDS: Record<NewsCategory, FeedSource[]> = {
  sudan: [
    { url: 'https://arabic.cnn.com/api/v1/rss/middle-east/rss.xml', source: 'CNN Arabic', sourceAr: 'CNN بالعربية' },
    { url: 'https://www.skynewsarabia.com/rss', source: 'Sky News Arabia', sourceAr: 'سكاي نيوز عربية' },
    { url: 'https://feeds.bbci.co.uk/arabic/rss.xml', source: 'BBC Arabic', sourceAr: 'BBC عربي' },
  ],
  sports: [
    { url: 'https://arabic.cnn.com/api/v1/rss/sport/rss.xml', source: 'CNN Arabic', sourceAr: 'CNN بالعربية' },
  ],
  economy: [
    { url: 'https://arabic.cnn.com/api/v1/rss/business/rss.xml', source: 'CNN Arabic', sourceAr: 'CNN بالعربية' },
  ],
  world: [
    { url: 'https://arabic.cnn.com/api/v1/rss/world/rss.xml', source: 'CNN Arabic', sourceAr: 'CNN بالعربية' },
    { url: 'https://feeds.bbci.co.uk/arabic/rss.xml', source: 'BBC Arabic', sourceAr: 'BBC عربي' },
  ],
}

// Category fallback images used when a feed item has no image of its own.
const FALLBACK_IMAGE: Record<NewsCategory, string> = {
  sudan: '/news/fallback-sudan.png',
  sports: '/news/fallback-sports.png',
  economy: '/news/fallback-economy.png',
  world: '/news/fallback-world.png',
}

// Keywords that mark an article as Sudan-specific (bubbled to the top of the Sudan corner).
const SUDAN_KEYWORDS = ['السودان', 'سوداني', 'سودانية', 'الخرطوم', 'بورتسودان', 'دارفور', 'الجنينة', 'الفاشر', 'الدعم السريع']

function stripCData(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function stripHtml(value: string): string {
  return decodeEntities(stripCData(value).replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function firstMatch(block: string, regexes: RegExp[]): string {
  for (const regex of regexes) {
    const match = block.match(regex)
    if (match && match[1]) return match[1].trim()
  }
  return ''
}

function extractImage(block: string): string {
  // Try media:content / media:thumbnail / enclosure attributes, then first <img> in the body.
  const attr = firstMatch(block, [
    /<media:content[^>]*\burl="([^"]+)"/i,
    /<media:thumbnail[^>]*\burl="([^"]+)"/i,
    /<enclosure[^>]*\burl="([^"]+)"/i,
  ])
  if (attr) return attr
  const inline = firstMatch(block, [/<img[^>]*\bsrc="([^"]+)"/i])
  return inline || ''
}

function makeId(url: string, title: string): string {
  const base = url || title
  let hash = 0
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i)
    hash |= 0
  }
  return `n${Math.abs(hash).toString(36)}`
}

function parseFeed(xml: string, feed: FeedSource, category: NewsCategory): NewsArticle[] {
  const items = xml.match(/<item\b[^>]*>([\s\S]*?)<\/item>/gi) ?? []
  const articles: NewsArticle[] = []

  for (const raw of items) {
    const title = stripHtml(firstMatch(raw, [/<title[^>]*>([\s\S]*?)<\/title>/i]))
    if (!title) continue

    const link = decodeEntities(stripCData(firstMatch(raw, [/<link[^>]*>([\s\S]*?)<\/link>/i])))
    const description = stripHtml(firstMatch(raw, [/<description[^>]*>([\s\S]*?)<\/description>/i]))
    const fullContent = stripHtml(
      firstMatch(raw, [/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i]),
    )
    const pubDateRaw = firstMatch(raw, [/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i, /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i])
    const parsedDate = pubDateRaw ? new Date(pubDateRaw) : new Date()
    const publishedAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()

    const image = extractImage(raw) || FALLBACK_IMAGE[category]
    const summary = description || fullContent.slice(0, 200)
    const content = fullContent || description

    articles.push({
      id: makeId(link, title),
      title,
      titleAr: title,
      summary,
      summaryAr: summary,
      content,
      contentAr: content,
      image,
      source: feed.source,
      sourceAr: feed.sourceAr,
      category,
      publishedAt,
      url: link,
    })
  }

  return articles
}

async function fetchFeed(feed: FeedSource, category: NewsCategory): Promise<NewsArticle[]> {
  try {
    const res = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RakobatnaNews/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      // Revalidate on the server every 15 minutes so content refreshes automatically.
      next: { revalidate: 900 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseFeed(xml, feed, category)
  } catch {
    return []
  }
}

function dedupeAndSort(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>()
  const unique: NewsArticle[] = []
  for (const article of articles) {
    const key = article.title.slice(0, 60)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(article)
  }
  return unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

async function fetchCategory(category: NewsCategory): Promise<NewsArticle[]> {
  const results = await Promise.all(FEEDS[category].map((feed) => fetchFeed(feed, category)))
  const merged = dedupeAndSort(results.flat())

  // In the Sudan & Arab corner, surface Sudan-specific stories first.
  if (category === 'sudan') {
    const isSudan = (a: NewsArticle) => SUDAN_KEYWORDS.some((k) => a.title.includes(k) || a.summary.includes(k))
    const sudanFirst = merged.filter(isSudan)
    const rest = merged.filter((a) => !isSudan(a))
    return [...sudanFirst, ...rest]
  }
  return merged
}

const CATEGORIES: NewsCategory[] = ['sudan', 'sports', 'economy', 'world']

/**
 * Get aggregated news. Pass a specific category, or omit for a mixed "all" feed
 * where every article is tagged with its real category for client-side filtering.
 */
export async function getNews(category?: NewsCategory | 'all'): Promise<NewsArticle[]> {
  if (category && category !== 'all') {
    return (await fetchCategory(category)).slice(0, 40)
  }

  const perCategory = await Promise.all(CATEGORIES.map((cat) => fetchCategory(cat)))
  // Interleave a healthy amount from each category, then sort the whole set by recency.
  const mixed = perCategory.flatMap((articles) => articles.slice(0, 20))
  return dedupeAndSort(mixed).slice(0, 60)
}
