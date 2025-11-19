import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Exhibition, Item } from '../../types'
import { exhibitionsService } from '../../services/exhibitionsService'
import { itemsService } from '../../services/itemsService'
import { COMPANY_INFO } from '../../constants/companyInfo'
import '../../styles/exhibitionLP.css'

const ExhibitionLandingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [galleryItems, setGalleryItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  // 表示する商品の品番リスト
  const FEATURED_ITEM_NOS = ['GKRH26AW-002', 'GE26SS-006', 'GKRH26AW-004']

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    if (!id) return

    try {
      setLoading(true)

      // 展示会データを取得
      const exhibitionData = await exhibitionsService.getExhibition(id)
      setExhibition(exhibitionData)

      // 全アイテムを取得してフィルタリング
      const result = await itemsService.listItems()
      const featuredItems = result.items.filter(item =>
        FEATURED_ITEM_NOS.includes(item.itemNo)
      )

      // 品番の順序通りにソート
      const sortedItems = FEATURED_ITEM_NOS.map(itemNo =>
        featuredItems.find(item => item.itemNo === itemNo)
      ).filter(Boolean) as Item[]

      setGalleryItems(sortedItems)

    } catch (error) {
      console.error('データ読み込みエラー:', error)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return ''
    let date: Date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      return ''
    }
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="lp-loading">
        <div className="loading-spinner"></div>
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!exhibition) {
    return (
      <div className="lp-error">
        <h2>展示会が見つかりません</h2>
        <p>指定された展示会は存在しないか、公開されていません。</p>
      </div>
    )
  }

  return (
    <div className="exhibition-landing-page">
      {/* ヘッダー */}
      <header className="lp-header">
        <div className="header-container">
          <div className="logo">
            <img src={COMPANY_INFO.logo} alt={COMPANY_INFO.name} />
          </div>
          <nav className="header-nav">
            <a href="#about">About</a>
            <a href="#info">Information</a>
            <a href="#gallery">Collection</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section
        className="hero-section"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)'
        }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-logo-corner">
          <img
            src="https://ronherman.jp/assets/front/img/common/site_logo.svg?1590567055"
            alt="Ron Herman"
            className="customer-logo-corner"
          />
        </div>
        <div className="hero-content">
          <div className="hero-badge">EXHIBITION</div>
          <h2 className="hero-customer-name">Ron Herman 様</h2>
          <h1 className="hero-title">
            <span className="title-line-main">26AW 展示会</span>
          </h1>
          <p className="hero-subtitle">
            開催日：{formatDate(exhibition.startDate)}
          </p>
          <p className="hero-location">開催場所：{exhibition.location}</p>
        </div>
      </section>

      {/* 展示会について */}
      <section id="about" className="about-section">
        <div className="section-container">
          <h2 className="section-title">ABOUT THE EXHIBITION</h2>
          <div className="about-content">
            {exhibition.description ? (
              <p className="description-text">{exhibition.description}</p>
            ) : (
              <p className="description-text">
                {COMPANY_INFO.name}が厳選した2026年秋冬コレクション。<br />
                トレンドを捉えた最新アイテムをご覧いただけます。
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 開催情報 */}
      <section id="info" className="info-section">
        <div className="section-container">
          <h2 className="section-title">EXHIBITION INFORMATION</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3>DATE</h3>
              <p className="info-detail">
                {formatDate(exhibition.startDate)}
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3>LOCATION</h3>
              <p className="info-detail">{exhibition.location}</p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3>STATUS</h3>
              <p className="info-detail">
                {exhibition.status === 'planning' && 'Coming Soon'}
                {exhibition.status === 'active' && 'Now Open'}
                {exhibition.status === 'completed' && 'Closed'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 出展商品ギャラリー */}
      <section id="gallery" className="gallery-section">
        <div className="section-container">
          <h2 className="section-title">FEATURED COLLECTION</h2>
          <p className="gallery-description">
            今シーズンを代表する注目アイテム
          </p>
          <div className="gallery-grid">
            {galleryItems.map((item) => (
              <div key={item.id} className="gallery-item">
                <div className="gallery-image">
                  {item.images && item.images.length > 0 ? (
                    <img src={item.images[0].url} alt={item.name} />
                  ) : (
                    <div className="no-image">画像なし</div>
                  )}
                </div>
                <div className="gallery-info">
                  <h3 className="gallery-item-no">{item.itemNo}</h3>
                  <p className="gallery-item-name">{item.name}</p>
                  {item.composition && (
                    <p className="gallery-item-detail">
                      <span className="detail-label">混率:</span> {item.composition}
                    </p>
                  )}
                  {item.fabricNo && (
                    <p className="gallery-item-detail">
                      <span className="detail-label">生地No.:</span> {item.fabricNo}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* お問い合わせセクション */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <h2 className="section-title">CONTACT</h2>
          <div className="contact-info">
            <div className="contact-item">
              <h3>{COMPANY_INFO.name}</h3>
              <p>{COMPANY_INFO.nameEn}</p>
            </div>
            <div className="contact-item">
              <p>{COMPANY_INFO.fullAddress}</p>
              <p>{COMPANY_INFO.phoneFormatted}</p>
            </div>
            <div className="contact-item">
              <p>For inquiries about this exhibition,</p>
              <p>please feel free to contact us.</p>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="lp-footer">
        <div className="footer-container">
          <div className="footer-logo">
            <img src={COMPANY_INFO.logo} alt={COMPANY_INFO.name} />
          </div>
          <p className="footer-text">
            © {new Date().getFullYear()} {COMPANY_INFO.nameEn} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default ExhibitionLandingPage
