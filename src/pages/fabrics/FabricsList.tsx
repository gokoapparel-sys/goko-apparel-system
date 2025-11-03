import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { fabricsService, ListFabricsResult } from '../../services/fabricsService'
import { Fabric } from '../../types'
import { QueryDocumentSnapshot } from 'firebase/firestore'

const FabricsList: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'布帛' | 'カット' | 'all'>('all')
  const [patternFilter, setPatternFilter] = useState<'無地' | '先染' | 'all'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // 生地取得
  const fetchFabrics = async (
    direction: 'next' | 'prev' | 'refresh' = 'refresh',
    cursor?: QueryDocumentSnapshot
  ) => {
    try {
      setLoading(true)
      const result: ListFabricsResult = await fabricsService.listFabrics({
        q: searchQuery,
        category: categoryFilter,
        pattern: patternFilter,
        sortBy: 'updatedAt',
        sortOrder,
        lastDoc: direction === 'next' ? cursor : undefined,
        firstDoc: direction === 'prev' ? cursor : undefined,
        direction: direction === 'refresh' ? undefined : direction,
      })

      setFabrics(result.fabrics)
      setLastDoc(result.lastDoc)
      setFirstDoc(result.firstDoc)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('生地取得エラー:', error)
      alert('生地の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 初回ロード
  useEffect(() => {
    if (currentUser) {
      fetchFabrics('refresh')
    }
  }, [currentUser, sortOrder, categoryFilter, patternFilter])

  // 検索
  const handleSearch = () => {
    setCurrentPage(1)
    fetchFabrics('refresh')
  }

  // 次ページ
  const handleNextPage = () => {
    if (hasMore && lastDoc) {
      setCurrentPage((prev) => prev + 1)
      fetchFabrics('next', lastDoc)
    }
  }

  // 前ページ
  const handlePrevPage = () => {
    if (currentPage > 1 && firstDoc) {
      setCurrentPage((prev) => prev - 1)
      fetchFabrics('prev', firstDoc)
    }
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
          無効
        </span>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-lg border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* 左側：タイトルと新規作成 */}
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">生地マスタ</h1>
              <button
                onClick={() => navigate('/fabrics/new')}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl hover:shadow-2xl border-2 border-emerald-500"
              >
                + 新規作成
              </button>
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
        {/* 検索とフィルター */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                検索（品番、生地名、メーカー）
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
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">すべて</option>
                <option value="布帛">布帛</option>
                <option value="カット">カット</option>
              </select>
            </div>
            <div>
              <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 mb-1">
                パターン
              </label>
              <select
                id="pattern"
                value={patternFilter}
                onChange={(e) => setPatternFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">すべて</option>
                <option value="無地">無地</option>
                <option value="先染">先染</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleSearch} className="btn-primary w-full">
                検索
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700 mr-2">
              並び替え:
            </label>
            <select
              id="sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="desc">新しい順</option>
              <option value="asc">古い順</option>
            </select>
          </div>
        </div>

        {/* 生地一覧 */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">生地一覧</h2>
            <p className="text-sm text-gray-600">ページ: {currentPage}</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : fabrics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">生地がありません</p>
              <button
                onClick={() => navigate('/fabrics/new')}
                className="mt-4 btn-primary inline-block"
              >
                最初の生地を作成
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
                        生地品番
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        生地名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        混率
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        生地値
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        メーカー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        タイプ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fabrics.map((fabric) => (
                      <tr
                        key={fabric.id}
                        onClick={() => navigate(`/fabrics/${fabric.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{fabric.fabricCode}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{fabric.fabricName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{fabric.composition}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${fabric.price.toLocaleString()}/m</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{fabric.manufacturer}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs space-y-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              {fabric.fabricType.category}
                            </span>
                            <br />
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                              {fabric.fabricType.pattern}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(fabric.status)}</td>
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

export default FabricsList
