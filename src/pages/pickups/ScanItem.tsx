import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { itemsService } from '../../services/itemsService'
import { pickupsService } from '../../services/pickupsService'
import { exhibitionsService } from '../../services/exhibitionsService'
import { Item, Exhibition } from '../../types'

const ScanItem: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const exhibitionId = searchParams.get('ex')

  const [item, setItem] = useState<Item | null>(null)
  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [session, setSession] = useState<{
    pickupCode: string
    exhibitionId: string
    startTime: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [alreadyAdded, setAlreadyAdded] = useState(false)

  useEffect(() => {
    loadAndAddItem()
  }, [itemId, exhibitionId])

  const loadAndAddItem = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      setAlreadyAdded(false)

      // セッション情報を取得
      const sessionData = localStorage.getItem('pickupSession')
      if (!sessionData) {
        setError('アクティブなピックアップセッションがありません。先にセッションを開始してください。')
        return
      }

      const parsedSession = JSON.parse(sessionData)
      setSession(parsedSession)

      // 展示会IDが一致するか確認
      if (exhibitionId !== parsedSession.exhibitionId) {
        setError('このアイテムは現在のセッションの展示会に属していません')
        return
      }

      // 展示会情報を取得
      const ex = await exhibitionsService.getExhibition(exhibitionId!)
      if (!ex) {
        setError('展示会が見つかりません')
        return
      }
      setExhibition(ex)

      // アイテム情報を取得
      const itemData = await itemsService.getItem(itemId!)
      if (!itemData) {
        setError('アイテムが見つかりません')
        return
      }
      setItem(itemData)

      // ピックアップリストを取得または作成
      const { pickups } = await pickupsService.listPickups()
      let pickup = pickups.find(
        (p) => p.pickupCode === parsedSession.pickupCode && p.exhibitionId === parsedSession.exhibitionId
      )

      if (!pickup) {
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

        pickup = (await pickupsService.getPickup(newPickupId)) || undefined
      }

      if (!pickup) {
        setError('ピックアップリストの作成に失敗しました')
        return
      }

      // すでに追加されているか確認
      if (pickup.itemIds && pickup.itemIds.includes(itemId!)) {
        setAlreadyAdded(true)
        return
      }

      // アイテムを追加
      const updatedItemIds = [...(pickup.itemIds || []), itemId!]
      await pickupsService.updatePickup(pickup.id!, {
        itemIds: updatedItemIds,
      })

      setSuccess(true)
    } catch (err) {
      console.error('アイテム追加エラー:', err)
      setError('アイテムの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToSession = () => {
    navigate('/pickup-scan-session')
  }

  const handleStartSession = () => {
    if (exhibitionId) {
      navigate(`/pickup-session-start?ex=${exhibitionId}`)
    } else {
      navigate('/pickups')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">アイテムを追加中...</p>
        </div>
      </div>
    )
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-4">エラー</h2>
          <p className="text-gray-700 mb-6">{error}</p>

          {!session ? (
            <button onClick={handleStartSession} className="btn-primary w-full">
              セッションを開始する
            </button>
          ) : (
            <button onClick={handleBackToSession} className="btn-secondary w-full">
              セッション画面に戻る
            </button>
          )}
        </div>
      </div>
    )
  }

  // すでに追加済み
  if (alreadyAdded && item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-yellow-700 mb-4">すでに追加済み</h2>

          {/* アイテム情報 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            {item.images && item.images.length > 0 && (
              <img
                src={item.images[0].url}
                alt={item.name}
                className="w-full h-48 object-cover rounded mb-4"
              />
            )}
            <p className="font-bold text-gray-900 mb-1">{item.itemNo}</p>
            <p className="text-sm text-gray-600 mb-2">{item.name}</p>
            {item.composition && (
              <p className="text-xs text-gray-500">{item.composition}</p>
            )}
          </div>

          <p className="text-gray-700 mb-6">
            このアイテムは既にピックアップリストに追加されています
          </p>

          <button onClick={handleBackToSession} className="btn-primary w-full">
            セッション画面に戻る
          </button>
        </div>
      </div>
    )
  }

  // 成功表示
  if (success && item && exhibition && session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-700 mb-4">追加完了!</h2>

          {/* アイテム情報 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            {item.images && item.images.length > 0 && (
              <img
                src={item.images[0].url}
                alt={item.name}
                className="w-full h-48 object-cover rounded mb-4"
              />
            )}
            <p className="font-bold text-gray-900 mb-1">{item.itemNo}</p>
            <p className="text-sm text-gray-600 mb-2">{item.name}</p>
            {item.composition && (
              <p className="text-xs text-gray-500">{item.composition}</p>
            )}
          </div>

          {/* セッション情報 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">ピックアップコード</p>
            <p className="font-bold text-green-800 mb-3">{session.pickupCode}</p>
            <p className="text-sm text-gray-600 mb-2">展示会</p>
            <p className="font-bold text-green-800">{exhibition.exhibitionName}</p>
          </div>

          <button onClick={handleBackToSession} className="btn-primary w-full">
            次のアイテムをスキャン
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default ScanItem
