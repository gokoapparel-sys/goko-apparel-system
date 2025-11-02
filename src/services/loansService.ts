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
import { Loan } from '../types'

const COLLECTION_NAME = 'loans'

export interface ListLoansParams {
  sortBy?: 'itemNo' | 'staff' | 'borrowDate' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  status?: 'borrowed' | 'returned'
}

export const loansService = {
  // 貸出一覧を取得
  async listLoans(params: ListLoansParams = {}) {
    const { sortBy = 'borrowDate', sortOrder = 'desc', status } = params

    const constraints: QueryConstraint[] = []

    if (status) {
      constraints.push(where('status', '==', status))
    }

    constraints.push(orderBy(sortBy, sortOrder))

    const q = query(collection(db, COLLECTION_NAME), ...constraints)
    const snapshot = await getDocs(q)

    const loans: Loan[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Loan[]

    return {
      loans,
      total: loans.length,
    }
  },

  // 貸出を1件取得
  async getLoan(id: string): Promise<Loan | null> {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Loan
  },

  // 貸出を新規作成
  async createLoan(data: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  // 貸出を更新
  async updateLoan(
    id: string,
    data: Partial<Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })
  },

  // 貸出を削除
  async deleteLoan(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  },

  // 返却処理
  async returnLoan(id: string, returnNotes?: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      status: 'returned',
      returnDate: Timestamp.now(),
      returnNotes: returnNotes || '',
      updatedAt: Timestamp.now(),
    })
  },
}
