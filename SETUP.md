# セットアップガイド

このガイドでは、アパレル商品管理システムをローカル環境で動作させるための手順を説明します。

## ✅ 完了済みの設定

以下の項目は既に設定済みです：

- ✅ React + TypeScript + Vite プロジェクト構造
- ✅ Tailwind CSS 設定
- ✅ Firebase SDK 統合
- ✅ 認証機能（ログイン・ログアウト）
- ✅ プロジェクトフォルダ構造
- ✅ TypeScript 型定義
- ✅ Firestore/Storage セキュリティルール

## 🔧 次のステップ

### 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `apparel-management-system`）
4. Google Analytics の設定（任意）
5. プロジェクトを作成

### 2. Firebase Authentication の設定

1. Firebase Console で「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブを開く
4. 「メール/パスワード」を有効化
5. 保存

### 3. Cloud Firestore の設定

1. Firebase Console で「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. **本番モードで開始** を選択
4. ロケーションを選択（推奨: `asia-northeast1` - 東京）
5. 有効にする

### 4. Firebase Storage の設定

1. Firebase Console で「Storage」を選択
2. 「始める」をクリック
3. セキュリティルールはデフォルトのまま「次へ」
4. ロケーションを選択（Firestore と同じ）
5. 完了

### 5. 環境変数の設定

1. Firebase Console のプロジェクト設定を開く
   - 左上の歯車アイコン → 「プロジェクトの設定」
2. 「全般」タブの一番下にある「アプリ」セクションで「</> Web」を選択
3. アプリのニックネームを入力（例: `apparel-web`）
4. 「Firebase Hosting も設定する」はチェックを入れる
5. 「アプリを登録」をクリック
6. 表示される設定情報をコピー

7. プロジェクトルートに `.env.local` ファイルを作成:

```bash
# Windowsの場合
copy .env.example .env.local

# Mac/Linuxの場合
cp .env.example .env.local
```

8. `.env.local` を開いて、Firebase の設定値を入力:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 6. Firebase CLI のインストールと初期化

```bash
# Firebase CLI をグローバルインストール
npm install -g firebase-tools

# Firebase にログイン
firebase login

# プロジェクトを初期化（既に firebase.json が存在するので不要）
# firebase init

# 既存の Firebase プロジェクトに接続
firebase use --add
# → プロジェクトを選択
# → エイリアスを入力（例: default）
```

### 7. セキュリティルールのデプロイ

```bash
# Firestore ルールをデプロイ
firebase deploy --only firestore:rules

# Storage ルールをデプロイ
firebase deploy --only storage:rules
```

### 8. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開く

## 🔑 テストユーザーの作成

アプリにログインするには、Firebase Console でテストユーザーを作成する必要があります。

### 方法1: Firebase Console から作成

1. Firebase Console → Authentication → Users タブ
2. 「ユーザーを追加」をクリック
3. メールアドレスとパスワードを入力
4. 「ユーザーを追加」

### 方法2: アプリから登録（オプション）

サインアップページを追加する場合は、`src/pages/SignUp.tsx` を作成できます。

## 🧪 動作確認

1. ブラウザで `http://localhost:5173` を開く
2. ログインページが表示されることを確認
3. 作成したテストユーザーでログイン
4. ダッシュボードが表示されることを確認
5. ログアウトできることを確認

## 📂 プロジェクト構造

```
goko_appalel-sysitem/
├── public/                      # 静的ファイル
├── src/
│   ├── components/             # UIコンポーネント
│   │   ├── common/            # 共通コンポーネント
│   │   │   └── PrivateRoute.tsx
│   │   ├── layout/
│   │   ├── items/
│   │   ├── fabrics/
│   │   ├── patterns/
│   │   ├── exhibitions/
│   │   ├── loans/
│   │   ├── pickups/
│   │   └── pdf/
│   ├── pages/                 # ページコンポーネント
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   ├── hooks/                 # カスタムフック
│   ├── services/              # ビジネスロジック
│   │   └── firebase/
│   │       ├── config.ts      # Firebase 初期化
│   │       ├── auth.ts        # 認証サービス
│   │       ├── firestore.ts   # Firestore サービス
│   │       └── storage.ts     # Storage サービス
│   ├── utils/                 # ユーティリティ
│   ├── types/                 # TypeScript型定義
│   │   └── index.ts
│   ├── contexts/              # Reactコンテキスト
│   │   └── AuthContext.tsx
│   ├── styles/                # スタイル
│   │   └── index.css
│   ├── App.tsx               # ルート設定
│   ├── main.tsx              # エントリーポイント
│   └── vite-env.d.ts         # Vite型定義
├── .env.example               # 環境変数テンプレート
├── .env.local                 # 環境変数（Git管理外）
├── firebase.json              # Firebase 設定
├── firestore.rules            # Firestore セキュリティルール
├── firestore.indexes.json     # Firestore インデックス
├── storage.rules              # Storage セキュリティルール
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🎯 次の開発タスク

基本的なプロジェクト構造と認証機能は実装済みです。以下の機能を順次実装していきます：

### Phase 1: マスタ管理機能
- [ ] ブランドマスタ（CRUD）
- [ ] 生地マスタ（CRUD）
- [ ] 型紙マスタ（CRUD + ファイルアップロード）
- [ ] アイテム管理（CRUD + 画像アップロード）

### Phase 2: 検索・表示機能
- [ ] アイテム一覧（グリッド/テーブル表示）
- [ ] 検索・フィルタ機能
- [ ] ソート機能

### Phase 3: 展示会機能
- [ ] 展示会カタログPDF生成
- [ ] ピックアップリスト機能
- [ ] Web共有機能

### Phase 4: サンプル貸出管理
- [ ] 貸出登録
- [ ] 貸出中一覧
- [ ] 返却処理

### Phase 5: データ連携
- [ ] CSV/Excel インポート
- [ ] CSV/Excel エクスポート

## ⚠️ トラブルシューティング

### 開発サーバーが起動しない

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Firebase 接続エラー

1. `.env.local` ファイルが存在するか確認
2. 環境変数の値が正しいか確認
3. Firebase プロジェクトが有効か確認

### ログインできない

1. Firebase Console で Authentication が有効か確認
2. テストユーザーが作成されているか確認
3. ブラウザのコンソールでエラーを確認

## 📚 参考資料

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 サポート

問題が発生した場合は、プロジェクトの Issue を作成してください。
