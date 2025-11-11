import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { loansService } from '../../services/loansService'
import { Loan } from '../../types'

const LoanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [returnNotes, setReturnNotes] = useState('')

  useEffect(() => {
    if (id) {
      loadLoan(id)
    }
  }, [id])

  const loadLoan = async (loanId: string) => {
    try {
      setLoading(true)
      const data = await loansService.getLoan(loanId)
      if (data) {
        setLoan(data)
      } else {
        alert('貸出記録が見つかりません')
        navigate('/loans')
      }
    } catch (error) {
      console.error('貸出記録読み込みエラー:', error)
      alert('貸出記録の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleReturnClick = () => {
    setReturnNotes('')
    setReturnDialogOpen(true)
  }

  const handleReturnConfirm = async () => {
    if (!id) return

    try {
      await loansService.returnLoan(id, returnNotes)
      alert('返却処理を完了しました')
      setReturnDialogOpen(false)
      setReturnNotes('')
      loadLoan(id)
    } catch (error) {
      console.error('返却処理エラー:', error)
      alert('返却処理に失敗しました')
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

  const formatDateTime = (timestamp: any): string => {
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

  if (!loan) {
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
                onClick={() => navigate('/loans')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 一覧
              </button>
              <h1 className="text-xl font-bold text-primary-700 ml-6">貸出記録詳細</h1>
              <button
                onClick={() => navigate(`/loans/${id}`)}
                className="ml-4 inline-flex items-center px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-all shadow-md"
              >
                編集
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{currentUser?.email}</span>
              {loan.status === 'borrowed' && (
                <button onClick={handleReturnClick} className="btn-secondary">
                  返却処理
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {/* 基本情報 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">品番</p>
                <p className="text-lg font-semibold text-gray-900">{loan.itemNo}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">アイテム名</p>
                <p className="text-lg font-semibold text-gray-900">{loan.itemName || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">担当者</p>
                <p className="text-lg font-semibold text-gray-900">{loan.staff}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">ステータス</p>
                <p className="text-lg font-semibold text-gray-900">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      loan.status === 'borrowed'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {loan.status === 'borrowed' ? '貸出中' : '返却済み'}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">貸出日</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(loan.borrowDate)}
                </p>
              </div>

              {loan.returnDate && (
                <div>
                  <p className="text-sm text-gray-600">返却日</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(loan.returnDate)}
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">目的</p>
                <p className="text-lg font-semibold text-gray-900">{loan.purpose}</p>
              </div>

              {loan.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">貸出時の備考</p>
                  <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">{loan.notes}</p>
                </div>
              )}

              {loan.returnNotes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">返却時のメモ</p>
                  <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">{loan.returnNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* メタ情報 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">その他の情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">作成日時</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDateTime(loan.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">更新日時</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDateTime(loan.updatedAt)}
                </p>
              </div>

              {loan.createdBy && (
                <div>
                  <p className="text-sm text-gray-600">作成者</p>
                  <p className="text-lg font-semibold text-gray-900">{loan.createdBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-8 pt-8 border-t flex justify-between">
            <button onClick={() => navigate('/loans')} className="btn-secondary">
              一覧に戻る
            </button>
            <div className="space-x-2">
              {loan.status === 'borrowed' && (
                <button onClick={handleReturnClick} className="btn-secondary">
                  返却処理
                </button>
              )}
              <button onClick={() => navigate(`/loans/${id}`)} className="btn-primary">
                編集
              </button>
            </div>
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

export default LoanDetail
