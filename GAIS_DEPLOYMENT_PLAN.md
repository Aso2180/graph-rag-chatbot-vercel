# GAIS GraphRAG Chatbot 構築・デプロイメント計画

## プロジェクト概要
**プロジェクト名**: AI使用上の法的リスク分析GraphRAG Chatbot for GAIS  
**目的**: 生成AI協会（GAIS）会員向けのAI使用上の法的リスク検討支援システム  
**公開形態**: パブリックURL（オープンアクセス）  
**参考サイト**: https://gais.jp/

## システム要件

### 主要機能
1. **会員資料アップロード機能**
   - メールアドレスによる投稿者識別
   - アップロード日時の自動記録
   - PDF形式の法的資料受付

2. **GraphRAG学習機能**
   - アップロードされた資料の自動解析
   - Neo4j Auraへのグラフデータ保存
   - エンティティ抽出と関係性マッピング

3. **統合検索機能**
   - Neo4jデータベース内の学習済みデータ検索
   - 最新Web情報の並行検索
   - 両ソースからの統合回答生成

4. **法的リスク分析機能**
   - Claude AIによる専門的な分析
   - 最新事例の参照
   - 実務的な対策提案

## 構築手順

### Phase 1: UI/UXの改修（優先度: 高）

#### 1.1 トップページの更新
```typescript
// app/page.tsx の修正内容
- タイトル: "AI使用上の法的リスク分析 GraphRAG Chatbot for GAIS"
- サブタイトル: "生成AI協会会員向け法的リスク検討支援システム"
- GAISロゴの追加（https://gais.jp/ を参考に作成）
```

#### 1.2 会員メールアドレス入力機能の実装
```typescript
// components/ChatInterface.tsx に追加
- メールアドレス入力フィールド（PDFアップロード時に必須）
- バリデーション機能（メールアドレス形式チェック）
```

#### 1.3 免責事項の表示
```typescript
// components/LegalDisclaimer.tsx を新規作成
- 表示位置: チャット画面上部の固定バナー
- 内容: "本システムの情報は参考用です。実務使用時は必ず専門家による確認を行ってください。"
- 閉じるボタン付き（セッション中は再表示なし）
```

### Phase 2: バックエンド機能拡張（優先度: 高）

#### 2.1 メールアドレス管理システム
```typescript
// lib/member/validation.ts を新規作成
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

#### 2.2 Neo4jスキーマの更新
```cypher
// 新しいプロパティを追加
(:Document {
  // 既存のプロパティ
  title: String,
  fileName: String,
  // 新規追加
  uploadedBy: String,    // メールアドレス
  uploadedAt: DateTime,  // アップロード日時
  organization: String   // "GAIS" 固定値
})
```

#### 2.3 アップロードAPIの更新
```typescript
// app/api/upload/route.ts の修正
- メールアドレスパラメータの受付
- アップロード履歴の記録
- Neo4jへの投稿者情報保存
```

### Phase 3: セキュリティ・アクセス管理（優先度: 中）

#### 3.1 レート制限の実装
```typescript
// middleware.ts を新規作成
- IPベースのレート制限（1時間あたり100リクエスト）
- メールアドレスごとのアップロード制限（1日10ファイルまで）
```

#### 3.2 コンテンツモデレーション
```typescript
// lib/moderation/content-check.ts
- アップロードファイルのサイズ制限（20MB）
- ファイル形式の検証（PDF only）
```

### Phase 4: 本番環境デプロイ（優先度: 高）

#### 4.1 Vercelデプロイメント設定
```bash
# vercel.json
{
  "functions": {
    "app/api/chat/route.ts": {
      "maxDuration": 60
    },
    "app/api/upload/route.ts": {
      "maxDuration": 30
    }
  }
}
```

#### 4.2 環境変数の設定
```env
# Production環境変数
ANTHROPIC_API_KEY=your_production_key
NEO4J_URI=neo4j+s://bf116132.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
SERPAPI_API_KEY=your_serpapi_key
NEXT_PUBLIC_APP_URL=https://gais-legal-risk-ai.vercel.app
```

#### 4.3 Neo4j Aura設定
- Production用インデックスの作成
- バックアップスケジュールの設定
- アクセスログの有効化

### Phase 5: 運用準備（優先度: 中）

#### 5.1 モニタリング設定
- Vercel Analyticsの有効化
- エラーログの収集
- 使用状況ダッシュボードの作成

#### 5.2 ドキュメント整備
- 利用ガイドの作成（GAIS会員向け）
- FAQ ページの実装

## 実装優先順位

### Week 1-2: 基本機能の実装
1. UI/UXの改修（Phase 1）
2. メールアドレス管理システムの実装（Phase 2.1）
3. 免責事項表示の実装

### Week 3-4: バックエンド強化
1. Neo4jスキーマ更新（Phase 2.2）
2. アップロードAPI更新（Phase 2.3）
3. セキュリティ機能の実装（Phase 3）

### Week 5-6: デプロイメント
1. Vercelへのデプロイ（Phase 4.1）
2. 本番環境設定（Phase 4.2-4.3）
3. 初期テスト実施

### Week 7: 運用開始
1. モニタリング設定（Phase 5.1）
2. ドキュメント公開（Phase 5.2）
3. 正式リリース

## チェックリスト

### 開発環境
- [ ] メールアドレス入力機能の実装
- [ ] 免責事項バナーの実装
- [ ] Neo4jスキーマの更新
- [ ] アップロードAPIのメールアドレス対応
- [ ] レート制限の実装

### デザイン・UI
- [ ] GAISブランディングの適用
- [ ] レスポンシブデザインの確認

### セキュリティ
- [ ] 入力値バリデーション
- [ ] XSS対策
- [ ] CSRF対策
- [ ] SQLインジェクション対策（Cypher）

### 本番環境
- [ ] Vercelデプロイメント
- [ ] カスタムドメイン設定
- [ ] SSL証明書設定
- [ ] CDN設定

### 運用
- [ ] バックアップ自動化
- [ ] モニタリング設定
- [ ] アラート設定

## 注意事項

1. **データプライバシー**
   - アップロードされた資料は全会員に共有される前提で設計
   - 機密情報を含む資料のアップロードは禁止する旨を明記

2. **法的責任**
   - AIの回答は参考情報である旨を常に表示
   - 最終的な判断は専門家に相談するよう促す

3. **スケーラビリティ**
   - 将来的な会員数増加を想定した設計
   - Neo4j Auraのプラン見直しタイミングの設定

---
最終更新: 2025-12-31