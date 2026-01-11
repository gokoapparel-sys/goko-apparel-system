// 一時的なユーザー作成スクリプト
const admin = require('firebase-admin');

// Firebase Admin SDK の初期化
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createUser() {
  try {
    const userRecord = await admin.auth().createUser({
      email: 'goko.apparel@gmail.com',
      password: 'goko1953',
      emailVerified: false,
      disabled: false,
    });

    console.log('✅ 新しいユーザーが作成されました:');
    console.log('UID:', userRecord.uid);
    console.log('メール:', userRecord.email);
    console.log('\n古いテストアカウントを削除しています...');

    // 古いアカウントを削除
    await admin.auth().deleteUser('wfMjFEvWKGhUz3gaTrxZzCY2JNX2');
    console.log('✅ 古いテストアカウント (test@example.com) を削除しました');

    console.log('\n🎉 完了！');
    console.log('新しいログイン情報:');
    console.log('メール: goko.apparel@gmail.com');
    console.log('パスワード: goko1953');

    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

createUser();
