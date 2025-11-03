import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { storageService } from '../services/firebase/storage'
import { firestoreService, orderBy } from '../services/firebase/firestore'
import { v4 as uuidv4 } from 'uuid'

interface UploadedFile {
  id: string
  url: string
  path: string
  contentType: string
  size: number
  createdAt: any
  createdBy: string
}

const UploadImage: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // ログインチェック
  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
    }
  }, [currentUser, navigate])

  // アップロード一覧を取得
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        setLoading(true)
        const uploads = await firestoreService.queryDocuments(
          'uploads',
          orderBy('createdAt', 'desc')
        )
        setUploadedFiles(uploads as UploadedFile[])
      } catch (error) {
        console.error('アップロード一覧の取得エラー:', error)
        alert('アップロード一覧の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchUploads()
    }
  }, [currentUser])

  // ファイル選択時の処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    // 画像ファイルのバリデーション
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validImageTypes.includes(file.type)) {
      alert('画像ファイル（JPEG、PNG、GIF、WebP）を選択してください')
      e.target.value = ''
      return
    }

    // ファイルサイズチェック（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズは10MB以下にしてください')
      e.target.value = ''
      return
    }

    setSelectedFile(file)

    // プレビュー生成
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // アップロード処理
  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return

    try {
      setUploading(true)

      // ユニークなファイル名を生成
      const fileName = `${uuidv4()}-${selectedFile.name}`
      const filePath = `uploads/${fileName}`

      // Storageにアップロード
      const downloadURL = await storageService.uploadFile(filePath, selectedFile)

      // Firestoreにメタデータを保存
      const uploadData = {
        url: downloadURL,
        path: filePath,
        contentType: selectedFile.type,
        size: selectedFile.size,
        createdBy: currentUser.email || currentUser.uid,
      }

      const docId = await firestoreService.addDocument('uploads', uploadData)

      // 一覧に追加
      const newUpload: UploadedFile = {
        id: docId,
        ...uploadData,
        createdAt: new Date(),
      }
      setUploadedFiles([newUpload, ...uploadedFiles])

      // リセット
      setSelectedFile(null)
      setPreviewUrl(null)
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      alert('アップロードが完了しました')
    } catch (error: any) {
      console.error('アップロードエラー:', error)
      if (error.code === 'storage/unauthorized') {
        alert('アップロード権限がありません。ログインしていることを確認してください。')
      } else {
        alert(`アップロードに失敗しました: ${error.message || error}`)
      }
    } finally {
      setUploading(false)
    }
  }

  // ファイルサイズを人間が読みやすい形式に変換
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
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
    return date.toLocaleString('ja-JP')
  }

  // 画像削除処理
  const handleDelete = async (file: UploadedFile) => {
    if (!confirm(`この画像を削除してもよろしいですか？\n${file.path}`)) {
      return
    }

    try {
      setDeleting(file.id)

      // Storageから削除
      await storageService.deleteFile(file.path)

      // Firestoreから削除
      await firestoreService.deleteDocument('uploads', file.id)

      // ローカルステートから削除
      setUploadedFiles(uploadedFiles.filter((f) => f.id !== file.id))

      alert('画像を削除しました')
    } catch (error: any) {
      console.error('削除エラー:', error)
      if (error.code === 'storage/object-not-found') {
        // Storageにファイルがない場合はFirestoreだけ削除
        await firestoreService.deleteDocument('uploads', file.id)
        setUploadedFiles(uploadedFiles.filter((f) => f.id !== file.id))
        alert('画像を削除しました（ストレージにファイルが見つかりませんでした）')
      } else if (error.code === 'storage/unauthorized') {
        alert('削除権限がありません')
      } else {
        alert(`削除に失敗しました: ${error.message || error}`)
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* 左側：タイトル */}
            <div className="flex items-center">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">画像アップロード</h1>
            </div>

            {/* 右側：ユーザー情報とホームボタン */}
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-600 font-medium hidden sm:block">{currentUser?.email}</span>
              <div className="h-10 w-px bg-gray-300"></div>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← ホーム
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* アップロードセクション */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">新しい画像をアップロード</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
                画像ファイルを選択
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100
                  cursor-pointer"
                disabled={uploading}
              />
              <p className="mt-1 text-xs text-gray-500">
                対応形式: JPEG, PNG, GIF, WebP（最大10MB）
              </p>
            </div>

            {/* プレビュー */}
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">プレビュー:</p>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-md max-h-64 object-contain mx-auto"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-600 text-center">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'アップロード中...' : 'アップロード'}
            </button>
          </div>
        </div>

        {/* アップロード一覧セクション */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">アップロード済み画像</h2>

          {loading ? (
            <p className="text-gray-600">読み込み中...</p>
          ) : uploadedFiles.length === 0 ? (
            <p className="text-gray-600">まだ画像がアップロードされていません</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={file.url}
                      alt="Uploaded"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EError%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600 truncate" title={file.path}>
                      <strong>パス:</strong> {file.path}
                    </p>
                    <p className="text-gray-600">
                      <strong>サイズ:</strong> {formatFileSize(file.size)}
                    </p>
                    <p className="text-gray-600">
                      <strong>アップロード:</strong> {formatDate(file.createdAt)}
                    </p>
                    <p className="text-gray-600 truncate" title={file.createdBy}>
                      <strong>アップロード者:</strong> {file.createdBy}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-emerald-600 hover:text-emerald-800 underline"
                      >
                        画像を開く
                      </a>
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deleting === file.id}
                        className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold rounded hover:from-red-700 hover:to-red-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting === file.id ? '削除中...' : '削除'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default UploadImage
