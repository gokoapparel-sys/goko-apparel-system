import React from 'react'
import { COMPANY_INFO } from '../../constants/companyInfo'
import '../../styles/exhibition2026JanLP.css'

const Exhibition2026JanLP: React.FC = () => {
  return (
    <div className="exhibition-2026-aw-landing-page">
      {/* ヘッダー */}
      <header className="lp-header-2026">
        <div className="header-container-2026">
          <div className="logo-2026">
            <img src={COMPANY_INFO.logo} alt={COMPANY_INFO.name} />
          </div>
          <nav className="header-nav-2026">
            <a href="#info">開催情報</a>
            <a href="#access">アクセス</a>
            <a href="#contact">お問い合わせ</a>
          </nav>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section
        className="hero-section-2026 hero-with-custom-bg"
      >
        <div className="hero-overlay-2026"></div>
        <div className="hero-content-2026">
          <h1 className="hero-title-2026">
            <span className="title-line-year">GOKO EXHIBITION</span>
            <span className="title-line-main-2026">2026</span>
            <span className="title-line-sub">Autumn & Winter</span>
          </h1>
          <div className="hero-divider"></div>
          <p className="hero-subtitle-2026">
            2026年1月13日（火）～ 16日（金）
          </p>
          <p className="hero-location-2026">
            株式会社 互興　本社ショールーム
          </p>
          <div className="hero-description-2026">
            <p className="hero-description-text">
              この度「2026 AUTUMN & WINTER GOKO EXHIBITION」を開催する運びとなりましたのでご案内いたします。
            </p>
            <p className="hero-description-text">
              ご来場日程とお時間を事前に各営業担当にご連絡の上お越しください
            </p>
          </div>
        </div>
        <div className="scroll-indicator">
          <span>SCROLL</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* 開催情報セクション */}
      <section id="info" className="info-section-2026">
        <div className="section-container-2026">
          <h2 className="section-title-2026">開催情報</h2>
          <div className="info-grid-2026">
            <div className="info-card-2026">
              <div className="info-icon-2026">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3>開催期間</h3>
              <p className="info-detail-2026">
                2026年1月13日（火）<br />
                ～ 1月16日（金）
              </p>
            </div>

            <div className="info-card-2026">
              <div className="info-icon-2026">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3>開催時間</h3>
              <p className="info-detail-2026">
                10:00 ～ 18:00<br />
                <span className="info-note">※最終日は17:00まで</span>
              </p>
            </div>

            <div className="info-card-2026">
              <div className="info-icon-2026">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3>開催場所</h3>
              <p className="info-detail-2026">
                株式会社 互興<br />
                本社ショールーム
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* アクセス情報セクション */}
      <section id="access" className="access-section-2026">
        <div className="section-container-2026">
          <h2 className="section-title-2026">アクセス</h2>
          <div className="access-content">
            <div className="access-info">
              <div className="access-item">
                <h3>住所</h3>
                <p>{COMPANY_INFO.fullAddress}</p>
              </div>
              <div className="access-item">
                <h3>最寄駅</h3>
                <p>
                  東京メトロ 銀座線・半蔵門線・千代田線<br />
                  「表参道」駅 A2出口より徒歩7分
                </p>
                <p className="access-alternative">
                  東京メトロ 銀座線<br />
                  「外苑前」駅 3番出口より徒歩8分
                </p>
              </div>
            </div>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3241.234837271384!2d139.7082!3d35.6675!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188c7e4f3b8f8b%3A0x1234567890abcdef!2z5p2x5Lqs6YO95riL6LC35Yy656We5a6u5YmN77yT5LiB55uu77yW4oiS77yR77yQ!5e0!3m2!1sja!2sjp!4v1234567890123!5m2!1sja!2sjp&q=東京都渋谷区神宮前3-6-10"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="株式会社 互興 本社ショールーム"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* お問い合わせセクション */}
      <section id="contact" className="contact-section-2026">
        <div className="section-container-2026">
          <h2 className="section-title-2026">お問い合わせ</h2>
          <div className="contact-info-2026">
            <div className="contact-box">
              <div className="contact-item-2026">
                <h3>{COMPANY_INFO.name}</h3>
                <p className="company-name-en">{COMPANY_INFO.nameEn}</p>
              </div>
              <div className="contact-item-2026">
                <p>{COMPANY_INFO.fullAddress}</p>
                <p>{COMPANY_INFO.phoneFormatted}</p>
              </div>
              <div className="contact-item-2026">
                <a
                  href="https://www.goko-group.co.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="website-link"
                >
                  www.goko-group.co.jp
                </a>
              </div>
              <div className="contact-item-2026">
                <p className="contact-message">
                  展示会に関するお問い合わせは、<br />
                  お気軽にご連絡ください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="lp-footer-2026">
        <div className="footer-container-2026">
          <div className="footer-logo-2026">
            <img src={COMPANY_INFO.logo} alt={COMPANY_INFO.name} />
          </div>
          <div className="footer-links">
            <a
              href="https://www.goko-group.co.jp/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Corporate Website
            </a>
          </div>
          <p className="footer-text-2026">
            © {new Date().getFullYear()} {COMPANY_INFO.nameEn}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Exhibition2026JanLP
