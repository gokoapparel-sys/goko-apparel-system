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

  // ピックアップコードを自動生成（重複チェック付き）
  async generatePickupCode(exhibitionId: string): Promise<string> {
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

    // 既存のピックアップリストを取得
    const q = query(collection(db, COLLECTION_NAME))
    const snapshot = await getDocs(q)

    // この展示会の既存ピックアップコードから最大連番を取得
    const filteredDocs = snapshot.docs.filter(
      doc => doc.data().exhibitionId === exhibitionId
    )

    // 既存のコードから連番を抽出して最大値を取得
    let maxNumber = 0
    const codePrefix = `PU-${exhibitionCode}-`

    filteredDocs.forEach(doc => {
      const pickupCode = doc.data().pickupCode
      if (pickupCode && pickupCode.startsWith(codePrefix)) {
        const numberPart = pickupCode.replace(codePrefix, '')
        const num = parseInt(numberPart, 10)
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num
        }
      }
    })

    // 最大連番+1から開始して、重複しないコードを探す（最大100回試行）
    for (let i = 1; i <= 100; i++) {
      const candidateNumber = maxNumber + i
      const candidateCode = `${codePrefix}${String(candidateNumber).padStart(3, '0')}`

      // このコードが既に存在するかチェック
      const isDuplicate = snapshot.docs.some(
        doc => doc.data().pickupCode === candidateCode
      )

      if (!isDuplicate) {
        // 重複していないコードが見つかった
        return candidateCode
      }
    }

    // 100回試行しても見つからない場合はタイムスタンプを追加
    const timestamp = Date.now().toString().slice(-4)
    return `${codePrefix}${String(maxNumber + 1).padStart(3, '0')}-${timestamp}`
  },

  // ピックアップリストを新規作成
  async createPickup(
    data: Omit<Pickup, 'id' | 'pickupCode' | 'createdAt' | 'updatedAt'>,
    customPickupCode?: string
  ): Promise<string> {
    const now = Timestamp.now()

    let pickupCode: string

    if (customPickupCode) {
      // カスタムコードが指定された場合は重複チェック
      const q = query(collection(db, COLLECTION_NAME))
      const snapshot = await getDocs(q)

      const isDuplicate = snapshot.docs.some(
        doc => doc.data().pickupCode === customPickupCode
      )

      if (isDuplicate) {
        throw new Error(`ピックアップコード「${customPickupCode}」は既に使用されています。別のコードを入力してください。`)
      }

      pickupCode = customPickupCode
    } else {
      // 自動生成
      pickupCode = await this.generatePickupCode(data.exhibitionId)
    }

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
