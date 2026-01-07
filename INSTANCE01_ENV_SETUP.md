# Instance01 環境変数設定ガイド

## 新しいInstance01（有料版）の環境変数

Vercelのダッシュボードで以下の環境変数を設定してください：

### 1. Neo4j Database (Instance01)
- **変数名**: `NEO4J_URI`
- **値**: `neo4j+s://12cc4171.databases.neo4j.io`

- **変数名**: `NEO4J_USER`
- **値**: `neo4j`

- **変数名**: `NEO4J_PASSWORD`
- **値**: `gFngWZB5B6CPwfr4xR8y2HkuOHj9Uz84zlNHRuSYTDU`

### 2. AI API Keys（既存のまま）
- **変数名**: `ANTHROPIC_API_KEY`
- **値**: `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`

### 3. 検索API（既存のまま）
- **変数名**: `TAVILY_API_KEY`
- **値**: `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`

## Instance01の特徴
- **リージョン**: Azure / Asia Pacific, Seoul (koreacentral)
- **メモリ**: 4GB（2GBから倍増）
- **ストレージ**: 8GB（4GBから倍増）
- **タイプ**: AuraDB Professional
- **パフォーマンス**: より高速で安定

## 設定手順
1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択
3. "Settings" → "Environment Variables"
4. 上記の環境変数を更新：
   - NEO4J_URI: 新しいInstance01のURI
   - NEO4J_PASSWORD: 新しいInstance01のパスワード
5. "Production", "Preview", "Development" 全てにチェック
6. "Save" をクリック
7. プロジェクトを再デプロイ

## 接続テスト
更新後、以下で接続をテスト：
- https://[your-domain]/api/test-upload
- https://[your-domain]/test-upload.html

## Instance01の利点
- より高いメモリとストレージ
- Seoul リージョンによる低レイテンシ（日本から）
- 安定したパフォーマンス