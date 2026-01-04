import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// このAPIは定期的に呼び出されることを想定（例：Vercel Cron Jobs、Azure Functions Timer Trigger）
export async function POST(request: NextRequest) {
  try {
    // 自動学習APIを呼び出す
    const response = await axios.get(`${getBaseUrl()}/api/learn`);
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled learning completed',
      learnResult: response.data,
      nextScheduled: getNextScheduledTime(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scheduled learn error:', error);
    return NextResponse.json(
      { error: 'Scheduled learning failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Schedule Learn API',
    description: 'このエンドポイントは定期的な自動学習をトリガーします。',
    recommendedSchedule: {
      frequency: 'daily',
      preferredTime: '02:00 JST',
      reason: 'AI関連の法的規制は頻繁に更新されるため、毎日チェックすることを推奨'
    },
    azureCronExpression: '0 0 2 * * *', // 毎日午前2時
    vercelCronExpression: '0 2 * * *'   // 毎日午前2時
  });
}

function getNextScheduledTime(): string {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(2, 0, 0, 0); // 次の日の午前2時
  return next.toISOString();
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  return '';
}