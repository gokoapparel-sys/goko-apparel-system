import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase/config'
import { Pickup } from '../types'

const COLLECTION_NAME = 'pickups'

export interface ListPickupsParams {
  sortBy?: 'pickupCode' | 'customerName' | 'createdDate' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  status?: 'active' | 'archived'
  exhibitionId?: string
}

export const pickupsService = {
  // ピックアップリスト一覧を取得
  async listPickups(params: ListPickupsParams = {}) {
    const { sortBy = 'createdDate', sortOrder = 'desc', status, exhibitionId } = params

    const constraints: QueryConstraint[] = []

    if (status) {
      constraints.push(where('status', '==', status))
    }

    if (exhibitionId) {
      constraints.push(where('exhibitionId', '==', exhibitionId))
    }

    // exhibitionIdが指定されている場合はorderByを使わない（複合インデックス不要）
    // クライアント側でソートする
    if (!exhibitionId) {
      constraints.push(orderBy(sortBy, sortOrder))
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints)
    const snapshot = await getDocs(q)

    let pickups: Pickup[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Pickup[]

    // exhibitionIdが指定されている場合はクライアント側でソート
    if (exhibitionId) {
      pickups = pickups.sort((a, b) => {
        const aValue = a[sortBy as keyof Pickup]
        const bValue = b[sortBy as keyof Pickup]

        // Timestamp型の比較
        if (aValue && bValue && typeof aValue === 'object' && 'toDate' in aValue) {
          const aDate = (aValue as any).toDate()
          const bDate = (bValue as any).toDate()
          return sortOrder === 'asc' ? aDate - bDate : bDate - aDate
        }

        // 文字列の比較
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        return 0
      })
    }

    return {
      pickups,
      total: pickups.length,
    }
  },

  // ピックアップリストを1件取得
  async getPickup(id: string): Promise<Pickup | null> {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Pickup
  },

  // ピックアップコードを自動生成
  async generatePickupCode(exhibitionId: string): Promise<string> {
    // 既存のピックアップリストを取得して連番を決定
    // whereとorderByを同時に使うとインデックスが必要になるため、
    // 全件取得してフィルタリング
    const q = query(collection(db, COLLECTION_NAME))
    const snapshot = await getDocs(q)

    // クライアント側でフィルタリング
    const filteredDocs = snapshot.docs.filter(
      doc => doc.data().exhibitionId === exhibitionId
    )
    const count = filteredDocs.length + 1

    // 展示会情報を取得
    let exhibitionCode = 'EX'
    try {
      const exhibitionDoc = await getDoc(doc(db, 'exhibitions', exhibitionId))
      if (exhibitionDoc.exists()) {
        const data = exhibitionDoc.data()
        exhibitionCode = data.exhibitionCode || data.exhibitionName || 'EX'
      }
    } catch (error) {
      console.error('展示会情報の取得エラー:', error)
    }

    // フォーマット: PU-{展示会コード}-{3桁連番}
    return `PU-${exhibitionCode}-${String(count).padStart(3, '0')}`
  },

  // ピックアップリストを新規作成
  async createPickup(
    data: Omit<Pickup, 'id' | 'pickupCode' | 'createdAt' | 'updatedAt'>,
    customPickupCode?: string
  ): Promise<string> {
    const now = Timestamp.now()

    // ピックアップコードを自動生成（カスタムコードが指定されていない場合）
    const pickupCode = customPickupCode || await this.generatePickupCode(data.exhibitionId)

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      pickupCode,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  // ピックアップリストを更新
  async updatePickup(
    id: string,
    data: Partial<Omit<Pickup, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })
  },

  // ピックアップリストを削除
  async deletePickup(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  },

  // 共有URLを生成
  generateShareUrl(pickupId: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/pickup/${pickupId}`
  },
}
