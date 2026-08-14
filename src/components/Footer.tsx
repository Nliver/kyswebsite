import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from '../hooks/useTranslation'
import { FaFacebook, FaGithub, FaLinkedin } from 'react-icons/fa'
import { SiBilibili, SiWechat, SiX } from 'react-icons/si'
import { useState } from 'react'
import { Modal } from 'antd'
import styles from '../styles/Footer.module.css'

interface MenuItem {
  labelKey: string
  href: string
  target?: string
}

interface MenuSection {
  titleKey: string
  items: MenuItem[]
}

export default function Footer() {
  const [isWeChatModalOpen, setIsWeChatModalOpen] = useState(false)
  const { t } = useTranslation()

  // 基于开源社 Header 组件中的主导航菜单项，使用翻译键
  const menuSections: MenuSection[] = [
    {
      titleKey: 'navigation.about_us',
      items: [
        { labelKey: 'navigation.intro', href: '/about' },
        { labelKey: 'navigation.governance.board', href: '/department/board' },
        {
          labelKey: 'navigation.governance.advisory',
          href: '/department/advisory'
        },
        { labelKey: 'navigation.governance.legal', href: '/department/legal' },
        { labelKey: 'navigation.executive', href: '/department/executive' },
        {
          labelKey: 'navigation.project_committee',
          href: '/department/project'
        },
        { labelKey: 'navigation.brand_resources', href: '/brand' }
      ]
    },
    {
      titleKey: 'navigation.governance.title',
      items: [
        { labelKey: 'navigation.charter', href: '/charter' },
        {
          labelKey: 'navigation.open_source_manifesto',
          href: '/governance/open-source-manifesto'
        },
        {
          labelKey: 'navigation.code_of_conduct',
          href: '/governance/code-of-conduct'
        },
        { labelKey: 'navigation.annual_report_full', href: '/kysreports' }
      ]
    },
    {
      titleKey: 'navigation.community_development',
      items: [
        { labelKey: 'navigation.partners', href: '/partners' },
        {
          labelKey: 'navigation.governance.formal_members',
          href: '/department/members'
        },
        {
          labelKey: 'navigation.honors.open_source_star',
          href: '/community/star'
        },
        {
          labelKey: 'navigation.honors.annual_volunteer',
          href: '/community/volunteer'
        },
        {
          labelKey: 'navigation.honors.coscon_star',
          href: '/community/coscon'
        },
        {
          labelKey: 'navigation.honors.community_cooperation_star',
          href: '/community/cooperation'
        },
        { labelKey: 'navigation.governance.kcc', href: '/community' },
        {
          labelKey: 'navigation.knowledge.china_open_source_annual_report',
          href: '/osreports'
        },
        {
          labelKey: 'navigation.honors.china_open_source_pioneer',
          href: '/community/pioneer'
        },
        {
          labelKey: 'navigation.honors.china_open_source_power_list',
          href: 'https://opensource.win/',
          target: '_blank'
        }
      ]
    },
    {
      titleKey: 'navigation.activities.title',
      items: [
        {
          labelKey: 'navigation.china_open_source_conference',
          href: '/events/coscon'
        },
        { labelKey: 'navigation.cooperation_activities', href: '/events' },
        {
          labelKey: 'navigation.activities.activity_calendar',
          href: '/events/calendar'
        }
      ]
    },
    {
      titleKey: 'navigation.blogs_announcements',
      items: [
        { labelKey: 'navigation.blogs', href: '/blogs' },
        { labelKey: 'navigation.announcements', href: '/announcement' }
      ]
    }
  ]

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          {/* Left section with logo and description */}
          <div className={styles.footerLeft}>
            <div className={styles.logoSection}>
              <Image
                src="/footer-logo.png"
                alt="KAIYUANSHE Logo"
                width={200}
                height={100}
                className={styles.footerLogo}
              />
              <p className={styles.aboutDescription}>
                {t('homepage.introduction.paragraph1')}
              </p>
            </div>

            {/* Social media icons */}
            <div className={styles.socialSection}>
              <div className={styles.socialLinks}>
                <Link
                  href="https://github.com/kaiyuanshe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  aria-label="GitHub"
                >
                  <FaGithub className={styles.socialIcon} />
                </Link>
                <Link
                  href="https://x.com/kaiyuanshe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  aria-label="X (Twitter)"
                >
                  <SiX className={styles.socialIcon} />
                </Link>
                <Link
                  href="https://www.facebook.com/kaiyuanshe/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  aria-label="Facebook"
                >
                  <FaFacebook className={styles.socialIcon} />
                </Link>
                <Link
                  href="https://www.linkedin.com/company/kaiyuanshe/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className={styles.socialIcon} />
                </Link>
                <Link
                  href="https://space.bilibili.com/525037536"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  aria-label="Bilibili"
                >
                  <SiBilibili className={styles.socialIcon} />
                </Link>
                <button
                  className={styles.socialButton}
                  aria-label="微信公众号"
                  onClick={() => setIsWeChatModalOpen(true)}
                >
                  <SiWechat className={styles.socialIcon} />
                </button>
              </div>

              {/* Volunteer button */}
              <div className={styles.volunteerSection}>
                <Link
                  href="https://kaiyuanshe.feishu.cn/share/base/form/shrcntepbkm5aYu8wnhhXRgej0b"
                  target="_blank"
                  className={styles.volunteerButton}
                  aria-label={t('footer.become_volunteer')}
                >
                  {t('footer.become_volunteer')}
                </Link>
              </div>
            </div>
          </div>

          {/* Right section with navigation menu */}
          <div className={styles.footerRight}>
            {menuSections.map((section, index) => (
              <div key={index} className={styles.menuSection}>
                <h4 className={styles.menuTitle}>{t(section.titleKey)}</h4>
                <ul className={styles.menuList}>
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link
                        href={item.href}
                        className={styles.menuLink}
                        target={item.target}
                      >
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer bottom with copyright */}
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            <span>
              <span style={{ marginRight: '2rem' }}>
                {t('footer.copyright')}
              </span>
              <span style={{ marginRight: '2rem' }}>沪 ICP 备 19006015 号</span>
              <span>公安备案 31011202006203 号</span>
            </span>
          </p>
        </div>
      </div>

      {/* WeChat QR Code Modal */}
      <Modal
        title={t('footer.follow_wechat_title')}
        open={isWeChatModalOpen}
        onCancel={() => setIsWeChatModalOpen(false)}
        footer={null}
        centered
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Image
            src="/img/home/QRCode.png"
            alt={t('footer.wechat_qr_alt')}
            width={250}
            height={250}
            style={{ borderRadius: '8px' }}
          />
          <p style={{ marginTop: '16px', color: '#666' }}>
            {t('footer.wechat_qr_description')}
          </p>
        </div>
      </Modal>
    </footer>
  )
}
