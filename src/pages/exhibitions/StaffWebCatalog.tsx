import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { Exhibition, Item, Pickup } from '../../types'
import { exhibitionsService } from '../../services/exhibitionsService'
import { itemsService } from '../../services/itemsService'
import { pickupsService } from '../../services/pickupsService'
import { generateQRCodeDataURL, generatePickupSessionURL, generateItemScanURL } from '../../utils/qrCodeGenerator'
import '../../styles/webCatalog.css'

const StaffWebCatalog: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [selectedPickupId, setSelectedPickupId] = useState<string>('')
  const [manualPickupCode, setManualPickupCode] = useState<string>('')
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [createdByFilter, setCreatedByFilter] = useState<string>('')
  const [sessionQR, setSessionQR] = useState<string>('')
  const [itemQRs, setItemQRs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [id])

  // 既存のピックアップリストを選択したときに、そのアイテムをチェック
  useEffect(() => {
    if (selectedPickupId) {
      const selectedPickup = pickups.find(p => p.id === selectedPickupId)
      if (selectedPickup && selectedPickup.itemIds) {
        setSelectedItemIds(new Set(selectedPickup.itemIds))
      }
    } else {
      // 選択解除されたらチェックをクリア
      setSelectedItemIds(new Set())
    }
  }, [selectedPickupId, pickups])

  // 入力者フィルターでアイテムを絞り込み
  useEffect(() => {
    if (createdByFilter) {
      setFilteredItems(items.filter(item => item.createdBy === createdByFilter))
    } else {
      setFilteredItems(items)
    }
  }, [createdByFilter, items])

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

      // ピックアップリストを取得
      const pickupsResult = await pickupsService.listPickups({ exhibitionId: id })
      setPickups(pickupsResult.pickups)

      // 展示会QRコードを生成
      const sessionURL = generatePickupSessionURL(id)
      const qr = await generateQRCodeDataURL(sessionURL, { width: 75 })
      setSessionQR(qr)

    } catch (error) {
      console.error('データ読み込みエラー:', error)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItemIds)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItemIds(newSelected)
  }

  const handleSubmit = async () => {
    // ピックアップコードを取得（選択または手動入力）
    const pickupCode = manualPickupCode.trim() ||
      (selectedPickupId ? pickups.find(p => p.id === selectedPickupId)?.pickupCode : '')

    if (!pickupCode) {
      alert('ピックアップコードを選択または入力してください')
      return
    }

    if (selectedItemIds.size === 0) {
      alert('アイテムを選択してください')
      return
    }

    try {
      setSubmitting(true)

      // ピックアップリストを取得または新規作成
      let pickup = selectedPickupId
        ? pickups.find(p => p.id === selectedPickupId)
        : pickups.find(p => p.pickupCode === pickupCode && p.exhibitionId === id)
      let pickupId = pickup?.id

      if (!pickup) {
        // 新規作成（手動入力されたコードをpickupCodeとして使用）
        pickupId = await pickupsService.createPickup(
          {
            exhibitionId: id!,
            customerName: pickupCode, // 仮のお客様名（後で編集可能）
            itemIds: [],
            createdDate: Timestamp.now(),
            status: 'active',
          },
          pickupCode // 手動入力されたコードをpickupCodeとして使用
        )

        // リストを再読み込み
        const updatedPickupsResult = await pickupsService.listPickups({ exhibitionId: id! })
        setPickups(updatedPickupsResult.pickups)

        // 新規作成したピックアップを取得
        pickup = updatedPickupsResult.pickups.find(p => p.id === pickupId)
      }

      // 今回選択されているアイテムIDリスト
      const newItemIds = Array.from(selectedItemIds)

      //アイテムIDリストの決定
      let finalItemIds: string[]

      if (selectedPickupId) {
        // リストから選択して編集している場合：
        // ユーザーは現在のリスト内容を見て操作しているため、チェックボックスの状態（削除操作含む）で上書きする
        finalItemIds = newItemIds
      } else {
        // コードを手入力した場合（新規または既存への追加）：
        // 既存の内容が見えていない可能性があるため、既存リストとマージして「追加」とする（誤って消さないように）
        const existingItemIds = pickup?.itemIds || []
        finalItemIds = [...new Set([...existingItemIds, ...newItemIds])]
      }

      // ピックアップリストを更新
      if (!pickupId) {
        throw new Error('ピックアップIDが取得できませんでした')
      }

      await pickupsService.updatePickup(pickupId, {
        itemIds: finalItemIds
      })

      // 成功メッセージを表示
      const addedCount = newItemIds.length

      // 送信状態を解除
      setSubmitting(false)

      // UIの更新を待ってからアラートを表示
      setTimeout(() => {
        alert(`${addedCount}件のアイテムを追加しました`)
        // アラート後に状態をクリア
        setSelectedItemIds(new Set())
        setManualPickupCode('')
        setSelectedPickupId('')
      }, 100)

    } catch (error) {
      console.error('送信エラー:', error)
      setSubmitting(false)
      setTimeout(() => {
        alert('送信に失敗しました: ' + (error instanceof Error ? error.message : String(error)))
      }, 100)
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

  // デバッグ用：コンソールに情報を出力
  console.log('Exhibition:', exhibition)
  console.log('Catalog Item IDs:', exhibition.catalogItemIds)
  console.log('Items:', items)
  console.log('Pickups:', pickups)

  return (
    <div className="web-catalog staff-catalog">
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
            <div className="catalog-badge staff-badge">管理者用カタログ - 社外秘</div>
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

            {sessionQR && (
              <div className="session-qr">
                <img src={sessionQR} alt="ピックアップセッション開始QR" />
                <p>ピックアップモード開始</p>
              </div>
            )}
          </div>
        </div>

        {/* ピックアップコード選択 */}
        <div className="pickup-selector no-print">
          <label htmlFor="pickup-select">既存のピックアップコードから選択:</label>
          <select
            id="pickup-select"
            value={selectedPickupId}
            onChange={(e) => {
              setSelectedPickupId(e.target.value)
              setManualPickupCode('')
            }}
          >
            <option value="">選択してください</option>
            {pickups.map(pickup => (
              <option key={pickup.id} value={pickup.id}>
                {pickup.pickupCode} - {pickup.customerName} ({pickup.itemIds?.length || 0}件)
              </option>
            ))}
          </select>

          <label htmlFor="manual-pickup-code">または新規入力:</label>
          <input
            id="manual-pickup-code"
            type="text"
            placeholder="例: PU-2024-001"
            value={manualPickupCode}
            onChange={(e) => {
              setManualPickupCode(e.target.value)
              setSelectedPickupId('')
            }}
          />

          <label htmlFor="createdBy-filter">入力者で絞り込み:</label>
          <select
            id="createdBy-filter"
            value={createdByFilter}
            onChange={(e) => setCreatedByFilter(e.target.value)}
          >
            <option value="">すべて表示</option>
            {[...new Set(items.map(item => item.createdBy).filter(Boolean))].map(createdBy => (
              <option key={createdBy} value={createdBy}>
                {createdBy}
              </option>
            ))}
          </select>

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={submitting || selectedItemIds.size === 0 || (!selectedPickupId && !manualPickupCode.trim())}
          >
            {submitting ? '送信中...' : `選択したアイテムを追加 (${selectedItemIds.size}件)`}
          </button>
        </div>
      </header>

      {/* アイテム一覧 */}
      <div className="items-grid">
        {items.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.12)'
          }}>
            <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '10px' }}>
              カタログアイテムが登録されていません
            </p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              展示会詳細ページで「カタログを保存」ボタンを押して、アイテムを登録してください
            </p>
          </div>
        ) : null}
        {filteredItems.map(item => (
          <div key={item.id} className="item-card">
            <div className="item-checkbox no-print">
              <input
                type="checkbox"
                checked={selectedItemIds.has(item.id!)}
                onChange={() => handleItemToggle(item.id!)}
              />
            </div>

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

              <div className="price-box">
                <div className="item-field">
                  <span className="label">$単価:</span>
                  <span className="value">{item.dollarPrice ? `$${item.dollarPrice}` : '-'}</span>
                </div>
                <div className="item-field">
                  <span className="label">参考売値:</span>
                  <span className="value">{item.referencePrice ? `${item.referencePrice.toLocaleString()}円` : '-'}</span>
                </div>
              </div>

              <div className="item-field">
                <span className="label">工場:</span>
                <span className="value">{item.factory || '-'}</span>
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
        株式会社 互興 アパレル商品管理システム - 管理者用カタログ（社外秘）
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

export default StaffWebCatalog
