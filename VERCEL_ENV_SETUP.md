# Vercel 環境変数設定ガイド

## 必要な環境変数

Vercelのダッシュボードで以下の環境変数を設定してください：

### 1. Anthropic API
- **変数名**: `ANTHROPIC_API_KEY`
- **値**: `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`

### 2. Neo4j Database
- **変数名**: `NEO4J_URI`
- **値**: `neo4j+s://12cc4171.databases.neo4j.io`

- **変数名**: `NEO4J_USER`
- **値**: `neo4j`

- **変数名**: `NEO4J_PASSWORD`
- **値**: `gFngWZB5B6CPwfr4xR8y2HkuOHj9Uz84zlNHRuSYTDU`

### 3. 検索API (どちらか一つ)
- **変数名**: `TAVILY_API_KEY`
- **値**: `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`

または

- **変数名**: `SERPAPI_KEY`
- **値**: `b355080d29863ea88c5690811f0f5b7a918ef4f20eefc01b909752d2a6b949b7`

### 4. 追加の環境変数（必要に応じて）
- **変数名**: `NEXT_PUBLIC_NEO4J_URI`
- **値**: `neo4j+s://bf116132.databases.neo4j.io`

## 設定手順

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクト `graph-rag-chatbot-vercel-100` を選択
3. "Settings" タブをクリック
4. 左側のメニューから "Environment Variables" を選択
5. 上記の環境変数を一つずつ追加：
   - "Key" に変数名を入力
   - "Value" に値を入力
   - "Production", "Preview", "Development" 全てにチェック
   - "Save" をクリック
6. 全ての環境変数を追加したら、プロジェクトを再デプロイ

## 再デプロイ方法

1. "Deployments" タブに移動
2. 最新のデプロイメントの右側の "..." メニューをクリック
3. "Redeploy" を選択
4. "Redeploy" ボタンをクリック

## 確認事項

- 環境変数名は大文字・小文字を正確に入力してください
- 値の前後に余分なスペースがないことを確認してください
- APIキーは引用符なしで入力してください