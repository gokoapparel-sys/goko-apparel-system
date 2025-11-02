import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
} from 'firebase/storage'
import { storage } from './config'

export const storageService = {
  // ファイルアップロード
  async uploadFile(path: string, file: File): Promise<string> {
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  },

  // 複数ファイルアップロード
  async uploadFiles(basePath: string, files: File[]): Promise<string[]> {
    const uploadPromises = files.map((file, index) => {
      const filePath = `${basePath}/${Date.now()}_${index}_${file.name}`
      return this.uploadFile(filePath, file)
    })
    return Promise.all(uploadPromises)
  },

  // ファイル削除
  async deleteFile(fileURL: string): Promise<void> {
    const fileRef = ref(storage, fileURL)
    await deleteObject(fileRef)
  },

  // ディレクトリ内のファイル一覧取得
  async listFiles(path: string): Promise<StorageReference[]> {
    const listRef = ref(storage, path)
    const result = await listAll(listRef)
    return result.items
  },

  // ダウンロードURL取得
  async getDownloadURL(path: string): Promise<string> {
    const fileRef = ref(storage, path)
    return await getDownloadURL(fileRef)
  },
}
