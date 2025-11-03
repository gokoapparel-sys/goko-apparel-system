import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { itemsService } from '../../services/itemsService'

const ItemForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isEditMode = !!id

  // フォームデータ
  const [formData, setFormData] = useState({
    itemNo: '',
    name: '',
    sku: '', // 後方互換性
    fabricNo: '',
    composition: '',
    dollarPrice: 0,
    moq: '',
    referencePrice: 0,
    factory: '',
    sizeOptions: '',
    colorOptions: '',
    color: '', // 後方互換性
    size: '', // 後方互換性
    status: 'active' as 'active' | 'archived',
    patternId: '',
    patternNo: '',
  })

  const [existingImages, setExistingImages] = useState<{ url: string; path: string }[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})


  // 編集モード時にデータをロード
  useEffect(() => {
    if (isEditMode && id) {
      loadItem(id)
    }
  }, [id, isEditMode])

  const loadItem = async (itemId: string) => {
    try {
      setLoading(true)
      const item = await itemsService.getItem(itemId)
      if (item) {
        setFormData({
          itemNo: item.itemNo || item.sku, // 後方互換性
          name: item.name,
          sku: item.sku,
          fabricNo: item.fabricNo || '',
          composition: item.composition || '',
          dollarPrice: item.dollarPrice || 0,
          moq: item.moq || '',
          referencePrice: item.referencePrice || 0,
          factory: item.factory || '',
          sizeOptions: item.sizeOptions || '',
          colorOptions: item.colorOptions || '',
          color: item.color || '',
          size: item.size || '',
          status: item.status,
          patternId: item.patternId || '',
          patternNo: item.patternNo || '',
        })
        setExistingImages(item.images || [])
      } else {
        alert('アイテムが見つかりません')
        navigate('/items')
      }
    } catch (error) {
      console.error('アイテム読み込みエラー:', error)
      alert('アイテムの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // フォーム入力の変更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const numericFields = ['dollarPrice', 'referencePrice']
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
    }))
    // エラーをクリア
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // 新しい画像の選択
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // バリデーション
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const invalidFiles = files.filter((f) => !validImageTypes.includes(f.type))
    if (invalidFiles.length > 0) {
      alert('画像ファイル（JPEG、PNG、GIF、WebP）のみ選択してください')
      e.target.value = ''
      return
    }

    const oversizedFiles = files.filter((f) => f.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('ファイルサイズは10MB以下にしてください')
      e.target.value = ''
      return
    }

    setNewImages((prev) => [...prev, ...files])

    // プレビュー生成
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  // 新しい画像のプレビューを削除
  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // 既存画像を削除
  const handleRemoveExistingImage = async (path: string) => {
    if (!id) return
    if (!confirm('この画像を削除しますか？')) return

    try {
      await itemsService.removeImage(id, path)
      setExistingImages((prev) => prev.filter((img) => img.path !== path))
      alert('画像を削除しました')
    } catch (error) {
      console.error('画像削除エラー:', error)
      alert('画像の削除に失敗しました')
    }
  }

  // バリデーション
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.itemNo.trim()) {
      newErrors.itemNo = 'アイテムNo.は必須です'
    }
    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です'
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

      // skuフィールドに後方互換性のためitemNoを設定
      const itemData = {
        ...formData,
        sku: formData.itemNo, // 後方互換性
      }

      if (isEditMode && id) {
        // 更新
        await itemsService.updateItem(id, itemData)

        // 新しい画像をアップロード
        if (newImages.length > 0) {
          await itemsService.attachImages(id, newImages)
        }

        alert('アイテムを更新しました')
        navigate('/items')
      } else {
        // 新規作成
        const itemId = await itemsService.createItem({
          ...itemData,
          createdBy: currentUser?.email || currentUser?.uid,
        })

        // 画像をアップロード
        if (newImages.length > 0) {
          await itemsService.attachImages(itemId, newImages)
        }

        alert('アイテムを作成しました')
        navigate('/items')
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
    if (!confirm('このアイテムを削除しますか？この操作は取り消せません。')) return

    try {
      setSubmitting(true)
      await itemsService.deleteItem(id)
      alert('アイテムを削除しました')
      navigate('/items')
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
                onClick={() => navigate('/items')}
                className="text-sm text-gray-600 hover:text-gray-900 mr-4"
              >
                ← 一覧に戻る
              </button>
              <h1 className="text-xl font-bold text-primary-700">
                {isEditMode ? 'アイテム編集' : '新規アイテム作成'}
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
              {/* アイテムNo. */}
              <div>
                <label htmlFor="itemNo" className="block text-sm font-medium text-gray-700 mb-1">
                  アイテムNo. <span className="text-red-500">*</span>
                </label>
                <input
                  id="itemNo"
                  name="itemNo"
                  type="text"
                  value={formData.itemNo}
                  onChange={handleChange}
                  placeholder="例: IT-001"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.itemNo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.itemNo && <p className="mt-1 text-sm text-red-500">{errors.itemNo}</p>}
              </div>

              {/* アイテム名 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  アイテム名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* 生地No. */}
              <div>
                <label htmlFor="fabricNo" className="block text-sm font-medium text-gray-700 mb-1">
                  生地No.
                </label>
                <input
                  id="fabricNo"
                  name="fabricNo"
                  type="text"
                  value={formData.fabricNo}
                  onChange={handleChange}
                  placeholder="例: FB-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 混率 */}
              <div>
                <label htmlFor="composition" className="block text-sm font-medium text-gray-700 mb-1">
                  混率
                </label>
                <input
                  id="composition"
                  name="composition"
                  type="text"
                  value={formData.composition}
                  onChange={handleChange}
                  placeholder="例: 綿100%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* ＄単価 */}
              <div>
                <label htmlFor="dollarPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  ＄単価
                </label>
                <input
                  id="dollarPrice"
                  name="dollarPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.dollarPrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 単価枚数条件 */}
              <div>
                <label htmlFor="moq" className="block text-sm font-medium text-gray-700 mb-1">
                  単価枚数条件
                </label>
                <input
                  id="moq"
                  name="moq"
                  type="text"
                  value={formData.moq}
                  onChange={handleChange}
                  placeholder="例: 100枚以上"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 売単価（参考） */}
              <div>
                <label htmlFor="referencePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  売単価（参考）
                </label>
                <input
                  id="referencePrice"
                  name="referencePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.referencePrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 工場名 */}
              <div>
                <label htmlFor="factory" className="block text-sm font-medium text-gray-700 mb-1">
                  工場名
                </label>
                <input
                  id="factory"
                  name="factory"
                  type="text"
                  value={formData.factory}
                  onChange={handleChange}
                  placeholder="例: ○○工場"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 型紙No. */}
              <div>
                <label htmlFor="patternNo" className="block text-sm font-medium text-gray-700 mb-1">
                  型紙No.
                </label>
                <input
                  id="patternNo"
                  name="patternNo"
                  type="text"
                  value={formData.patternNo}
                  onChange={handleChange}
                  placeholder="例: PT-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  型紙No.を入力すると、該当する型紙と紐づけられます
                </p>
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
                  <option value="active">有効</option>
                  <option value="archived">アーカイブ</option>
                </select>
              </div>

              {/* サイズ展開 */}
              <div className="md:col-span-2">
                <label htmlFor="sizeOptions" className="block text-sm font-medium text-gray-700 mb-1">
                  サイズ展開
                </label>
                <textarea
                  id="sizeOptions"
                  name="sizeOptions"
                  rows={2}
                  value={formData.sizeOptions}
                  onChange={handleChange}
                  placeholder="例: S, M, L, XL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 色展開 */}
              <div className="md:col-span-2">
                <label htmlFor="colorOptions" className="block text-sm font-medium text-gray-700 mb-1">
                  色展開
                </label>
                <textarea
                  id="colorOptions"
                  name="colorOptions"
                  rows={2}
                  value={formData.colorOptions}
                  onChange={handleChange}
                  placeholder="例: 白, 黒, グレー, ネイビー"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* 画像管理 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">画像</h2>

            {/* 既存画像 */}
            {isEditMode && existingImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">現在の画像</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`画像 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img.path)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={submitting}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 新しい画像のプレビュー */}
            {previewUrls.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">追加する画像</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`プレビュー ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={submitting}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 画像アップロード */}
            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                画像を追加
              </label>
              <input
                id="images"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100
                  cursor-pointer"
                disabled={submitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                対応形式: JPEG, PNG, GIF, WebP（最大10MB）
              </p>
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
                onClick={() => navigate('/items')}
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

export default ItemForm
