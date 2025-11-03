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
  limit,
  startAfter,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase/config'
import { Fabric } from '../types'

const COLLECTION_NAME = 'fabrics'
const ITEMS_PER_PAGE = 20

export interface ListFabricsParams {
  q?: string // 検索クエリ（fabricCode, fabricName）
  category?: '布帛' | 'カット' | 'all'
  pattern?: '無地' | '先染' | 'all'
  sortBy?: 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  lastDoc?: QueryDocumentSnapshot
  firstDoc?: QueryDocumentSnapshot
  direction?: 'next' | 'prev'
}

export interface ListFabricsResult {
  fabrics: Fabric[]
  lastDoc: QueryDocumentSnapshot | null
  firstDoc: QueryDocumentSnapshot | null
  hasMore: boolean
}

export const fabricsService = {
  /**
   * 生地一覧を取得
   */
  async listFabrics(params: ListFabricsParams = {}): Promise<ListFabricsResult> {
    const {
      q,
      category = 'all',
      pattern = 'all',
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      lastDoc,
      direction = 'next',
    } = params

    try {
      let q_query = query(
        collection(db, COLLECTION_NAME),
        orderBy(sortBy, sortOrder),
        limit(ITEMS_PER_PAGE + 1)
      )

      // ページネーション
      if (direction === 'next' && lastDoc) {
        q_query = query(
          collection(db, COLLECTION_NAME),
          orderBy(sortBy, sortOrder),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE + 1)
        )
      }

      const querySnapshot = await getDocs(q_query)
      let fabrics = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Fabric[]

      // クライアント側でフィルタリング
      if (q && q.trim()) {
        const searchLower = q.toLowerCase().trim()
        fabrics = fabrics.filter(
          (fabric) =>
            fabric.fabricCode.toLowerCase().includes(searchLower) ||
            fabric.fabricName.toLowerCase().includes(searchLower) ||
            fabric.manufacturer.toLowerCase().includes(searchLower)
        )
      }

      // カテゴリフィルタ
      if (category !== 'all') {
        fabrics = fabrics.filter((f) => f.fabricType.category === category)
      }

      // パターンフィルタ
      if (pattern !== 'all') {
        fabrics = fabrics.filter((f) => f.fabricType.pattern === pattern)
      }

      // hasMore の判定
      const hasMore = fabrics.length > ITEMS_PER_PAGE
      if (hasMore) {
        fabrics = fabrics.slice(0, ITEMS_PER_PAGE)
      }

      return {
        fabrics,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        firstDoc: querySnapshot.docs[0] || null,
        hasMore,
      }
    } catch (error) {
      console.error('生地一覧の取得エラー:', error)
      throw error
    }
  },

  /**
   * 生地を1件取得
   */
  async getFabric(id: string): Promise<Fabric | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Fabric
      }
      return null
    } catch (error) {
      console.error('生地取得エラー:', error)
      throw error
    }
  },

  /**
   * 生地を作成
   */
  async createFabric(data: Omit<Fabric, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // バリデーション
      if (!data.fabricCode || !data.fabricName) {
        throw new Error('生地品番と生地名は必須です')
      }
      if (typeof data.price !== 'number' || data.price < 0) {
        throw new Error('生地値は0以上の数値である必要があります')
      }
      if (!data.fabricType.category || !data.fabricType.pattern) {
        throw new Error('生地タイプ（カテゴリとパターン）は必須です')
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      return docRef.id
    } catch (error) {
      console.error('生地作成エラー:', error)
      throw error
    }
  },

  /**
   * 生地を更新
   */
  async updateFabric(
    id: string,
    data: Partial<Omit<Fabric, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      // バリデーション
      if (data.fabricCode !== undefined && !data.fabricCode) {
        throw new Error('生地品番は必須です')
      }
      if (data.fabricName !== undefined && !data.fabricName) {
        throw new Error('生地名は必須です')
      }
      if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
        throw new Error('生地値は0以上の数値である必要があります')
      }

      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('生地更新エラー:', error)
      throw error
    }
  },

  /**
   * 生地を削除
   */
  async deleteFabric(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('生地削除エラー:', error)
      throw error
    }
  },

  /**
   * 生地品番の重複チェック
   */
  async checkFabricCodeExists(fabricCode: string, excludeId?: string): Promise<boolean> {
    try {
      const fabrics = await this.listFabrics({ q: fabricCode })
      return fabrics.fabrics.some((f) => f.fabricCode === fabricCode && f.id !== excludeId)
    } catch (error) {
      console.error('生地品番チェックエラー:', error)
      return false
    }
  },
}
