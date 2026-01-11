import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { exhibitionsService } from '../../services/exhibitionsService'
import { Exhibition } from '../../types'

const ExhibitionsList: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'planning' | 'active' | 'completed'>('all')

  useEffect(() => {
    loadExhibitions()
  }, [statusFilter])

  const loadExhibitions = async () => {
    try {
      setLoading(true)
      const params = statusFilter === 'all' ? {} : { status: statusFilter }
      const result = await exhibitionsService.listExhibitions(params)
      setExhibitions(result.exhibitions)
    } catch (error) {
      console.error('展示会取得エラー:', error)
      alert('展示会の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

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
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getStatusLabel = (status: Exhibition['status']): string => {
    switch (status) {
      case 'planning':
        return '企画中'
      case 'active':
        return '開催中'
      case 'completed':
        return '終了'
    }
  }

  const getStatusColor = (status: Exhibition['status']): string => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
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
          <div className="flex flex-wrap justify-between items-center min-h-[5rem] py-2 gap-2">
            {/* 左側：タイトルと新規作成 */}
            <div className="flex items-center space-x-2 sm:space-x-6">
              <h1 className="text-base sm:text-2xl font-black text-gray-900 tracking-tight whitespace-nowrap">展示会管理</h1>
              <button
                onClick={() => navigate('/exhibitions/new')}
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

        {/* フィルター */}
        <div className="mb-6 card">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">ステータス:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">すべて</option>
              <option value="planning">企画中</option>
              <option value="active">開催中</option>
              <option value="completed">終了</option>
            </select>
          </div>
        </div>

        {/* 展示会リスト */}
        <div className="card">
          {exhibitions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">展示会がありません</p>
              <button
                onClick={() => navigate('/exhibitions/new')}
                className="mt-4 btn-primary"
              >
                最初の展示会を作成
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      展示会コード
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      展示会名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      開催期間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      場所
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exhibitions.map((exhibition) => (
                    <tr
                      key={exhibition.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/exhibitions/${exhibition.id}/detail`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {exhibition.exhibitionCode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {exhibition.exhibitionName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(exhibition.startDate)} ~ {formatDate(exhibition.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{exhibition.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            exhibition.status
                          )}`}
                        >
                          {getStatusLabel(exhibition.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/exhibitions/${exhibition.id}`)
                          }}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          編集
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/exhibitions/${exhibition.id}/detail`)
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          詳細
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ExhibitionsList
