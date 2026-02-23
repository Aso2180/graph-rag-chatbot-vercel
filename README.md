# GAIS AI使用上の法的リスク分析システム

生成AI協会（GAIS）会員向けの、AI利用に関する法的リスク診断から利用規約生成までを一貫して支援する専門的なWebアプリケーションです。

## 🎯 アプリの目的

### 背景・課題

日本では生成AIの活用が諸外国に比して遅れており、効果的な活用方法が分からないことに加え、**生成AIに対する懸念が非常に高く、AI活用を阻害しています**。総務省（2025）「国内外における最新の情報通信技術の研究開発及びデジタル活用の動向に関する調査研究」によれば、**78.4%が生成AIのリスクを懸念**しています。

### 解決アプローチ

本アプリケーション「生成AI使用上の法的リスク分析」は、この課題を解消し、日本でのAI活用促進を目的として開発されました。

**主要な解決策:**
- ✅ **作成予定アプリに対する法的リスクの可視化**: 3段階評価（HIGH/MEDIUM/LOW）で直感的に理解
- ✅ **規約等のドラフトをAIが自動作成**: 5種類の法的文書をストリーミング生成
- ✅ **リスクを的確に想定した取り組みによるリスク最小化**: GraphRAGによる正確な分析
- ✅ **社内外ステークホルダーの懸念解消**: 専門的なリスクレポートと明確な対応策

### 技術的な差別化ポイント

**GraphRAG（Neo4j）採用による高精度分析:**
- 法的知識をグラフ構造で保存し、関連性を正確に把握
- PDF・GitHubからの法的資料自動取り込みで知識ベース拡張
- Web検索（Tavily）との並列処理で最新の法規制・判例に対応

**直感的で使いやすいUX設計:**
- 最小の選択項目でリスクアドバイスを取得可能
- 3ステップ表示のツアーガイド機能でプロセスを直感的に把握
- 戻る・進むの自在なナビゲーションによる快適な操作性
- 生成文書の別ウィンドウ拡大表示・コピー・MDダウンロード機能

**最適化された高速生成:**
- Server-Sent Events（SSE）による並列ストリーミング生成
- 残り時間表示によるUX向上
- Claude Sonnet 4.5による専門的な法的分析

**わかりやすい活用事例:**
- 初回アクセス時の動画再生機能（1分26秒）
- 実際の利用フローを視覚的に理解

## 🎯 主要機能

### 1. 詳細診断ウィザード（5ステップ）
1. **基本情報入力**: アプリケーション名、概要、料金モデル（7種類）
2. **AI利用状況**:
   - AI技術（12種類）: LLM、画像生成、音声認識、OCR、顔認識、感情分析など
   - AIプロバイダー（11種類）: OpenAI、Anthropic、Google、Microsoft、Amazonなど
   - ユースケース（13種類）: カスタマーサポート、コンテンツ作成、データ分析など
3. **データ取扱**:
   - 入力データ種別（13種類）: テキスト、個人情報、生体情報、医療情報など
   - データ送信先（3種類）: 外部API、ローカル処理、両方
   - データ保存・利用（8種類）: 保存なし、セッションのみ、短期/長期保存など
4. **想定ユーザー（14種類）**: 一般消費者、企業、社内、開発者、子ども、EU域内など
5. **懸念リスク（15項目）**: 著作権、プライバシー、差別、誤情報、セキュリティなど

### 2. AI法的リスク分析
- **分析エンジン**: Claude Sonnet 4.5による専門的評価
- **統合検索**: GraphRAG（Neo4j）+ Web検索（Tavily）の並列処理
- **リスク判定**: HIGH/MEDIUM/LOWの3段階評価
- **出力内容**:
  - エグゼクティブサマリー
  - 詳細リスク分析（著作権、プライバシー、法的責任など）
  - 優先対応アクション
  - 関連事例・判例

### 3. 法的文書自動生成（5種類）
1. **利用規約**: サービス利用条件、免責事項、準拠法
2. **プライバシーポリシー**: 個人情報保護方針、データ取扱
3. **AI免責事項**: AI機能の制限と正確性に関する免責
4. **社内リスクレポート**: 経営層向けリスク評価資料
5. **ユーザーガイドライン**: 安全な利用方法の案内

