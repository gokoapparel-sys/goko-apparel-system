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
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase/config'
import { storageService } from './firebase/storage'
import { Item } from '../types'
import { v4 as uuidv4 } from 'uuid'

const COLLECTION_NAME = 'items'
const ITEMS_PER_PAGE = 20

/**
 * Firestoreのデータを安全にItem型に変換
 */
function toItem(id: string, d: any): Item {
  const priceNum =
    typeof d?.price === 'number'
      ? d.price
      : Number.isFinite(Number(d?.price))
        ? Number(d.price)
        : 0

  const dollarPriceNum =
    typeof d?.dollarPrice === 'number'
      ? d.dollarPrice
      : Number.isFinite(Number(d?.dollarPrice))
        ? Number(d.dollarPrice)
        : undefined

  const referencePriceNum =
    typeof d?.referencePrice === 'number'
      ? d.referencePrice
      : Number.isFinite(Number(d?.referencePrice))
        ? Number(d.referencePrice)
        : undefined

  return {
    id,
    itemNo: String(d?.itemNo ?? d?.sku ?? ''),
    name: String(d?.name ?? ''),
    sku: String(d?.sku ?? ''),
    fabricNo: d?.fabricNo ? String(d.fabricNo) : undefined,
    fabricName: d?.fabricName ? String(d.fabricName) : undefined,
    composition: d?.composition ? String(d.composition) : undefined,
    fabricSpec: d?.fabricSpec ? String(d.fabricSpec) : undefined,
    price: priceNum,
    dollarPrice: dollarPriceNum,
    moq: d?.moq ? String(d.moq) : undefined,
    referencePrice: referencePriceNum,
    factory: d?.factory ? String(d.factory) : undefined,
    sizeOptions: d?.sizeOptions ? String(d.sizeOptions) : undefined,
    colorOptions: d?.colorOptions ? String(d.colorOptions) : undefined,
    color: d?.color ? String(d.color) : undefined,
    size: d?.size ? String(d.size) : undefined,
    status: (d?.status === 'active' || d?.status === 'archived') ? d.status : 'active',
    patternId: d?.patternId ? String(d.patternId) : undefined,
    patternNo: d?.patternNo ? String(d.patternNo) : undefined,
    appealPoint: d?.appealPoint ? String(d.appealPoint) : undefined,
    images: Array.isArray(d?.images) ? d.images.filter(Boolean) : [],
    createdAt: d?.createdAt?.toDate?.() instanceof Date ? d.createdAt.toDate() : d?.createdAt instanceof Date ? d.createdAt : undefined,
    updatedAt: d?.updatedAt?.toDate?.() instanceof Date ? d.updatedAt.toDate() : d?.updatedAt instanceof Date ? d.updatedAt : undefined,
    createdBy: d?.createdBy ? String(d.createdBy) : undefined,
    plannerId: d?.plannerId ? String(d.plannerId) : undefined,
  }
}

export interface ListItemsParams {
  q?: string // 検索クエリ（name, sku）
  status?: 'active' | 'archived' // アイテムのステータスでフィルター
  sortBy?: 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  lastDoc?: QueryDocumentSnapshot
  firstDoc?: QueryDocumentSnapshot
  direction?: 'next' | 'prev'
}

export interface ListItemsResult {
  items: Item[]
  lastDoc: QueryDocumentSnapshot | null
  firstDoc: QueryDocumentSnapshot | null
  hasMore: boolean
}

