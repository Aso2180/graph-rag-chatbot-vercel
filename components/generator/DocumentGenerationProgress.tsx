'use client';

import { DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/document';

type DocumentStatus = 'pending' | 'generating' | 'completed' | 'error';

interface DocumentProgress {
  type: DocumentType;
  status: DocumentStatus;
  error?: string;
}

interface DocumentGenerationProgressProps {
  documentTypes: DocumentType[];
  progress: DocumentProgress[];
  completed: number;
  total: number;
  estimatedTimeRemaining?: number;
}

export function DocumentGenerationProgress({
  documentTypes,
  progress,
  completed,
  total,
  estimatedTimeRemaining,
}: DocumentGenerationProgressProps) {
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'pending':
        return <span className="text-gray-400">⏳</span>;
      case 'generating':
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
          </div>
        );
      case 'completed':
        return <span className="text-green-500 text-xl">✓</span>;
      case 'error':
        return <span className="text-red-500 text-xl">⚠</span>;
    }
  };

  const getStatusText = (status: DocumentStatus) => {
    switch (status) {
      case 'pending':
        return '待機中';
      case 'generating':
        return '生成中...';
      case 'completed':
        return '完了';
      case 'error':
        return 'エラー';
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'generating':
        return 'text-blue-600 font-semibold';
      case 'completed':
        return 'text-green-600 font-semibold';
      case 'error':
        return 'text-red-600 font-semibold';
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `約${seconds}秒`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `約${minutes}分`;
    }
    return `約${minutes}分${remainingSeconds}秒`;
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-200 p-3 sm:p-6 space-y-3 sm:space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-gray-800">文書生成中</h3>
        <div className="text-xs sm:text-sm text-gray-600">
          {completed} / {total} 完了
        </div>
      </div>

      {/* プログレスバー */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs text-gray-600">
          <span>{Math.round(progressPercentage)}% 完了</span>
          {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
            <span className="font-medium text-blue-600">
              残り {formatTime(estimatedTimeRemaining)}
            </span>
          )}
        </div>
      </div>

      {/* 文書別の進捗 */}
      <div className="space-y-1.5 sm:space-y-2">
        {documentTypes.map((docType) => {
          const docProgress = progress.find((p) => p.type === docType);
          const status = docProgress?.status || 'pending';

          return (
            <div
              key={docType}
              className={`
                flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-all
                ${status === 'generating' ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}
              `}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-6 sm:w-8 flex justify-center flex-shrink-0">{getStatusIcon(status)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                    {DOCUMENT_TYPE_LABELS[docType]}
                  </p>
                  <p className={`text-[10px] sm:text-xs ${getStatusColor(status)}`}>
                    {getStatusText(status)}
                    {docProgress?.error && ` (${docProgress.error})`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ヒント */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
        <p className="text-[10px] sm:text-xs text-blue-800">
          💡 複数の文書を並列で生成しています。このウィンドウを閉じずにお待ちください。
        </p>
      </div>
    </div>
  );
}
