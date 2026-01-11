import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCveXtoCsSRV-XPUVOCdwzj_c7LJxZdjWY',
  authDomain: 'goko-apparel-system.firebaseapp.com',
  projectId: 'goko-apparel-system',
  storageBucket: 'goko-apparel-system.firebasestorage.app',
  messagingSenderId: '42478506289',
  appId: '1:42478506289:web:d37572e63d7fdb1f33a010',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkExhibition() {
  try {
    console.log('展示会GOKO-26AWを検索中...\n');

    const q = query(
      collection(db, 'exhibitions'),
      where('exhibitionCode', '==', 'GOKO-26AW')
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('GOKO-26AWが見つかりませんでした');
      return;
    }

    const exhibitionDoc = querySnapshot.docs[0];
    const data = exhibitionDoc.data();

    console.log('=== 展示会データ ===');
    console.log('ID:', exhibitionDoc.id);
    console.log('展示会コード:', data.exhibitionCode);
    console.log('展示会名:', data.exhibitionName);
    console.log('説明欄 (description):', data.description || '(未設定)');
    console.log('ステータス:', data.status);
    console.log('\n期待される展示会LP URL: /exhibition-2026-jan');
    console.log('\n現在の設定:');
    if (data.description && data.description.startsWith('/')) {
      console.log('  → 展示会LPボタンは:', data.description, 'に遷移します');
    } else {
      console.log('  → 展示会LPボタンはデフォルトページに遷移します');
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

checkExhibition();
