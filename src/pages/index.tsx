import styles from './index.module.css'

import Hero from '@/components/home/hero/Hero'
import MissionSection from '@/components/home/mission/Mission'
import EventSection from '@/components/home/events/Events'
import ArticleSection from '@/components/home/article/Article'
import CarouselSession from '@/components/home/carousel/Carousel'
import PartnersSection from '@/components/home/partners/Partners'
import type { Event } from '@/pages/api/event'
import type { Article } from '@/pages/api/article'
import { fetchHomeArticles, fetchHomeEvents } from '@/lib/homeData'
import { useAsyncList } from '@/hooks/useAsyncList'

export default function Home() {
  const eventsState = useAsyncList<Event>(
    fetchHomeEvents,
    'Failed to load homepage events:'
  )
  const articlesState = useAsyncList<Article>(
    fetchHomeArticles,
    'Failed to load homepage articles:'
  )

  const retryCarousel = () => {
    if (eventsState.status === 'error') {
      void eventsState.reload()
    }

    if (articlesState.status === 'error') {
      void articlesState.reload()
    }
  }

  return (
    <div className={styles.homepage}>
      {/* session1 */}
      <div
        style={{
          background: `linear-gradient(
    135deg,
    var(--primary-400) 0%,
    #87ceeb 30%,
    #b3d9ff 50%,
    #87ceeb 70%,
    var(--primary-400) 100%
  )`
        }}
      >
        <Hero />
        <CarouselSession
          events={eventsState.data}
          articles={articlesState.data}
          eventsStatus={eventsState.status}
          articlesStatus={articlesState.status}
          onRetry={retryCarousel}
        />
      </div>

      {/* Activities Section */}
      <EventSection
        events={eventsState.data}
        status={eventsState.status}
        onRetry={eventsState.reload}
      />
      <ArticleSection
        articles={articlesState.data}
        status={articlesState.status}
        onRetry={articlesState.reload}
      />
      {/* Mission Section */}
      <MissionSection />
      {/* Partners Section */}
      <PartnersSection />
    </div>
  )
}
