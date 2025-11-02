import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { Item, Pickup } from '../../types'

// PDFスタイル定義
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #333',
    paddingBottom: 10,
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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
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
    padding: 8,
    border: '1pt solid #ddd',
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
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '35%',
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    width: '65%',
    color: '#000',
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
})

interface PickupPDFProps {
  pickup: Pickup
  items: Item[]
}

export const PickupPDF: React.FC<PickupPDFProps> = ({ pickup, items }) => {
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

  // 10アイテムずつページを分割
  const itemsPerPage = 10
  const pages: Item[][] = []
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage))
  }

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* ヘッダー（各ページに表示） */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Image src="/goko-logo.svg" style={styles.logo} />
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>株式会社 互興</Text>
                <Text style={styles.companyName}>GOKO Co.,Ltd.</Text>
              </View>
            </View>
            <Text style={styles.title}>ピックアップリスト - {pickup.customerName}</Text>
            <Text style={styles.subtitle}>
              {pickup.exhibitionName || ''} | {formatDate(pickup.createdDate)}
            </Text>
            <Text style={styles.subtitle}>
              コード: {pickup.pickupCode}
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
                  <View style={styles.itemRow}>
                    <Text style={styles.label}>品番:</Text>
                    <Text style={styles.value}>{item.itemNo}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.label}>アイテム名:</Text>
                    <Text style={styles.value}>{item.name}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.label}>混率:</Text>
                    <Text style={styles.value}>{item.composition || '-'}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.label}>生地No.:</Text>
                    <Text style={styles.value}>{item.fabricNo || '-'}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.label}>＄単価:</Text>
                    <Text style={styles.value}>{item.dollarPrice ? `$${item.dollarPrice}` : '-'}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.label}>参考売値:</Text>
                    <Text style={styles.value}>
                      {item.referencePrice ? `¥${item.referencePrice.toLocaleString()}` : '-'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* フッター */}
          <Text style={styles.footer}>
            ページ {pageIndex + 1} / {pages.length}
          </Text>
        </Page>
      ))}
    </Document>
  )
}
