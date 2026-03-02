import { Timestamp } from 'firebase/firestore'

// ユーザー型
export interface User {
  id: string
  email: string
  displayName: string
  role: 'admin' | 'user'
  createdAt: Timestamp
  updatedAt: Timestamp
}

// アイテム型（簡易版 - CRUD 用）
export interface Item {
  id?: string
  itemNo: string // アイテムNo.
  name: string
  sku: string // 旧フィールド（後方互換性のため残す）
  fabricNo?: string // 生地No.
  fabricName?: string // 生地名
  composition?: string // 混率
  fabricSpec?: string // 生地規格（規格、目付、生産/市場生地など）
  price?: number // 価格（後方互換性のため残す）
  dollarPrice?: number // ＄単価
  moq?: string // 単価枚数条件
  referencePrice?: number // 売単価（参考）
  factory?: string // 工場名
  sizeOptions?: string // サイズ展開（カンマ区切り）- 後方互換性のため残す
  colorOptions?: string // 色展開（カンマ区切り）- 後方互換性のため残す
  color?: string // 旧フィールド（後方互換性のため残す）
  size?: string // 旧フィールド（後方互換性のため残す）
  status: 'active' | 'archived'
  patternId?: string  // 型紙ID（紐付け）
  patternNo?: string // 型紙No.（表示用）
  appealPoint?: string // アピールポイント
  images?: {
    url: string
    path: string
  }[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
  createdBy?: string
  plannerId?: string // 企画担当者ID
}

// アイテム型（詳細版 - 将来の拡張用）
export interface ItemDetailed {
  id?: string
  itemCode: string
  itemName: string
  brandId: string
  category: string
  season: string
  pricing: {
    dollarPrice: number
    costPrice: number
    sellingPrice: number
    lotCondition: string
  }
  mainFabricId: string
  patternId: string
  production: {
    factory: string
    moq: number
    leadTime: string
  }
  images: string[]
  status: 'active' | 'inactive'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// 生地型
export interface Fabric {
  id?: string
  fabricCode: string
  fabricName: string
  composition: string
  price: number
  manufacturer: string
  fabricType: {
    category: '布帛' | 'カット'
    pattern: '無地' | '先染'
  }
  managerId: string
  status: 'active' | 'inactive'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// 型紙型
export interface Pattern {
  id?: string
  patternCode: string
  patternName: string
  files: {
    spec?: Array<{  // 複数の仕様書対応（新形式）
      id: string  // 個別ファイルの識別用
      fileName: string
      fileUrl: string
      uploadedAt: Timestamp
    }> | {  // 単一の仕様書（旧形式：後方互換性）
      fileName: string
      fileUrl: string
    }
    layout?: {
      fileName: string
      fileUrl: string
    }
    data?: {  // 型紙データファイル（DXF, AI, CDR など）
      fileName: string
      fileUrl: string
    }
  }
  managerId: string
  status: 'active' | 'inactive'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// ブランド型
export interface Brand {
  id?: string
  brandCode: string
  brandName: string
  description?: string
  status: 'active' | 'inactive'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// 展示会型
export interface Exhibition {
  id?: string
  exhibitionCode: string
  exhibitionName: string
  startDate: Timestamp
  endDate: Timestamp
  location: string
  description?: string
  status: 'planning' | 'active' | 'completed'
  catalogItemIds?: string[] // カタログに含めるアイテムのID配列
  labelSize?: {
    width: number // 横幅（mm）
    height: number // 縦幅（mm）
  }
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// サンプル貸出型
export interface Loan {
  id?: string
  itemId: string
  itemNo: string // 品番
  itemName?: string // アイテム名（表示用）
  staff: string // 担当者
  borrowDate: Timestamp
  returnDate?: Timestamp
  returnNotes?: string // 返却時のメモ
  purpose: string
  status: 'borrowed' | 'returned'
  notes?: string // 貸出時の備考
  createdAt?: Timestamp
  updatedAt?: Timestamp
  createdBy?: string
}

// ピックアップリスト型
export interface Pickup {
  id?: string
  pickupCode: string
  customerName: string
  exhibitionId: string
  exhibitionName?: string // 表示用
  itemIds?: string[] // 選択されたアイテムのID配列（オプショナル）
  createdDate: Timestamp
  shareUrl?: string
  status: 'active' | 'archived'
  createdAt?: Timestamp
  updatedAt?: Timestamp
  createdBy?: string
}
