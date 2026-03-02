import { Item, Exhibition } from '../../types'

interface StaffCatalogHTMLProps {
  exhibition: Exhibition
  items: Item[]
  imageBase64Map?: Record<string, string> // 画像URLをbase64データURLにマッピング
}

export function generateStaffCatalogHTML({ exhibition, items, imageBase64Map }: StaffCatalogHTMLProps): string {
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return ''
    let date: Date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      return ''
    }
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // ページごとにアイテムを分割
  // 全てのページにヘッダーがあるため、全ページ10アイテムずつ（5列×2段）
  const itemsPerPage = 10
  const pages: Item[][] = []

  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage))
  }

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Hiragino Kaku Gothic Pro', 'メイリオ', 'MS PGothic', sans-serif;
        }

        .pdf-page {
          width: 1123px;
          height: 794px;
          position: relative;
          background: white;
          page-break-after: always;
        }

        /* 表紙スタイル */
        .cover-page {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
          overflow: hidden;
          position: relative;
        }

        .cover-page::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
          border-radius: 50%;
        }

        .cover-page::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%);
          border-radius: 50%;
        }

        .cover-content {
          text-align: center;
          color: white;
          position: relative;
          z-index: 1;
        }

        .cover-logo {
          width: 240px;
          height: 60px;
          background: linear-gradient(to right, #fbbf24, #f59e0b);
          margin: 0 auto 40px;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          font-size: 36px;
          font-weight: 900;
          color: #0f172a;
          box-shadow: 0 10px 30px rgba(251, 191, 36, 0.4);
          letter-spacing: 6px;
          line-height: 1;
          padding-top: 3px;
        }

        .cover-company {
          font-size: 16px;
          margin-bottom: 80px;
          opacity: 0.95;
          letter-spacing: 2px;
          color: white;
          text-align: center;
          line-height: 1.5;
        }

        .cover-title {
          font-size: 56px;
          font-weight: bold;
          margin-bottom: 25px;
          text-shadow: 3px 3px 6px rgba(0,0,0,0.4);
          line-height: 1.2;
          letter-spacing: 2px;
        }

        .cover-subtitle {
          font-size: 28px;
          margin-bottom: 50px;
          opacity: 0.95;
          font-weight: 300;
          letter-spacing: 3px;
        }

        .cover-info {
          font-size: 16px;
          margin-bottom: 12px;
          line-height: 1.8;
          opacity: 0.9;
        }

        .cover-badge {
          display: inline-block;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          color: white;
          padding: 14px 40px;
          border-radius: 30px;
          margin-top: 20px;
          font-size: 16px;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 8px 20px rgba(220, 38, 38, 0.4);
          letter-spacing: 1px;
        }

        .cover-footer {
          position: absolute;
          bottom: 30px;
          text-align: center;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
        }

        /* コンテンツページスタイル */
        .content-page {
          padding: 15px 20px;
          background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
        }

        .page-header {
          margin-bottom: 8px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
          border-radius: 6px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
          text-align: center;
        }

        .page-title {
          font-size: 20px;
          font-weight: bold;
          color: white;
          margin-bottom: 6px;
          letter-spacing: 1px;
        }

        .page-subtitle {
          font-size: 12px;
          color: #cbd5e1;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }

        .item-card {
          border: none;
          padding: 6px;
          border-radius: 8px;
          background: white;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.12);
          transition: transform 0.2s;
          position: relative;
          overflow: hidden;
        }

        .item-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(to right, #2563eb, #fbbf24);
        }

        .item-image {
          width: 100%;
          height: 130px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 8px;
          margin-bottom: 4px;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .item-image img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
        }

        .item-no {
          font-size: 16px;
          font-weight: bold;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
          padding-bottom: 3px;
          border-bottom: 1px solid #e2e8f0;
          text-align: center;
        }

        .item-name {
          font-size: 11px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
          line-height: 1.3;
          min-height: 22px;
          text-align: center;
        }

        .item-field {
          font-size: 9px;
          margin-bottom: 3px;
          line-height: 1.4;
        }

        .field-label {
          display: inline-block;
          min-width: 65px;
          font-weight: bold;
          color: #64748b;
        }

        .field-value {
          color: #1e293b;
        }

        .page-footer {
          position: absolute;
          bottom: 20px;
          left: 40px;
          right: 40px;
          text-align: center;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          color: #999;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <!-- 表紙 -->
      <div class="pdf-page cover-page">
        <div class="cover-content">
          <div class="cover-logo">GOKO</div>
          <div class="cover-company">株式会社 互興 | GOKO Co.,Ltd.</div>
          <div class="cover-title">${exhibition.exhibitionName}</div>
          <div class="cover-subtitle">管理者用カタログ</div>
          <div class="cover-info">期間: ${formatDate(exhibition.startDate)} - ${formatDate(exhibition.endDate)}</div>
          <div class="cover-info">会場: ${exhibition.location}</div>
          <div class="cover-badge">社外秘 - Internal Use Only</div>
        </div>
        <div class="cover-footer">株式会社 互興 アパレル商品管理システム</div>
      </div>

      <!-- 商品ページ -->
      ${pages.map((pageItems, pageIndex) => `
        <div class="pdf-page content-page">
          <div class="page-header">
            <div class="page-title">${exhibition.exhibitionName} - 管理者用カタログ</div>
            <div class="page-subtitle">${formatDate(exhibition.startDate)} - ${formatDate(exhibition.endDate)} / ${exhibition.location}</div>
          </div>

          <div class="items-grid">
            ${pageItems.map(item => `
              <div class="item-card">
                <div class="item-image">
                  ${(() => {
      if (item.images && item.images.length > 0) {
        const imageUrl = item.images[0].url
        const base64Image = imageBase64Map && imageBase64Map[imageUrl]

        if (base64Image && base64Image.startsWith('data:image/')) {
          return `<img src="${base64Image}" alt="${item.name}" />`
        } else {
          console.warn('画像データが見つかりません:', item.itemNo, imageUrl)
          return '<div style="color: #999; font-size: 11px;">画像なし</div>'
        }
      } else {
        return '<div style="color: #999; font-size: 11px;">画像なし</div>'
      }
    })()}
                </div>
                <div class="item-no">${item.itemNo}</div>
                <div class="item-name">${item.name.replace(/[\s\u3000]+/g, '<br />')}</div>
                <div class="item-field">
                  <span class="field-label">混率:</span>
                  <span class="field-value">${item.composition || '-'}</span>
                </div>
                <div class="item-field">
                  <span class="field-label">生地No.:</span>
                  <span class="field-value">${item.fabricNo || '-'}</span>
                </div>
                <div class="item-field">
                  <span class="field-label">$単価:</span>
                  <span class="field-value">${item.dollarPrice ? `$${item.dollarPrice}` : '-'}</span>
                </div>
                <div class="item-field">
                  <span class="field-label">参考売値:</span>
                  <span class="field-value">${item.referencePrice ? `${item.referencePrice.toLocaleString()}円` : '-'}</span>
                </div>
                <div class="item-field">
                  <span class="field-label">工場:</span>
                  <span class="field-value">${item.factory || '-'}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="page-footer">
            株式会社 互興 GOKO Co.,Ltd. | ページ ${pageIndex + 2} / ${pages.length + 1} | 管理者用（社外秘）
          </div>
        </div>
      `).join('')}
    </body>
    </html>
  `
}
