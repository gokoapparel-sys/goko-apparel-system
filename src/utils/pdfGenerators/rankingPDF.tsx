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
    borderBottom: '3pt solid #3b82f6',
    paddingBottom: 12,
    backgroundColor: '#eff6ff',
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
    color: '#3b82f6',
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
    border: '2pt solid #3b82f6',
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    position: 'relative',
  },
  rankingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    width: 50,
    height: 50,
    borderRadius: 25,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 18,
    fontWeight: 900,
    zIndex: 10,
    border: '3pt solid #ffffff',
  },
  itemImage: {
    width: '100%',
    height: 180,
    objectFit: 'contain',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  itemInfo: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  itemNo: {
    fontSize: 22,
    fontWeight: 700,
    color: '#3b82f6',
    marginBottom: 8,
    lineHeight: 1.3,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: '#3b82f6',
    lineHeight: 1.4,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '30%',
    fontWeight: 700,
    color: '#555',
    lineHeight: 1.5,
    fontSize: 10,
  },
  value: {
    width: '70%',
    color: '#000',
    lineHeight: 1.5,
    fontSize: 10,
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
    backgroundColor: '#3b82f6',
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
    color: '#3b82f6',
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
})

interface RankingItem {
  item: Item
  pickupCount: number
  customers: Array<{ pickupCode: string; customerName: string }>
}

interface RankingPDFProps {
  exhibition: Exhibition
  rankings: RankingItem[]
}

export const RankingPDF: React.FC<RankingPDFProps> = ({ exhibition, rankings }) => {
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

  // 全ピックアップ数を計算
  const totalPickups = rankings.reduce((sum, r) => sum + r.pickupCount, 0)

  // 10アイテムずつページを分割（2列 × 5行）
  const itemsPerPage = 10
  const pages: RankingItem[][] = []
  for (let i = 0; i < rankings.length; i += itemsPerPage) {
    pages.push(rankings.slice(i, i + itemsPerPage))
  }

  return (
    <Document>
      {/* 表紙ページ */}
      <Page size="A4" orientation="landscape" style={styles.coverPage}>
        <View style={styles.coverContent}>
          <Image src="/goko-logo.svg" style={styles.coverLogo} />
          <Text style={styles.coverCompany}>株式会社 互興 | GOKO Co.,Ltd.</Text>

          <Text style={styles.coverTitle}>{exhibition.exhibitionName}</Text>
          <Text style={styles.coverSubtitle}>Pickup Ranking Report</Text>

          <Text style={styles.coverInfo}>
            期間: {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
          </Text>
          <Text style={styles.coverInfo}>会場: {exhibition.location}</Text>

          <Text style={styles.coverBadge}>ピックアップランキング</Text>
        </View>
        <Text style={styles.coverFooter}>
          株式会社 互興 GOKO Co.,Ltd.
        </Text>
      </Page>

      {/* ランキングページ */}
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
            <Text style={styles.title}>{exhibition.exhibitionName} - ピックアップランキング</Text>
            <Text style={styles.subtitle}>
              {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)} / {exhibition.location}
            </Text>
          </View>

          {/* アイテムグリッド */}
          <View style={styles.grid}>
            {pageItems.map((ranking, indexInPage) => {
              const globalIndex = pageIndex * itemsPerPage + indexInPage
              const pickupRate = totalPickups > 0 ? Math.round((ranking.pickupCount / totalPickups) * 100) : 0
              return (
                <View key={ranking.item.id} style={styles.itemContainer}>
                  {/* ランキングバッジ */}
                  <View style={styles.rankingBadge}>
                    <Text>No.{globalIndex + 1}</Text>
                  </View>

                  {/* 画像 */}
                  {ranking.item.images && ranking.item.images.length > 0 ? (
                    <Image src={ranking.item.images[0].url} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#999' }}>画像なし</Text>
                    </View>
                  )}

                  {/* 商品情報 */}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemNo}>{ranking.item.itemNo}</Text>
                    <Text style={styles.itemName}>{ranking.item.name}</Text>

                    <View style={styles.itemRow}>
                      <Text style={styles.label}>ピックアップ率:</Text>
                      <Text style={styles.value}>{pickupRate}%</Text>
                    </View>
                    <View style={styles.itemRow}>
                      <Text style={styles.label}>ピックアップ数:</Text>
                      <Text style={styles.value}>{ranking.pickupCount}件</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>

          {/* フッター */}
          <Text style={styles.footer}>
            ページ {pageIndex + 2} / {pages.length + 1}
          </Text>
        </Page>
      ))}
    </Document>
  )
}
