import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function updateExhibition() {
  try {
    console.log('展示会GOKO-26AWを検索中...');

    // GOKO-26AWを検索
    const q = query(
      collection(db, 'exhibitions'),
      where('exhibitionCode', '==', 'GOKO-26AW')
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('GOKO-26AWが見つかりませんでした');
      return;
    }

    // 最初のマッチしたドキュメントを更新
    const exhibitionDoc = querySnapshot.docs[0];
    console.log('展示会が見つかりました:', exhibitionDoc.id);
    console.log('現在のデータ:', exhibitionDoc.data());

    // descriptionフィールドを更新
    const docRef = doc(db, 'exhibitions', exhibitionDoc.id);
    await updateDoc(docRef, {
      description: '/exhibition-2026-jan'
    });

    console.log('✓ 展示会LPのURLを更新しました');
    console.log('新しいLP URL: /exhibition-2026-jan');
    console.log('完全URL: https://goko-apparel-system.web.app/exhibition-2026-jan');

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

updateExhibition();
