'use client';

import React, { useState } from 'react';
import { DiagnosisResult, RiskItem } from '@/types/diagnosis';

interface DiagnosisResultViewProps {
  result: DiagnosisResult;
  onReset: () => void;
  onChatWithResult?: () => void;
  onGenerateDocuments?: () => void;
}

const RISK_LEVEL_STYLES = {
  high: {
    bg: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-800',
    badge: 'bg-red-500 text-white',
    label: '高',
  },
  medium: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-500',
    text: 'text-yellow-800',
    badge: 'bg-yellow-500 text-white',
    label: '中',
  },
  low: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-800',
    badge: 'bg-green-500 text-white',
    label: '低',
  },
};

export function DiagnosisResultView({
  result,
  onReset,
  onChatWithResult,
  onGenerateDocuments,
}: DiagnosisResultViewProps) {
  const [expandedRisks, setExpandedRisks] = useState<Set<number>>(new Set());

  const overallStyle = RISK_LEVEL_STYLES[result.overallRiskLevel];

  const toggleRisk = (index: number) => {
    const newExpanded = new Set(expandedRisks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRisks(newExpanded);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className={`${overallStyle.bg} ${overallStyle.border} border-l-4 rounded-lg p-6`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {result.appName || 'AIアプリケーション'}の診断結果
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              診断日時: {formatDate(result.diagnosedAt)}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-600">総合リスクレベル</span>
            <span className={`${overallStyle.badge} px-4 py-1 rounded-full text-lg font-bold mt-1`}>
              {overallStyle.label}
            </span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">診断サマリー</h3>
        <p className="text-gray-700 leading-relaxed">{result.executiveSummary}</p>
      </div>

      {/* Priority Actions */}
      {result.priorityActions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            優先対応事項
          </h3>
          <ol className="list-decimal list-inside space-y-2">
            {result.priorityActions.map((action, index) => (
              <li key={index} className="text-blue-800">
                {action}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Risk Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          リスク詳細分析 ({result.risks.length}件)
        </h3>
        <div className="space-y-4">
          {result.risks.map((risk, index) => (
            <RiskCard
              key={index}
              risk={risk}
              isExpanded={expandedRisks.has(index)}
              onToggle={() => toggleRisk(index)}
            />
          ))}
        </div>
      </div>

      {/* Related Cases */}
      {result.relatedCases.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">参考事例・判例</h3>
          <ul className="list-disc list-inside space-y-1">
            {result.relatedCases.map((caseItem, index) => (
              <li key={index} className="text-gray-700">
                {caseItem}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-100 rounded-lg p-4">
        <p className="text-sm text-gray-600 italic">{result.disclaimer}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center pt-4">
        {onChatWithResult && (
          <button
            onClick={onChatWithResult}
            className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            チャットで詳細を相談
          </button>
        )}
        {onGenerateDocuments && (
          <button
            onClick={onGenerateDocuments}
            className="flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            利用規約を生成
          </button>
        )}
        <button
          onClick={onReset}
          className="flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          新しい診断を開始
        </button>
      </div>
    </div>
  );
}

interface RiskCardProps {
  risk: RiskItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function RiskCard({ risk, isExpanded, onToggle }: RiskCardProps) {
  const style = RISK_LEVEL_STYLES[risk.level];

  return (
    <div className={`border ${style.border} rounded-lg overflow-hidden`}>
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 ${style.bg} flex items-center justify-between text-left`}
      >
        <div className="flex items-center">
          <span className={`${style.badge} px-2 py-0.5 rounded text-sm font-medium mr-3`}>
            {style.label}
          </span>
          <span className="font-medium text-gray-900">{risk.category}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-4 bg-white space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">概要</h4>
            <p className="text-gray-900">{risk.summary}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">詳細</h4>
            <p className="text-gray-700">{risk.details}</p>
          </div>

          {risk.legalBasis.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">法的根拠</h4>
              <div className="flex flex-wrap gap-2">
                {risk.legalBasis.map((basis, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(basis + ' 法律 解説')}`;
                      window.open(searchUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100 transition-colors cursor-pointer border-0"
                  >
                    {basis}
                    <svg
                      className="w-3 h-3 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {risk.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">推奨対策</h4>
              <ul className="list-disc list-inside space-y-1">
                {risk.recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-700">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {risk.graphRagSources.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">参照文書</h4>
              <div className="flex flex-wrap gap-2">
                {risk.graphRagSources.map((source, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
