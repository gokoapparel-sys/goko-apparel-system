import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { exhibitionsService } from '../../services/exhibitionsService'
import { itemsService } from '../../services/itemsService'
import { Exhibition, Item } from '../../types'
import { pdf } from '@react-pdf/renderer'
import { TagLabelPDF } from '../../utils/pdfGenerators/tagLabelPDF'
import { generatePDFFromHTML } from '../../utils/pdfGenerators/htmlToPdfGenerator'
import { generateStaffCatalogHTML } from '../../utils/pdfGenerators/staffCatalogHTML'
import { generateCustomerCatalogHTML } from '../../utils/pdfGenerators/customerCatalogHTML'
import { convertImagesToBase64 } from '../../utils/imageUtils'

const ExhibitionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [loading, setLoading] = useState(true)
  const [allItems, setAllItems] = useState<Item[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [createdByFilter, setCreatedByFilter] = useState('')
  const [savingCatalog, setSavingCatalog] = useState(false)

  useEffect(() => {
    if (id) {
      loadExhibition(id)
    }
    loadAllItems()
  }, [id])

  const loadExhibition = async (exhibitionId: string) => {
    try {
      setLoading(true)
      const data = await exhibitionsService.getExhibition(exhibitionId)
      if (data) {
        setExhibition(data)
        setSelectedItemIds(data.catalogItemIds || [])
      } else {
        alert('展示会が見つかりません')
        navigate('/exhibitions')
      }
    } catch (error) {
      console.error('展示会読み込みエラー:', error)
      alert('展示会の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const loadAllItems = async () => {
    try {
      const items = await itemsService.listAllItems({ status: 'active' })
      setAllItems(items)
    } catch (error) {
      console.error('アイテム読み込みエラー:', error)
    }
  }

  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSaveCatalog = async () => {
    if (!id) {
      console.log('IDがありません')
      return
    }

    console.log('カタログ保存開始')
    console.log('選択されたアイテムID:', selectedItemIds)

    try {
      setSavingCatalog(true)
      console.log('保存処理を実行中...')

      await exhibitionsService.updateExhibition(id, {
        catalogItemIds: selectedItemIds
      })

      console.log('保存完了')
      alert('カタログアイテムを保存しました')
      await loadExhibition(id)
      console.log('再読み込み完了')
    } catch (error) {
      console.error('保存エラー:', error)
      alert(`保存に失敗しました: ${error}`)
    } finally {
      console.log('finally句実行')
      setSavingCatalog(false)
    }
  }

  const handleExportStaffPDF = async () => {
    if (!exhibition) return

    try {
      console.log('=== 管理者用PDF出力開始 ===')

      // 選択されたアイテムのみを取得
      const catalogItems = allItems.filter(item => selectedItemIds.includes(item.id!))
      console.log('カタログアイテム数:', catalogItems.length)

      if (catalogItems.length === 0) {
        alert('カタログアイテムが選択されていません')
        return
      }

      // 画像URLを収集
      const imageUrls: string[] = []
      catalogItems.forEach(item => {
        if (item.images && item.images.length > 0) {
          imageUrls.push(item.images[0].url)
        }
      })
      console.log('画像URL数:', imageUrls.length)

      // 画像をbase64に変換
      console.log('画像変換開始...')
      let imageBase64Map: Record<string, string> = {}

      try {
        imageBase64Map = await convertImagesToBase64(imageUrls)
        console.log('画像変換完了')

        // 画像変換の失敗を検出
        const failedImages = Object.values(imageBase64Map).filter(base64 => !base64.startsWith('data:image/')).length
        if (failedImages > 0) {
          console.warn(`⚠️ ${failedImages}件の画像がプレースホルダーで表示されます。`)
          console.warn('詳細はFIREBASE_STORAGE_CORS_SETUP.mdを参照してください。')
        }
      } catch (error) {
        console.error('画像変換で予期しないエラー:', error)
        console.warn('全ての画像をスキップしてPDFを生成します')
      }

      // HTMLを生成
      console.log('HTML生成開始...')
      const htmlContent = generateStaffCatalogHTML({
        exhibition,
        items: catalogItems,
        imageBase64Map
      })
      console.log('HTML生成完了')

      // PDF生成とダウンロード
      console.log('PDF生成開始...')
      await generatePDFFromHTML(
        htmlContent,
        `${exhibition.exhibitionCode}_管理者用カタログ.pdf`,
        'landscape'
      )
      console.log('✅ PDF生成完了')
    } catch (error: any) {
      console.error('PDF出力エラー:', error)
      alert(`PDF出力に失敗しました: ${error?.message || error}`)
    }
  }

  const handleExportCustomerPDF = async () => {
    if (!exhibition) return

    try {
      console.log('=== お客様用PDF出力開始 ===')

      // 選択されたアイテムのみを取得
      const catalogItems = allItems.filter(item => selectedItemIds.includes(item.id!))
      console.log('カタログアイテム数:', catalogItems.length)

      if (catalogItems.length === 0) {
        alert('カタログアイテムが選択されていません')
        return
      }

      // 画像URLを収集
      const imageUrls: string[] = []
      catalogItems.forEach(item => {
        if (item.images && item.images.length > 0) {
          imageUrls.push(item.images[0].url)
        }
      })
      console.log('画像URL数:', imageUrls.length)

      // 画像をbase64に変換
      console.log('画像変換開始...')
      let imageBase64Map: Record<string, string> = {}

      try {
        imageBase64Map = await convertImagesToBase64(imageUrls)
        console.log('画像変換完了')

        // 画像変換の失敗を検出
        const failedImages = Object.values(imageBase64Map).filter(base64 => !base64.startsWith('data:image/')).length
        if (failedImages > 0) {
          console.warn(`⚠️ ${failedImages}件の画像がプレースホルダーで表示されます。`)
          console.warn('詳細はFIREBASE_STORAGE_CORS_SETUP.mdを参照してください。')
        }
      } catch (error) {
        console.error('画像変換で予期しないエラー:', error)
        console.warn('全ての画像をスキップしてPDFを生成します')
      }

      // HTMLを生成
      console.log('HTML生成開始...')
      const htmlContent = generateCustomerCatalogHTML({
        exhibition,
        items: catalogItems,
        imageBase64Map
      })
      console.log('HTML生成完了')

      // PDF生成とダウンロード
      console.log('PDF生成開始...')
      await generatePDFFromHTML(
        htmlContent,
        `${exhibition.exhibitionCode}_お客様用カタログ.pdf`,
        'landscape'
      )
      console.log('✅ PDF生成完了')
    } catch (error: any) {
      console.error('PDF出力エラー:', error)
      alert(`PDF出力に失敗しました: ${error?.message || error}`)
    }
  }

  const handleExportTagLabelPDF = async () => {
    if (!exhibition) return

    try {
      // 選択されたアイテムのみを取得
      const catalogItems = allItems.filter(item => selectedItemIds.includes(item.id!))

      if (catalogItems.length === 0) {
        alert('カタログアイテムが選択されていません')
        return
      }

      // 各アイテムの製品画像URLを取得
      const itemImages: Record<string, string> = {}
      for (const item of catalogItems) {
        // アイテムに画像がある場合は最初の画像を使用
        if (item.images && item.images.length > 0) {
          itemImages[item.id!] = item.images[0].url
        }
      }

      // PDF生成（展示会のlabelSizeを使用、なければデフォルト値）
      const blob = await pdf(
        <TagLabelPDF
          exhibitionName={exhibition.exhibitionName}
          items={catalogItems}
          labelWidth={exhibition.labelSize?.width}
          labelHeight={exhibition.labelSize?.height}
          itemImages={itemImages}
        />
      ).toBlob()

      // ダウンロード
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${exhibition.exhibitionCode}_下げ札.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF出力エラー:', error)
      alert('PDF出力に失敗しました')
    }
  }

  // 日付フォーマット
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

  const getStatusLabel = (status: Exhibition['status']): string => {
    switch (status) {
      case 'planning':
        return '企画中'
      case 'active':
        return '開催中'
      case 'completed':
        return '終了'
    }
  }

  const getStatusColor = (status: Exhibition['status']): string => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!exhibition) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/exhibitions')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 一覧
              </button>
              <h1 className="text-xl font-bold text-primary-700 ml-6">展示会詳細</h1>
              <button
                onClick={() => navigate(`/exhibitions/${id}`)}
                className="ml-4 inline-flex items-center px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-all shadow-md"
              >
                編集
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{currentUser?.email}</span>
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
                <p className="text-sm text-gray-600">展示会コード</p>
                <p className="text-lg font-semibold text-gray-900">{exhibition.exhibitionCode}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">展示会名</p>
                <p className="text-lg font-semibold text-gray-900">{exhibition.exhibitionName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">開始日</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(exhibition.startDate)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">終了日</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(exhibition.endDate)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">場所</p>
                <p className="text-lg font-semibold text-gray-900">{exhibition.location}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">ステータス</p>
                <p className="text-lg font-semibold text-gray-900">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      exhibition.status
                    )}`}
                  >
                    {getStatusLabel(exhibition.status)}
                  </span>
                </p>
              </div>
            </div>

            {exhibition.description && (
              <div className="mt-6">
                <p className="text-sm text-gray-600">説明</p>
                <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">
                  {exhibition.description}
                </p>
              </div>
            )}
          </div>

          {/* コンテンツ */}
          <div className="mt-8 pt-8 border-t">
            <div className="mb-4">
              {/* 1段目：タイトル（左寄せ） */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg font-bold text-gray-900">コンテンツ</h2>
              </div>

              {/* 2段目：アクションボタン（右詰め） */}
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => navigate(`/exhibitions/${id}/staff-catalog`)}
                  className="inline-flex items-center px-5 py-2.5 bg-blue-900 text-amber-100 font-medium rounded-lg hover:bg-blue-950 transition-all shadow-sm"
                >
                  管理者用WEBカタログ
                </button>
                <button
                  onClick={handleExportStaffPDF}
                  disabled={selectedItemIds.length === 0}
                  className="inline-flex items-center px-5 py-2.5 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-950 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  管理者用PDF出力
                </button>
                <button
                  onClick={() => navigate(`/exhibitions/${id}/landing`)}
                  className="inline-flex items-center px-5 py-2.5 bg-purple-700 text-white font-medium rounded-lg hover:bg-purple-800 transition-all shadow-sm"
                >
                  展示会LP
                </button>
                <button
                  onClick={() => navigate(`/exhibitions/${id}/customer-catalog`)}
                  className="inline-flex items-center px-5 py-2.5 bg-teal-700 text-amber-100 font-medium rounded-lg hover:bg-teal-800 transition-all shadow-sm"
                >
                  お客様用WEBカタログ
                </button>
                <button
                  onClick={handleExportCustomerPDF}
                  disabled={selectedItemIds.length === 0}
                  className="inline-flex items-center px-5 py-2.5 bg-teal-700 text-white font-medium rounded-lg hover:bg-teal-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  お客様用PDF出力
                </button>
                <button
                  onClick={handleExportTagLabelPDF}
                  disabled={selectedItemIds.length === 0}
                  className="inline-flex items-center px-5 py-2.5 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下げ札ダウンロード
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                選択済み: {selectedItemIds.length} 件
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="アイテムNo.またはアイテム名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-[2] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={createdByFilter}
                  onChange={(e) => setCreatedByFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">入力者ID：絞り込み</option>
                  {[...new Set(allItems.map(item => item.createdBy).filter(Boolean))].map(createdBy => (
                    <option key={createdBy} value={createdBy}>
                      {createdBy}
                    </option>
                  ))}
                </select>
              </div>

              {/* 保存ボタン */}
              <div className="mt-3">
                <button
                  onClick={handleSaveCatalog}
                  disabled={savingCatalog}
                  className="inline-flex items-center px-6 py-2 bg-cyan-50 text-emerald-700 font-bold rounded-lg hover:bg-cyan-100 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingCatalog ? '保存中...' : 'アイテムリスト保存'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      選択
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      アイテムNo.
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
                      工場
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allItems
                    .filter(
                      (item) =>
                        (item.itemNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
                        (createdByFilter === '' || item.createdBy === createdByFilter)
                    )
                    .map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 ${
                          selectedItemIds.includes(item.id!)
                            ? 'bg-blue-50'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.id!)}
                            onChange={() => handleToggleItem(item.id!)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.itemNo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.composition || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.fabricNo || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.dollarPrice ? `$${item.dollarPrice}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.factory || '-'}
                        </td>
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
                  {formatDateTime(exhibition.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">更新日時</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDateTime(exhibition.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-8 pt-8 border-t flex justify-between">
            <button onClick={() => navigate('/exhibitions')} className="btn-secondary">
              一覧に戻る
            </button>
            <button onClick={() => navigate(`/exhibitions/${id}`)} className="btn-primary">
              編集
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ExhibitionDetail
