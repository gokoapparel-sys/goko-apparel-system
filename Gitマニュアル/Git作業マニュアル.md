# Git作業マニュアル
**GOKO アパレル商品管理システム**

作成日：2025年11月3日
GitHubリポジトリ：https://github.com/gokoapparel-sys/goko-apparel-system

---

## 📚 目次

1. [このPCで作業をする場合](#このpcで作業をする場合)
2. [別なPCで初めて作業をする場合](#別なpcで初めて作業をする場合)
3. [別なPCで作業を再開する場合](#別なpcで作業を再開する場合)
4. [トラブルシューティング](#トラブルシューティング)
5. [よく使うGitコマンド一覧](#よく使うgitコマンド一覧)

---

## 1. このPCで作業をする場合

### 🖥️ 現在のPC情報
- **プロジェクトフォルダ**: `C:\Users\aja10\Desktop\goko_appalel-system`
- **GitHubアカウント**: `gokoapparel-sys`

### ✅ 作業開始手順

#### ステップ1: フォルダに移動
```powershell
cd "C:\Users\aja10\Desktop\goko_appalel-system"
```

#### ステップ2: 最新版を確認
```powershell
git pull
```

**表示される結果：**
- `Already up to date.` → 最新版です。そのまま作業開始OK
- ファイル名が表示される → 他のPCでの変更がダウンロードされました

#### ステップ3: Claude Code起動（必要に応じて）
```powershell
claude code .
```

#### ステップ4: 開発サーバー起動
```powershell
npm run dev
```

ブラウザで http://localhost:5179 にアクセス

---

### 💾 作業終了手順

#### ステップ1: 変更を確認
```powershell
git status
```

#### ステップ2: 変更をステージング
```powershell
git add .
```

#### ステップ3: コミット（変更を記録）
```powershell
git commit -m "変更内容の説明（例：画像削除機能を追加）"
```

#### ステップ4: GitHubにアップロード
```powershell
git push
```

**重要**: `git push` を忘れると、他のPCに変更が反映されません！

---

## 2. 別なPCで初めて作業をする場合

### 🆕 初回セットアップ（1回だけ）

#### 前提条件の確認

以下がインストールされているか確認：

```powershell
# Gitの確認
git --version

# Node.jsの確認
node --version

# npmの確認
npm --version

# Claude Code CLIの確認
claude --version
```

**どれかがエラーになる場合は、先にインストールが必要です。**

---

#### ステップ1: 作業場所に移動

**方法1（推奨）: 環境変数を使う**
```powershell
cd $env:USERPROFILE\Desktop
```

**方法2: ユーザー名を指定**
```powershell
cd C:\Users\[ユーザー名]\Desktop
```

**ユーザー名がわからない場合：**
```powershell
echo $env:USERNAME
```

**ユーザー名にスペースや日本語が含まれる場合：**
```powershell
cd "C:\Users\山田 太郎\Desktop"
```

---

#### ステップ2: プロジェクトをダウンロード（クローン）

```powershell
git clone https://github.com/gokoapparel-sys/goko-apparel-system.git
```

**初回のみGitHub認証が必要：**
1. ブラウザが自動起動
2. GitHubにサインイン
   - ユーザー名: `gokoapparel-sys`
   - パスワードを入力
3. Git Credential Manager の承認ボタンをクリック
4. "Authentication Succeeded" と表示されればOK

---

#### ステップ3: フォルダに移動

```powershell
cd goko-apparel-system
```

---

#### ステップ4: パッケージをインストール

```powershell
npm install
```

**実行時間**: 数分かかります。完了まで待ちましょう。

---

#### ステップ5: 環境設定ファイルを作成

`.env` ファイルは `.gitignore` に含まれているため、手動で作成が必要です。

**元のPCから `.env` ファイルの内容をコピーして、新しいPCで作成してください。**

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

#### ステップ6: Claude Code起動

```powershell
claude code .
```

---

#### ステップ7: 開発サーバー起動

```powershell
npm run dev
```

ブラウザで http://localhost:5179 にアクセス

---

### ✅ 初回セットアップ完了！

これで新しいPCでも作業ができるようになりました。

---

## 3. 別なPCで作業を再開する場合

### 🔄 2回目以降の作業開始

#### ステップ1: フォルダに移動

```powershell
cd $env:USERPROFILE\Desktop\goko-apparel-system
```

**または（ユーザー名を指定）：**
```powershell
cd C:\Users\[ユーザー名]\Desktop\goko-apparel-system
```

---

#### ステップ2: 最新版を取得

```powershell
git pull
```

**表示される結果：**
- `Already up to date.` → 変更なし
- ファイル名が表示される → 他のPCでの変更がダウンロードされました

---

#### ステップ3: Claude Code起動（必要に応じて）

```powershell
claude code .
```

---

#### ステップ4: 開発サーバー起動

```powershell
npm run dev
```

---

### 💾 作業終了手順

**このPCの場合と同じです：**

```powershell
# 1. 変更を確認
git status

# 2. 変更をステージング
git add .

# 3. コミット
git commit -m "変更内容の説明"

# 4. GitHubにアップロード
git push
```

---

## 4. トラブルシューティング

### ❌ エラー: `git: command not found`

**原因**: Gitがインストールされていない

**解決策**: https://git-scm.com/ からGitをダウンロードしてインストール

---

### ❌ エラー: `Permission denied`

**原因**: GitHub認証が失敗している

**解決策**:
```powershell
# 認証情報をクリアして再認証
git credential reject
# その後、git pull または git push を実行
```

---

### ❌ エラー: `Your local changes would be overwritten`

**原因**: ローカルに未保存の変更がある状態で `git pull` を実行

**解決策1（変更を保存する場合）**:
```powershell
git stash        # 変更を一時退避
git pull         # 最新版を取得
git stash pop    # 退避した変更を戻す
```

**解決策2（変更を破棄する場合）**:
```powershell
git reset --hard HEAD    # すべての変更を破棄
git pull                 # 最新版を取得
```

---

### ❌ エラー: `npm install` が失敗する

**原因**: Node.jsのバージョンが古い、またはネットワークエラー

**解決策**:
```powershell
# Node.jsのバージョンを確認
node --version

# 18以上が必要です。古い場合は https://nodejs.org/ から最新版をインストール

# キャッシュをクリアして再試行
npm cache clean --force
npm install
```

---

### ❌ エラー: `port 5179 is already in use`

**原因**: 開発サーバーがすでに起動している

**解決策**:
```powershell
# プロセスを確認
netstat -ano | findstr :5179

# 該当プロセスを終了
taskkill /F /PID [プロセスID]

# または、別のターミナルを閉じる
```

---

## 5. よく使うGitコマンド一覧

### 📖 基本コマンド

| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `git status` | 現在の状態を確認 | いつでも |
| `git pull` | GitHubから最新版を取得 | 作業開始時 |
| `git add .` | すべての変更をステージング | コミット前 |
| `git commit -m "メッセージ"` | 変更を記録 | 作業終了時 |
| `git push` | GitHubにアップロード | 作業終了時 |

---

### 🔍 確認コマンド

| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `git log --oneline -5` | 最近の5件のコミット履歴 | 履歴確認 |
| `git diff` | 変更内容を表示 | コミット前の確認 |
| `git branch` | ブランチ一覧 | 現在のブランチ確認 |
| `git remote -v` | リモートリポジトリURL確認 | 接続先確認 |

---

### 🛠️ 便利コマンド

| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `git stash` | 変更を一時退避 | 未保存の変更があるとき |
| `git stash pop` | 退避した変更を戻す | 退避後 |
| `git reset --hard HEAD` | すべての変更を破棄 | やり直したいとき |
| `git checkout main` | mainブランチに切り替え | ブランチ移動 |

---

## 📋 クイックリファレンス

### このPCで作業

```powershell
cd "C:\Users\aja10\Desktop\goko_appalel-system"
git pull
claude code .
npm run dev
```

### 別なPC（初回）

```powershell
cd $env:USERPROFILE\Desktop
git clone https://github.com/gokoapparel-sys/goko-apparel-system.git
cd goko-apparel-system
npm install
claude code .
npm run dev
```

### 別なPC（2回目以降）

```powershell
cd $env:USERPROFILE\Desktop\goko-apparel-system
git pull
claude code .
npm run dev
```

### 作業終了

```powershell
git add .
git commit -m "変更内容"
git push
```

---

## 📞 サポート情報

### GitHubリポジトリ
https://github.com/gokoapparel-sys/goko-apparel-system

### GitHubアカウント
- **ユーザー名**: gokoapparel-sys
- **用途**: すべてのPCで同じアカウントを使用

### 注意事項
- `.env` ファイルは各PCで手動作成が必要
- `node_modules` は各PCで `npm install` が必要
- 作業終了時は必ず `git push` を実行

---

**最終更新**: 2025年11月3日
**作成者**: Claude (AI Assistant)
