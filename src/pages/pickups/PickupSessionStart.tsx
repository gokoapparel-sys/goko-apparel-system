import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { pickupsService } from '../../services/pickupsService'
import { exhibitionsService } from '../../services/exhibitionsService'
import { Exhibition, Pickup } from '../../types'

const PickupSessionStart: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const exhibitionId = searchParams.get('ex')

  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [selectedPickupCode, setSelectedPickupCode] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!exhibitionId) {
      setError('展示会IDが指定されていません')
      setLoading(false)
      return
    }
    loadData()
  }, [exhibitionId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // 展示会情報を取得
      const ex = await exhibitionsService.getExhibition(exhibitionId!)
      if (!ex) {
        setError('展示会が見つかりません')
        return
      }
      setExhibition(ex)

      // この展示会のピックアップリストを取得
      const { pickups: allPickups } = await pickupsService.listPickups()
      const exhibitionPickups = allPickups.filter(
        (p) => p.exhibitionId === exhibitionId && p.status === 'active'
      )
      setPickups(exhibitionPickups)
    } catch (err) {
      console.error('データ読み込みエラー:', err)
      setError('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = () => {
    const pickupCode = selectedPickupCode || manualCode.trim()

    if (!pickupCode) {
      alert('ピックアップコードを選択または入力してください')
      return
    }

    // セッション情報をローカルストレージに保存
    const sessionData = {
      pickupCode,
      exhibitionId: exhibitionId!,
      startTime: new Date().toISOString(),
    }
    localStorage.setItem('pickupSession', JSON.stringify(sessionData))

    // スキャン待機画面に遷移
    navigate(`/pickup-scan-session`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error || !exhibition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">エラー</h2>
          <p className="text-gray-700 mb-4">{error || '展示会が見つかりません'}</p>
          <button onClick={() => navigate('/pickups')} className="btn-secondary">
            ピックアップリスト一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="card max-w-lg w-full">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-primary-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-primary-700"
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
          <h1 className="text-2xl font-bold text-primary-700 mb-2">
            ピックアップセッション開始
          </h1>
          <p className="text-gray-600">{exhibition.exhibitionName}</p>
        </div>

        {/* ピックアップリスト選択 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ピックアップリストを選択
            </label>

            {pickups.length > 0 ? (
              <select
                value={selectedPickupCode}
                onChange={(e) => {
                  setSelectedPickupCode(e.target.value)
                  setManualCode('')
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">-- ピックアップリストを選択してください --</option>
                {pickups.map((pickup) => (
                  <option key={pickup.id} value={pickup.pickupCode}>
                    {pickup.pickupCode} - {pickup.customerName} (登録済み: {pickup.itemIds?.length || 0}件)
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-center text-gray-500 py-4 border border-gray-200 rounded-lg bg-gray-50">
                この展示会のピックアップリストがまだ作成されていません
              </p>
            )}
          </div>

          {/* 手動入力 */}
          <div className="pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              または、ピックアップコードを直接入力
            </label>
            <input
              type="text"
              placeholder="例: PU-EX2024SS-001"
              value={manualCode}
              onChange={(e) => {
                setManualCode(e.target.value)
                setSelectedPickupCode('')
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 開始ボタン */}
          <button
            onClick={handleStartSession}
            disabled={!selectedPickupCode && !manualCode.trim()}
            className="w-full btn-primary py-4 text-lg"
          >
            セッション開始
          </button>

          <button
            onClick={() => navigate('/pickups')}
            className="w-full btn-secondary mt-2"
          >
            キャンセル
          </button>
        </div>

        {/* 説明 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>使い方:</strong>
            <br />
            1. ピックアップリストを選択
            <br />
            2. セッション開始
            <br />
            3. 商品の下げ札QRコードをスキャン
          </p>
        </div>
      </div>
    </div>
  )
}

export default PickupSessionStart
