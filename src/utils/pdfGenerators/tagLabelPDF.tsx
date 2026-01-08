import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { Item } from '../../types'

// 日本語フォント登録
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf'
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
    padding: '2mm',
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
    color: '#999999',
    lineHeight: 1.2,
    textAlign: 'center',
  },
  itemNo: {
    fontWeight: 'bold',
    color: '#1a56db',
    marginTop: '0.3mm',
    marginBottom: '0mm',
    textAlign: 'center',
    lineHeight: 1.1,
  },
  itemName: {
    fontSize: 8,
    color: '#333333',
    marginTop: '0mm',
    marginBottom: '0.5mm',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 1.2,
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5mm',
  },
  infoRow: {
    fontSize: 7,
    color: '#888888',
    lineHeight: 1.3,
    textAlign: 'left',
  },
  compositionRow: {
    fontSize: 6,
    color: '#555555',
    lineHeight: 1.3,
    textAlign: 'left',
    paddingLeft: '4mm',
  },
  label_text: {
    fontWeight: 'bold',
    color: '#333333',
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
    color: '#888888',
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

    // 文字数に応じてフォントサイズを調整
    if (length <= 12) {
      return 11 // 通常サイズ
    } else if (length <= 15) {
      return 9 // やや小さく
    } else if (length <= 20) {
      return 7 // 小さく
    } else {
      return 6 // 最小サイズ
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
      .split(/[\s　]+/)
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
                {/* ヘッダー: GOKOロゴ + 展示会名 */}
                <View style={styles.labelHeader}>
                  <Image src="/goko-logo.svg" style={styles.logo} />
                  <Text style={styles.exhibitionName}>{exhibitionName}</Text>
                </View>

                {/* 品番（必ず1行、長さに応じてフォントサイズ自動調整） */}
                <Text
                  style={{
                    ...styles.itemNo,
                    fontSize: getItemNoFontSize(item.itemNo),
                  }}
                >
                  {item.itemNo}
                </Text>

                {/* アイテム名 */}
                <Text
                  style={{
                    ...styles.itemName,
                    fontSize: getItemNameFontSize(item.name),
                  }}
                >
                  {item.name}
                </Text>

                {/* 詳細情報 */}
                <View style={styles.infoSection}>
                  {/* 生地 */}
                  {item.fabricNo && (
                    <Text style={styles.infoRow}>
                      <Text style={styles.label_text}>生地: </Text>
                      {item.fabricNo}
                    </Text>
                  )}

                  {/* 混率（素材ごとに複数段で表示、ラベルなし） */}
                  {item.composition && (() => {
                    const compositionParts = parseComposition(item.composition)

                    if (compositionParts.length === 0) {
                      return null
                    } else {
                      // 素材を複数段で表示（ラベルなし）
                      return (
                        <>
                          {compositionParts.map((part, idx) => (
                            <Text key={idx} style={styles.compositionRow}>
                              {part}
                            </Text>
                          ))}
                        </>
                      )
                    }
                  })()}
                </View>

                {/* 製品画像 */}
                {itemImages && itemImages[item.id!] && (
                  <View style={styles.imageContainer}>
                    <Image src={itemImages[item.id!]} style={styles.productImage} />
                  </View>
                )}

                {/* 工場名 */}
                {item.factory && (
                  <Text style={styles.factoryName}>
                    {item.factory}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  )
}

export default TagLabelPDF
