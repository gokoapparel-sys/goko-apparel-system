import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * HTMLをPDFに変換する共通ユーティリティ
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  filename: string,
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<void> {
  // 一時的なコンテナを作成
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.innerHTML = htmlContent
  document.body.appendChild(container)

  try {
    // A4サイズの設定（mm）
    const a4Width = orientation === 'landscape' ? 297 : 210
    const a4Height = orientation === 'landscape' ? 210 : 297

    // ページ要素を取得
    const pages = container.querySelectorAll('.pdf-page')

    if (pages.length === 0) {
      throw new Error('No pages found with class "pdf-page"')
    }

    // PDFドキュメントを作成
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    })

    // 各ページを処理
    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i] as HTMLElement

      // html2canvasでキャンバスに変換
      const canvas = await html2canvas(pageElement, {
        scale: 2, // 高解像度
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1123, // A4横のピクセル幅を明示的に指定
        height: 794  // A4横のピクセル高さを明示的に指定
      })

      // キャンバスを画像データに変換
      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      // 2ページ目以降は新しいページを追加
      if (i > 0) {
        pdf.addPage()
      }

      // 画像をPDFに追加（A4サイズ全体に引き伸ばす）
      pdf.addImage(imgData, 'JPEG', 0, 0, a4Width, a4Height)
    }

    // PDFをダウンロード
    pdf.save(filename)
  } finally {
    // 一時コンテナを削除
    document.body.removeChild(container)
  }
}
