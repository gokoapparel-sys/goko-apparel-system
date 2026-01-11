// 展示会データ確認スクリプト（Firebase Admin SDK使用）
const admin = require('firebase-admin');

// Firebase Admin SDK の初期化
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkExhibitions() {
  try {
    console.log('=== 展示会データ確認 ===\n');

    // GOKO-26AWを検索
    console.log('1. GOKO-26AWを検索中...');
    const gokoSnapshot = await db.collection('exhibitions')
      .where('exhibitionCode', '==', 'GOKO-26AW')
      .get();

    if (!gokoSnapshot.empty) {
      const gokoDoc = gokoSnapshot.docs[0];
      const gokoData = gokoDoc.data();
      console.log('✓ GOKO-26AWが見つかりました');
      console.log('  ID:', gokoDoc.id);
      console.log('  展示会コード:', gokoData.exhibitionCode);
      console.log('  展示会名:', gokoData.exhibitionName);
      console.log('  description:', gokoData.description || '(未設定)');
      console.log('  status:', gokoData.status);
      console.log('  catalogItemIds:', gokoData.catalogItemIds?.length || 0, '件');
    } else {
      console.log('✗ GOKO-26AWが見つかりませんでした');
    }

    console.log('\n---\n');

    // RH-26AWを検索
    console.log('2. RH-26AWを検索中...');
    const rhSnapshot = await db.collection('exhibitions')
      .where('exhibitionCode', '==', 'RH-26AW')
      .get();

    if (!rhSnapshot.empty) {
      const rhDoc = rhSnapshot.docs[0];
      const rhData = rhDoc.data();
      console.log('✓ RH-26AWが見つかりました');
      console.log('  ID:', rhDoc.id);
      console.log('  展示会コード:', rhData.exhibitionCode);
      console.log('  展示会名:', rhData.exhibitionName);
      console.log('  description:', rhData.description || '(未設定)');
      console.log('  status:', rhData.status);
      console.log('  catalogItemIds:', rhData.catalogItemIds?.length || 0, '件');
    } else {
      console.log('✗ RH-26AWが見つかりませんでした');
    }

    console.log('\n=== 確認完了 ===');
    process.exit(0);

  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

checkExhibitions();
