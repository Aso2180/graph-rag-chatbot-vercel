// Query API実装を使用
export { getSession, QueryAPISession as Session } from './query-api-client';

// 後方互換性のためのダミー実装
export async function closeDriver(): Promise<void> {
  // Query APIはステートレスなので何もしない
}