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
import { Exhibition } from '../types'

const COLLECTION_NAME = 'exhibitions'

export interface ListExhibitionsParams {
  sortBy?: 'exhibitionCode' | 'exhibitionName' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  status?: 'planning' | 'active' | 'completed'
}

export const exhibitionsService = {
  // 展示会一覧を取得
  async listExhibitions(params: ListExhibitionsParams = {}) {
    const { sortBy = 'startDate', sortOrder = 'desc', status } = params

    const constraints: QueryConstraint[] = []

    if (status) {
      constraints.push(where('status', '==', status))
    }

    constraints.push(orderBy(sortBy, sortOrder))

    const q = query(collection(db, COLLECTION_NAME), ...constraints)
    const snapshot = await getDocs(q)

    const exhibitions: Exhibition[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Exhibition[]

    return {
      exhibitions,
      total: exhibitions.length,
    }
  },

  // 展示会を1件取得
  async getExhibition(id: string): Promise<Exhibition | null> {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Exhibition
  },

  // 展示会を新規作成
  async createExhibition(data: Omit<Exhibition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  // 展示会を更新
  async updateExhibition(
    id: string,
    data: Partial<Omit<Exhibition, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })
  },

  // 展示会を削除
  async deleteExhibition(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  },
}
