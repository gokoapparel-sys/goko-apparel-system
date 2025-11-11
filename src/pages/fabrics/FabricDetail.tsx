import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { fabricsService } from '../../services/fabricsService'
import { Fabric } from '../../types'

const FabricDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [fabric, setFabric] = useState<Fabric | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadFabric(id)
    }
  }, [id])

  const loadFabric = async (fabricId: string) => {
    try {
      setLoading(true)
      const data = await fabricsService.getFabric(fabricId)
      if (data) {
        setFabric(data)
      } else {
        alert('生地が見つかりません')
        navigate('/fabrics')
      }
    } catch (error) {
      console.error('生地読み込みエラー:', error)
      alert('生地の読み込みに失敗しました')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!fabric) {
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
                onClick={() => navigate('/fabrics')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 一覧
              </button>
              <h1 className="text-xl font-bold text-primary-700 ml-6">生地詳細</h1>
              <button
                onClick={() => navigate(`/fabrics/${id}`)}
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
                <p className="text-sm text-gray-600">生地品番</p>
                <p className="text-lg font-semibold text-gray-900">{fabric.fabricCode}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">生地名</p>
                <p className="text-lg font-semibold text-gray-900">{fabric.fabricName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">混率</p>
                <p className="text-lg font-semibold text-gray-900">{fabric.composition}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">生地値</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${fabric.price.toLocaleString()}/m
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">メーカー</p>
                <p className="text-lg font-semibold text-gray-900">{fabric.manufacturer}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">入力者ID</p>
                <p className="text-lg font-semibold text-gray-900">{fabric.managerId}</p>
              </div>
            </div>
          </div>

          {/* 生地タイプ */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">生地タイプ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">カテゴリ</p>
                <p className="text-lg font-semibold text-gray-900">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {fabric.fabricType.category}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">パターン</p>
                <p className="text-lg font-semibold text-gray-900">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {fabric.fabricType.pattern}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ステータスとメタ情報 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">その他の情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">ステータス</p>
                <p className="text-lg font-semibold text-gray-900">
                  {fabric.status === 'active' ? (
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

              <div>
                <p className="text-sm text-gray-600">作成日時</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(fabric.createdAt)}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">更新日時</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(fabric.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-8 pt-8 border-t flex justify-between">
            <button onClick={() => navigate('/fabrics')} className="btn-secondary">
              一覧に戻る
            </button>
            <button onClick={() => navigate(`/fabrics/${id}`)} className="btn-primary">
              編集
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default FabricDetail
