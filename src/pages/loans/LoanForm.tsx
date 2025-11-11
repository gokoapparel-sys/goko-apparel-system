import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { loansService } from '../../services/loansService'
import { itemsService } from '../../services/itemsService'
import { exhibitionsService } from '../../services/exhibitionsService'
import { Loan, Item, Exhibition } from '../../types'
import { Timestamp } from 'firebase/firestore'

const LoanForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [formData, setFormData] = useState({
    itemId: '',
    itemNo: '',
    itemName: '',
    staff: '',
    borrowDate: '',
    purpose: '',
    notes: '',
    status: 'borrowed' as 'borrowed' | 'returned',
  })

  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [selectedExhibitionId, setSelectedExhibitionId] = useState('')
  const [allItems, setAllItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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
        const loan = await loansService.getLoan(id)
        if (loan) {
          setFormData({
            itemId: loan.itemId,
            itemNo: loan.itemNo,
            itemName: loan.itemName || '',
            staff: loan.staff,
            borrowDate: loan.borrowDate
              ? new Date(loan.borrowDate.toDate()).toISOString().split('T')[0]
              : '',
            purpose: loan.purpose,
            notes: loan.notes || '',
            status: loan.status,
          })
        } else {
          alert('貸出記録が見つかりません')
          navigate('/loans')
        }
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 展示会が選択されたら、そのカタログアイテムでフィルタリング
    if (selectedExhibitionId) {
      const selectedExhibition = exhibitions.find((ex) => ex.id === selectedExhibitionId)
      if (selectedExhibition && selectedExhibition.catalogItemIds) {
        const filtered = allItems.filter((item) =>
          selectedExhibition.catalogItemIds!.includes(item.id!)
        )
        setFilteredItems(filtered)
      } else {
        setFilteredItems([])
      }
    } else {
      setFilteredItems([])
    }
  }, [selectedExhibitionId, exhibitions, allItems])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // アイテムが変更された場合、アイテム情報を設定
    if (name === 'itemId' && value) {
      const selectedItem = allItems.find((item) => item.id === value)
      if (selectedItem) {
        setFormData((prev) => ({
          ...prev,
          itemNo: selectedItem.itemNo,
          itemName: selectedItem.name,
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.itemId) {
      alert('アイテムを選択してください')
      return
    }

    if (!formData.staff.trim()) {
      alert('担当者を入力してください')
      return
    }

    if (!formData.borrowDate) {
      alert('貸出日を入力してください')
      return
    }

    if (!formData.purpose.trim()) {
      alert('目的を入力してください')
      return
    }

    try {
      setSubmitting(true)

      const loanData: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'> = {
        itemId: formData.itemId,
        itemNo: formData.itemNo,
        itemName: formData.itemName,
        staff: formData.staff,
        borrowDate: Timestamp.fromDate(new Date(formData.borrowDate)),
        purpose: formData.purpose,
        notes: formData.notes,
        status: formData.status,
        createdBy: currentUser?.email || undefined,
      }

      if (isEditMode) {
        await loansService.updateLoan(id, loanData)
        alert('貸出記録を更新しました')
      } else {
        await loansService.createLoan(loanData)
        alert('貸出記録を作成しました')
      }

      navigate('/loans')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/loans')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 一覧
              </button>
              <h1 className="text-xl font-bold text-primary-700 ml-6">
                {isEditMode ? '貸出記録編集' : '新規貸出'}
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="card">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">貸出情報</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="exhibitionId" className="block text-sm font-medium text-gray-700 mb-1">
                  展示会で絞り込み <span className="text-red-500">*</span>
                </label>
                <select
                  id="exhibitionId"
                  value={selectedExhibitionId}
                  onChange={(e) => {
                    setSelectedExhibitionId(e.target.value)
                    // 展示会を変更したらアイテム選択をクリア
                    setFormData((prev) => ({ ...prev, itemId: '', itemNo: '', itemName: '' }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={submitting}
                >
                  <option value="">展示会を選択してください</option>
                  {exhibitions.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.exhibitionName} ({ex.exhibitionCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-1">
                  品番（アイテム） <span className="text-red-500">*</span>
                </label>
                <select
                  id="itemId"
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={submitting || !selectedExhibitionId}
                  size={8}
                >
                  <option value="">
                    {selectedExhibitionId
                      ? 'アイテムを選択してください'
                      : '先に展示会を選択してください'}
                  </option>
                  {filteredItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.itemNo} - {item.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedExhibitionId ? `${filteredItems.length} 件のカタログアイテム` : ''}
                </p>
              </div>

              <div>
                <label htmlFor="staff" className="block text-sm font-medium text-gray-700 mb-1">
                  担当者 <span className="text-red-500">*</span>
                </label>
                <input
                  id="staff"
                  name="staff"
                  type="text"
                  value={formData.staff}
                  onChange={handleChange}
                  placeholder="例: 山田太郎"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label
                  htmlFor="borrowDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  貸出日 <span className="text-red-500">*</span>
                </label>
                <input
                  id="borrowDate"
                  name="borrowDate"
                  type="date"
                  value={formData.borrowDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                  目的 <span className="text-red-500">*</span>
                </label>
                <input
                  id="purpose"
                  name="purpose"
                  type="text"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="例: 展示会での使用"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="その他の情報"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {isEditMode && (
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
                    <option value="borrowed">貸出中</option>
                    <option value="returned">返却済み</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="mt-8 pt-8 border-t flex justify-between">
            <button type="button" onClick={() => navigate('/loans')} className="btn-secondary">
              キャンセル
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? '保存中...' : isEditMode ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default LoanForm
