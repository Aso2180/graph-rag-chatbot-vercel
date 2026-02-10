# デフォルトドキュメント設定ガイド

このガイドでは、全会員が共通で利用できるデフォルトドキュメントの設定方法を説明します。

## 概要

デフォルトドキュメントとは、全GAIS会員が最初からGraphRAGで利用できる共通ドキュメントです。
個々の会員がアップロードするPDFとは別に、常にグラフ検索とダッシュボードに表示されます。

## 実装内容

### 1. API エンドポイント

#### `/api/admin/default-documents` (POST)
特定のドキュメントをデフォルトとしてマークします。

**リクエスト:**
```json
{
  "fileName": "1767699267660-エンターテイメント活用のAI法的リスク.pdf",
  "isDefault": true
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Document marked as default",
  "document": {
    "title": "...",
    "fileName": "...",
    "isDefault": true,
    "uploadedBy": "..."
  }
}
```

#### `/api/admin/default-documents` (GET)
現在のデフォルトドキュメントのリストを取得します。

**レスポンス:**
```json
{
  "success": true,
  "count": 2,
  "documents": [
    {
      "title": "...",
      "fileName": "...",
      "uploadedBy": "...",
      "pageCount": 10,
      "chunkCount": 50,
      "isDefault": true
    }
  ]
}
```

### 2. 設定手順

#### ステップ 1: ドキュメントをアップロード

まず、aso@tcl.co.jp のアカウントで以下の2つのPDFをアップロードします：

1. `ai-legal-risks-entertainment.md` / `1767699267660-エンターテイメント活用のAI法的リスク.pdf`
2. `AIビジネス活用の法的リスクと権利：日本法実務ガイド` / `1767699311752-AIビジネス活用の法的リスクと権利：日本法実務ガイド.pdf`

#### ステップ 2: デフォルトドキュメントとして設定

開発サーバーを起動します：
```bash
npm run dev
```

curlコマンドまたはPostmanを使用してデフォルト設定を行います：

```bash
# ドキュメント1をデフォルト化
curl -X POST http://localhost:3000/api/admin/default-documents \
  -H "Content-Type: application/json" \
  -d '{"fileName":"1767699267660-エンターテイメント活用のAI法的リスク.pdf","isDefault":true}'

# ドキュメント2をデフォルト化
curl -X POST http://localhost:3000/api/admin/default-documents \
  -H "Content-Type: application/json" \
  -d '{"fileName":"1767699311752-AIビジネス活用の法的リスクと権利：日本法実務ガイド.pdf","isDefault":true}'
```

#### ステップ 3: 確認

デフォルトドキュメントのリストを確認します：

```bash
curl -X GET http://localhost:3000/api/admin/default-documents
```

#### ステップ 4: ダッシュボードで確認

任意の会員アカウントでログインし、ダッシュボードを確認します。
「デフォルトドキュメント（全会員共通）」セクションに2つのPDFが表示されることを確認します。

### 3. 機能説明

#### graph-search API
グラフ検索では、デフォルトドキュメント（`isDefault = true`）を優先的に表示します：
- デフォルトドキュメントはスコア 1.8 で優先表示
- 全ユーザーの検索結果に含まれる

#### member-stats API
ダッシュボード統計では、デフォルトドキュメントを別セクションで表示：
- 各会員の個人ドキュメント統計
- 全会員共通のデフォルトドキュメント一覧

#### MemberDashboard コンポーネント
ダッシュボードUIに新しいセクションが追加されました：
- 緑色のカードでデフォルトドキュメントを表示
- 📚 アイコンで視覚的に区別
- 全会員が常に閲覧可能

### 4. Neo4j データベース構造

デフォルトドキュメントは `Document` ノードに `isDefault` プロパティを追加：

```cypher
// デフォルトドキュメントをマーク
MATCH (d:Document)
WHERE d.fileName = "1767699267660-エンターテイメント活用のAI法的リスク.pdf"
SET d.isDefault = true

// デフォルトドキュメントを取得
MATCH (d:Document)
WHERE d.isDefault = true
RETURN d
```

### 5. トラブルシューティング

#### ドキュメントが見つからない
```bash
# 全ドキュメントのリストを確認
curl -X GET "http://localhost:3000/api/member-stats?email=aso@tcl.co.jp"
```

#### Neo4j接続エラー
環境変数を確認：
- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`

#### デフォルトドキュメントが表示されない
ブラウザのキャッシュをクリアしてページを再読み込み

### 6. セキュリティ注意事項

- `/api/admin/default-documents` エンドポイントは管理者のみアクセス可能にする必要があります
- 本番環境では認証ミドルウェアを追加してください
- デフォルトドキュメントは全会員に公開されるため、機密情報を含めないでください

## まとめ

この実装により：
1. ✅ 2つのPDFがデフォルトドキュメントとして設定可能
2. ✅ 全会員が最初からこれらのドキュメントを利用可能
3. ✅ グラフ検索で優先的に表示
4. ✅ ダッシュボードで常に閲覧可能
5. ✅ 個人ドキュメントとは別管理

次のステップ：
- 本番環境へのデプロイ
- 管理者認証の実装
- デフォルトドキュメント管理UIの作成（オプション）
