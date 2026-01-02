'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MemberStatistics {
  memberEmail: string;
  organization: string;
  documentCount: number;
  totalPages: number;
  totalChunks: number;
  lastUploadDate: string | null;
  recentDocuments: DocumentInfo[];
}

interface DocumentInfo {
  title: string;
  fileName: string;
  uploadedAt: string;
  pageCount: number;
  chunkCount: number;
}

interface MemberDashboardProps {
  memberEmail: string;
}

export default function MemberDashboard({ memberEmail }: MemberDashboardProps) {
  const [stats, setStats] = useState<MemberStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberEmail) {
      fetchMemberStats();
    }
  }, [memberEmail]);

  const fetchMemberStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/member-stats?email=${encodeURIComponent(memberEmail)}`);
      
      if (!response.ok) {
        throw new Error(`Statistics fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load member statistics');
      console.error('Member stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未アップロード';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-blue-600">会員ダッシュボード</div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-blue-600">会員ダッシュボード</div>
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-red-600">
              <p className="font-medium">エラーが発生しました</p>
              <p className="text-sm mt-1">{error}</p>
              <button 
                onClick={fetchMemberStats}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                再試行
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-blue-600">会員ダッシュボード</div>
        <Card>
          <CardContent className="p-4">
            <p>統計データが見つかりません。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blue-600">会員ダッシュボード</h2>
        <button 
          onClick={fetchMemberStats}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          更新
        </button>
      </div>

      {/* 会員情報サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">アップロード済み文書</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900">{stats.documentCount}</div>
            <div className="text-xs text-blue-600 mt-1">文書</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">総ページ数</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900">{stats.totalPages}</div>
            <div className="text-xs text-green-600 mt-1">ページ</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">分析チャンク数</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900">{stats.totalChunks}</div>
            <div className="text-xs text-purple-600 mt-1">チャンク</div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">最終アップロード</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm font-medium text-orange-900">{formatDate(stats.lastUploadDate)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 会員情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-600">会員情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600">メールアドレス</div>
              <div className="text-base mt-1">{stats.memberEmail}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">組織</div>
              <div className="text-base mt-1 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                  {stats.organization}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アップロード履歴 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-600">最近のアップロード</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentDocuments.length === 0 ? (
            <p className="text-gray-500">アップロードされた文書はありません。</p>
          ) : (
            <div className="space-y-3">
              {stats.recentDocuments.map((doc, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{doc.fileName}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{doc.pageCount}ページ</span>
                        <span>{doc.chunkCount}チャンク</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        処理済み
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}