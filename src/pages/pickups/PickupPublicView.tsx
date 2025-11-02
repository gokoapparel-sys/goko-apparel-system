import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { pickupsService } from '../../services/pickupsService'
import { itemsService } from '../../services/itemsService'
import { Pickup, Item } from '../../types'

const PickupPublicView: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const [pickup, setPickup] = useState<Pickup | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (id) {
      loadPickup(id)
    }
  }, [id])

  const loadPickup = async (pickupId: string) => {
    try {
      setLoading(true)
      const data = await pickupsService.getPickup(pickupId)

      if (data && data.status === 'active') {
        setPickup(data)

        // アイテムデータを読み込み
        const { items: allItems } = await itemsService.listItems({ status: 'active' })
        const selectedItems = allItems.filter((item) => data.itemIds.includes(item.id!))
        setItems(selectedItems)
      } else {
        setError(true)
      }
    } catch (error) {
      console.error('ピックアップリスト読み込みエラー:', error)
      setError(true)
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error || !pickup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ピックアップリストが見つかりません</h2>
          <p className="text-gray-600">
            このリンクは無効か、すでにアーカイブされています。
            <br />
            担当者にお問い合わせください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ヘッダー */}
      <header className="relative bg-gradient-to-br from-emerald-800 via-emerald-600 to-emerald-500 text-white shadow-2xl overflow-hidden">
        {/* 装飾的な背景要素 */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-amber-400/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-emerald-400/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* ロゴ */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-900 font-black text-4xl px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
              GOKO
            </div>
          </div>

          {/* 会社名 */}
          <div className="text-center mb-6">
            <p className="text-lg font-medium tracking-wider opacity-95">
              株式会社 互興 | GOKO Co.,Ltd.
            </p>
          </div>

          {/* 展示会名 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight drop-shadow-lg">
              {pickup.exhibitionName || '展示会'}
            </h1>
            <p className="text-2xl font-light opacity-90 tracking-wide">
              ピックアップリスト
            </p>
          </div>

          {/* お客様情報と詳細 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-3xl mx-auto border border-white/20 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center sm:text-left">
              <div>
                <p className="text-emerald-100 text-sm mb-1 font-medium">お客様名</p>
                <p className="text-xl font-bold">{pickup.customerName} 様</p>
              </div>
              <div>
                <p className="text-emerald-100 text-sm mb-1 font-medium">作成日</p>
                <p className="text-xl font-semibold">{formatDate(pickup.createdDate)}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-sm mb-1 font-medium">ピックアップコード</p>
                <p className="text-xl font-semibold">{pickup.pickupCode}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-sm mb-1 font-medium">選択アイテム数</p>
                <p className="text-xl font-bold">{items.length} 件</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* アイテムグリッド */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1">
              {/* 装飾的なトップバー */}
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-amber-400"></div>

              <div className="p-5">
                {/* 画像 */}
                <div className="aspect-square w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0].url}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📷</div>
                        <div className="text-xs">画像なし</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 商品情報 */}
                <div className="space-y-3">
                  <div className="border-b border-emerald-100 pb-2">
                    <p className="text-xs text-emerald-700 font-semibold mb-1">品番</p>
                    <p className="text-lg font-bold text-emerald-900">{item.itemNo}</p>
                  </div>

                  <div className="pb-2">
                    <p className="text-xs text-gray-500 mb-1">アイテム名</p>
                    <p className="text-base font-semibold text-gray-900 leading-snug">{item.name}</p>
                  </div>

                  {item.composition && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">混率</p>
                      <p className="text-sm text-gray-700">{item.composition}</p>
                    </div>
                  )}

                  {item.fabricNo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">生地No.</p>
                      <p className="text-sm text-gray-700">{item.fabricNo}</p>
                    </div>
                  )}

                  {item.sizeOptions && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">サイズ展開</p>
                      <p className="text-sm text-gray-700">{item.sizeOptions}</p>
                    </div>
                  )}

                  {item.colorOptions && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">色展開</p>
                      <p className="text-sm text-gray-700">{item.colorOptions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto border border-emerald-100">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">アイテムがありません</p>
              <p className="text-sm text-gray-500">
                このピックアップリストにはまだアイテムが選択されていません
              </p>
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white mt-16 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-900 font-black text-2xl px-6 py-2 rounded-lg shadow-lg">
                GOKO
              </div>
            </div>
            <p className="text-lg font-medium mb-2 tracking-wide">
              株式会社 互興 | GOKO Co.,Ltd.
            </p>
            <p className="text-emerald-100 opacity-90">
              ご不明な点がございましたら、担当者までお問い合わせください。
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PickupPublicView
