import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { itemsService } from '../../services/itemsService'
import { patternsService } from '../../services/patternsService'
import { Pattern } from '../../types'

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
    fabricName: '',
    composition: '',
    fabricSpec: '',
    dollarPrice: 0,
    moq: '',
    referencePrice: 0,
    factory: '',
    color: '', // 後方互換性
    size: '', // 後方互換性
    status: 'active' as 'active' | 'archived',
    patternId: '',
    patternNo: '',
    createdBy: '',
    appealPoint: '',
  })

  const [existingImages, setExistingImages] = useState<{ url: string; path: string }[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // 型紙一覧を読み込み
  useEffect(() => {
    loadPatterns()
  }, [])

  // 編集モード時にデータをロード
  useEffect(() => {
    if (isEditMode && id) {
      loadItem(id)
    }
  }, [id, isEditMode])

  const loadPatterns = async () => {
    try {
      const { patterns: patternsList } = await patternsService.listPatterns()
      // activeステータスの型紙のみフィルタリング
      const activePatterns = patternsList.filter(p => p.status === 'active')
      setPatterns(activePatterns)
    } catch (error) {
      console.error('型紙一覧読み込みエラー:', error)
    }
  }

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
          fabricName: item.fabricName || '',
          composition: item.composition || '',
          fabricSpec: item.fabricSpec || '',
          dollarPrice: item.dollarPrice || 0,
          moq: item.moq || '',
          referencePrice: item.referencePrice || 0,
          factory: item.factory || '',
          color: item.color || '',
          size: item.size || '',
          status: item.status,
          patternId: item.patternId || '',
          patternNo: item.patternNo || '',
          createdBy: item.createdBy || '',
          appealPoint: item.appealPoint || '',
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

    // 型紙選択の場合、patternIdとpatternNoを自動設定
    if (name === 'patternId') {
      const selectedPattern = patterns.find(p => p.id === value)
      setFormData((prev) => ({
        ...prev,
        patternId: value,
        patternNo: selectedPattern?.patternCode || '',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
      }))
    }

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
    if (!formData.createdBy.trim()) {
      newErrors.createdBy = '入力者IDは必須です'
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
        const itemId = await itemsService.createItem(itemData)

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
      <nav className="bg-white shadow-lg border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/items')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 一覧
              </button>
              <h1 className="text-xl font-bold text-primary-700 ml-6">
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

              {/* 生地名 */}
              <div>
                <label htmlFor="fabricName" className="block text-sm font-medium text-gray-700 mb-1">
                  生地名
                </label>
                <input
                  id="fabricName"
                  name="fabricName"
                  type="text"
                  value={formData.fabricName}
                  onChange={handleChange}
                  placeholder="例: コットンツイル"
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

              {/* 生地規格 */}
              <div>
                <label htmlFor="fabricSpec" className="block text-sm font-medium text-gray-700 mb-1">
                  生地規格
                </label>
                <input
                  id="fabricSpec"
                  name="fabricSpec"
                  type="text"
                  value={formData.fabricSpec}
                  onChange={handleChange}
                  placeholder="例: 40/-天竺 170g/m² 生産生地"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  生地の規格や目付、生産生地か市場生地か等を入力してください
                </p>
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

              {/* 型紙選択 */}
              <div>
                <label htmlFor="patternId" className="block text-sm font-medium text-gray-700 mb-1">
                  型紙
                </label>
                <select
                  id="patternId"
                  name="patternId"
                  value={formData.patternId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                >
                  <option value="">型紙を選択してください</option>
                  {patterns.map((pattern) => (
                    <option key={pattern.id} value={pattern.id}>
                      {pattern.patternCode} - {pattern.patternName}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  型紙を選択すると、自動的に型紙No.が設定されます
                </p>
                {formData.patternNo && (
                  <p className="mt-1 text-xs text-emerald-600">
                    選択中の型紙No.: {formData.patternNo}
                  </p>
                )}
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

              {/* アピールポイント */}
              <div className="md:col-span-2">
                <label htmlFor="appealPoint" className="block text-sm font-medium text-gray-700 mb-1">
                  アピールポイント
                </label>
                <textarea
                  id="appealPoint"
                  name="appealPoint"
                  rows={3}
                  value={formData.appealPoint}
                  onChange={handleChange}
                  placeholder="例: 軽量で通気性に優れた素材を使用。ストレッチ性があり着心地抜群です。"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* 入力者 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">入力者情報</h2>
            <div>
              <label htmlFor="createdBy" className="block text-sm font-medium text-gray-700 mb-1">
                入力者ID <span className="text-red-500">*</span>
              </label>
              <input
                id="createdBy"
                name="createdBy"
                type="text"
                value={formData.createdBy}
                onChange={handleChange}
                placeholder="例: tanaka@company.co.jp"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.createdBy ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={submitting}
              />
              {errors.createdBy && <p className="mt-1 text-sm text-red-500">{errors.createdBy}</p>}
              <p className="mt-1 text-xs text-gray-500">
                ※必須：社内メールアドレスを入力してください。分類しない場合は『free』と入力してください
              </p>
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
          <div className="mt-8 pt-8 border-t flex flex-wrap justify-between gap-2">
            <div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-4 py-2 sm:px-6 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base whitespace-nowrap"
                >
                  削除
                </button>
              )}
            </div>
            <div className="flex flex-wrap space-x-2 sm:space-x-4 gap-2">
              <button
                type="button"
                onClick={() => navigate('/items')}
                disabled={submitting}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-base whitespace-nowrap"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 sm:px-8 sm:py-3 text-xs sm:text-base whitespace-nowrap"
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
