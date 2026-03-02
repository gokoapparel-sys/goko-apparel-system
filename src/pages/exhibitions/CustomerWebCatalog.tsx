import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Exhibition, Item } from '../../types'
import { exhibitionsService } from '../../services/exhibitionsService'
import { itemsService } from '../../services/itemsService'
import { generateQRCodeDataURL, generateItemScanURL } from '../../utils/qrCodeGenerator'
import '../../styles/webCatalog.css'

const CustomerWebCatalog: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [itemQRs, setItemQRs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

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

      // カタログアイテムを取得
      const catalogItemIds = exhibitionData?.catalogItemIds || []
      if (catalogItemIds.length > 0) {
        const allItems = await itemsService.listAllItems()
        const catalogItems = allItems.filter(item => catalogItemIds.includes(item.id!))
        setItems(catalogItems)

        // 各アイテムのQRコードを生成
        const qrs: Record<string, string> = {}
        for (const item of catalogItems) {
          const itemURL = generateItemScanURL(item.id!, id)
          qrs[item.id!] = await generateQRCodeDataURL(itemURL, { width: 75 })
        }
        setItemQRs(qrs)
      }

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
      month: '2-digit',
      day: '2-digit',
    })
  }

  if (loading) {
    return <div className="loading">読み込み中...</div>
  }

  if (!exhibition) {
    return <div className="error">展示会が見つかりません</div>
  }

  return (
    <div className="web-catalog customer-catalog">
      {/* ヘッダー */}
      <header className="catalog-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-box">
              <img src="/goko-logo.svg" alt="GOKO" className="logo-image" />
            </div>
            <div className="company-info">
              <div>株式会社 互興</div>
              <div>GOKO Co.,Ltd.</div>
            </div>
          </div>
          <div className="header-center">
            <h1 className="exhibition-title">{exhibition.exhibitionName}</h1>
            <p className="exhibition-info">
              {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)} / {exhibition.location}
            </p>
            <div className="catalog-badge">お客様用カタログ</div>
          </div>
          <div className="header-right">
            {/* お客様用カタログではナビゲーションボタンは非表示 */}
          </div>
        </div>
      </header>

      {/* アイテム一覧 */}
      <div className="items-grid">
        {items.map(item => (
          <div key={item.id} className="item-card">
            <div className="item-image" onClick={() => item.images && item.images.length > 0 && setEnlargedImage(item.images[0].url)} style={{ cursor: item.images && item.images.length > 0 ? 'pointer' : 'default' }}>
              {item.images && item.images.length > 0 ? (
                <img src={item.images[0].url} alt={item.name} />
              ) : (
                <div className="no-image">画像なし</div>
              )}
            </div>

            <div className="item-info">
              <div className="item-no">{item.itemNo}</div>
              <div className="item-name" style={{ whiteSpace: 'pre-wrap' }}>{item.name.replace(/[\s\u3000]+/g, '\n')}</div>

              <div className="item-field">
                <span className="label">生地名:</span>
                <span className="value">{item.fabricName || '-'}</span>
              </div>

              <div className="item-field">
                <span className="label">混率:</span>
                <span className="value">{item.composition || '-'}</span>
              </div>
            </div>

            {itemQRs[item.id!] && (
              <div className="item-qr">
                <img src={itemQRs[item.id!]} alt={`${item.itemNo} QR`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 印刷用フッター */}
      <footer className="catalog-footer print-only">
        株式会社 互興 - {exhibition.exhibitionName} カタログ
      </footer>

      {/* 画像拡大モーダル */}
      {enlargedImage && (
        <div
          className="image-modal"
          onClick={() => setEnlargedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
        >
          <img
            src={enlargedImage}
            alt="拡大画像"
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setEnlargedImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default CustomerWebCatalog
