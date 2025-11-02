# Firebase Storage CORS設定ガイド

## 問題

PDF出力時に画像が表示されない原因は、Firebase StorageのCORS（Cross-Origin Resource Sharing）設定が適用されていないためです。

## 解決方法

### 方法1: Google Cloud Consoleで設定（推奨）

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/ にアクセス
   - プロジェクト「goko-apparel-system」を選択

2. **Cloud Storageを開く**
   - 左メニューから「Cloud Storage」→「バケット」を選択
   - `goko-apparel-system.firebasestorage.app` バケットをクリック

3. **権限タブを開く**
   - 「権限」タブをクリック

4. **CORS設定を追加**
   - ページ上部の「バケット構成の編集」をクリック
   - 「CORS」セクションで以下のJSON設定を追加：

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

5. **保存**
   - 「保存」ボタンをクリック

### 方法2: gsutilコマンドで設定（技術者向け）

#### 前提条件
- Google Cloud SDK (`gsutil`) がインストールされている必要があります
- https://cloud.google.com/sdk/docs/install からインストール可能

#### 手順

1. **Google Cloud SDKをインストール**
   ```bash
   # Windowsの場合は、上記URLからインストーラーをダウンロード
   ```

2. **認証**
   ```bash
   gcloud auth login
   gcloud config set project goko-apparel-system
   ```

3. **CORS設定を適用**
   ```bash
   gsutil cors set cors.json gs://goko-apparel-system.firebasestorage.app
   ```

4. **設定を確認**
   ```bash
   gsutil cors get gs://goko-apparel-system.firebasestorage.app
   ```

## 確認方法

CORS設定を適用後、以下を確認してください：

1. ブラウザを完全にリロード（Ctrl + Shift + R）
2. PDF出力を再実行
3. ブラウザのコンソールでCORSエラーが消えていることを確認
4. PDFに画像が正しく表示されることを確認

## 注意事項

- **セキュリティ**: 本番環境では `"origin": ["*"]` ではなく、特定のドメインのみを許可することを推奨します
  ```json
  "origin": ["https://yourdomain.com", "http://localhost:5179"]
  ```

- **キャッシュ**: ブラウザのキャッシュが原因で設定が反映されない場合は、シークレットモードで確認してください

## 現在の暫定対応

CORS設定が適用されるまでの間、以下の暫定対応が実装されています：

- 画像の読み込みに失敗した場合、プレースホルダー画像（グラデーション背景 + テキスト）が表示されます
- これにより、CORS設定前でもPDF自体は生成されます
- 正常な画像表示のためには、上記のCORS設定が必要です

## トラブルシューティング

### Q: CORS設定を適用したのに画像が表示されない
A: 以下を確認してください：
- ブラウザのキャッシュをクリア
- Firebase Storageのセキュリティルールで画像の読み取りが許可されているか確認
- 画像URLが正しいか確認

### Q: gsutilコマンドが見つからない
A: Google Cloud SDKをインストールしてください：
https://cloud.google.com/sdk/docs/install

### Q: 特定のドメインのみ許可したい
A: cors.jsonを以下のように変更：
```json
[
  {
    "origin": ["https://your-production-domain.com", "http://localhost:5179"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```
