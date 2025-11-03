import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { pickupsService } from '../../services/pickupsService'
import { exhibitionsService } from '../../services/exhibitionsService'
import { itemsService } from '../../services/itemsService'
import { Exhibition, Pickup, Item } from '../../types'

const PickupScanSession: React.FC = () => {
  const navigate = useNavigate()

  const [session, setSession] = useState<{
    pickupCode: string
    exhibitionId: string
    startTime: string
  } | null>(null)

  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [pickup, setPickup] = useState<Pickup | null>(null)
  const [scannedItems, setScannedItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      setLoading(true)
      setError('')

      // セッションデータを取得
      const sessionData = localStorage.getItem('pickupSession')
      if (!sessionData) {
        setError('アクティブなセッションがありません')
        return
      }

      const parsedSession = JSON.parse(sessionData)
      setSession(parsedSession)

      // 展示会情報を取得
      const ex = await exhibitionsService.getExhibition(parsedSession.exhibitionId)
      if (!ex) {
        setError('展示会が見つかりません')
        return
      }
      setExhibition(ex)

      // ピックアップリストを取得または作成
      const { pickups } = await pickupsService.listPickups()
      let existingPickup: Pickup | null | undefined = pickups.find(
        (p) => p.pickupCode === parsedSession.pickupCode && p.exhibitionId === parsedSession.exhibitionId
      )

      if (!existingPickup) {
        // 新規作成（セッションのpickupCodeを使用）
        const newPickupId = await pickupsService.createPickup(
          {
            exhibitionId: parsedSession.exhibitionId,
            customerName: parsedSession.pickupCode,
            itemIds: [],
            createdDate: Timestamp.now(),
            status: 'active',
          },
          parsedSession.pickupCode // セッションのpickupCodeを使用
        )

        existingPickup = await pickupsService.getPickup(newPickupId)
      }

      setPickup(existingPickup ?? null)

      // スキャン済みアイテムを読み込み
      if (existingPickup && existingPickup.itemIds && existingPickup.itemIds.length > 0) {
        const items = await Promise.all(
          existingPickup.itemIds.map((id) => itemsService.getItem(id))
        )
        setScannedItems(items.filter((item) => item !== null) as Item[])
      }
    } catch (err) {
      console.error('セッション読み込みエラー:', err)
      setError('セッションの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = () => {
    if (confirm('ピックアップセッションを終了しますか？')) {
      localStorage.removeItem('pickupSession')
      navigate('/pickups')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!pickup) return

    try {
      const updatedItemIds = pickup.itemIds?.filter((id) => id !== itemId) || []
      await pickupsService.updatePickup(pickup.id!, {
        itemIds: updatedItemIds,
      })

      // UIを更新
      setScannedItems(scannedItems.filter((item) => item.id !== itemId))
      setPickup({ ...pickup, itemIds: updatedItemIds })
    } catch (err) {
      console.error('アイテム削除エラー:', err)
      alert('アイテムの削除に失敗しました')
    }
  }

  // 定期的にスキャン済みアイテムを再読み込み（他の画面で追加された場合）
  useEffect(() => {
    if (!pickup) return

    const interval = setInterval(async () => {
      try {
        const updatedPickup = await pickupsService.getPickup(pickup.id!)
        if (updatedPickup && updatedPickup.itemIds) {
          const items = await Promise.all(
            updatedPickup.itemIds.map((id) => itemsService.getItem(id))
          )
          setScannedItems(items.filter((item) => item !== null) as Item[])
          setPickup(updatedPickup)
        }
      } catch (err) {
        console.error('更新エラー:', err)
      }
    }, 2000) // 2秒ごとに更新

    return () => clearInterval(interval)
  }, [pickup])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error || !session || !exhibition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">エラー</h2>
          <p className="text-gray-700 mb-4">{error || 'セッションが見つかりません'}</p>
          <button onClick={() => navigate('/pickups')} className="btn-secondary">
            ピックアップリスト一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* セッション情報カード */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-green-700 mb-2">
                ピックアップセッション
              </h1>
              <p className="text-gray-600">{exhibition.exhibitionName}</p>
            </div>
            <div className="inline-block p-4 bg-green-100 rounded-full">
              <svg
                className="w-8 h-8 text-green-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">ピックアップコード</p>
                <p className="font-bold text-green-800">{session.pickupCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">開始時刻</p>
                <p className="font-bold text-green-800">
                  {new Date(session.startTime).toLocaleTimeString('ja-JP')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleEndSession} className="btn-danger flex-1">
              セッション終了
            </button>
          </div>
        </div>

        {/* スキャン待機カード */}
        <div className="card mb-6 text-center">
          <div className="inline-block p-6 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-16 h-16 text-blue-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            下げ札QRコードをスキャンしてください
          </h2>
          <p className="text-gray-600">
            スマートフォンのカメラで商品の下げ札QRコードを読み取ると、自動的にこのセッションに追加されます
          </p>
        </div>

        {/* スキャン済みアイテム一覧 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              スキャン済みアイテム ({scannedItems.length}件)
            </h2>
          </div>

          {scannedItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p>まだアイテムがスキャンされていません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scannedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* 画像 */}
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0].url}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* 商品情報 */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{item.itemNo}</h3>
                    <p className="text-sm text-gray-600">{item.name}</p>
                    {item.composition && (
                      <p className="text-xs text-gray-500">{item.composition}</p>
                    )}
                  </div>

                  {/* 削除ボタン */}
                  <button
                    onClick={() => handleRemoveItem(item.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="削除"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PickupScanSession
