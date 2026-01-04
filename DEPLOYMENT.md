# GAIS GraphRAG Chatbot - Vercel Deployment Guide

## 🚀 Vercel × GitHub連携デプロイメント

### 前提条件

1. **GitHubアカウント**: [github.com](https://github.com) でアカウント作成
2. **Vercelアカウント**: [vercel.com](https://vercel.com) でアカウント作成（GitHubアカウントで連携推奨）
3. **必要なAPIキー**:
   - 🤖 **Anthropic Claude API Key** ([console.anthropic.com](https://console.anthropic.com))
   - 🔍 **Tavily Search API Key** ([tavily.com](https://tavily.com))
   - 🗄️ **Neo4j Aura Database** (現在使用中: `bf116132.databases.neo4j.io`)

---

## Step 1: GitHubリポジトリ作成

### 1.1 新しいリポジトリを作成
```bash
# GitHubで新しいリポジトリ作成
# 例: gais-graphrag-chatbot

# ローカルからpush
cd /path/to/graph-rag-chatbot
git init
git add .
git commit -m "Initial commit: GAIS GraphRAG Chatbot"
git branch -M main
git remote add origin https://github.com/[your-username]/gais-graphrag-chatbot.git
git push -u origin main
```

### 1.2 リポジトリ設定
- **Visibility**: Private（GAISメンバーのみアクセス）
- **Description**: "GAIS生成AI協会 - AI使用上の法的リスク分析 GraphRAG Chatbot"
- **Topics**: `gais`, `graphrag`, `legal-analysis`, `nextjs`, `neo4j`

---

## Step 2: APIキー取得

### 2.1 Anthropic Claude API
```bash
# 1. https://console.anthropic.com にアクセス
# 2. API Keys → Create Key
# 3. 名前: "GAIS-GraphRAG-Production"
# 4. キーをコピー（例: sk-ant-api03-...）
```

### 2.2 Tavily Search API  
```bash
# 1. https://tavily.com にアクセス
# 2. Sign up → Get API Key
# 3. Free Plan: 1,000 searches/month
# 4. キーをコピー（例: tvly-...）
```

### 2.3 Neo4j Aura Database
```bash
# 現在使用中の情報:
NEO4J_URI=neo4j+s://bf116132.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=[現在のパスワード]
```

---

## Step 3: Vercelデプロイメント

### 3.1 Vercel プロジェクト作成

1. **Vercelダッシュボード**にアクセス
2. **"New Project"**をクリック
3. **"Import Git Repository"**を選択
4. **GitHubアカウント**を接続
5. **作成したリポジトリ**を選択

### 3.2 ビルド設定

```json
{
  "Framework Preset": "Next.js",
  "Root Directory": "./",
  "Build Command": "npm run build", 
  "Output Directory": ".next",
  "Install Command": "npm install",
  "Node.js Version": "18.x"
}
```

### 3.3 環境変数設定

Vercelの**Environment Variables**セクションで以下を設定:

#### 🔑 **必須環境変数**
```bash
# Neo4j Database
NEO4J_URI=neo4j+s://bf116132.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=[your-neo4j-password]

# AI Services  
ANTHROPIC_API_KEY=[your-claude-api-key]
TAVILY_API_KEY=[your-tavily-api-key]

# Production Settings
NODE_ENV=production
```

#### 📊 **オプション環境変数**
```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://[your-app].vercel.app
NEXT_PUBLIC_MAX_FILE_SIZE=20971520
NEXT_PUBLIC_ALLOWED_FILE_TYPES=application/pdf

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=50

# Upload Settings
MAX_UPLOAD_SIZE=20971520
UPLOAD_TIMEOUT_MS=300000
```

### 3.4 デプロイ実行

1. **"Deploy"**ボタンをクリック
2. ビルド進行状況を監視
3. **成功時**: `https://[your-app].vercel.app` でアクセス可能

---

## Step 4: デプロイ後の検証

### 4.1 ヘルスチェック

```bash
# 基本接続確認
curl https://[your-app].vercel.app

# API動作確認  
curl https://[your-app].vercel.app/api/member-stats \
  -X POST \
  -H "Content-Type: application/json"
```

### 4.2 機能テスト

#### 📄 **PDFアップロード**
```bash
1. https://[your-app].vercel.app にアクセス
2. "📄 PDF Upload"ボタンをクリック  
3. GAISメールアドレス入力（例: test@gais.jp）
4. PDFファイル選択・アップロード
5. "アップロードが完了しました"メッセージ確認
```

#### 💬 **チャット機能**
```bash
1. 質問入力: "AIの商用利用における法的リスクは？"
2. Graph RAG検索: ✅ ON
3. Web検索(Tavily): ✅ ON  
4. 回答表示確認
5. ソース表示確認: 📚 Graph: X 🌐 Web: X
```

#### 📊 **メンバーダッシュボード**
```bash
1. メールアドレス入力後
2. "📊 Dashboard"ボタン表示確認
3. 統計データ表示確認:
   - アップロード済み文書数
   - 総ページ数  
   - 分析チャンク数
   - 最近のアップロード履歴
```

---

## Step 5: 継続的デプロイメント

### 5.1 自動デプロイ設定

```bash
# コード変更時の自動デプロイ
git add .
git commit -m "Update: [変更内容]"  
git push origin main
# → Vercelが自動的に再デプロイ
```

### 5.2 ブランチ戦略

```bash
# 開発ブランチでのテスト
git checkout -b feature/new-function
git push origin feature/new-function  
# → Vercelがプレビューデプロイを作成

# 本番反映
git checkout main
git merge feature/new-function
git push origin main
# → 本番環境に自動デプロイ
```

---

## Step 6: モニタリング設定

### 6.1 Vercel Analytics

```bash
1. Vercelダッシュボード → Analytics
2. Web Analytics: 有効化
3. Function Analytics: 有効化  
4. パフォーマンス監視開始
```

### 6.2 エラー追跡

```bash
# ログ確認
1. Vercelダッシュボード → Functions
2. 各API関数のログ確認
3. エラー発生時の詳細確認

# アラート設定
1. Settings → Notifications
2. Deploy failed, Function errors 設定
```

---

## 🚨 トラブルシューティング

### よくある問題と解決策

#### 1. **ビルドエラー**
```bash
Error: Could not resolve "pdf-parse-new"
→ 解決: package.json の dependencies 確認
→ npm install pdf-parse-new
```

#### 2. **環境変数エラー**  
```bash
Error: NEO4J_URI is not defined
→ 解決: Vercel Environment Variables で設定確認
→ Production, Preview, Development すべてに設定
```

#### 3. **Neo4j接続エラー**
```bash
Error: Unable to connect to Neo4j
→ 解決: 
  1. Neo4j Aura ダッシュボードで接続確認
  2. パスワード再発行
  3. IP制限設定確認
```

#### 4. **ファイルアップロードエラー**
```bash
Error: Function timeout
→ 解決:
  1. vercel.json で maxDuration: 300 設定確認
  2. ファイルサイズ制限確認（20MB以下）
```

#### 5. **Tavily API エラー**
```bash
Error: Tavily API key invalid  
→ 解決:
  1. https://tavily.com でAPI key確認
  2. 月間制限(1,000回)確認
  3. 環境変数の正確性確認
```

---

## 📋 デプロイメント チェックリスト

### 🔧 **デプロイ前**
- [ ] GitHubリポジトリ作成・push完了
- [ ] Anthropic API key 取得
- [ ] Tavily API key 取得  
- [ ] Neo4j Aura 接続情報確認
- [ ] `.env.local` の機密情報削除確認

### 🚀 **デプロイ中**
- [ ] Vercelプロジェクト作成
- [ ] GitHub連携設定
- [ ] 環境変数設定完了
- [ ] ビルド成功確認

### ✅ **デプロイ後**
- [ ] サイトアクセス確認
- [ ] PDFアップロード機能テスト
- [ ] チャット機能テスト  
- [ ] メンバーダッシュボードテスト
- [ ] エラー監視設定
- [ ] パフォーマンス監視設定

---

## 🎯 次のステップ

デプロイ成功後:

1. **Week 7: 運用開始**
   - モニタリング設定詳細化
   - ドキュメント公開
   - GAIS会員向け正式リリース

2. **継続的改善**  
   - ユーザーフィードバック収集
   - パフォーマンス最適化
   - 新機能追加

---

**🔗 有用なリンク**
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)  
- [Neo4j Aura](https://neo4j.com/cloud/aura/)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Tavily API Docs](https://docs.tavily.com/)