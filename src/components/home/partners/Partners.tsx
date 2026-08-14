import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { partnersRawData } from '@/data/partners'
import styles from './Partners.module.css'
import { useTranslation } from '../../../hooks/useTranslation'

export default function PartnersSection() {
  const { t } = useTranslation()
  const scrollRef1 = useRef<HTMLDivElement>(null)
  const scrollRef2 = useRef<HTMLDivElement>(null)

  // 只显示有logo的合作伙伴，不区分时间和等级，并根据title去重
  const validPartners = partnersRawData
    .filter(
      partner => partner.logo && 
      partner.logo !== '/logo.png' && 
      partner.logo.trim() !== ''
    )
    .reduce<typeof partnersRawData>((acc, partner) => {
      // 检查是否已存在相同title的合作伙伴
      const existingIndex = acc.findIndex(existing => existing.title === partner.title)
      if (existingIndex === -1) {
        // 如果不存在，直接添加
        acc.push(partner)
      }
      return acc
    }, [])

  // 将合作伙伴数组分成两组
  const midIndex = Math.ceil(validPartners.length / 2)
  const firstRowPartners = [...validPartners.slice(0, midIndex), ...validPartners.slice(0, midIndex)]
  const secondRowPartners = [...validPartners.slice(midIndex), ...validPartners.slice(midIndex)]

  useEffect(() => {
    let animationFrame1: number
    let animationFrame2: number
    const scrollContainer1 = scrollRef1.current
    const scrollContainer2 = scrollRef2.current

    const scroll1 = () => {
      if (scrollContainer1) {
        scrollContainer1.scrollLeft += 1
        
        // 当滚动到一半时重置到开始位置，实现无缝循环
        if (scrollContainer1.scrollLeft >= scrollContainer1.scrollWidth / 2) {
          scrollContainer1.scrollLeft = 0
        }
      }
      animationFrame1 = requestAnimationFrame(scroll1)
    }

    const scroll2 = () => {
      if (scrollContainer2) {
        scrollContainer2.scrollLeft -= 1
        
        // 当滚动到开始位置时重置到一半位置，实现反向无缝循环
        if (scrollContainer2.scrollLeft <= 0) {
          scrollContainer2.scrollLeft = scrollContainer2.scrollWidth / 2
        }
      }
      animationFrame2 = requestAnimationFrame(scroll2)
    }

    // 开始自动滚动
    const startScrolling = () => {
      animationFrame1 = requestAnimationFrame(scroll1)
      animationFrame2 = requestAnimationFrame(scroll2)
    }

    // 停止自动滚动
    const stopScrolling = () => {
      cancelAnimationFrame(animationFrame1)
      cancelAnimationFrame(animationFrame2)
    }

    // 添加鼠标事件监听器
    const containers = [scrollContainer1, scrollContainer2]
    containers.forEach(container => {
      if (container) {
        container.addEventListener('mouseenter', stopScrolling)
        container.addEventListener('mouseleave', startScrolling)
      }
    })

    // 初始化第二行的滚动位置
    if (scrollContainer2) {
      scrollContainer2.scrollLeft = scrollContainer2.scrollWidth / 2
    }

    // 启动轮播
    startScrolling()

    // 清理函数
    return () => {
      cancelAnimationFrame(animationFrame1)
      cancelAnimationFrame(animationFrame2)
      containers.forEach(container => {
        if (container) {
          container.removeEventListener('mouseenter', stopScrolling)
          container.removeEventListener('mouseleave', startScrolling)
        }
      })
    }
  }, [])

  return (
    <section className={styles.partnersSection}>
      <div className={styles.container}>
        <div className={styles.partnersBlock}>
          <div className={styles.blockHeader}>
            <div className={styles.blockNumber}>{t('homepage.mission.blockNumber04')}</div>
            <h2 className={styles.blockTitle}>{t('homepage.mission.ourPartners')}</h2>
            <div className={styles.blockDivider}></div>
          </div>
          
          <div className={styles.partnersCarouselContainer}>
            {/* 第一行 - 向右滚动 */}
            <div className={styles.partnersCarousel}>
              <div 
                ref={scrollRef1}
                className={styles.partnersScroll}
              >
                <div className={styles.partnersTrack}>
                  {firstRowPartners.map((partner, index) => (
                    <Link
                      key={`row1-${partner.organization}-${index}`}
                      href="/partners"
                      className={styles.partnerCard}
                    >
                      <div className={styles.partnerLogoWrapper}>
                        <Image
                          src={partner.logo}
                          alt={partner.title}
                          fill
                          sizes="(max-width: 480px) 80px, (max-width: 768px) 100px, 120px"
                          className={styles.partnerLogo}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 第二行 - 向左滚动 */}
            <div className={styles.partnersCarousel}>
              <div 
                ref={scrollRef2}
                className={styles.partnersScroll}
              >
                <div className={styles.partnersTrack}>
                  {secondRowPartners.map((partner, index) => (
                    <Link
                      key={`row2-${partner.organization}-${index}`}
                      href="/partners"
                      className={styles.partnerCard}
                    >
                      <div className={styles.partnerLogoWrapper}>
                        <Image
                          src={partner.logo}
                          alt={partner.title}
                          fill
                          sizes="(max-width: 480px) 80px, (max-width: 768px) 100px, 120px"
                          className={styles.partnerLogo}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
