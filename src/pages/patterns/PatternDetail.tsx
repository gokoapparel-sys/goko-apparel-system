import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { patternsService } from '../../services/patternsService'
import { itemsService } from '../../services/itemsService'
import { Pattern, Item } from '../../types'

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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/patterns')}
                className="text-sm text-gray-600 hover:text-gray-900 mr-4"
              >
                ← 一覧に戻る
              </button>
              <h1 className="text-xl font-bold text-primary-700">型紙詳細</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{currentUser?.email}</span>
              <button onClick={() => navigate(`/patterns/${id}`)} className="btn-primary">
                編集
              </button>
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
                <p className="text-sm text-gray-600">型紙名</p>
                <p className="text-lg font-semibold text-gray-900">{pattern.patternName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">担当者ID</p>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">ファイル</h2>
            <div className="space-y-4">
              {(['spec', 'layout', 'data'] as const).map((fileType) => (
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
                        <a
                          href={pattern.files[fileType]!.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-800 underline"
                        >
                          ダウンロード / 表示
                        </a>
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
                        SKU
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
                          <div className="text-sm text-gray-900">¥{item.price.toLocaleString()}</div>
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
