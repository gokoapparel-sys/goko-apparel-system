import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { exhibitionsService } from '../../services/exhibitionsService'
import { Timestamp } from 'firebase/firestore'

const ExhibitionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isEditMode = !!id

  // フォームデータ
  const [formData, setFormData] = useState({
    exhibitionCode: '',
    exhibitionName: '',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
    status: 'planning' as 'planning' | 'active' | 'completed',
    labelWidth: '35', // デフォルト3.5cm
    labelHeight: '50', // デフォルト5cm
  })

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // 編集モード時にデータをロード
  useEffect(() => {
    if (isEditMode && id) {
      loadExhibition(id)
    }
  }, [id, isEditMode])

  const loadExhibition = async (exhibitionId: string) => {
    try {
      setLoading(true)
      const exhibition = await exhibitionsService.getExhibition(exhibitionId)
      if (exhibition) {
        // Timestampを文字列に変換
        const startDate = exhibition.startDate?.toDate
          ? exhibition.startDate.toDate().toISOString().split('T')[0]
          : ''
        const endDate = exhibition.endDate?.toDate
          ? exhibition.endDate.toDate().toISOString().split('T')[0]
          : ''

        setFormData({
          exhibitionCode: exhibition.exhibitionCode,
          exhibitionName: exhibition.exhibitionName,
          startDate,
          endDate,
          location: exhibition.location,
          description: exhibition.description || '',
          status: exhibition.status,
          labelWidth: exhibition.labelSize?.width?.toString() || '35',
          labelHeight: exhibition.labelSize?.height?.toString() || '50',
        })
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

  // フォーム入力の変更
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // エラーをクリア
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // バリデーション
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.exhibitionCode.trim()) {
      newErrors.exhibitionCode = '展示会コードは必須です'
    }
    if (!formData.exhibitionName.trim()) {
      newErrors.exhibitionName = '展示会名は必須です'
    }
    if (!formData.startDate) {
      newErrors.startDate = '開始日は必須です'
    }
    if (!formData.endDate) {
      newErrors.endDate = '終了日は必須です'
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = '終了日は開始日より後である必要があります'
    }
    if (!formData.location.trim()) {
      newErrors.location = '場所は必須です'
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

      // 文字列をTimestampに変換
      const exhibitionData = {
        exhibitionCode: formData.exhibitionCode,
        exhibitionName: formData.exhibitionName,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
        location: formData.location,
        description: formData.description,
        status: formData.status,
        labelSize: {
          width: parseFloat(formData.labelWidth),
          height: parseFloat(formData.labelHeight),
        },
      }

      if (isEditMode && id) {
        // 更新
        await exhibitionsService.updateExhibition(id, exhibitionData)
        alert('展示会を更新しました')
        navigate('/exhibitions')
      } else {
        // 新規作成
        await exhibitionsService.createExhibition(exhibitionData)
        alert('展示会を作成しました')
        navigate('/exhibitions')
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
    if (!confirm('この展示会を削除しますか？この操作は取り消せません。')) return

    try {
      setSubmitting(true)
      await exhibitionsService.deleteExhibition(id)
      alert('展示会を削除しました')
      navigate('/exhibitions')
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
              <h1 className="text-xl font-bold text-primary-700 ml-6">
                {isEditMode ? '展示会編集' : '新規展示会作成'}
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
              {/* 展示会コード */}
              <div>
                <label
                  htmlFor="exhibitionCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  展示会コード <span className="text-red-500">*</span>
                </label>
                <input
                  id="exhibitionCode"
                  name="exhibitionCode"
                  type="text"
                  value={formData.exhibitionCode}
                  onChange={handleChange}
                  placeholder="例: EX-2024-01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.exhibitionCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.exhibitionCode && (
                  <p className="mt-1 text-sm text-red-500">{errors.exhibitionCode}</p>
                )}
              </div>

              {/* 展示会名 */}
              <div>
                <label
                  htmlFor="exhibitionName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  展示会名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="exhibitionName"
                  name="exhibitionName"
                  type="text"
                  value={formData.exhibitionName}
                  onChange={handleChange}
                  placeholder="例: 2024春夏展示会"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.exhibitionName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.exhibitionName && (
                  <p className="mt-1 text-sm text-red-500">{errors.exhibitionName}</p>
                )}
              </div>

              {/* 開始日 */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
              </div>

              {/* 終了日 */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  終了日 <span className="text-red-500">*</span>
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
              </div>

              {/* 場所 */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  場所 <span className="text-red-500">*</span>
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="例: 東京ビッグサイト"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
              </div>

              {/* ステータス */}
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
                  <option value="planning">企画中</option>
                  <option value="active">開催中</option>
                  <option value="completed">終了</option>
                </select>
              </div>
            </div>

            {/* 下げ札サイズ設定 */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-lg font-bold text-gray-900 mb-3">下げ札シールサイズ設定</h3>
              <p className="text-sm text-gray-600 mb-4">
                この展示会用の下げ札シールのサイズを指定してください（単位: mm）
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 横幅 */}
                <div>
                  <label htmlFor="labelWidth" className="block text-sm font-medium text-gray-700 mb-1">
                    横幅（mm）
                  </label>
                  <input
                    id="labelWidth"
                    name="labelWidth"
                    type="number"
                    step="0.1"
                    min="10"
                    max="100"
                    value={formData.labelWidth}
                    onChange={handleChange}
                    placeholder="35"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={submitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">デフォルト: 35mm (3.5cm)</p>
                </div>

                {/* 縦幅 */}
                <div>
                  <label htmlFor="labelHeight" className="block text-sm font-medium text-gray-700 mb-1">
                    縦幅（mm）
                  </label>
                  <input
                    id="labelHeight"
                    name="labelHeight"
                    type="number"
                    step="0.1"
                    min="10"
                    max="150"
                    value={formData.labelHeight}
                    onChange={handleChange}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={submitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">デフォルト: 50mm (5cm)</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-blue-700">
                💡 現在の設定: 横{formData.labelWidth}mm × 縦{formData.labelHeight}mm
              </p>
            </div>

            {/* 説明 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="展示会の詳細情報を入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={submitting}
              />
            </div>
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
                onClick={() => navigate('/exhibitions')}
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

export default ExhibitionForm
