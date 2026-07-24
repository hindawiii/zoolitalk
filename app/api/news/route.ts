import { NextResponse } from 'next/server'
import { getNews, type NewsCategory } from '@/lib/news/rss'

// Revalidate the route every 15 minutes so news content updates automatically.
export const revalidate = 900

const VALID: (NewsCategory | 'all')[] = ['all', 'sudan', 'sports', 'economy', 'world']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const param = searchParams.get('category') ?? 'all'
  const category = (VALID.includes(param as NewsCategory | 'all') ? param : 'all') as NewsCategory | 'all'

  try {
    const articles = await getNews(category)
    return NextResponse.json(
      { articles, updatedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      },
    )
  } catch {
    return NextResponse.json({ articles: [], updatedAt: new Date().toISOString() }, { status: 200 })
  }
}