export const itemsService = {
  /**
   * 全てのアイテムを取得（ページネーションなし）
   */
  async listAllItems(params: { status?: 'active' | 'archived' } = {}): Promise<Item[]> {
    const { status } = params

    try {
      let q_query = query(
        collection(db, COLLECTION_NAME),
        orderBy('updatedAt', 'desc')
      )

      const querySnapshot = await getDocs(q_query)
      let items = querySnapshot.docs.map((doc) => toItem(doc.id, doc.data()))

      // ステータスでフィルタリング
      if (status) {
        items = items.filter((item) => item.status === status)
      }

      return items
    } catch (error) {
      console.error('全アイテム取得エラー:', error)
      throw error
    }
  },

  /**
   * アイテム一覧を取得
   */
  async listItems(params: ListItemsParams = {}): Promise<ListItemsResult> {
    const {
      q,
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
      let items = querySnapshot.docs.map((doc) => toItem(doc.id, doc.data()))

      // クライアント側で検索フィルタリング（Firestore の制限のため）
      if (q && q.trim()) {
        const searchLower = q.toLowerCase().trim()
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchLower) ||
            item.sku.toLowerCase().includes(searchLower)
        )
      }

      // hasMore の判定
      const hasMore = items.length > ITEMS_PER_PAGE
      if (hasMore) {
        items = items.slice(0, ITEMS_PER_PAGE)
      }

      return {
        items,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        firstDoc: querySnapshot.docs[0] || null,
        hasMore,
      }
    } catch (error) {
      console.error('アイテム一覧の取得エラー:', error)
      throw error
    }
  },

  /**
   * アイテムを1件取得
   */
  async getItem(id: string): Promise<Item | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return toItem(docSnap.id, docSnap.data())
      }
      return null
    } catch (error) {
      console.error('アイテム取得エラー:', error)
      throw error
    }
  },

  /**
   * 複数のアイテムをID指定で取得
   */
  async getItemsByIds(ids: string[]): Promise<Item[]> {
    if (!ids || ids.length === 0) return []

    try {
      // 10個ずつのチャンクに分けて並列取得（Firestoreの制限回避とパフォーマンス最適化）
      const chunkSize = 10
      const chunks = []

      for (let i = 0; i < ids.length; i += chunkSize) {
        chunks.push(ids.slice(i, i + chunkSize))
      }

      const results = await Promise.all(
        chunks.map(async (chunkIds) => {
          const promises = chunkIds.map(id => this.getItem(id))
          return await Promise.all(promises)
        })
      )

      // nullを除外してフラット化
      return results.flat().filter((item): item is Item => item !== null)
    } catch (error) {
      console.error('複数アイテム取得エラー:', error)
      throw error
    }
  },

  /**
   * アイテムを作成
   */
  async createItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // バリデーション
      if (!data.name || !data.sku) {
        throw new Error('名前とSKUは必須です')
      }
      // 価格バリデーション（オプショナルフィールド）
      if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
        throw new Error('価格は0以上の数値である必要があります')
      }
      if (data.dollarPrice !== undefined && (typeof data.dollarPrice !== 'number' || data.dollarPrice < 0)) {
        throw new Error('＄単価は0以上の数値である必要があります')
      }
      if (data.referencePrice !== undefined && (typeof data.referencePrice !== 'number' || data.referencePrice < 0)) {
        throw new Error('参考売値は0以上の数値である必要があります')
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      return docRef.id
    } catch (error) {
      console.error('アイテム作成エラー:', error)
      throw error
    }
  },

  /**
   * アイテムを更新
   */
  async updateItem(
    id: string,
    data: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      // バリデーション
      if (data.name !== undefined && !data.name) {
        throw new Error('名前は必須です')
      }
      if (data.sku !== undefined && !data.sku) {
        throw new Error('SKUは必須です')
      }
      // 価格バリデーション（オプショナルフィールド）
      if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
        throw new Error('価格は0以上の数値である必要があります')
      }
      if (data.dollarPrice !== undefined && (typeof data.dollarPrice !== 'number' || data.dollarPrice < 0)) {
        throw new Error('＄単価は0以上の数値である必要があります')
      }
      if (data.referencePrice !== undefined && (typeof data.referencePrice !== 'number' || data.referencePrice < 0)) {
        throw new Error('参考売値は0以上の数値である必要があります')
      }

      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('アイテム更新エラー:', error)
      throw error
    }
  },

  /**
   * アイテムを削除
   */
  async deleteItem(id: string): Promise<void> {
    try {
      // まず画像を削除
      const item = await this.getItem(id)
      if (item && item.images && item.images.length > 0) {
        for (const image of item.images) {
          try {
            await this.removeImage(id, image.path)
          } catch (error) {
            console.warn(`画像の削除に失敗: ${image.path}`, error)
          }
        }
      }

      // ドキュメントを削除
      const docRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('アイテム削除エラー:', error)
      throw error
    }
  },

  /**
   * 画像をアップロードして、アイテムに追加
   */
  async attachImages(id: string, files: File[]): Promise<void> {
    try {
      const item = await this.getItem(id)
      if (!item) {
        throw new Error('アイテムが見つかりません')
      }

      const uploadedImages: { url: string; path: string }[] = []

      for (const file of files) {
        // ファイルバリデーション
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!validImageTypes.includes(file.type)) {
          throw new Error(`無効なファイル形式: ${file.name}`)
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`ファイルサイズが大きすぎます: ${file.name}（最大10MB）`)
        }

        // Storage にアップロード
        const fileName = `${uuidv4()}-${file.name}`
        const filePath = `items/${id}/${fileName}`
        const downloadURL = await storageService.uploadFile(filePath, file)

        uploadedImages.push({
          url: downloadURL,
          path: filePath,
        })
      }

      // Firestore を更新
      const existingImages = item.images || []
      await this.updateItem(id, {
        images: [...existingImages, ...uploadedImages],
      })
    } catch (error) {
      console.error('画像アップロードエラー:', error)
      throw error
    }
  },

  /**
   * 画像を削除
   */
  async removeImage(id: string, path: string): Promise<void> {
    try {
      const item = await this.getItem(id)
      if (!item) {
        throw new Error('アイテムが見つかりません')
      }

      // Storage から削除
      try {
        const fileRef = ref(storage, path)
        await deleteObject(fileRef)
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          throw error
        }
        console.warn('画像が Storage に存在しません:', path)
      }

      // Firestore から削除
      const updatedImages = (item.images || []).filter((img) => img.path !== path)
      await this.updateItem(id, {
        images: updatedImages,
      })
    } catch (error) {
      console.error('画像削除エラー:', error)
      throw error
    }
  },
}
