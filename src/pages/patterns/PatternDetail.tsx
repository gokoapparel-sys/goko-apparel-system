import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { patternsService } from '../../services/patternsService'
import { itemsService } from '../../services/itemsService'
import { Pattern, Item } from '../../types'
import { Timestamp } from 'firebase/firestore'
import JSZip from 'jszip'

const PatternDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [pattern, setPattern] = useState<Pattern | null>(null)
  const [linkedItems, setLinkedItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadPattern(id)
    }
  }, [id])

  const loadPattern = async (patternId: string) => {
    try {
      setLoading(true)
      const data = await patternsService.getPattern(patternId)
      if (data) {
        setPattern(data)
        // 紐づいたアイテムを取得
        await loadLinkedItems(patternId)
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

  const loadLinkedItems = async (patternId: string) => {
    try {
      const result = await itemsService.listItems({})
      const filtered = result.items.filter((item) => item.patternId === patternId)
      setLinkedItems(filtered)
    } catch (error) {
      console.error('紐づいたアイテム取得エラー:', error)
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

  // 型紙ファイルを一括ダウンロード（ZIP）
  const handleDownloadAllFiles = async () => {
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
      link.download = `${pattern.patternCode}_型紙ファイル.zip`
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

  if (!pattern) {
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
                onClick={() => navigate('/patterns')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 一覧
              </button>
              <h1 className="text-xl font-bold text-primary-700 ml-6">型紙詳細</h1>
              <button
                onClick={() => navigate(`/patterns/${id}`)}
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
                <p className="text-sm text-gray-600">型紙No.</p>
                <p className="text-lg font-semibold text-gray-900">{pattern.patternCode}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">アイテム名</p>
                <p className="text-lg font-semibold text-gray-900">{pattern.patternName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">入力者ID</p>
                <p className="text-lg font-semibold text-gray-900">{pattern.managerId}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">ステータス</p>
                <p className="text-lg font-semibold text-gray-900">
                  {pattern.status === 'active' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      有効
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      無効
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ファイル */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">型紙ファイル</h2>

            {/* 個別ダウンロードボタン */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">個別ダウンロード:</p>
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
                    download={pattern.files.layout.fileName}
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
                    download={pattern.files.data.fileName}
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
                  onClick={handleDownloadAllFiles}
                  className="w-full mt-3 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg"
                >
                  📥 すべてまとめてダウンロード（ZIP）
                </button>
              )}
            </div>

            {/* ファイル詳細 */}
            <div className="space-y-4">
              {/* 仕様書（複数ファイル対応 + 後方互換性） */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">仕様書</h3>
                {pattern.files.spec ? (
                  Array.isArray(pattern.files.spec) && pattern.files.spec.length > 0 ? (
                    // 新形式: 配列
                    <div className="space-y-2">
                      {pattern.files.spec.map((specFile) => (
                        <div key={specFile.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                          <svg
                            className="w-8 h-8 text-emerald-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {specFile.fileName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : ('fileUrl' in pattern.files.spec && pattern.files.spec.fileUrl) ? (
                    // 旧形式: 単一オブジェクト（後方互換性）
                    (() => {
                      const specFile = pattern.files.spec as { fileName: string; fileUrl: string }
                      return (
                        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                          <svg
                            className="w-8 h-8 text-emerald-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {specFile.fileName}
                            </p>
                          </div>
                        </div>
                      )
                    })()

                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                      ファイルがアップロードされていません
                    </p>
                  )
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                    ファイルがアップロードされていません
                  </p>
                )}
              </div>

              {/* 展開図と型紙データファイル */}
              {(['layout', 'data'] as const).map((fileType) => (
                <div key={fileType} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{getFileTypeLabel(fileType)}</h3>

                  {pattern.files[fileType] ? (
                    <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                      <svg
                        className="w-8 h-8 text-red-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pattern.files[fileType]!.fileName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                      ファイルがアップロードされていません
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 紐づいたアイテム */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              紐づいたアイテム ({linkedItems.length}件)
            </h2>
            {linkedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        名前
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アイテムNo.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        価格
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {linkedItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/items/${item.id}/detail`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{item.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">¥{item.price?.toLocaleString() ?? '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.status === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              有効
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              アーカイブ
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
                この型紙に紐づいたアイテムはありません
              </p>
            )}
          </div>

          {/* メタ情報 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">その他の情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">作成日時</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(pattern.createdAt)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">更新日時</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(pattern.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-8 pt-8 border-t flex justify-between">
            <button onClick={() => navigate('/patterns')} className="btn-secondary">
              一覧に戻る
            </button>
            <button onClick={() => navigate(`/patterns/${id}`)} className="btn-primary">
              編集
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PatternDetail
