'use client';

import React from 'react';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/document';
import { Checkbox } from '@/components/ui/Checkbox';

interface DocumentTypeSelectorProps {
  selectedTypes: DocumentType[];
  onChange: (types: DocumentType[]) => void;
}

const DOCUMENT_OPTIONS: Array<{
  type: DocumentType;
  description: string;
  example: string;
  icon: string;
}> = [
  {
    type: 'terms_of_service',
    description: 'サービス利用条件、免責事項、禁止事項等を定めた文書',
    example: '新サービス開始時、規約改定時',
    icon: '📋',
  },
  {
    type: 'privacy_policy',
    description: '個人情報の収集・利用・保護に関する方針',
    example: 'Webサイト公開時、個人情報取扱変更時',
    icon: '🔒',
  },
  {
    type: 'ai_disclaimer',
    description: 'AI機能の制限、出力の正確性に関する免責事項',
    example: 'AI機能実装時、利用規約への追記',
    icon: '🤖',
  },
  {
    type: 'internal_risk_report',
    description: '社内向けのリスク評価・対策レポート',
    example: '新規プロジェクト開始時、定期監査',
    icon: '📊',
  },
  {
    type: 'user_guidelines',
    description: 'ユーザー向けの利用ガイドライン・ベストプラクティス',
    example: 'コミュニティ運営時、サービス説明',
    icon: '📖',
  },
];

export function DocumentTypeSelector({
  selectedTypes,
  onChange,
}: DocumentTypeSelectorProps) {
  const handleToggle = (type: DocumentType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
        生成する文書を選択 <span className="text-red-500">*</span>
      </h3>
      <p className="text-xs sm:text-sm text-gray-600">
        生成したい文書の種類を選択してください（複数選択可）
      </p>

      <div className="grid gap-2 sm:gap-3">
        {DOCUMENT_OPTIONS.map((option) => (
          <div
            key={option.type}
            className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-colors ${
              selectedTypes.includes(option.type)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleToggle(option.type)}
          >
            <div className="flex items-start">
              <div className="flex items-center h-5 mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(option.type)}
                  onChange={() => handleToggle(option.type)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl flex-shrink-0">{option.icon}</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">
                    {DOCUMENT_TYPE_LABELS[option.type]}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{option.description}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 italic">
                  例: {option.example}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
