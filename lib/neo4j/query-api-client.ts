import { env } from '@/lib/config/env';

interface QueryAPIResponse {
  data: {
    fields: string[];
    values: any[][];
  };
  bookmarks?: string[];
}

interface QueryAPIError {
  errors: Array<{
    code: string;
    message: string;
  }>;
}

export class Neo4jQueryAPIClient {
  private baseUrl: string;
  private auth: string;

  constructor() {
    const uri = env.NEO4J_URI || 'neo4j+s://bf116132.databases.neo4j.io';
    const username = env.NEO4J_USER || 'neo4j';
    const password = env.NEO4J_PASSWORD || '';
    
    console.log('Neo4j URI:', uri);
    
    // neo4j+s://bf116132.databases.neo4j.io から https://bf116132.databases.neo4j.io/db/neo4j/query/v2 に変換
    const hostname = uri.replace('neo4j+s://', '').replace('neo4j://', '');
    this.baseUrl = `https://${hostname}/db/neo4j/query/v2`;
    
    console.log('Query API URL:', this.baseUrl);
    
    // Basic認証ヘッダーを作成
    this.auth = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }

  async run(statement: string, parameters: Record<string, any> = {}): Promise<any[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.auth,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          statement,
          parameters
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as QueryAPIError;
        throw new Error(error.errors?.[0]?.message || 'Query execution failed');
      }

      const result = data as QueryAPIResponse;
      
      // Neo4j Driver形式の結果に変換
      return result.data.values.map(row => {
        const record: Record<string, any> = {};
        result.data.fields.forEach((field, index) => {
          record[field] = convertNeo4jValue(row[index]);
        });
        return {
          get: (key: string) => record[key],
          toObject: () => record,
          keys: () => result.data.fields,
          has: (key: string) => key in record
        };
      });
    } catch (error) {
      console.error('Query API error:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // Query APIはステートレスなので、closeは何もしない
  }
}

// Neo4j Driverと互換性のあるセッションクラス
export class QueryAPISession {
  private client: Neo4jQueryAPIClient;

  constructor(client: Neo4jQueryAPIClient) {
    this.client = client;
  }

  async run(statement: string, parameters?: Record<string, any>): Promise<{ records: any[] }> {
    const records = await this.client.run(statement, parameters);
    return { records };
  }

  async close(): Promise<void> {
    // Query APIはステートレスなので、closeは何もしない
  }
}

// Neo4j特有のプロパティを扱うヘルパー関数
export function convertNeo4jValue(value: any): any {
  // Neo4j整数型の処理
  if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
    return value.low;
  }
  // 配列の処理
  if (Array.isArray(value)) {
    return value.map(v => convertNeo4jValue(v));
  }
  // オブジェクトの処理
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const converted: any = {};
    for (const key in value) {
      converted[key] = convertNeo4jValue(value[key]);
    }
    return converted;
  }
  return value;
}

// Neo4j Driver互換のインターフェース
export function getSession(): QueryAPISession {
  try {
    const client = new Neo4jQueryAPIClient();
    return new QueryAPISession(client);
  } catch (error) {
    console.error('Failed to create Neo4j session:', error);
    throw new Error('Database connection configuration error');
  }
}