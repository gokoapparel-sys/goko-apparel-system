import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth'
import { auth } from './config'

export const authService = {
  // ユーザー登録
  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(userCredential.user, { displayName })
    }
    return userCredential.user
  },

  // ログイン
  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  },

  // ログアウト
  async signOut(): Promise<void> {
    await signOut(auth)
  },

  // パスワードリセットメール送信
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email)
  },

  // 現在のユーザーを取得
  getCurrentUser(): User | null {
    return auth.currentUser
  },
}