**特徴:**
- Server-Sent Events（SSE）によるストリーミング生成
- 複数文書の並列処理
- リアルタイムプレビュー・コピー・ダウンロード

### 4. GraphRAG統合検索
- **PDFアップロード**: 法的資料を自動解析（最大20MB）
- **Markdownインポート**: GitHubリポジトリからの一括取得
- **グラフデータベース**: Neo4j Auraで知識を構造化保存
- **Web検索統合**: Tavily APIで最新の法規制・判例を取得
- **ドキュメント管理**: メンバー別統計、一覧表示、削除機能

### 5. 3ステップフロー
**ステップ1: 利用状況入力**
- **基本情報**（4項目）: 社内利用、法人サービス、会員登録あり、外部API利用
- **AI生成コンテンツの種類**（4種類）: テキスト、画像、動画、音声
- **AI生成コンテンツの利用目的**（7種類）:
  - 社内利用（研修・教育）
  - 社内利用（業務効率化）
  - 会社案内・サービス紹介
  - 採用・リクルート
  - マーケティング・広告
  - 顧客向けサービス提供
  - 商品・製品への組込み
- **ファイルアップロード**: PDF/Markdown、GitHubリポジトリ連携

**ステップ2: リスク分析**
- 詳細診断ウィザード（5ステップ）実行
- AI法的リスク分析（最大5分）
- リアルタイムチャット相談機能
- リスクヒント表示

**ステップ3: 利用規約生成**
- 文書タイプ選択（最大5種類）
- 会社情報入力
- ストリーミング生成（最大5分）
- プレビュー・コピー・ダウンロード

### 6. メンバーダッシュボード
- アップロード統計（文書数、総ページ数、分析チャンク数）
- ドキュメント一覧・詳細表示
- ドキュメント削除機能
- アップロード履歴

### 7. 紹介動画モーダル
- 初回アクセス時に自動表示（localStorage管理）
- 最大化/最小化機能
- スキップ可能
- 「次回表示しない」オプション

## 🛠 技術スタック

### フロントエンド
- **Next.js 14.2.35** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS 4**

### バックエンド
- **Next.js API Routes** (Serverless Functions)
- **Anthropic Claude API** (Sonnet 4.5: claude-sonnet-4-5-20250929)
- **Neo4j Aura Professional** (GraphRAG)
- **Tavily API** (Web検索)

### ファイル処理
- **pdf-parse-new**: PDF解析
- **Markdown Parser**: MD文書処理

### デプロイ
- **Vercel** (ホスティング、Function実行時間設定あり)
- **Neo4j Aura** (クラウドデータベース)

## 🔒 セキュリティ機能

### 実装済み機能
- **メールアドレス検証**: GAIS会員メールアドレスによる識別
- **レート制限**（一部APIに実装）:
  - アップロード: 10ファイル/日
  - メンバー統計: 200リクエスト/時間
- **コンテンツモデレーション**:
  - ファイルタイプ検証（PDF/Markdown のみ許可）
  - ファイルサイズ制限（最大20MB）
  - ファイル名検証（実行可能ファイル除外、特殊文字制限）
  - 重複アップロード防止（1時間以内の同一ファイル）
- **環境変数管理**: API キーなどの機密情報の安全な保管

## 📦 セットアップ

### 1. 環境変数設定

`.env.local` ファイルを作成:

```bash
# Neo4j Database
NEO4J_URI=neo4j+s://[your-instance].databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=[your-password]

# AI Services
ANTHROPIC_API_KEY=[your-claude-api-key]
TAVILY_API_KEY=[your-tavily-api-key]

# Application (Optional)
NODE_ENV=development
```

### 2. 依存関係インストール

```bash
npm install
```

### 3. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 🚀 Vercelデプロイ

