import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { itemsService } from '../../services/itemsService'
import { patternsService } from '../../services/patternsService'
import { Item, Pattern } from '../../types'
import { Timestamp } from 'firebase/firestore'
import JSZip from 'jszip'
import { getStorage, ref, getBlob } from 'firebase/storage'

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [item, setItem] = useState<Item | null>(null)
  const [pattern, setPattern] = useState<Pattern | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadItem(id)
    }
  }, [id])

  const loadItem = async (itemId: string) => {
    try {
      setLoading(true)
      const data = await itemsService.getItem(itemId)
      if (data) {
        setItem(data)
        // 型紙情報を取得
        if (data.patternId) {
          try {
            const patternData = await patternsService.getPattern(data.patternId)
            setPattern(patternData)
          } catch (error) {
            console.error('型紙読み込みエラー:', error)
          }
        }
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
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 画像を1枚ダウンロード
  const handleDownloadImage = async (_url: string, path: string, index: number) => {
    try {
      const storage = getStorage()
      const imageRef = ref(storage, path)
      const blob = await getBlob(imageRef)
      const ext = blob.type.split('/')[1] || 'jpg'
      const downloadName = `${item?.name || 'image'}_${index + 1}.${ext}`
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = downloadName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('画像のダウンロードに失敗しました:', error)
      alert('画像のダウンロードに失敗しました')
    }
  }

  // 全画像をZIPでダウンロード
  const handleDownloadAllImages = async () => {
    if (!item?.images || item.images.length === 0) return
    try {
      const zip = new JSZip()
      const storage = getStorage()
      for (let i = 0; i < item.images.length; i++) {
        const img = item.images[i]
        const imageRef = ref(storage, img.path)
        const blob = await getBlob(imageRef)
        const ext = blob.type.split('/')[1] || 'jpg'
        zip.file(`${item.name}_${i + 1}.${ext}`, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = `${item.name}_画像.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('画像の一括ダウンロードに失敗しました:', error)
      alert('画像の一括ダウンロードに失敗しました')
    }
  }

  // 型紙ファイルを一括ダウンロード（ZIP）
  const handleDownloadAllPatternFiles = async () => {
    if (!pattern) return

    try {
      const zip = new JSZip()
      const promises: Promise<void>[] = []

      // 仕様書を追加（複数ファイル対応 + 後方互換性）
      if (pattern.files?.spec) {
        if (Array.isArray(pattern.files.spec)) {
          // 新形式: 配列
          const specFiles = pattern.files.spec
          specFiles.forEach((specFile, index) => {
            const promise = fetch(specFile.fileUrl)
              .then(res => res.blob())
              .then(blob => {
                const fileName = specFiles.length > 1
                  ? `spec_${index + 1}_${specFile.fileName}`
                  : specFile.fileName
                zip.file(fileName, blob)
              })
            promises.push(promise)
          })
        } else if ('fileUrl' in pattern.files.spec && pattern.files.spec.fileUrl) {
          // 旧形式: 単一オブジェクト（後方互換性）
          const specFile = pattern.files.spec as { fileName: string; fileUrl: string }
          const promise = fetch(specFile.fileUrl)
            .then(res => res.blob())
            .then(blob => {
              zip.file(specFile.fileName, blob)
            })
          promises.push(promise)
        }
      }

      // 展開図を追加
      if (pattern.files?.layout) {
        const promise = fetch(pattern.files.layout.fileUrl)
          .then(res => res.blob())
          .then(blob => {
            zip.file(pattern.files.layout!.fileName, blob)
          })
        promises.push(promise)
      }

      // 型紙データを追加
      if (pattern.files?.data) {
        const promise = fetch(pattern.files.data.fileUrl)
          .then(res => res.blob())
          .then(blob => {
            zip.file(pattern.files.data!.fileName, blob)
          })
        promises.push(promise)
      }

      // すべてのファイルを取得
      await Promise.all(promises)

      // ZIPファイルを生成してダウンロード
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = `${pattern.patternCode}_${item?.itemNo || 'files'}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert('型紙ファイルをダウンロードしました')
    } catch (error) {
      console.error('ダウンロードエラー:', error)
      alert('ダウンロードに失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!item) {
    return null
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
              <h1 className="text-xl font-bold text-primary-700 ml-6">アイテム詳細</h1>
              <button
                onClick={() => navigate(`/items/${id}`)}
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
          {/* 画像ギャラリー */}
          {item.images && item.images.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">画像</h2>
                <button
                  onClick={handleDownloadAllImages}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  全画像をダウンロード
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {item.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={img.url}
                        alt={`${item.name} ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg hover:opacity-75 transition-opacity"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EError%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    </a>
                    <button
                      onClick={() => handleDownloadImage(img.url, img.path, index)}
                      className="absolute bottom-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-1.5 rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      title="ダウンロード"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 基本情報 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">名前</p>
                <p className="text-lg font-semibold text-gray-900">{item.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">アイテムNo.</p>
                <p className="text-lg font-semibold text-gray-900">{item.sku}</p>
              </div>

              {item.fabricNo && (
                <div>
                  <p className="text-sm text-gray-600">生地No.</p>
                  <p className="text-lg font-semibold text-gray-900">{item.fabricNo}</p>
                </div>
              )}

              {item.fabricName && (
                <div>
                  <p className="text-sm text-gray-600">生地名</p>
                  <p className="text-lg font-semibold text-gray-900">{item.fabricName}</p>
                </div>
              )}

              {item.composition && (
                <div>
                  <p className="text-sm text-gray-600">混率</p>
                  <p className="text-lg font-semibold text-gray-900">{item.composition}</p>
                </div>
              )}

              {item.fabricSpec && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">生地規格</p>
                  <p className="text-lg font-semibold text-gray-900">{item.fabricSpec}</p>
                  <p className="text-xs text-gray-500 mt-1">生地の規格や目付、生産/市場生地など</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">色</p>
                <p className="text-lg font-semibold text-gray-900">{item.color || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">サイズ</p>
                <p className="text-lg font-semibold text-gray-900">{item.size || '-'}</p>
              </div>

              {item.dollarPrice && (
                <div>
                  <p className="text-sm text-gray-600">＄単価</p>
                  <p className="text-lg font-semibold text-gray-900">${item.dollarPrice.toLocaleString()}</p>
                </div>
              )}

              {item.moq && (
                <div>
                  <p className="text-sm text-gray-600">単価枚数条件</p>
                  <p className="text-lg font-semibold text-gray-900">{item.moq}</p>
                </div>
              )}

              {item.referencePrice && (
                <div>
                  <p className="text-sm text-gray-600">売単価（参考）</p>
                  <p className="text-lg font-semibold text-gray-900">¥{item.referencePrice.toLocaleString()}</p>
                </div>
              )}

              {item.factory && (
                <div>
                  <p className="text-sm text-gray-600">工場名</p>
                  <p className="text-lg font-semibold text-gray-900">{item.factory}</p>
                </div>
              )}

              {item.price && (
                <div>
                  <p className="text-sm text-gray-600">価格（旧）</p>
                  <p className="text-lg font-semibold text-gray-900">¥{item.price.toLocaleString()}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">ステータス</p>
                <p className="text-lg font-semibold text-gray-900">
                  {item.status === 'active' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      有効
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      アーカイブ
                    </span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">入力者ID</p>
                <p className="text-lg font-semibold text-gray-900">{item.createdBy || '-'}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-2">型紙</p>
                {pattern ? (
                  <div>
                    <p className="text-lg font-semibold text-gray-900 mb-3">
                      <button
                        onClick={() => navigate(`/patterns/${pattern.id}/detail`)}
                        className="text-purple-700 hover:text-purple-900 hover:underline"
                      >
                        {pattern.patternCode} - {pattern.patternName}
                      </button>
                    </p>
                    {/* 型紙ファイルダウンロード */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">型紙ファイル:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 仕様書（複数ファイル対応 + 後方互換性） */}
                        {pattern.files?.spec ? (
                          Array.isArray(pattern.files.spec) && pattern.files.spec.length > 0 ? (
                            // 新形式: 配列
                            (() => {
                              const specFiles = pattern.files.spec as Array<{ id: string; fileName: string; fileUrl: string; uploadedAt: Timestamp }>
                              return (
                                <div className="space-y-2">
                                  {specFiles.map((specFile, index) => (
                                    <a
                                      key={specFile.id}
                                      href={specFile.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={specFile.fileName}
                                      className="inline-flex items-center justify-center w-full px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                                    >
                                      📄 仕様書 {specFiles.length > 1 ? `(${index + 1})` : ''}
                                    </a>
                                  ))}
                                </div>
                              )
                            })()

                          ) : ('fileUrl' in pattern.files.spec && pattern.files.spec.fileUrl) ? (
                            // 旧形式: 単一オブジェクト（後方互換性）
                            (() => {
                              const specFile = pattern.files.spec as { fileName: string; fileUrl: string }
                              return (
                                <a
                                  href={specFile.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={specFile.fileName}
                                  className="inline-flex items-center justify-center px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                  📄 仕様書
                                </a>
                              )
                            })()

                          ) : (
                            <div className="inline-flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                              📄 仕様書（未登録）
                            </div>
                          )
                        ) : (
                          <div className="inline-flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                            📄 仕様書（未登録）
                          </div>
                        )}

                        {/* 展開図 */}
                        {pattern.files?.layout ? (
                          <a
                            href={pattern.files.layout.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors"
                          >
                            📐 展開図
                          </a>
                        ) : (
                          <div className="inline-flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                            📐 展開図（未登録）
                          </div>
                        )}

                        {/* 型紙データ */}
                        {pattern.files?.data ? (
                          <a
                            href={pattern.files.data.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-700 text-white text-sm font-medium rounded-lg hover:bg-indigo-800 transition-colors"
                          >
                            📦 型紙データ
                          </a>
                        ) : (
                          <div className="inline-flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                            📦 型紙データ（未登録）
                          </div>
                        )}
                      </div>

                      {/* 一括ダウンロードボタン */}
                      {(pattern.files?.spec || pattern.files?.layout || pattern.files?.data) && (
                        <button
                          onClick={() => handleDownloadAllPatternFiles()}
                          className="w-full mt-3 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg"
                        >
                          📥 すべてまとめてダウンロード（ZIP）
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-gray-400">未設定</p>
                )}
              </div>

              {item.createdBy && (
                <div>
                  <p className="text-sm text-gray-600">作成者</p>
                  <p className="text-lg font-semibold text-gray-900">{item.createdBy}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">作成日時</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(item.createdAt)}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">更新日時</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(item.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-8 pt-8 border-t flex justify-between">
            <button
              onClick={() => navigate('/items')}
              className="btn-secondary"
            >
              一覧に戻る
            </button>
            <button
              onClick={() => navigate(`/items/${id}`)}
              className="btn-primary"
            >
              編集
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ItemDetail
