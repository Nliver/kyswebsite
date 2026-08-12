'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import styles from './Carousel.module.css'
import { useTranslation } from '../../../hooks/useTranslation'

type EventItem = {
  ID: number
  title?: string
  cover_img?: string
  event_setting?: number
  bage_link?: string
}

type ArticleItem = {
  ID: number
  title?: string
  cover_img?: string
}

type CarouselImage = {
  src: string
  detailUrl: string
  openInNewTab: boolean
  alt?: string
}

const CLOUDINARY_HOSTNAME = 'res.cloudinary.com'

function getCloudinaryImageUrl(src: string, transformation: string) {
  try {
    const url = new URL(src)

    if (url.hostname !== CLOUDINARY_HOSTNAME) {
      return src
    }

    const uploadSegment = '/upload/'
    const uploadIndex = url.pathname.indexOf(uploadSegment)

    if (uploadIndex === -1) {
      return src
    }

    const transformationIndex = uploadIndex + uploadSegment.length
    url.pathname = `${url.pathname.slice(0, transformationIndex)}${transformation}/${url.pathname.slice(transformationIndex)}`

    return url.toString()
  } catch {
    return src
  }
}

export default function Carousel({
  events,
  articles
}: {
  events: EventItem[]
  articles: ArticleItem[]
}) {
  const { t } = useTranslation()
  const [selectedImage, setSelectedImage] = useState<CarouselImage | null>(null)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isAtEnd, setIsAtEnd] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const carouselImages = useMemo(() => {
    const eventImages = events
      .map((event) => {
        const isExternal = event.event_setting === 2 && event.bage_link
        return {
          src: event.cover_img || '',
          alt: event.title,
          detailUrl: isExternal ? event.bage_link || '' : `/events/${event.ID}`,
          openInNewTab: Boolean(isExternal)
        }
      })
      .filter((image) => Boolean(image.src))

    const articleImages = articles
      .map((article) => ({
        src: article.cover_img || '',
        alt: article.title,
        detailUrl: `/blogs/${article.ID}`,
        openInNewTab: false
      }))
      .filter((image) => Boolean(image.src))

    return [...eventImages, ...articleImages]
  }, [events, articles])

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current
      setIsAtStart(scrollLeft <= 1)
      setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 1)
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      checkScrollPosition()
      container.addEventListener('scroll', checkScrollPosition)
      window.addEventListener('resize', checkScrollPosition)

      return () => {
        container.removeEventListener('scroll', checkScrollPosition)
        window.removeEventListener('resize', checkScrollPosition)
      }
    }
  }, [])

  useEffect(() => {
    if (!scrollContainerRef.current) {
      return
    }

    const rafId = requestAnimationFrame(() => {
      checkScrollPosition()
    })

    return () => cancelAnimationFrame(rafId)
  }, [carouselImages.length])

  if (carouselImages.length === 0) {
    return null
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollDistance =
        window.innerWidth >= 1800 ? 425 : window.innerWidth >= 1300 ? 320 : 407
      scrollContainerRef.current.scrollBy({
        left: -scrollDistance,
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollDistance =
        window.innerWidth >= 1800 ? 425 : window.innerWidth >= 1300 ? 320 : 407
      scrollContainerRef.current.scrollBy({
        left: scrollDistance,
        behavior: 'smooth'
      })
    }
  }

  const openImageModal = (image: CarouselImage) => {
    setSelectedImage(image)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  const handleDetailClick = () => {
    if (selectedImage) {
      if (selectedImage.openInNewTab) {
        window.open(selectedImage.detailUrl, '_blank')
      } else {
        window.location.href = selectedImage.detailUrl
      }
    }
  }

  return (
    <section className={styles.carousel}>
      <div className={styles.container}>
        <button
          className={`${styles.navButton} ${styles.navLeft} ${isAtStart ? styles.disabled : ''}`}
          onClick={scrollLeft}
          disabled={isAtStart}
          aria-label="Previous images"
        >
          <ChevronLeft size={24} />
        </button>

        <div className={styles.scrollContainer} ref={scrollContainerRef}>
          <div className={styles.imageGrid}>
            {carouselImages.map((image, index) => (
              <div
                key={index}
                className={styles.imageWrapper}
                onClick={() => openImageModal(image)}
              >
                <Image
                  src={getCloudinaryImageUrl(
                    image.src,
                    'w_800,c_fill,f_auto,q_auto'
                  )}
                  alt={image.alt || `Activity ${index + 1}`}
                  width={400}
                  height={300}
                  className={styles.image}
                  sizes="(max-width: 480px) 200px, (max-width: 768px) 250px, (max-width: 1299px) 387px, (max-width: 1799px) 300px, 405px"
                  preload={index === 0}
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>

        <button
          className={`${styles.navButton} ${styles.navRight} ${isAtEnd ? styles.disabled : ''}`}
          onClick={scrollRight}
          disabled={isAtEnd}
          aria-label="Next images"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {selectedImage && (
        <div className={styles.modal} onClick={closeImageModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeButton}
              onClick={closeImageModal}
              aria-label="Close image"
            >
              <X size={24} />
            </button>
            <div className={styles.imageContainer}>
              <Image
                src={getCloudinaryImageUrl(
                  selectedImage.src,
                  'w_1600,c_limit,f_auto,q_auto'
                )}
                alt={selectedImage.alt || 'Enlarged view'}
                width={800}
                height={600}
                className={styles.modalImage}
                sizes="90vw"
                unoptimized
              />
              <button
                className={styles.detailButton}
                onClick={handleDetailClick}
                aria-label="View details"
              >
                <ExternalLink size={16} />
                {t('homepage.carousel.viewDetails')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
