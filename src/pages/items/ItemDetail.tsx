import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { itemsService } from '../../services/itemsService'
import { patternsService } from '../../services/patternsService'
import { Item, Pattern } from '../../types'

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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/items')}
                className="text-sm text-gray-600 hover:text-gray-900 mr-4"
              >
                ← 一覧に戻る
              </button>
              <h1 className="text-xl font-bold text-primary-700">アイテム詳細</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{currentUser?.email}</span>
              <button onClick={() => navigate(`/items/${id}`)} className="btn-primary">
                編集
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {/* 画像ギャラリー */}
          {item.images && item.images.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">画像</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {item.images.map((img, index) => (
                  <a
                    key={index}
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
                <p className="text-sm text-gray-600">SKU</p>
                <p className="text-lg font-semibold text-gray-900">{item.sku}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">色</p>
                <p className="text-lg font-semibold text-gray-900">{item.color || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">サイズ</p>
                <p className="text-lg font-semibold text-gray-900">{item.size || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">価格</p>
                <p className="text-lg font-semibold text-gray-900">¥{item.price.toLocaleString()}</p>
              </div>

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
                <p className="text-sm text-gray-600">型紙</p>
                {pattern ? (
                  <p className="text-lg font-semibold text-gray-900">
                    <button
                      onClick={() => navigate(`/patterns/${pattern.id}/detail`)}
                      className="text-purple-700 hover:text-purple-900 hover:underline"
                    >
                      {pattern.patternCode} - {pattern.patternName}
                    </button>
                  </p>
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
