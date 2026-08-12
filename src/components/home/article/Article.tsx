import { Calendar, User, Eye, ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import dayjs from 'dayjs'
import { Tag } from 'antd'
import styles from './Article.module.css'
import { useTranslation } from '../../../hooks/useTranslation'
import type { Article } from '@/pages/api/article'
import AsyncContentState from '@/components/base/AsyncContentState'
import ContentCardSkeleton from '@/components/base/ContentCardSkeleton'
import type { AsyncStatus } from '@/types/async'

export function formatTime(isoTime: string): string {
  return dayjs(isoTime).format('YYYY年M月D日')
}

type ArticleSectionProps = {
  articles: Article[]
  status: AsyncStatus
  onRetry: () => void
}

export default function ArticleSection({
  articles,
  status,
  onRetry
}: ArticleSectionProps) {
  const { t } = useTranslation()

  return (
    <section className={styles.articles}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {t('homepage.articles.title')}
          </h2>
          <p className={styles.sectionDescription}>
            {t('homepage.articles.description')}
          </p>
        </div>
        <div className={styles.articlesGrid}>
          {status === 'loading' && (
            <ContentCardSkeleton label={t('common.loading')} />
          )}

          <AsyncContentState
            status={status}
            isEmpty={articles.length === 0}
            emptyDescription={t('homepage.articles.empty')}
            errorDescription={t('homepage.articles.loadError')}
            retryLabel={t('homepage.articles.retry')}
            onRetry={onRetry}
            icon={<BookOpen />}
          />

          {status === 'success' &&
            articles.map((article, index) => {
              return (
                <div key={article.ID || index} className={styles.articleCard}>
                  <div className={styles.articleCardGlow}></div>
                  <div className={styles.articleCardHeader}>
                    <div className={styles.articleMeta}>
                      <div className={styles.articleStats}>
                        <div className={styles.statItem}>
                          <Eye className={styles.articleIcon} />
                          {article.view_count || 0}
                        </div>
                      </div>
                    </div>
                    <h3 className={styles.articleTitle}>{article.title}</h3>
                    <p className={styles.articleDescription}>
                      {article.description}
                    </p>
                  </div>
                  <div className={styles.articleCardContent}>
                    <div className={styles.articleInfo}>
                      <div className={styles.articleInfoItem}>
                        <User className={styles.articleIcon} />
                        {article.author || t('homepage.articles.unknownAuthor')}
                      </div>

                      <div className={styles.articleInfoItem}>
                        <Calendar className={styles.articleIcon} />
                        {formatTime(article.CreatedAt)}
                      </div>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className={styles.tagsContainer}>
                        {article.tags
                          .slice(0, 3)
                          .map((tag: string, tagIndex: number) => (
                            <Tag key={tagIndex} className={styles.tag}>
                              {tag}
                            </Tag>
                          ))}
                      </div>
                    )}
                    <Link href={`/blogs/${article.ID}`} passHref>
                      <button className={styles.articleButton}>
                        {t('homepage.articles.readArticle')}
                        <ArrowRight className={styles.buttonIcon} />
                      </button>
                    </Link>
                  </div>
                </div>
              )
            })}
        </div>
        <div className={styles.sectionFooter}>
          <Link href="/blogs">
            <button className={styles.moreButton}>
              <BookOpen className={styles.buttonIcon} />
              {t('homepage.articles.viewMore')}
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