### 1. GitHubリポジトリ作成・プッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[username]/[repo-name].git
git push -u origin main
```

### 2. Vercelプロジェクト作成

1. [Vercel](https://vercel.com) にログイン
2. "New Project" → GitHubリポジトリをインポート
3. Framework Preset: **Next.js**
4. Root Directory: `./`
5. Build Command: `npm run build`
6. Node.js Version: **18.x**

### 3. 環境変数設定（Vercelダッシュボード）

必須環境変数:
```bash
NEO4J_URI=neo4j+s://[your-instance].databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=[your-password]
ANTHROPIC_API_KEY=[your-claude-api-key]
TAVILY_API_KEY=[your-tavily-api-key]
NODE_ENV=production
```

### 4. Vercel設定（vercel.json）

本プロジェクトには以下のFunction実行時間設定があります:
```json
{
  "functions": {
    "app/api/generator/generate-stream/route.ts": { "maxDuration": 300 },
    "app/api/diagnosis/analyze/route.ts": { "maxDuration": 300 },
    "app/api/chat/route.ts": { "maxDuration": 60 },
    "app/api/graph-search/route.ts": { "maxDuration": 60 }
  }
}
```

### 5. デプロイ

"Deploy" ボタンをクリック → 自動デプロイ開始

## 📚 使い方

### 基本フロー

1. **初回アクセス**: 紹介動画モーダル表示（1分26秒、29MB）
2. **ステップ1: 利用状況入力**
   - GAIS会員メールアドレス入力
   - 基本情報、コンテンツ種別、利用目的を選択
   - PDFアップロード / GitHubリポジトリ連携（オプション）
3. **ステップ2: リスク分析**
   - 詳細診断ウィザード（5ステップ）実行
   - AI法的リスク分析実行（最大5分）
   - リスクレベル判定（HIGH/MEDIUM/LOW）
   - 詳細レポート表示
   - チャットで追加質問可能
4. **ステップ3: 利用規約生成**
   - 文書タイプ選択（最大5種類）
   - 会社情報入力
   - 準拠法選択（日本法/EU法）
   - ストリーミング生成（最大5分）
   - プレビュー・コピー・ダウンロード

### PDF/MDアップロード

- **対応形式**: PDF（最大20MB）、Markdown
- **自動処理**: テキスト抽出 → チャンク分割 → Neo4jグラフ保存
- **GitHub連携**: パブリックリポジトリからMDファイル自動取得

## 📋 APIエンドポイント

### 本番用エンドポイント

| エンドポイント | 機能 | タイムアウト |
|--------------|------|------------|
| `/api/chat` | チャットメッセージ処理 | 60秒 |
| `/api/upload` | PDF/MDファイルアップロード | 標準 |
| `/api/import/github` | GitHubリポジトリからMD取得 | 標準 |
| `/api/diagnosis/analyze` | リスク診断分析 | 300秒 |
| `/api/generator/generate` | 文書生成（通常） | 標準 |
| `/api/generator/generate-stream` | 文書生成（SSE） | 300秒 |
| `/api/graph-search` | GraphRAG検索 | 60秒 |
| `/api/web-search` | Web検索 | 標準 |
| `/api/member-stats` | メンバー統計 | 標準 |
| `/api/document-content` | ドキュメント内容取得 | 標準 |
| `/api/document-delete` | ドキュメント削除 | 標準 |
| `/api/learn` | ドキュメント学習 | 標準 |
| `/api/admin/default-documents` | デフォルト文書管理 | 標準 |

### デバッグ用エンドポイント（開発環境のみ）

- `/api/debug` - デバッグ情報
- `/api/debug-neo4j` - Neo4j接続確認
- `/api/test-upload` - アップロードテスト
- `/api/schedule-learn` - 学習スケジュール

## 🎨 プロジェクト構造

```
graph-rag-chatbot-vercel/
├── app/
│   ├── api/                    # APIルート（17エンドポイント）
│   │   ├── chat/              # チャット処理
│   │   ├── diagnosis/         # リスク診断
│   │   ├── generator/         # 文書生成（2種類）
│   │   ├── upload/            # ファイルアップロード
│   │   ├── import/            # GitHub連携
│   │   ├── graph-search/      # GraphRAG検索
│   │   ├── web-search/        # Web検索
│   │   ├── member-stats/      # メンバー統計
│   │   ├── document-content/  # ドキュメント取得
│   │   ├── document-delete/   # ドキュメント削除
│   │   ├── learn/             # 学習処理
│   │   └── admin/             # 管理機能
│   ├── layout.tsx             # ルートレイアウト
│   └── page.tsx               # ホームページ
├── components/                 # 26個のTSXコンポーネント
│   ├── diagnosis/             # 診断関連
│   │   ├── DiagnosisWizard.tsx
│   │   ├── DiagnosisResult.tsx
│   │   ├── WizardProgress.tsx
│   │   └── steps/             # 診断5ステップ
│   ├── generator/             # 文書生成関連
│   │   ├── DocumentGenerator.tsx
│   │   ├── DocumentTypeSelector.tsx
│   │   ├── DocumentPreview.tsx
│   │   └── DocumentGenerationProgress.tsx
│   ├── steps/                 # メインフロー
│   │   ├── Step1UserContext.tsx
│   │   ├── Step2RiskAnalysis.tsx
│   │   ├── Step3TermsGeneration.tsx
│   │   ├── StepNavigation.tsx
│   │   ├── DiagnosisProgress.tsx
│   │   └── AdvancedSettings.tsx
│   ├── ui/                    # UIコンポーネント
│   │   ├── Modal.tsx
│   │   ├── Checkbox.tsx
│   │   ├── RadioGroup.tsx
│   │   └── card.tsx
│   ├── ChatInterface.tsx      # メインインターフェース
│   ├── MemberDashboard.tsx    # ダッシュボード
│   ├── VideoIntroModal.tsx    # 動画モーダル
│   └── LegalDisclaimer.tsx    # 免責事項
├── lib/                       # ユーティリティ（9ファイル）
│   ├── anthropic/             # Claude API連携
│   ├── neo4j/                 # Neo4j接続・クエリ
│   ├── member/                # メンバー管理・検証
│   ├── rate-limit/            # レート制限
│   ├── moderation/            # コンテンツモデレーション
│   ├── pdf/                   # PDF処理
│   └── config/                # 環境設定
├── types/                     # TypeScript型定義（4ファイル）
│   ├── chat.ts
│   ├── diagnosis.ts
│   ├── document.ts
│   └── userContext.ts
├── public/                    # 静的ファイル
│   ├── intro-video.mp4        # 紹介動画（29MB）
│   └── tane-kun.png           # マスコットキャラクター
├── vercel.json                # Vercel設定（Function実行時間）
├── package.json               # 依存関係
└── tsconfig.json              # TypeScript設定
```

## 🔧 トラブルシューティング

### ビルドエラー
```bash
# キャッシュクリア＆再インストール
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Neo4j接続エラー
- Neo4j Auraダッシュボードで接続情報確認
- パスワード再発行
- 環境変数の正確性確認（NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD）

