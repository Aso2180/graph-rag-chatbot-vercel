'use client';

import React from 'react';
import { DiagnosisInput } from '@/types/diagnosis';
import { CheckboxGroup } from '@/components/ui/Checkbox';

interface StepConcernsProps {
  data: Partial<DiagnosisInput>;
  onChange: (data: Partial<DiagnosisInput>) => void;
}

const CONCERNED_RISKS = [
  {
    id: 'copyright',
    label: '著作権・知的財産',
    description: 'AI生成物の著作権、学習データの権利',
  },
  {
    id: 'privacy',
    label: 'プライバシー・個人情報',
    description: 'データ保護法、同意取得',
  },
  {
    id: 'liability',
    label: '製造物責任・損害賠償',
    description: 'AI出力による損害の責任',
  },
  {
    id: 'discrimination',
    label: '差別・バイアス',
    description: 'AIの差別的出力、公平性',
  },
  {
    id: 'misinformation',
    label: '誤情報・ハルシネーション',
    description: '不正確な情報の生成',
  },
  {
    id: 'transparency',
    label: '透明性・説明責任',
    description: 'AI利用の開示義務',
  },
  {
    id: 'security',
    label: 'セキュリティ',
    description: 'データ漏洩、攻撃対策',
  },
  {
    id: 'terms_violation',
    label: 'API利用規約違反',
    description: 'プロバイダー規約の遵守',
  },
  {
    id: 'deepfake',
    label: 'ディープフェイク・なりすまし',
    description: '偽コンテンツの生成',
  },
  {
    id: 'employment',
    label: '雇用・労働',
    description: 'AIによる採用判断、労働者保護',
  },
  {
    id: 'consumer_protection',
    label: '消費者保護',
    description: '不当表示、誤認誘導',
  },
  {
    id: 'sector_regulation',
    label: '業界固有規制',
    description: '医療、金融、法務等の規制',
  },
  {
    id: 'eu_ai_act',
    label: 'EU AI規制法',
    description: 'リスクベースの規制対応',
  },
  {
    id: 'export_control',
    label: '輸出管理・制裁',
    description: '技術の輸出規制',
  },
  {
    id: 'other',
    label: 'その他',
    description: '上記以外の懸念事項',
  },
];

export function StepConcerns({ data, onChange }: StepConcernsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          懸念事項と追加情報
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          特に気になるリスク領域と、追加で伝えたい情報があれば入力してください。
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            特に懸念しているリスク領域
          </label>
          <div className="bg-gray-50 rounded-lg p-4 max-h-72 overflow-y-auto">
            <CheckboxGroup
              options={CONCERNED_RISKS}
              selectedValues={data.concernedRisks || []}
              onChange={(values) => onChange({ ...data, concernedRisks: values })}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="additionalNotes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            追加情報・特記事項（任意）
          </label>
          <textarea
            id="additionalNotes"
            value={data.additionalNotes || ''}
            onChange={(e) => onChange({ ...data, additionalNotes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例: すでに発生したインシデント、過去の指摘事項、特殊な事業形態など、診断に役立つ追加情報があれば記載してください。"
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">診断の注意事項</p>
              <p className="text-yellow-700">
                この診断は情報提供を目的としており、法的アドバイスではありません。
                具体的な対応については、必ず専門家にご相談ください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
