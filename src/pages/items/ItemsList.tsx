import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { itemsService, ListItemsResult } from '../../services/itemsService'
import { patternsService } from '../../services/patternsService'
import { Item, Pattern } from '../../types'
import { QueryDocumentSnapshot } from 'firebase/firestore'

const ItemsList: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<Item[]>([])
  const [patterns, setPatterns] = useState<Map<string, Pattern>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [createdByFilter, setCreatedByFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // アイテム取得
  const fetchItems = async (
    direction: 'next' | 'prev' | 'refresh' = 'refresh',
    cursor?: QueryDocumentSnapshot
  ) => {
    try {
      setLoading(true)
      setError(null)
      const result: ListItemsResult = await itemsService.listItems({
        q: searchQuery,
        sortBy: 'updatedAt',
        sortOrder,
        lastDoc: direction === 'next' ? cursor : undefined,
        firstDoc: direction === 'prev' ? cursor : undefined,
        direction: direction === 'refresh' ? undefined : direction,
      })

      // 入力者フィルターを適用
      let filteredItems = result.items
      if (createdByFilter.trim()) {
        filteredItems = result.items.filter(item =>
          item.createdBy?.toLowerCase().includes(createdByFilter.toLowerCase())
        )
      }

      setItems(filteredItems)
      setLastDoc(result.lastDoc)
      setFirstDoc(result.firstDoc)
      setHasMore(result.hasMore)

      // 型紙情報を取得
      const patternIds = [...new Set(result.items.map((item) => item.patternId).filter(Boolean))]
      if (patternIds.length > 0) {
        const patternsMap = new Map<string, Pattern>()
        await Promise.all(
          patternIds.map(async (id) => {
            try {
              const pattern = await patternsService.getPattern(id!)
              if (pattern) {
                patternsMap.set(id!, pattern)
              }
            } catch (error) {
              console.error(`型紙取得エラー (${id}):`, error)
            }
          })
        )
        setPatterns(patternsMap)
      }
    } catch (error: any) {
      console.error('アイテム取得エラー:', error)
      setError(error?.message || '読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 初回ロード
  useEffect(() => {
    if (currentUser) {
      fetchItems('refresh')
    }
  }, [currentUser, sortOrder])

  // 検索
  const handleSearch = () => {
    setCurrentPage(1)
    fetchItems('refresh')
  }

  // 次ページ
  const handleNextPage = () => {
    if (hasMore && lastDoc) {
      setCurrentPage((prev) => prev + 1)
      fetchItems('next', lastDoc)
    }
  }

  // 前ページ
  const handlePrevPage = () => {
    if (currentPage > 1 && firstDoc) {
      setCurrentPage((prev) => prev - 1)
      fetchItems('prev', firstDoc)
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

  // ステータスバッジ
  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          有効
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          アーカイブ
        </span>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-lg border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center min-h-[5rem] py-2 gap-2">
            {/* 左側：タイトルと新規作成 */}
            <div className="flex items-center space-x-2 sm:space-x-6">
              <h1 className="text-base sm:text-2xl font-black text-gray-900 tracking-tight whitespace-nowrap">アイテム管理</h1>
              <button
                onClick={() => navigate('/items/new')}
                className="inline-flex items-center px-3 py-2 sm:px-8 sm:py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl hover:shadow-2xl border-2 border-emerald-500 text-xs sm:text-base whitespace-nowrap"
              >
                + 新規作成
              </button>
            </div>

            {/* 右側：ユーザー情報とホームボタン */}
            <div className="flex items-center space-x-2 sm:space-x-6">
              <span className="text-xs sm:text-sm text-gray-600 font-medium hidden md:block">{currentUser?.email}</span>
              <div className="h-10 w-px bg-gray-300 hidden md:block"></div>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg text-xs sm:text-base whitespace-nowrap"
              >
                ← ホーム
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索とフィルター */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                検索（名前、アイテムNo.）
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="検索キーワードを入力..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="createdByFilter" className="block text-sm font-medium text-gray-700 mb-1">
                入力者IDで絞り込み
              </label>
              <input
                id="createdByFilter"
                type="text"
                value={createdByFilter}
                onChange={(e) => setCreatedByFilter(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="例: tanaka@company.co.jp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="w-full md:w-48">
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                並び替え
              </label>
              <select
                id="sort"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="desc">新しい順</option>
                <option value="asc">古い順</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleSearch} className="btn-primary">
                検索
              </button>
            </div>
          </div>
        </div>

        {/* エラーバナー */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 text-red-700 px-4 py-3 border border-red-200">
            <p className="font-medium">エラーが発生しました</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* アイテム一覧 */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">アイテム一覧</h2>
            <p className="text-sm text-gray-600">ページ: {currentPage}</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">アイテムがありません</p>
              <button
                onClick={() => navigate('/items/new')}
                className="mt-4 btn-primary inline-block"
              >
                最初のアイテムを作成
              </button>
            </div>
          ) : (
            <>
              {/* テーブル表示 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        画像
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        名前
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アイテムNo.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        生地No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        型紙
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        入力者ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        更新日
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/items/${item.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-12 w-12 bg-gray-200 rounded overflow-hidden">
                            {item.images && item.images.length > 0 ? (
                              <img
                                src={item.images[0].url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src =
                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{item.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{item.fabricNo || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600">
                            {item.patternId && patterns.has(item.patternId) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation() // 行クリックイベントを止める
                                  navigate(`/patterns/${item.patternId}/detail`)
                                }}
                                className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors cursor-pointer"
                                title="型紙詳細を見る"
                              >
                                {patterns.get(item.patternId)?.patternCode}
                              </button>
                            ) : (
                              <span className="text-gray-400">未設定</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {item.createdBy || <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status ?? 'active')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(item.updatedAt || item.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ページネーション */}
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← 前のページ
                </button>
                <span className="text-sm text-gray-600">ページ {currentPage}</span>
                <button
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次のページ →
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default ItemsList