### ファイルアップロードタイムアウト
- ファイルサイズ確認（20MB以下）
- `vercel.json`で該当APIの`maxDuration`設定確認

### 診断・生成処理のタイムアウト
- Vercel設定で最大300秒（5分）に設定済み
- それ以上かかる場合は入力データを簡素化

## ⚠️ 免責事項

**本ツールは情報提供を目的としており、法的アドバイスの代替ではありません。**

- 本アプリケーションが提供するリスク分析結果および生成される法的文書は、一般的な情報提供を目的としたものです
- 具体的な法的判断や意思決定を行う際は、必ず専門の弁護士等にご相談ください
- 本ツールの利用により生じたいかなる損害についても、開発者および生成AI協会（GAIS）は責任を負いかねます
- 生成されるAIコンテンツの正確性・完全性・適法性について保証するものではありません
- 各国・地域の法規制は頻繁に変更されるため、最新の法令・判例は必ず別途ご確認ください

## 📝 ライセンス

GAIS会員限定利用

## 🔗 関連リンク

- [生成AI協会（GAIS）](https://gais.jp/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Neo4j Aura](https://neo4j.com/cloud/aura/)
- [Tavily API](https://docs.tavily.com/)
- [Vercel Documentation](https://vercel.com/docs)

---

**最終更新日**: 2025年2月23日
**バージョン**: 2.0.0
**Node.js**: 18.x
**Next.js**: 14.2.35
