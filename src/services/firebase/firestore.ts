import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'

export const firestoreService = {
  // ドキュメント取得
  async getDocument(collectionName: string, docId: string): Promise<DocumentData | null> {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  },

  // コレクション全件取得
  async getCollection(collectionName: string): Promise<DocumentData[]> {
    const querySnapshot = await getDocs(collection(db, collectionName))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  // クエリ実行
  async queryDocuments(
    collectionName: string,
    ...constraints: QueryConstraint[]
  ): Promise<DocumentData[]> {
    const q = query(collection(db, collectionName), ...constraints)
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  // ドキュメント追加
  async addDocument(collectionName: string, data: DocumentData): Promise<string> {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  },

  // ドキュメント更新
  async updateDocument(
    collectionName: string,
    docId: string,
    data: Partial<DocumentData>
  ): Promise<void> {
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })
  },

  // ドキュメント削除
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(db, collectionName, docId)
    await deleteDoc(docRef)
  },
}

// クエリヘルパー
export { where, orderBy, limit }
