import { NextRequest, NextResponse } from 'next/server';

// レート制限の設定
export const RATE_LIMIT_CONFIG = {
  chat: {
    windowMs: 60 * 60 * 1000,    // 1時間
    maxRequests: 100,             // 100リクエスト/時間
  },
  upload: {
    windowMs: 24 * 60 * 60 * 1000, // 24時間
    maxRequests: 10,               // 10ファイル/日
  },
  graphSearch: {
    windowMs: 60 * 60 * 1000,    // 1時間
    maxRequests: 200,             // 200リクエスト/時間
  },
  webSearch: {
    windowMs: 60 * 60 * 1000,    // 1時間
    maxRequests: 50,              // 50リクエスト/時間
  },
} as const;

// メモリベースのレート制限ストア（本番環境ではRedisを推奨）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// クリーンアップ関数
const cleanupOldEntries = () => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (value.resetTime < now) {
      requestCounts.delete(key);
    }
  }
};

// 定期的にクリーンアップ
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldEntries, 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMIT_CONFIG
): RateLimitResult {
  const limits = RATE_LIMIT_CONFIG[endpoint];
  const rateLimitKey = `${endpoint}:${identifier}`;
  const now = Date.now();
  
  const record = requestCounts.get(rateLimitKey);

  if (!record || record.resetTime < now) {
    // 新しいウィンドウを開始
    requestCounts.set(rateLimitKey, {
      count: 1,
      resetTime: now + limits.windowMs,
    });
    
    return {
      allowed: true,
      limit: limits.maxRequests,
      remaining: limits.maxRequests - 1,
      resetTime: now + limits.windowMs,
    };
  } else if (record.count >= limits.maxRequests) {
    // レート制限に達した
    return {
      allowed: false,
      limit: limits.maxRequests,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    };
  } else {
    // カウントを増やす
    record.count++;
    requestCounts.set(rateLimitKey, record);
    
    return {
      allowed: true,
      limit: limits.maxRequests,
      remaining: limits.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }
}

export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  if (!result.allowed) {
    const resetDate = new Date(result.resetTime);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `リクエスト制限に達しました。${resetDate.toLocaleString('ja-JP')}以降に再試行してください。`,
        resetTime: result.resetTime,
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': result.retryAfter?.toString() || '60',
        }
      }
    );
  }
  
  return NextResponse.next();
}

// レート制限ヘッダーを追加
export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): void {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
}

// IPアドレス取得のヘルパー関数
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}