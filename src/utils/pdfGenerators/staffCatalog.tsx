import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { Item, Exhibition } from '../../types'

// 日本語フォント登録
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf'
})

// PDFスタイル定義
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'NotoSansJP',
  },
  header: {
    marginBottom: 20,
    borderBottom: '3pt solid #1a56db',
    paddingBottom: 12,
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 45,
    height: 11,
    marginRight: 8,
  },
  companyInfo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 7,
    color: '#666',
    lineHeight: 1.4,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
    lineHeight: 1.3,
    color: '#1a56db',
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  itemContainer: {
    width: '48%',
    marginBottom: 15,
    marginRight: '2%',
    padding: 14,
    border: '2pt solid #1a56db',
    backgroundColor: '#f0f7ff',
    borderRadius: 6,
  },
  itemImage: {
    width: '100%',
    height: 150,
    objectFit: 'contain',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  itemInfo: {
    fontSize: 8,
    lineHeight: 1.5,
  },
  itemNo: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a56db',
    marginBottom: 8,
    lineHeight: 1.3,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: '#1a56db',
    lineHeight: 1.4,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '35%',
    fontWeight: 700,
    color: '#555',
    lineHeight: 1.5,
    fontSize: 9,
  },
  value: {
    width: '65%',
    color: '#000',
    lineHeight: 1.5,
    fontSize: 9,
  },
  priceBox: {
    backgroundColor: '#fef3c7',
    padding: 8,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 4,
    borderLeft: '4pt solid #f59e0b',
    border: '1pt solid #fbbf24',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTop: '1pt solid #ddd',
    paddingTop: 10,
  },
  // 表紙スタイル
  coverPage: {
    backgroundColor: '#1a56db',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'NotoSansJP',
  },
  coverContent: {
    textAlign: 'center',
    color: '#ffffff',
  },
  coverLogo: {
    width: 150,
    height: 36,
    marginBottom: 20,
  },
  coverCompany: {
    fontSize: 11,
    marginBottom: 40,
    color: '#ffffff',
    lineHeight: 1.5,
  },
  coverTitle: {
    fontSize: 48,
    fontWeight: 700,
    marginBottom: 20,
    color: '#ffffff',
    lineHeight: 1.3,
  },
  coverSubtitle: {
    fontSize: 20,
    fontWeight: 400,
    marginBottom: 30,
    color: '#ffffff',
    lineHeight: 1.4,
  },
  coverInfo: {
    fontSize: 12,
    marginBottom: 10,
    color: '#ffffff',
    lineHeight: 1.6,
  },
  coverBadge: {
    backgroundColor: '#fbbf24',
    padding: '12pt 28pt',
    borderRadius: 25,
    marginTop: 30,
    fontSize: 14,
    color: '#1a56db',
    border: '2pt solid #ffffff',
    lineHeight: 1.5,
    fontWeight: 700,
  },
  coverFooter: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.5,
  },
  coverQRCode: {
    width: 120,
    height: 120,
    marginTop: 40,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
  },
  coverQRText: {
    fontSize: 10,
    marginTop: 10,
    color: '#ffffff',
  },
})

interface StaffCatalogPDFProps {
  exhibition: Exhibition
  items: Item[]
  sessionQRCode?: string // ピックアップセッション開始用QRコード（Data URL）
}

export const StaffCatalogPDF: React.FC<StaffCatalogPDFProps> = ({ exhibition, items, sessionQRCode }) => {
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

  // 8アイテムずつページを分割
  const itemsPerPage = 8
  const pages: Item[][] = []
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage))
  }

  return (
    <Document>
      {/* 表紙ページ */}
      <Page size="A4" orientation="landscape" style={styles.coverPage}>
        <View style={styles.coverContent}>
          <Image src="/goko-logo.svg" style={styles.coverLogo} />
          <Text style={styles.coverCompany}>株式会社 互興 | GOKO Co.,Ltd.</Text>

          <Text style={styles.coverTitle}>{exhibition.exhibitionName}</Text>
          <Text style={styles.coverSubtitle}>管理者用カタログ</Text>

          <Text style={styles.coverInfo}>
            期間: {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
          </Text>
          <Text style={styles.coverInfo}>会場: {exhibition.location}</Text>

          <Text style={styles.coverBadge}>社外秘 - Internal Use Only</Text>

          {/* ピックアップセッション開始用QRコード */}
          {sessionQRCode && (
            <>
              <Image src={sessionQRCode} style={styles.coverQRCode} />
              <Text style={styles.coverQRText}>ピックアップセッション開始</Text>
            </>
          )}
        </View>
        <Text style={styles.coverFooter}>
          株式会社 互興 アパレル商品管理システム
        </Text>
      </Page>

      {/* 商品ページ */}
      {pages.map((pageItems, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          {/* ヘッダー（各ページに表示） */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Image src="/goko-logo.svg" style={styles.logo} />
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>株式会社 互興</Text>
                <Text style={styles.companyName}>GOKO Co.,Ltd.</Text>
              </View>
            </View>
            <Text style={styles.title}>{exhibition.exhibitionName} - 管理者用カタログ</Text>
            <Text style={styles.subtitle}>
              {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)} / {exhibition.location}
            </Text>
          </View>

          {/* アイテムグリッド */}
          <View style={styles.grid}>
            {pageItems.map((item) => (
              <View key={item.id} style={styles.itemContainer}>
                {/* 画像 */}
                {item.images && item.images.length > 0 ? (
                  <Image src={item.images[0].url} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#999' }}>画像なし</Text>
                  </View>
                )}

                {/* 商品情報 */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemNo}>{item.itemNo}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.itemRow}>
                    <Text style={styles.label}>混率:</Text>
                    <Text style={styles.value}>{item.composition || '-'}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.label}>生地No.:</Text>
                    <Text style={styles.value}>{item.fabricNo || '-'}</Text>
                  </View>

                  {/* 価格情報ボックス */}
                  <View style={styles.priceBox}>
                    <View style={styles.itemRow}>
                      <Text style={styles.label}>$単価:</Text>
                      <Text style={styles.value}>{item.dollarPrice ? `$${item.dollarPrice}` : '-'}</Text>
                    </View>
                    <View style={styles.itemRow}>
                      <Text style={styles.label}>参考売値:</Text>
                      <Text style={styles.value}>
                        {item.referencePrice ? `${item.referencePrice.toLocaleString()}円` : '-'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemRow}>
                    <Text style={styles.label}>工場:</Text>
                    <Text style={styles.value}>{item.factory || '-'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* フッター */}
          <Text style={styles.footer}>
            ページ {pageIndex + 2} / {pages.length + 1} | 管理者用（社外秘）
          </Text>
        </Page>
      ))}
    </Document>
  )
}
