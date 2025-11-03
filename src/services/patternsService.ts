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
import { Pattern } from '../types'
import { v4 as uuidv4 } from 'uuid'

const COLLECTION_NAME = 'patterns'
const ITEMS_PER_PAGE = 20

export interface ListPatternsParams {
  q?: string // 検索クエリ（patternCode, patternName）
  sortBy?: 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  lastDoc?: QueryDocumentSnapshot
  firstDoc?: QueryDocumentSnapshot
  direction?: 'next' | 'prev'
}

export interface ListPatternsResult {
  patterns: Pattern[]
  lastDoc: QueryDocumentSnapshot | null
  firstDoc: QueryDocumentSnapshot | null
  hasMore: boolean
}

export const patternsService = {
  /**
   * 型紙一覧を取得
   */
  async listPatterns(params: ListPatternsParams = {}): Promise<ListPatternsResult> {
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
      let patterns = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pattern[]

      // クライアント側でフィルタリング
      if (q && q.trim()) {
        const searchLower = q.toLowerCase().trim()
        patterns = patterns.filter(
          (pattern) =>
            pattern.patternCode.toLowerCase().includes(searchLower) ||
            pattern.patternName.toLowerCase().includes(searchLower)
        )
      }

      // hasMore の判定
      const hasMore = patterns.length > ITEMS_PER_PAGE
      if (hasMore) {
        patterns = patterns.slice(0, ITEMS_PER_PAGE)
      }

      return {
        patterns,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        firstDoc: querySnapshot.docs[0] || null,
        hasMore,
      }
    } catch (error) {
      console.error('型紙一覧の取得エラー:', error)
      throw error
    }
  },

  /**
   * 型紙を1件取得
   */
  async getPattern(id: string): Promise<Pattern | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Pattern
      }
      return null
    } catch (error) {
      console.error('型紙取得エラー:', error)
      throw error
    }
  },

  /**
   * 型紙を作成
   */
  async createPattern(data: Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // バリデーション
      if (!data.patternCode || !data.patternName) {
        throw new Error('型紙No.と型紙名は必須です')
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      return docRef.id
    } catch (error) {
      console.error('型紙作成エラー:', error)
      throw error
    }
  },

  /**
   * 型紙を更新
   */
  async updatePattern(
    id: string,
    data: Partial<Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      // バリデーション
      if (data.patternCode !== undefined && !data.patternCode) {
        throw new Error('型紙No.は必須です')
      }
      if (data.patternName !== undefined && !data.patternName) {
        throw new Error('型紙名は必須です')
      }

      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('型紙更新エラー:', error)
      throw error
    }
  },

  /**
   * 型紙を削除
   */
  async deletePattern(id: string): Promise<void> {
    try {
      // まずファイルを削除
      const pattern = await this.getPattern(id)
      if (pattern && pattern.files) {
        const fileTypes = ['spec', 'layout', 'data'] as const
        for (const type of fileTypes) {
          const file = pattern.files[type]
          if (file?.fileUrl) {
            try {
              // URLからパスを抽出して削除
              const urlPath = new URL(file.fileUrl).pathname
              const storagePath = decodeURIComponent(urlPath.split('/o/')[1]?.split('?')[0] || '')
              if (storagePath) {
                const fileRef = ref(storage, storagePath)
                await deleteObject(fileRef)
              }
            } catch (error) {
              console.warn(`ファイル削除エラー (${type}):`, error)
            }
          }
        }
      }

      // ドキュメントを削除
      const docRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('型紙削除エラー:', error)
      throw error
    }
  },

  /**
   * ファイルをアップロード
   */
  async uploadFile(
    id: string,
    file: File,
    fileType: 'spec' | 'layout' | 'data'
  ): Promise<void> {
    try {
      const pattern = await this.getPattern(id)
      if (!pattern) {
        throw new Error('型紙が見つかりません')
      }

      // ファイルバリデーション
      if (fileType === 'data') {
        // 型紙データファイル: DXF, AI, CDR, PDF, ZIP など
        const validDataTypes = [
          'application/pdf',
          'application/dxf',
          'application/x-dxf',
          'image/vnd.dxf',
          'application/postscript',  // .ai
          'application/x-coreldraw', // .cdr
          'application/zip',
          'application/x-zip-compressed',
          'application/octet-stream', // 汎用バイナリ
        ]
        const validExtensions = ['.dxf', '.ai', '.cdr', '.pdf', '.zip', '.dwg', '.plt']
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

        if (!validDataTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
          throw new Error('型紙データファイル（DXF, AI, CDR, PDF, ZIP など）をアップロードしてください')
        }
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('ファイルサイズは50MB以下にしてください')
        }
      } else {
        // PDF書類（型紙、仕様書、展開図）
        if (file.type !== 'application/pdf') {
          throw new Error('PDFファイルのみアップロード可能です')
        }
        if (file.size > 20 * 1024 * 1024) {
          throw new Error('ファイルサイズは20MB以下にしてください')
        }
      }

      // 既存ファイルを削除
      if (pattern.files[fileType]?.fileUrl) {
        try {
          const urlPath = new URL(pattern.files[fileType]!.fileUrl).pathname
          const storagePath = decodeURIComponent(urlPath.split('/o/')[1]?.split('?')[0] || '')
          if (storagePath) {
            const fileRef = ref(storage, storagePath)
            await deleteObject(fileRef)
          }
        } catch (error) {
          console.warn('既存ファイル削除エラー:', error)
        }
      }

      // Storage にアップロード
      const fileName = `${uuidv4()}-${file.name}`
      const filePath = `patterns/${id}/${fileType}/${fileName}`
      const downloadURL = await storageService.uploadFile(filePath, file)

      // Firestore を更新
      const updatedFiles = {
        ...pattern.files,
        [fileType]: {
          fileName: file.name,
          fileUrl: downloadURL,
        },
      }

      await this.updatePattern(id, {
        files: updatedFiles,
      })
    } catch (error) {
      console.error('ファイルアップロードエラー:', error)
      throw error
    }
  },

  /**
   * ファイルを削除
   */
  async removeFile(id: string, fileType: 'spec' | 'layout' | 'data'): Promise<void> {
    try {
      const pattern = await this.getPattern(id)
      if (!pattern) {
        throw new Error('型紙が見つかりません')
      }

      // Storage から削除
      if (pattern.files[fileType]?.fileUrl) {
        try {
          const urlPath = new URL(pattern.files[fileType]!.fileUrl).pathname
          const storagePath = decodeURIComponent(urlPath.split('/o/')[1]?.split('?')[0] || '')
          if (storagePath) {
            const fileRef = ref(storage, storagePath)
            await deleteObject(fileRef)
          }
        } catch (error: any) {
          if (error.code !== 'storage/object-not-found') {
            throw error
          }
          console.warn('ファイルが Storage に存在しません')
        }
      }

      // Firestore から削除
      const updatedFiles = { ...pattern.files }
      delete updatedFiles[fileType]

      await this.updatePattern(id, {
        files: updatedFiles,
      })
    } catch (error) {
      console.error('ファイル削除エラー:', error)
      throw error
    }
  },
}
