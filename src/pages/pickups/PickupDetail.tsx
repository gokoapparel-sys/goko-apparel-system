import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { pickupsService } from '../../services/pickupsService'
import { itemsService } from '../../services/itemsService'
import { Pickup, Item } from '../../types'
import { generatePickupCatalogHTML } from '../../utils/pdfGenerators/pickupCatalogHTML'
import { generatePDFFromHTML } from '../../utils/pdfGenerators/htmlToPdfGenerator'
import { convertImagesToBase64 } from '../../utils/imageUtils'

const PickupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [pickup, setPickup] = useState<Pickup | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadPickup(id)
    }
  }, [id])

  const loadPickup = async (pickupId: string) => {
    try {
      setLoading(true)
      const data = await pickupsService.getPickup(pickupId)
      if (data) {
        setPickup(data)

        // アイテムデータを読み込み
        const allItems = await itemsService.listAllItems()
        const selectedItems = allItems.filter((item) => data.itemIds?.includes(item.id!))
        setItems(selectedItems)
      } else {
        alert('ピックアップリストが見つかりません')
        navigate('/pickups')
      }
    } catch (error) {
      console.error('ピックアップリスト読み込みエラー:', error)
      alert('ピックアップリストの読み込みに失敗しました')
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

  const formatDateTime = (timestamp: any): string => {
    if (!timestamp) return ''
    let date: Date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      return ''
    }
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const copyShareUrl = () => {
    if (pickup?.shareUrl) {
      navigator.clipboard.writeText(pickup.shareUrl)
      alert('共有URLをコピーしました')
    }
  }

  const handleExportPDF = async () => {
    if (!pickup) return

    try {
      if (items.length === 0) {
        alert('アイテムが選択されていません')
        return
      }

      console.log('=== ピックアップリストPDF出力開始 ===')
      console.log('お客様名:', pickup.customerName)
      console.log('アイテム数:', items.length)

      // 画像URLを収集
      const imageUrls: string[] = []
      items.forEach(item => {
        if (item.images && item.images.length > 0) {
          imageUrls.push(item.images[0].url)
        }
      })

      console.log('画像URL数:', imageUrls.length)

      // 画像をbase64に変換
      const imageBase64Map = await convertImagesToBase64(imageUrls)

      console.log('画像変換完了')

      // HTMLを生成
      const htmlContent = generatePickupCatalogHTML({
        pickup,
        items,
        imageBase64Map
      })

      console.log('HTML生成完了')

      // PDFを生成してダウンロード
      const filename = `ピックアップリスト_${pickup.pickupCode}_${pickup.customerName}.pdf`
      await generatePDFFromHTML(htmlContent, filename, 'landscape')

      console.log('=== PDF出力完了 ===')
    } catch (error) {
      console.error('PDF出力エラー:', error)
      alert('PDF出力に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!pickup) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-lg border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* 左側：一覧に戻るボタンとタイトル */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/pickups')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 一覧
              </button>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">ピックアップリスト詳細</h1>
            </div>

            {/* 右側：ユーザー情報と編集ボタン */}
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-600 font-medium hidden sm:block">{currentUser?.email}</span>
              <div className="h-10 w-px bg-gray-300"></div>
              <button
                onClick={() => navigate(`/pickups/${id}`)}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl hover:shadow-2xl border-2 border-emerald-500"
              >
                編集
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {/* 基本情報 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">ピックアップコード</p>
                <p className="text-lg font-semibold text-gray-900">{pickup.pickupCode}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">お客様名</p>
                <p className="text-lg font-semibold text-gray-900">{pickup.customerName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">展示会</p>
                <p className="text-lg font-semibold text-gray-900">
                  {pickup.exhibitionName || '-'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">作成日</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(pickup.createdDate)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">ステータス</p>
                <p className="text-lg font-semibold text-gray-900">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      pickup.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {pickup.status === 'active' ? '有効' : 'アーカイブ'}
                  </span>
                </p>
              </div>

              {pickup.shareUrl && (
                <div>
                  <p className="text-sm text-gray-600">共有URL</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-900 truncate flex-1">{pickup.shareUrl}</p>
                    <button onClick={copyShareUrl} className="btn-secondary text-xs">
                      コピー
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 選択アイテム */}
          <div className="mt-8 pt-8 border-t">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">選択アイテム</h2>
              <button
                onClick={handleExportPDF}
                disabled={items.length === 0}
                className="btn-secondary"
              >
                PDF出力
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      品番
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      アイテム名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      混率
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      生地No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ＄単価
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      参考売値
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      工場
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.itemNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.composition || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.fabricNo || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.dollarPrice ? `$${item.dollarPrice}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.referencePrice ? `¥${item.referencePrice.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.factory || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* メタ情報 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">その他の情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">作成日時</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDateTime(pickup.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">更新日時</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDateTime(pickup.updatedAt)}
                </p>
              </div>

              {pickup.createdBy && (
                <div>
                  <p className="text-sm text-gray-600">作成者</p>
                  <p className="text-lg font-semibold text-gray-900">{pickup.createdBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-8 pt-8 border-t flex justify-between">
            <button
              onClick={() => navigate('/pickups')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
            >
              ← 一覧
            </button>
            <button
              onClick={() => navigate(`/pickups/${id}`)}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl hover:shadow-2xl border-2 border-emerald-500"
            >
              編集
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PickupDetail
