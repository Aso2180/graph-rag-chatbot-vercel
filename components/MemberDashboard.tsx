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
  defaultDocuments: DocumentInfo[];
}

interface DocumentInfo {
  title: string;
  fileName: string;
  uploadedAt: string;
  pageCount: number;
  chunkCount: number;
}

interface DocumentChunk {
  text: string;
  chunkIndex: number;
  pageNumber: number;
}

interface DocumentContent {
  title: string;
  fileName: string;
  pageCount: number;
  chunks: DocumentChunk[];
}

interface MemberDashboardProps {
  memberEmail: string;
}

export default function MemberDashboard({ memberEmail }: MemberDashboardProps) {
  const [stats, setStats] = useState<MemberStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentContent | null>(null);
  const [loadingFileName, setLoadingFileName] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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
      
      // Check if data contains an error flag but still has stats
      if (data.error && data.documentCount !== undefined) {
        // Database is unavailable but we have placeholder data
        setStats(data);
        setError(null); // Don't show error if we have data
      } else {
        setStats(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load member statistics');
      console.error('Member stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentContent = async (fileName: string) => {
    setLoadingFileName(fileName);
    try {
      const response = await fetch(`/api/document-content?fileName=${encodeURIComponent(fileName)}`);

      if (!response.ok) {
        throw new Error('ドキュメント内容の取得に失敗しました');
      }

      const data = await response.json();
      setSelectedDocument(data);
      setShowModal(true);
    } catch (err) {
      console.error('Document content fetch error:', err);
      alert(err instanceof Error ? err.message : 'ドキュメント内容の取得に失敗しました');
    } finally {
      setLoadingFileName(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDocument(null);
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

      {/* デフォルトドキュメント（全会員共通） */}
      {stats.defaultDocuments && Array.isArray(stats.defaultDocuments) && stats.defaultDocuments.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-700 flex items-center">
              <span className="mr-2">📚</span>
              デフォルトドキュメント（全会員共通）
            </CardTitle>
            <p className="text-sm text-green-600 mt-1">
              これらのドキュメントは全会員が利用可能なデフォルトの法的リスク分析資料です
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.defaultDocuments.map((doc, index) => (
                <div key={index} className="border border-green-300 bg-white rounded-lg p-4 hover:bg-green-50 transition-colors">
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
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        デフォルト
                      </span>
                      <button
                        onClick={() => fetchDocumentContent(doc.fileName)}
                        disabled={loadingFileName !== null}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {loadingFileName === doc.fileName ? '読込中...' : '内容を見る'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* ドキュメント内容表示モーダル */}
      {showModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedDocument.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDocument.pageCount}ページ | {selectedDocument.chunks.length}チャンク
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {selectedDocument.chunks.map((chunk, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        チャンク {chunk.chunkIndex + 1} {chunk.pageNumber && `(ページ ${chunk.pageNumber})`}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {chunk.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}