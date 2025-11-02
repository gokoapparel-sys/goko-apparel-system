import QRCode from 'qrcode'

/**
 * QRコードをData URLとして生成
 * @param text QRコードに埋め込むテキスト（URL等）
 * @param options オプション設定
 * @returns Data URL (画像として使用可能)
 */
export const generateQRCodeDataURL = async (
  text: string,
  options?: {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
  }
): Promise<string> => {
  try {
    const dataURL = await QRCode.toDataURL(text, {
      width: options?.width || 200,
      margin: options?.margin || 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#ffffff',
      },
    })
    return dataURL
  } catch (error) {
    console.error('QRコード生成エラー:', error)
    throw error
  }
}

/**
 * ピックアップセッション開始用URLを生成
 * @param exhibitionId 展示会ID
 * @returns セッション開始URL
 */
export const generatePickupSessionURL = (exhibitionId: string): string => {
  const baseURL = window.location.origin
  return `${baseURL}/pickup-session-start?ex=${exhibitionId}`
}

/**
 * アイテムスキャン用URLを生成
 * @param itemId アイテムID
 * @param exhibitionId 展示会ID
 * @returns アイテムスキャンURL
 */
export const generateItemScanURL = (itemId: string, exhibitionId: string): string => {
  const baseURL = window.location.origin
  return `${baseURL}/scan-item/${itemId}?ex=${exhibitionId}`
}

/**
 * ピックアップリスト用QRコードURL生成
 * @param pickupCode ピックアップコード
 * @returns ピックアップリスト直接開始URL
 */
export const generatePickupDirectURL = (pickupCode: string): string => {
  const baseURL = window.location.origin
  return `${baseURL}/pickup-session-direct/${pickupCode}`
}
