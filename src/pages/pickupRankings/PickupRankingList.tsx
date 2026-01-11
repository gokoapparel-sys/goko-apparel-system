import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { exhibitionsService } from '../../services/exhibitionsService'
import { Exhibition } from '../../types'

const PickupRankingList: React.FC = () => {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-lg border-b-4 border-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center min-h-[5rem] py-2 gap-2">
            {/* 左側：タイトル */}
            <div className="flex items-center space-x-2 sm:space-x-6">
              <h1 className="text-base sm:text-2xl font-black text-gray-900 tracking-tight whitespace-nowrap">ピックアップランキング</h1>
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          <h2 className="text-xl font-bold text-gray-900 mb-6">展示会を選択してください</h2>
          {exhibitions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">展示会がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exhibitions.map((exhibition) => (
                <div
                  key={exhibition.id}
                  onClick={() => navigate(`/pickup-rankings/${exhibition.id}`)}
                  className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 border-3 border-blue-400 rounded-2xl p-6 cursor-pointer hover:shadow-2xl hover:border-blue-500 transition-all transform hover:scale-[1.03] hover:-translate-y-1"
                  style={{ boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)' }}
                >
                  {/* ステータスバッジ */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-md ${getStatusColor(
                        exhibition.status
                      )}`}
                    >
                      {getStatusLabel(exhibition.status)}
                    </span>
                  </div>

                  {/* 展示会情報 */}
                  <div className="space-y-3 mt-2">
                    <h3 className="text-2xl font-black text-blue-900 mb-3 pr-16 tracking-tight">
                      {exhibition.exhibitionName}
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-blue-700">
                        <span className="font-bold w-24">展示会コード:</span>
                        <span className="text-blue-900 font-semibold">{exhibition.exhibitionCode}</span>
                      </div>

                      <div className="flex items-center text-blue-700">
                        <span className="font-bold w-24">開催期間:</span>
                        <span className="text-blue-900 font-semibold">
                          {formatDate(exhibition.startDate)} ~ {formatDate(exhibition.endDate)}
                        </span>
                      </div>

                      <div className="flex items-center text-blue-700">
                        <span className="font-bold w-24">場所:</span>
                        <span className="text-blue-900 font-semibold">{exhibition.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* ボタン */}
                  <div className="mt-6">
                    <div className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white font-black py-3 px-4 rounded-xl text-center hover:from-blue-800 hover:to-black transition-all shadow-lg hover:shadow-xl text-base">
                      ランキングを見る →
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

export default PickupRankingList
