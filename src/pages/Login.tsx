import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setError('')
      setLoading(true)
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="card max-w-md w-full">
        {/* GOKO Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/goko-logo.svg"
            alt="GOKO"
            className="h-10"
          />
        </div>

        <h1 className="text-3xl font-bold text-center mb-1 text-primary-700">
          アパレル商品管理システム
        </h1>
        <p className="text-center text-sm text-gray-600 mb-1">株式会社 互興</p>
        <p className="text-center text-xs text-gray-500 mb-8">GOKO Co.,Ltd.</p>
        <p className="text-center text-gray-600 mb-8 font-semibold">ログイン</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4 text-sm">
          パスワードをお忘れの場合は管理者にお問い合わせください
        </p>
      </div>
    </div>
  )
}

export default Login
