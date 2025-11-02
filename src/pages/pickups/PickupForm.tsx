import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { pickupsService } from '../../services/pickupsService'
import { exhibitionsService } from '../../services/exhibitionsService'
import { itemsService } from '../../services/itemsService'
import { Pickup, Exhibition, Item } from '../../types'
import { Timestamp } from 'firebase/firestore'

const PickupForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [formData, setFormData] = useState({
    customerName: '',
    exhibitionId: '',
    exhibitionName: '',
    itemIds: [] as string[],
    status: 'active' as 'active' | 'archived',
  })

  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [catalogItems, setCatalogItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)

      // 展示会一覧を読み込み
      const { exhibitions: exData } = await exhibitionsService.listExhibitions()
      setExhibitions(exData)

      // アイテム一覧を読み込み
      const { items: itemsData } = await itemsService.listItems({ status: 'active' })
      setAllItems(itemsData)

      // 編集モードの場合、既存データを読み込み
      if (id) {
        const pickup = await pickupsService.getPickup(id)
        if (pickup) {
          setFormData({
            customerName: pickup.customerName,
            exhibitionId: pickup.exhibitionId,
            exhibitionName: pickup.exhibitionName || '',
            itemIds: pickup.itemIds || [],
            status: pickup.status,
          })

          // 展示会のカタログアイテムを読み込み
          if (pickup.exhibitionId) {
            await loadCatalogItems(pickup.exhibitionId)
          }
        } else {
          alert('ピックアップリストが見つかりません')
          navigate('/pickups')
        }
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const loadCatalogItems = async (exhibitionId: string) => {
    try {
      const exhibition = await exhibitionsService.getExhibition(exhibitionId)
      if (exhibition && exhibition.catalogItemIds) {
        const items = allItems.filter((item) => exhibition.catalogItemIds!.includes(item.id!))
        setCatalogItems(items)
      }
    } catch (error) {
      console.error('カタログアイテム読み込みエラー:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // 展示会が変更された場合、カタログアイテムを再読み込み
    if (name === 'exhibitionId' && value) {
      const selected = exhibitions.find((ex) => ex.id === value)
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          exhibitionName: selected.exhibitionName,
        }))
        loadCatalogItems(value)
      }
    }
  }

  const handleToggleItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      itemIds: prev.itemIds.includes(itemId)
        ? prev.itemIds.filter((id) => id !== itemId)
        : [...prev.itemIds, itemId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerName.trim()) {
      alert('お客様名を入力してください')
      return
    }

    if (!formData.exhibitionId) {
      alert('展示会を選択してください')
      return
    }

    // アイテムなしでもピックアップリストを作成可能（後でスキャンで追加）
    try {
      setSubmitting(true)

      const pickupData: Omit<Pickup, 'id' | 'pickupCode' | 'createdAt' | 'updatedAt'> = {
        customerName: formData.customerName,
        exhibitionId: formData.exhibitionId,
        exhibitionName: formData.exhibitionName,
        itemIds: formData.itemIds.length > 0 ? formData.itemIds : [],
        createdDate: Timestamp.now(),
        status: formData.status,
        createdBy: currentUser.email,
      }

      console.log('ピックアップデータ:', pickupData)

      if (isEditMode) {
        await pickupsService.updatePickup(id, pickupData)

        // 共有URLがない場合は生成して保存
        const currentPickup = await pickupsService.getPickup(id)
        if (currentPickup && !currentPickup.shareUrl) {
          const shareUrl = pickupsService.generateShareUrl(id)
          await pickupsService.updatePickup(id, { shareUrl })
          console.log('共有URLを生成しました:', shareUrl)
        }

        alert('ピックアップリストを更新しました')
      } else {
        console.log('ピックアップリスト作成開始...')
        const newId = await pickupsService.createPickup(pickupData)
        console.log('作成されたID:', newId)

        // 共有URLを生成して保存
        const shareUrl = pickupsService.generateShareUrl(newId)
        console.log('共有URL:', shareUrl)
        await pickupsService.updatePickup(newId, { shareUrl })

        alert('ピックアップリストを作成しました')
      }

      navigate('/pickups')
    } catch (error: any) {
      console.error('保存エラー:', error)
      console.error('エラー詳細:', error.message, error.code)
      alert(`保存に失敗しました: ${error.message || error}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
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
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {isEditMode ? 'ピックアップリスト編集' : 'ピックアップリスト作成'}
              </h1>
            </div>

            {/* 右側：ユーザー情報 */}
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-600 font-medium hidden sm:block">{currentUser.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="card">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                  お客様名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  type="text"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="例: 株式会社○○"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="exhibitionId" className="block text-sm font-medium text-gray-700 mb-1">
                  展示会 <span className="text-red-500">*</span>
                </label>
                <select
                  id="exhibitionId"
                  name="exhibitionId"
                  value={formData.exhibitionId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={submitting}
                >
                  <option value="">選択してください</option>
                  {exhibitions.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.exhibitionName} ({ex.exhibitionCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  ステータス
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                >
                  <option value="active">有効</option>
                  <option value="archived">アーカイブ</option>
                </select>
              </div>
            </div>

            {!isEditMode && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  💡 ピックアップコードは自動生成されます（例: PU-EX2024SS-001）
                </p>
              </div>
            )}
          </div>

          {/* アイテム選択 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">アイテム選択</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                選択済み: {formData.itemIds.length} 件
              </p>
              <input
                type="text"
                placeholder="品番またはアイテム名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {formData.exhibitionId ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        選択
                      </th>
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {catalogItems
                      .filter(
                        (item) =>
                          item.itemNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50 ${
                            formData.itemIds.includes(item.id!) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={formData.itemIds.includes(item.id!)}
                              onChange={() => handleToggleItem(item.id!)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.itemNo}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.composition || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.fabricNo || '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">展示会を選択してください</p>
            )}
          </div>

          {/* 送信ボタン */}
          <div className="mt-8 pt-8 border-t flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/pickups')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
            >
              ← 一覧
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl hover:shadow-2xl border-2 border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '保存中...' : isEditMode ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default PickupForm
