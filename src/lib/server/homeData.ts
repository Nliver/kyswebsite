import type { Article } from '@/pages/api/article'
import type { Event } from '@/pages/api/event'

type ApiResponse<T> = {
  code?: number
  message?: string
  data?: T
}

const HOME_PAGE_SIZE = 3
const REQUEST_TIMEOUT_MS = 5000

async function fetchPublicList<Item>(
  endpoint: string,
  dataKey: string
): Promise<Item[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  if (!apiUrl) {
    console.warn('Skipping homepage data fetch: API URL is not defined')
    return []
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`)
    }

    const payload = (await response.json()) as ApiResponse<
      Record<string, Item[] | undefined>
    >

    if (payload.code && payload.code !== 200) {
      throw new Error(payload.message || `API returned code ${payload.code}`)
    }

    const items = payload.data?.[dataKey]

    return Array.isArray(items) ? items : []
  } catch (error) {
    console.error(
      `Failed to fetch public homepage data from ${endpoint}:`,
      error
    )
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getHomePageData(): Promise<{
  events: Event[]
  articles: Article[]
}> {
  const eventQuery = new URLSearchParams({
    publish_status: '2',
    order: 'desc',
    page: '1',
    page_size: HOME_PAGE_SIZE.toString()
  })
  const articleQuery = new URLSearchParams({
    publish_status: '2',
    category: 'blog',
    order: 'desc',
    page: '1',
    page_size: HOME_PAGE_SIZE.toString()
  })

  const [events, articles] = await Promise.all([
    fetchPublicList<Event>(`/events?${eventQuery}`, 'events'),
    fetchPublicList<Article>(`/articles?${articleQuery}`, 'articles')
  ])

  return { events, articles }
}
