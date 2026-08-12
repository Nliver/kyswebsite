import type { GetStaticProps } from 'next'
import { useEffect, useRef } from 'react'

import styles from './index.module.css'

import Hero from '@/components/home/hero/Hero'
import MissionSection from '@/components/home/mission/Mission'
import EventSection from '@/components/home/events/Events'
import ArticleSection from '@/components/home/article/Article'
import CarouselSession from '@/components/home/carousel/Carousel'
import PartnersSection from '@/components/home/partners/Partners'
import type { Event } from '@/pages/api/event'
import type { Article } from '@/pages/api/article'
import { getHomePageData } from '@/lib/server/homeData'

type HomePageProps = {
  events: Event[]
  articles: Article[]
}

export default function Home({ events, articles }: HomePageProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animationFrame: number
    const scrollContainer = scrollRef.current

    const scroll = () => {
      if (scrollContainer) {
        scrollContainer.scrollLeft += 0.5
        if (
          scrollContainer.scrollLeft >=
          scrollContainer.scrollWidth - scrollContainer.clientWidth
        ) {
          scrollContainer.scrollLeft = 0
        }
      }
      animationFrame = requestAnimationFrame(scroll)
    }

    animationFrame = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(animationFrame)
  }, [])

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
        <CarouselSession events={events} articles={articles} />
      </div>

      {/* Activities Section */}
      <EventSection events={events} />
      <ArticleSection articles={articles} />
      {/* Mission Section */}
      <MissionSection />
      {/* Partners Section */}
      <PartnersSection />
    </div>
  )
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const { events, articles } = await getHomePageData()

  return {
    props: { events, articles },
    revalidate: 60
  }
}
