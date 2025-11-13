import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { patternsService } from '../../services/patternsService'
import { Pattern } from '../../types'

const PatternForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isEditMode = !!id

  // フォームデータ
  const [formData, setFormData] = useState({
    patternCode: '',
    patternName: '',
    managerId: '',
    status: 'active' as 'active' | 'inactive',
  })

  const [files, setFiles] = useState<Pattern['files']>({})
  const [uploadingFiles, setUploadingFiles] = useState<{
    spec?: boolean
    layout?: boolean
    data?: boolean
  }>({})

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // 編集モード時にデータをロード
  useEffect(() => {
    if (isEditMode && id) {
      loadPattern(id)
    } else {
      // 新規作成時は現在のユーザーを担当者に設定
      setFormData((prev) => ({
        ...prev,
        managerId: currentUser?.email || currentUser?.uid || '',
      }))
    }
  }, [id, isEditMode, currentUser])

  const loadPattern = async (patternId: string) => {
    try {
      setLoading(true)
      const pattern = await patternsService.getPattern(patternId)
      if (pattern) {
        setFormData({
          patternCode: pattern.patternCode,
          patternName: pattern.patternName,
          managerId: pattern.managerId,
          status: pattern.status,
        })
        setFiles(pattern.files)
      } else {
        alert('型紙が見つかりません')
        navigate('/patterns')
      }
    } catch (error) {
      console.error('型紙読み込みエラー:', error)
      alert('型紙の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // フォーム入力の変更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  // ファイルアップロード
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: 'spec' | 'layout' | 'data'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isEditMode || !id) {
      alert('先に型紙を作成してからファイルをアップロードしてください')
      e.target.value = ''
      return
    }

    // バリデーション
    if (fileType === 'data') {
      // 型紙データファイルのバリデーションはサービス側で実施
      if (file.size > 50 * 1024 * 1024) {
        alert('ファイルサイズは50MB以下にしてください')
        e.target.value = ''
        return
      }
    } else if (fileType === 'spec') {
      // 仕様書: PDF または Excel
      const validExtensions = ['.pdf', '.xls', '.xlsx']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      if (!validExtensions.includes(fileExtension)) {
        alert('仕様書はPDFまたはExcelファイル（.pdf, .xls, .xlsx）のみアップロード可能です')
        e.target.value = ''
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('ファイルサイズは20MB以下にしてください')
        e.target.value = ''
        return
      }
    } else {
      // 展開図: PDFのみ
      if (file.type !== 'application/pdf') {
        alert('PDFファイルのみアップロード可能です')
        e.target.value = ''
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('ファイルサイズは20MB以下にしてください')
        e.target.value = ''
        return
      }
    }

    try {
      setUploadingFiles((prev) => ({ ...prev, [fileType]: true }))
      await patternsService.uploadFile(id, file, fileType)

      // ファイル情報を更新
      const updatedPattern = await patternsService.getPattern(id)
      if (updatedPattern) {
        setFiles(updatedPattern.files)
      }

      alert('ファイルをアップロードしました')
    } catch (error: any) {
      console.error('ファイルアップロードエラー:', error)
      alert(`ファイルのアップロードに失敗しました: ${error.message || error}`)
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [fileType]: false }))
      e.target.value = ''
    }
  }

  // ファイル削除（layout, data用）
  const handleFileRemove = async (fileType: 'layout' | 'data') => {
    if (!id) return
    if (!confirm('このファイルを削除しますか？')) return

    try {
      await patternsService.removeFile(id, fileType)
      setFiles((prev) => {
        const updated = { ...prev }
        delete updated[fileType]
        return updated
      })
      alert('ファイルを削除しました')
    } catch (error) {
      console.error('ファイル削除エラー:', error)
      alert('ファイルの削除に失敗しました')
    }
  }

  // 仕様書の個別ファイル削除
  const handleSpecFileRemove = async (fileId: string) => {
    if (!id) return
    if (!confirm('この仕様書ファイルを削除しますか？')) return

    try {
      await patternsService.removeSpecFile(id, fileId)
      // ファイル情報を更新
      const updatedPattern = await patternsService.getPattern(id)
      if (updatedPattern) {
        setFiles(updatedPattern.files)
      }
      alert('仕様書ファイルを削除しました')
    } catch (error) {
      console.error('仕様書ファイル削除エラー:', error)
      alert('ファイルの削除に失敗しました')
    }
  }

  // バリデーション
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.patternCode.trim()) {
      newErrors.patternCode = '型紙No.は必須です'
    }
    if (!formData.patternName.trim()) {
      newErrors.patternName = 'アイテム名は必須です'
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
        await patternsService.updatePattern(id, {
          ...formData,
          files,
        })
        alert('型紙を更新しました')
        navigate('/patterns')
      } else {
        // 新規作成
        const patternId = await patternsService.createPattern({
          ...formData,
          files: {},
        })
        alert('型紙を作成しました。ファイルをアップロードできます。')
        navigate(`/patterns/${patternId}`)
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
    if (!confirm('この型紙を削除しますか？関連するファイルも全て削除されます。')) return

    try {
      setSubmitting(true)
      await patternsService.deletePattern(id)
      alert('型紙を削除しました')
      navigate('/patterns')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  // ファイルタイプの表示名
  const getFileTypeLabel = (type: 'spec' | 'layout' | 'data'): string => {
    switch (type) {
      case 'spec':
        return '仕様書'
      case 'layout':
        return '展開図'
      case 'data':
        return '型紙データファイル'
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
                onClick={() => navigate('/patterns')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 一覧
              </button>
              <h1 className="text-xl font-bold text-primary-700 ml-6">
                {isEditMode ? '型紙編集' : '新規型紙作成'}
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
              {/* 型紙No. */}
              <div>
                <label
                  htmlFor="patternCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  型紙No. <span className="text-red-500">*</span>
                </label>
                <input
                  id="patternCode"
                  name="patternCode"
                  type="text"
                  value={formData.patternCode}
                  onChange={handleChange}
                  placeholder="例: PT-001"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.patternCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.patternCode && (
                  <p className="mt-1 text-sm text-red-500">{errors.patternCode}</p>
                )}
              </div>

              {/* アイテム名 */}
              <div>
                <label
                  htmlFor="patternName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  アイテム名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="patternName"
                  name="patternName"
                  type="text"
                  value={formData.patternName}
                  onChange={handleChange}
                  placeholder="例: 基本シャツ型紙"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.patternName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {errors.patternName && (
                  <p className="mt-1 text-sm text-red-500">{errors.patternName}</p>
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
                  <option value="inactive">無効</option>
                </select>
              </div>
            </div>
          </div>

          {/* ファイル管理 */}
          {isEditMode && (
            <div className="mt-8 pt-8 border-t space-y-6">
              <h2 className="text-xl font-bold text-gray-900">ファイル管理</h2>
              <p className="text-sm text-gray-600">
                仕様書: PDFまたはExcelファイル（.pdf, .xls, .xlsx / 最大20MB / 複数可）<br />
                展開図: PDFファイル（最大20MB）<br />
                型紙データファイル: DXF, AI, CDR, PDF, ZIP など（最大50MB）
              </p>

              {/* 仕様書（複数ファイル対応） */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">仕様書</h3>

                {/* アップロード済みファイル一覧 */}
                {files.spec && Array.isArray(files.spec) && files.spec.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {files.spec.map((specFile) => (
                      <div
                        key={specFile.id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className="w-8 h-8 text-emerald-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {specFile.fileName}
                            </p>
                            <a
                              href={specFile.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:text-primary-800"
                            >
                              ファイルを開く
                            </a>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSpecFileRemove(specFile.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          disabled={submitting}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ファイルアップロード */}
                <div>
                  <input
                    type="file"
                    accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(e) => handleFileUpload(e, 'spec')}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100
                      cursor-pointer"
                    disabled={submitting || uploadingFiles.spec}
                  />
                  {uploadingFiles.spec && (
                    <p className="mt-2 text-sm text-gray-600">アップロード中...</p>
                  )}
                </div>
              </div>

              {/* 展開図と型紙データファイル（単一ファイル） */}
              {(['layout', 'data'] as const).map((fileType) => (
                <div key={fileType} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{getFileTypeLabel(fileType)}</h3>

                  {files[fileType] ? (
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div className="flex items-center space-x-3">
                        <svg
                          className="w-8 h-8 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {files[fileType]!.fileName}
                          </p>
                          <a
                            href={files[fileType]!.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:text-primary-800"
                          >
                            ファイルを開く
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(fileType)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={submitting}
                      >
                        削除
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept={fileType === 'data' ? '.dxf,.ai,.cdr,.pdf,.zip,.dwg,.plt' : 'application/pdf'}
                        onChange={(e) => handleFileUpload(e, fileType)}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary-50 file:text-primary-700
                          hover:file:bg-primary-100
                          cursor-pointer"
                        disabled={submitting || uploadingFiles[fileType]}
                      />
                      {uploadingFiles[fileType] && (
                        <p className="mt-2 text-sm text-gray-600">アップロード中...</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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
                onClick={() => navigate('/patterns')}
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

export default PatternForm
