import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { fabricsService } from '../../services/fabricsService'

const FabricForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isEditMode = !!id

  // フォームデータ
  const [formData, setFormData] = useState({
    fabricCode: '',
    fabricName: '',
    composition: '',
    price: 0,
    manufacturer: '',
    fabricType: {
      category: '布帛' as '布帛' | 'カット',
      pattern: '無地' as '無地' | '先染',
    },
    managerId: '',
    status: 'active' as 'active' | 'inactive',
  })

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // 編集モード時にデータをロード
  useEffect(() => {
    if (isEditMode && id) {
      loadFabric(id)
    } else {
      // 新規作成時は現在のユーザーを担当者に設定
      setFormData((prev) => ({
        ...prev,
        managerId: currentUser?.email || currentUser?.uid || '',
      }))
    }
  }, [id, isEditMode, currentUser])

  const loadFabric = async (fabricId: string) => {
    try {
      setLoading(true)
      const fabric = await fabricsService.getFabric(fabricId)
      if (fabric) {
        setFormData({
          fabricCode: fabric.fabricCode,
          fabricName: fabric.fabricName,
          composition: fabric.composition,
          price: fabric.price,
          manufacturer: fabric.manufacturer,
          fabricType: fabric.fabricType,
          managerId: fabric.managerId,
          status: fabric.status,
        })
      } else {
        alert('生地が見つかりません')
        navigate('/fabrics')
      }
    } catch (error) {
      console.error('生地読み込みエラー:', error)
      alert('生地の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // フォーム入力の変更
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    if (name === 'category' || name === 'pattern') {
      setFormData((prev) => ({
        ...prev,
        fabricType: {
          ...prev.fabricType,
          [name]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'price' ? parseFloat(value) || 0 : value,
      }))
    }

    // エラーをクリア
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // バリデーション
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.fabricCode.trim()) {
      newErrors.fabricCode = '生地品番は必須です'
    }
    if (!formData.fabricName.trim()) {
      newErrors.fabricName = '生地名は必須です'
    }
    if (!formData.composition.trim()) {
      newErrors.composition = '混率は必須です'
    }
    if (formData.price < 0) {
      newErrors.price = '生地値は0以上である必要があります'
    }
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'メーカーは必須です'
    }
    if (!formData.managerId.trim()) {
      newErrors.managerId = '入力者IDは必須です'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      alert('入力内容を確認してください')
      return
    }

    try {
      setSubmitting(true)

      if (isEditMode && id) {
        // 更新
        await fabricsService.updateFabric(id, formData)
        alert('生地を更新しました')
        navigate('/fabrics')
      } else {
        // 新規作成
        await fabricsService.createFabric(formData)
        alert('生地を作成しました')
        navigate('/fabrics')
      }
    } catch (error: any) {
      console.error('保存エラー:', error)
      alert(`保存に失敗しました: ${error.message || error}`)
    } finally {
      setSubmitting(false)
    }
  }

  // 削除
  const handleDelete = async () => {
    if (!id) return
    if (!confirm('この生地を削除しますか？この操作は取り消せません。')) return

    try {
      setSubmitting(true)
      await fabricsService.deleteFabric(id)
      alert('生地を削除しました')
      navigate('/fabrics')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
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
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/fabrics')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 一覧
              </button>
              <h1 className="text-xl font-bold text-primary-700 ml-6">
                {isEditMode ? '生地編集' : '新規生地作成'}
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
          {/* 基本情報 */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">基本情報</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 生地品番 */}
              <div>
                <label
                  htmlFor="fabricCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  生地品番 <span className="text-red-500">*</span>
                </label>
                <input
                  id="fabricCode"
                  name="fabricCode"
                  type="text"
                  value={formData.fabricCode}
                  onChange={handleChange}
                  placeholder="例: F-001"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.fabricCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.fabricCode && (
                  <p className="mt-1 text-sm text-red-500">{errors.fabricCode}</p>
                )}
              </div>

              {/* 生地名 */}
              <div>
                <label
                  htmlFor="fabricName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  生地名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="fabricName"
                  name="fabricName"
                  type="text"
                  value={formData.fabricName}
                  onChange={handleChange}
                  placeholder="例: コットンツイル"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.fabricName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.fabricName && (
                  <p className="mt-1 text-sm text-red-500">{errors.fabricName}</p>
                )}
              </div>

              {/* 混率 */}
              <div>
                <label
                  htmlFor="composition"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  混率 <span className="text-red-500">*</span>
                </label>
                <input
                  id="composition"
                  name="composition"
                  type="text"
                  value={formData.composition}
                  onChange={handleChange}
                  placeholder="例: 綿100%"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.composition ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.composition && (
                  <p className="mt-1 text-sm text-red-500">{errors.composition}</p>
                )}
              </div>

              {/* 生地値 */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  生地値（＄/m） <span className="text-red-500">*</span>
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
              </div>

              {/* メーカー */}
              <div>
                <label
                  htmlFor="manufacturer"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  メーカー <span className="text-red-500">*</span>
                </label>
                <input
                  id="manufacturer"
                  name="manufacturer"
                  type="text"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="例: ABC繊維株式会社"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.manufacturer ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.manufacturer && (
                  <p className="mt-1 text-sm text-red-500">{errors.manufacturer}</p>
                )}
              </div>

              {/* 入力者ID */}
              <div>
                <label htmlFor="managerId" className="block text-sm font-medium text-gray-700 mb-1">
                  入力者ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="managerId"
                  name="managerId"
                  type="text"
                  value={formData.managerId}
                  onChange={handleChange}
                  placeholder="例: user@example.com"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.managerId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.managerId && (
                  <p className="mt-1 text-sm text-red-500">{errors.managerId}</p>
                )}
              </div>
            </div>
          </div>

          {/* 生地タイプ */}
          <div className="mt-8 pt-8 border-t space-y-6">
            <h2 className="text-xl font-bold text-gray-900">生地タイプ</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* カテゴリ */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.fabricType.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                >
                  <option value="布帛">布帛</option>
                  <option value="カット">カット</option>
                </select>
              </div>

              {/* パターン */}
              <div>
                <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 mb-1">
                  パターン <span className="text-red-500">*</span>
                </label>
                <select
                  id="pattern"
                  name="pattern"
                  value={formData.fabricType.pattern}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                >
                  <option value="無地">無地</option>
                  <option value="先染">先染</option>
                </select>
              </div>
            </div>
          </div>

          {/* ステータス */}
          <div className="mt-8 pt-8 border-t">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            >
              <option value="active">有効</option>
              <option value="inactive">無効</option>
            </select>
          </div>

          {/* ボタン */}
          <div className="mt-8 pt-8 border-t flex justify-between">
            <div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  削除
                </button>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/fabrics')}
                disabled={submitting}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '保存中...' : isEditMode ? '更新' : '作成'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default FabricForm
