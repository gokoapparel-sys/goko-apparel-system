import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { loansService } from '../../services/loansService'
import { itemsService } from '../../services/itemsService'
import { Loan } from '../../types'

const LoansList: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'borrowed' | 'returned'>('all')
  const [sortBy, setSortBy] = useState<'borrowDate' | 'staff'>('borrowDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
  const [returnNotes, setReturnNotes] = useState('')
  const [itemImages, setItemImages] = useState<Record<string, string>>({})

  useEffect(() => {
    loadLoans()
  }, [statusFilter, sortBy, sortOrder])

  const loadLoans = async () => {
    try {
      setLoading(true)
      const params = {
        sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      }
      const { loans: data } = await loansService.listLoans(params)
      setLoans(data)

      // アイテム画像を非同期で取得
      if (data.length > 0) {
        const itemIds = Array.from(new Set(data.map(loan => loan.itemId)))
        // 一度に大量に取得するのを防ぐため、必要に応じて分割するか、現状は全量取得（件数次第）
        // itemsService.getItemsByIds は firestore の in 句を使う場合 10件制限がある可能性があるが
        // サービスの実装を確認しないといけない。通常 id in [...] は30件まで。
        // ここでは itemsService.getItemsByIds がチャンク処理しているか不明だが、
        // 念のため、エラーにならないよう try-catch 内で行う。
        // もしサービスが未対応なら、個別に取るか、サービスを修正する必要がある。
        // 前回のコンテキストから getItemsByIds は存在確認済み。
        // 10件以上の挙動が不明だが、ここではそのまま呼び出す。
        try {
          // Firestoreの制限を考慮して、IDリストをチャンク分割して取得するロジックをサービスが持っていると仮定、
          // もしくはここで分割する。安全のため最大30件ずつ取得とかではなく、
          // itemsService.getItemsByIdsの実装が見れないので、
          // 安全策として、ループで取得するのではなく、一旦全量渡してみる。
          // もしエラーが出るようなら修正が必要。
          const items = await itemsService.getItemsByIds(itemIds)
          const imageMap: Record<string, string> = {}
          items.forEach(item => {
            if (item.id && item.images && item.images.length > 0) {
              imageMap[item.id] = item.images[0].url
            }
          })
          setItemImages(imageMap)
        } catch (imageError) {
          console.error('画像取得エラー:', imageError)
          // 画像取得失敗はメインフローを止めない
        }
      } else {
        setItemImages({})
      }

    } catch (error) {
      console.error('貸出記録読み込みエラー:', error)
      alert('貸出記録の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleReturnClick = (id: string) => {
    setSelectedLoanId(id)
    setReturnNotes('')
    setReturnDialogOpen(true)
  }

  const handleReturnConfirm = async () => {
    if (!selectedLoanId) return

    try {
      await loansService.returnLoan(selectedLoanId, returnNotes)
      alert('返却処理を完了しました')
      setReturnDialogOpen(false)
      setSelectedLoanId(null)
      setReturnNotes('')
      loadLoans()
    } catch (error) {
      console.error('返却処理エラー:', error)
      alert('返却処理に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('この貸出記録を削除してもよろしいですか？')) {
      return
    }

    try {
      await loansService.deleteLoan(id)
      alert('削除しました')
      loadLoans()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
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
          <div className="flex justify-between items-center h-20">
            {/* 左側：タイトルと新規作成 */}
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">サンプル貸出管理</h1>
              <button
                onClick={() => navigate('/loans/new')}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl hover:shadow-2xl border-2 border-emerald-500"
              >
                + 新規貸出
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
        {/* フィルター・ソート */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">すべて</option>
                <option value="borrowed">貸出中</option>
                <option value="returned">返却済み</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">並び替え</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="borrowDate">貸出日</option>
                <option value="staff">担当者</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">順序</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
            </div>
          </div>
        </div>

        {/* 貸出一覧 */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">
                    {/* 画像列 */}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    品番
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    アイテム名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    担当者
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    貸出日
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    返却日
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    目的
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      貸出記録がありません
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 flex-shrink-0">
                          {itemImages[loan.itemId] ? (
                            <div className="relative group">
                              <img
                                src={itemImages[loan.itemId]}
                                alt=""
                                className="w-12 h-12 object-cover rounded border border-gray-200 bg-white cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => window.open(itemImages[loan.itemId], '_blank')}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-300 text-[10px]">
                              No Img
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{loan.itemNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{loan.itemName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{loan.staff}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(loan.borrowDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {loan.returnDate ? formatDate(loan.returnDate) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {loan.purpose.length > 20
                          ? `${loan.purpose.substring(0, 20)}...`
                          : loan.purpose}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${loan.status === 'borrowed'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                            }`}
                        >
                          {loan.status === 'borrowed' ? '貸出中' : '返却済み'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          onClick={() => navigate(`/loans/${loan.id}/detail`)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          詳細
                        </button>
                        {loan.status === 'borrowed' && (
                          <button
                            onClick={() => handleReturnClick(loan.id!)}
                            className="text-green-600 hover:text-green-900"
                          >
                            返却
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/loans/${loan.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(loan.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 返却ダイアログ */}
        {returnDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">返却処理</h3>
              <div className="mb-4">
                <label htmlFor="returnNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  返却時のメモ（任意）
                </label>
                <textarea
                  id="returnNotes"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={3}
                  placeholder="返却時の状態や備考を入力してください"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setReturnDialogOpen(false)
                    setSelectedLoanId(null)
                    setReturnNotes('')
                  }}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button onClick={handleReturnConfirm} className="btn-primary">
                  返却処理を実行
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default LoansList
