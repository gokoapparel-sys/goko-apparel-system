import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { Item } from '../../types'

// 日本語フォント登録
Font.register({
  family: 'NotoSansJP',
  fonts: [
    { src: '/fonts/NotoSansJP-Regular.ttf' },
    { src: '/fonts/NotoSansJP-Bold.ttf', fontWeight: 'bold' }
  ]
})

interface TagLabelPDFProps {
  exhibitionName: string
  items: Item[]
  labelWidth?: number // 横幅（mm）デフォルト35
  labelHeight?: number // 縦幅（mm）デフォルト50
  itemImages?: Record<string, string> // アイテムIDをキーとした製品画像URL のマップ
}

// 動的スタイル生成関数
const createStyles = (labelWidth: number, labelHeight: number) => StyleSheet.create({
  page: {
    padding: '10mm',
    backgroundColor: '#ffffff',
    fontFamily: 'NotoSansJP',
  },
  labelGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '3mm',
  },
  label: {
    width: `${labelWidth}mm`,
    height: `${labelHeight}mm`,
    border: '1pt solid #cccccc',
    padding: '1.5mm', // パディング少し減らしてスペース確保
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  labelHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0mm',
    borderBottom: '0.5pt solid #cccccc',
    paddingBottom: '0mm',
    minHeight: '5mm',
    maxHeight: '5mm',
  },
  logo: {
    width: 15,
    height: 4,
    marginBottom: '0.5mm',
  },
  exhibitionName: {
    fontSize: 5,
    color: '#000000',
    lineHeight: 1.2,
    textAlign: 'center',
  },
  itemNo: {
    fontWeight: 'bold', // Boldフォントが適用される
    color: '#000000',
    marginTop: '0.3mm',
    marginBottom: '0mm',
    textAlign: 'center',
    lineHeight: 1.1,
  },
  itemName: {
    fontSize: 8,
    color: '#000000',
    marginTop: '0mm',
    marginBottom: '0.5mm',
    textAlign: 'center',
    fontWeight: 'bold', // Boldフォントが適用される
    lineHeight: 1.2,
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5mm',
  },
  infoRow: {
    fontSize: 7,
    color: '#000000',
    lineHeight: 1.3,
    textAlign: 'left',
  },
  compositionRow: {
    fontSize: 6,
    color: '#000000',
    lineHeight: 1.3,
    textAlign: 'left',
    paddingLeft: '4mm',
  },
  label_text: {
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 1.6,
  },
  imageContainer: {
    marginTop: '0.5mm',
    marginLeft: '-2mm',
    marginRight: '-2mm',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${labelWidth}mm`,
    minHeight: `${labelWidth * 0.8}mm`,
    maxHeight: `${labelWidth * 0.8}mm`,
  },
  factoryName: {
    fontSize: 5,
    color: '#000000',
    textAlign: 'center',
    marginTop: '0.5mm',
    lineHeight: 1.2,
  },
  productImage: {
    width: `${labelWidth}mm`,
    height: `${labelWidth * 0.8}mm`,
    objectFit: 'contain',
    objectPosition: 'center',
  },
})

export const TagLabelPDF: React.FC<TagLabelPDFProps> = ({
  exhibitionName,
  items,
  labelWidth = 35,
  labelHeight = 50,
  itemImages
}) => {
  // スタイルを動的に生成
  const styles = createStyles(labelWidth, labelHeight)

  // A4用紙に配置できる枚数を動的に計算
  // A4: 210mm × 297mm
  const pageWidth = 210
  const pageHeight = 297
  const margin = 10 // 上下左右のマージン
  const gap = 3 // ラベル間の隙間

  const availableWidth = pageWidth - (margin * 2)
  const availableHeight = pageHeight - (margin * 2)

  const labelsPerRow = Math.floor(availableWidth / (labelWidth + gap))
  const labelsPerColumn = Math.floor(availableHeight / (labelHeight + gap))
  const itemsPerPage = labelsPerRow * labelsPerColumn

  // 品番の長さに応じたフォントサイズを計算
  const getItemNoFontSize = (itemNo: string): number => {
    const length = itemNo.length

    // 文字数に応じてフォントサイズを調整 (Boldになったので少しサイズ調整)
    if (length <= 12) {
      return 12 // 通常サイズ (11->12)
    } else if (length <= 15) {
      return 10 // やや小さく
    } else if (length <= 20) {
      return 8 // 小さく
    } else {
      return 7 // 最小サイズ
    }
  }

  // アイテム名の長さに応じたフォントサイズを計算
  const getItemNameFontSize = (itemName: string): number => {
    const length = itemName.length

    // 文字数に応じてフォントサイズを調整
    if (length <= 10) {
      return 8 // 通常サイズ
    } else if (length <= 15) {
      return 7 // やや小さく
    } else if (length <= 20) {
      return 6 // 小さく
    } else {
      return 5 // 最小サイズ
    }
  }

  // 混率を解析して配列に変換
  const parseComposition = (composition: string | undefined): string[] => {
    if (!composition) return []

    // スペースや全角スペースで分割し、空文字を除外
    const parts = composition
      .split(/[\s\u3000]+/)
      .filter((part) => part.trim().length > 0)

    return parts
  }

  // ページごとにアイテムを分割
  const pages: Item[][] = []
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage))
  }

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <View style={styles.labelGrid}>
            {pageItems.map((item, index) => (
              <View key={index} style={styles.label}>
                {/* ヘッダー: GOKOロゴ + 展示会名（一番上・高さ固定） */}
                <View style={{ ...styles.labelHeader, height: '7%', justifyContent: 'flex-start' }}>
                  <Image src="/goko-logo.svg" style={styles.logo} />
                  <Text style={styles.exhibitionName}>{exhibitionName}</Text>
                </View>

                {/* 品番（上部固定、目立つように）- フォントサイズ大＆Bold */}
                <View style={{ height: '10%', justifyContent: 'center', alignItems: 'center' }}>
                  <Text
                    style={{
                      ...styles.itemNo,
                      fontSize: getItemNoFontSize(item.itemNo),
                      color: '#000000',
                    }}
                  >
                    {item.itemNo}
                  </Text>
                </View>

                {/* アイテム名（品番の下）- 2行表示用にエリア拡大 */}
                <View style={{ height: '12%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: '1mm' }}>
                  <Text
                    style={{
                      ...styles.itemName,
                      fontSize: getItemNameFontSize(item.name),
                      marginBottom: 0,
                      maxLines: 2,
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.name.replace(/[\s\u3000]+/g, '\n')}
                  </Text>
                </View>

                {/* 生地情報と混率 */}
                <View style={{ ...styles.infoSection, height: '15%', justifyContent: 'flex-start' }}>
                  {/* 生地 */}
                  <Text style={styles.infoRow}>
                    <Text style={styles.label_text}>生地: </Text>
                    {item.fabricNo || '-'}
                  </Text>

                  {/* 混率 */}
                  {item.composition && (
                    <View style={{ marginTop: '0.5mm' }}>
                      {parseComposition(item.composition).map((part, idx) => (
                        <Text key={idx} style={styles.compositionRow}>
                          {part}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* 製品画像（中央〜下部エリア）- エリア拡大 (44% -> 50%) */}
                <View style={{ height: '50%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0.5mm' }}>
                  {itemImages && itemImages[item.id!] ? (
                    <Image src={itemImages[item.id!]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Text style={{ fontSize: 6, color: '#ccc' }}>No Image</Text>
                  )}
                </View>

                {/* 工場名（一番下） */}
                <View style={{ height: '6%', justifyContent: 'flex-end' }}>
                  <Text style={styles.factoryName}>
                    {item.factory || ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  )
}

export default TagLabelPDF
