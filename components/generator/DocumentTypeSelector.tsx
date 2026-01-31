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
  icon: string;
}> = [
  {
    type: 'terms_of_service',
    description: 'サービス利用条件、免責事項、禁止事項等を定めた文書',
    icon: '📋',
  },
  {
    type: 'privacy_policy',
    description: '個人情報の収集・利用・保護に関する方針',
    icon: '🔒',
  },
  {
    type: 'ai_disclaimer',
    description: 'AI機能の制限、出力の正確性に関する免責事項',
    icon: '🤖',
  },
  {
    type: 'internal_risk_report',
    description: '社内向けのリスク評価・対策レポート',
    icon: '📊',
  },
  {
    type: 'user_guidelines',
    description: 'ユーザー向けの利用ガイドライン・ベストプラクティス',
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        生成する文書を選択 <span className="text-red-500">*</span>
      </h3>
      <p className="text-sm text-gray-600">
        生成したい文書の種類を選択してください（複数選択可）
      </p>

      <div className="grid gap-3">
        {DOCUMENT_OPTIONS.map((option) => (
          <div
            key={option.type}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedTypes.includes(option.type)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleToggle(option.type)}
          >
            <div className="flex items-start">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(option.type)}
                  onChange={() => handleToggle(option.type)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="text-xl mr-2">{option.icon}</span>
                  <span className="font-medium text-gray-900">
                    {DOCUMENT_TYPE_LABELS[option.type]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{option.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
