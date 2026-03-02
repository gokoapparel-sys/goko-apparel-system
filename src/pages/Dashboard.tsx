import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Dashboard: React.FC = () => {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center min-h-[5rem] py-2">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img src="/goko-logo.svg" alt="GOKO" className="h-5 sm:h-6" />
              <div>
                <h1 className="text-sm sm:text-xl font-black text-gray-900 tracking-tight whitespace-nowrap">
                  アパレル商品管理システム
                </h1>
                <p className="text-xs text-gray-600 font-medium">GOKO Co.,Ltd.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-6">
              <span className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block">{currentUser?.email}</span>
              <div className="h-10 w-px bg-gray-300 hidden sm:block"></div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg text-xs sm:text-base whitespace-nowrap"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* アイテム管理 */}
          <div
            onClick={() => navigate('/items')}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border border-slate-500"
          >
            <h2 className="text-lg font-bold text-cyan-300 mb-1">アイテム管理</h2>
            <p className="text-slate-200 text-xs">商品情報の登録・編集・検索</p>
          </div>

          {/* 展示会管理 */}
          <div
            onClick={() => navigate('/exhibitions')}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border border-slate-500"
          >
            <h2 className="text-lg font-bold text-cyan-300 mb-1">展示会管理</h2>
            <p className="text-slate-200 text-xs">展示会の管理とカタログ作成</p>
          </div>

          {/* ピックアップリスト */}
          <div
            onClick={() => navigate('/pickups')}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border border-slate-500"
          >
            <h2 className="text-lg font-bold text-cyan-300 mb-1">ピックアップリスト</h2>
            <p className="text-slate-200 text-xs">展示会での商品選定とWeb共有</p>
          </div>

          {/* 生地マスタ */}
          <div
            onClick={() => navigate('/fabrics')}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border border-emerald-500"
          >
            <h2 className="text-lg font-bold text-amber-300 mb-1">生地マスタ</h2>
            <p className="text-emerald-100 text-xs">生地情報の一元管理</p>
          </div>

          {/* 型紙マスタ */}
          <div
            onClick={() => navigate('/patterns')}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border border-emerald-500"
          >
            <h2 className="text-lg font-bold text-amber-300 mb-1">型紙マスタ</h2>
            <p className="text-emerald-100 text-xs">型紙・仕様書・展開図の管理</p>
          </div>

          {/* 画像アップロード */}
          <div
            onClick={() => navigate('/uploads')}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border border-emerald-500"
          >
            <h2 className="text-lg font-bold text-amber-300 mb-1">画像アップロード</h2>
            <p className="text-emerald-100 text-xs">商品画像のアップロードと管理</p>
          </div>

          {/* サンプル貸出 */}
          <div
            onClick={() => navigate('/loans')}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border border-gray-400"
          >
            <h2 className="text-lg font-bold text-blue-200 mb-1">サンプル貸出</h2>
            <p className="text-gray-100 text-xs">貸出・返却のシンプルな管理</p>
          </div>

          {/* ピックアップランキング */}
          <div
            onClick={() => navigate('/pickup-rankings')}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border border-slate-500"
          >
            <h2 className="text-lg font-bold text-cyan-300 mb-1">ピックアップランキング</h2>
            <p className="text-slate-200 text-xs">人気アイテムのランキング分析</p>
          </div>
        </div>

        <div className="mt-8 card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ようこそ</h2>
          <p className="text-gray-700">
            アパレル商品管理システムにログインしました。
            <br />
            各機能のカードをクリックして開始してください。
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>初期設定:</strong> Firebaseの設定が完了し、認証機能が動作しています。
              <br />
              次のステップでは、各マスタデータの登録と管理機能を実装していきます。
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
