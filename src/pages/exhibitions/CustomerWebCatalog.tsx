import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Exhibition, Item } from '../../types'
import { exhibitionsService } from '../../services/exhibitionsService'
import { itemsService } from '../../services/itemsService'
import { generateQRCodeDataURL, generateItemScanURL } from '../../utils/qrCodeGenerator'
import '../../styles/webCatalog.css'

const CustomerWebCatalog: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [itemQRs, setItemQRs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

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
        const result = await itemsService.listItems()
        const catalogItems = result.items.filter(item => catalogItemIds.includes(item.id!))
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
            {/* ナビゲーションボタン */}
            <div className="catalog-nav no-print">
              <button onClick={() => navigate('/')} className="nav-btn">
                ホーム
              </button>
              <button onClick={() => navigate(`/exhibitions/${id}`)} className="nav-btn">
                戻る
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* アイテム一覧 */}
      <div className="items-grid">
        {items.map(item => (
          <div key={item.id} className="item-card">
            <div className="item-image">
              {item.images && item.images.length > 0 ? (
                <img src={item.images[0].url} alt={item.name} />
              ) : (
                <div className="no-image">画像なし</div>
              )}
            </div>

            <div className="item-info">
              <div className="item-no">{item.itemNo}</div>
              <div className="item-name">{item.name}</div>

              <div className="item-field">
                <span className="label">混率:</span>
                <span className="value">{item.composition || '-'}</span>
              </div>

              <div className="item-field">
                <span className="label">生地No.:</span>
                <span className="value">{item.fabricNo || '-'}</span>
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
    </div>
  )
}

export default CustomerWebCatalog
