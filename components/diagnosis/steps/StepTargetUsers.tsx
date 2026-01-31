'use client';

import React from 'react';
import { DiagnosisInput } from '@/types/diagnosis';
import { CheckboxGroup } from '@/components/ui/Checkbox';

interface StepTargetUsersProps {
  data: Partial<DiagnosisInput>;
  onChange: (data: Partial<DiagnosisInput>) => void;
}

const TARGET_USERS = [
  { id: 'general_public', label: '一般消費者', description: '個人ユーザー向けB2Cサービス' },
  { id: 'enterprise', label: '企業・法人', description: 'B2Bサービス' },
  { id: 'internal', label: '社内ユーザー', description: '従業員向け社内ツール' },
  { id: 'developers', label: '開発者', description: 'API、SDK提供' },
  { id: 'children', label: '子ども（13歳未満）', description: 'COPPA対象' },
  { id: 'minors', label: '未成年（13-17歳）', description: '追加保護が必要' },
  { id: 'healthcare', label: '医療従事者', description: '医師、看護師等' },
  { id: 'legal', label: '法律専門家', description: '弁護士、法務担当' },
  { id: 'financial', label: '金融専門家', description: '投資家、FP等' },
  { id: 'education', label: '教育関係者', description: '教師、学生' },
  { id: 'government', label: '政府・行政', description: '公的機関' },
  { id: 'global', label: '海外ユーザー', description: '日本国外' },
  { id: 'eu', label: 'EU域内ユーザー', description: 'GDPR対象' },
  { id: 'us', label: '米国ユーザー', description: '各州法対象' },
];

export function StepTargetUsers({ data, onChange }: StepTargetUsersProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          想定ユーザー
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          アプリケーションの想定ユーザーを選択してください。法規制はユーザー属性によって異なります。
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            想定ユーザー <span className="text-red-500">*</span>
          </label>
          <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
            <CheckboxGroup
              options={TARGET_USERS}
              selectedValues={data.targetUsers || []}
              onChange={(values) => onChange({ ...data, targetUsers: values })}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">ユーザー属性と法規制</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>EU域内ユーザー → GDPR（一般データ保護規則）が適用</li>
                <li>子ども向け → COPPA（米国）、児童保護法規制</li>
                <li>医療・金融 → 業界固有の規制が追加で適用</li>
                <li>グローバル展開 → 各国のAI規制に留意</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
