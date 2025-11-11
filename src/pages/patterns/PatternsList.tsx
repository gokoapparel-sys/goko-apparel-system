import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { patternsService, ListPatternsResult } from '../../services/patternsService'
import { Pattern } from '../../types'
import { QueryDocumentSnapshot } from 'firebase/firestore'

const PatternsList: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // 型紙取得
  const fetchPatterns = async (
    direction: 'next' | 'prev' | 'refresh' = 'refresh',
    cursor?: QueryDocumentSnapshot
  ) => {
    try {
      setLoading(true)
      const result: ListPatternsResult = await patternsService.listPatterns({
        q: searchQuery,
        sortBy: 'updatedAt',
        sortOrder,
        lastDoc: direction === 'next' ? cursor : undefined,
        firstDoc: direction === 'prev' ? cursor : undefined,
        direction: direction === 'refresh' ? undefined : direction,
      })

      setPatterns(result.patterns)
      setLastDoc(result.lastDoc)
      setFirstDoc(result.firstDoc)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('型紙取得エラー:', error)
      alert('型紙の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 初回ロード
  useEffect(() => {
    if (currentUser) {
      fetchPatterns('refresh')
    }
  }, [currentUser, sortOrder])

  // 検索
  const handleSearch = () => {
    setCurrentPage(1)
    fetchPatterns('refresh')
  }

  // 次ページ
  const handleNextPage = () => {
    if (hasMore && lastDoc) {
      setCurrentPage((prev) => prev + 1)
      fetchPatterns('next', lastDoc)
    }
  }

  // 前ページ
  const handlePrevPage = () => {
    if (currentPage > 1 && firstDoc) {
      setCurrentPage((prev) => prev - 1)
      fetchPatterns('prev', firstDoc)
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
          無効
        </span>
      )
    }
  }

  // ファイル数をカウント
  const countFiles = (files: Pattern['files']): number => {
    let count = 0
    if (files.spec) count++
    if (files.layout) count++
    if (files.data) count++
    return count
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-lg border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* 左側：タイトルと新規作成 */}
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">型紙マスタ</h1>
              <button
                onClick={() => navigate('/patterns/new')}
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                検索（型紙No.、アイテム名）
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

        {/* 型紙一覧 */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">型紙一覧</h2>
            <p className="text-sm text-gray-600">ページ: {currentPage}</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : patterns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">型紙がありません</p>
              <button
                onClick={() => navigate('/patterns/new')}
                className="mt-4 btn-primary inline-block"
              >
                最初の型紙を作成
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
                        型紙No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アイテム名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ファイル
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
                    {patterns.map((pattern) => (
                      <tr
                        key={pattern.id}
                        onClick={() => navigate(`/patterns/${pattern.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {pattern.patternCode}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{pattern.patternName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs space-y-1">
                            {pattern.files.spec && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 mr-1">
                                仕様書
                              </span>
                            )}
                            {pattern.files.layout && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-800 mr-1">
                                展開図
                              </span>
                            )}
                            {pattern.files.data && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                                データ
                              </span>
                            )}
                            {countFiles(pattern.files) === 0 && (
                              <span className="text-gray-400">なし</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{pattern.managerId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(pattern.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(pattern.updatedAt || pattern.createdAt)}
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

export default PatternsList
