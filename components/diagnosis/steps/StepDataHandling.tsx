'use client';

import React from 'react';
import { DiagnosisInput } from '@/types/diagnosis';
import { CheckboxGroup } from '@/components/ui/Checkbox';
import { RadioGroup } from '@/components/ui/RadioGroup';

interface StepDataHandlingProps {
  data: Partial<DiagnosisInput>;
  onChange: (data: Partial<DiagnosisInput>) => void;
}

const INPUT_DATA_TYPES = [
  { id: 'text', label: 'テキスト', description: 'ユーザー入力、ドキュメント' },
  { id: 'personal_info', label: '個人情報', description: '氏名、連絡先、住所等' },
  { id: 'sensitive_personal', label: '要配慮個人情報', description: '健康情報、信条、犯歴等' },
  { id: 'children_data', label: '子どものデータ', description: '13歳未満のユーザー' },
  { id: 'images', label: '画像', description: '写真、スクリーンショット' },
  { id: 'audio', label: '音声', description: '録音、通話データ' },
  { id: 'video', label: '動画', description: 'ビデオコンテンツ' },
  { id: 'biometric', label: '生体情報', description: '顔画像、指紋、声紋' },
  { id: 'location', label: '位置情報', description: 'GPS、IPアドレス' },
  { id: 'financial', label: '金融情報', description: '収入、資産、取引履歴' },
  { id: 'medical', label: '医療情報', description: '診断、処方、健康記録' },
  { id: 'business', label: '企業機密', description: '営業秘密、戦略情報' },
  { id: 'public', label: '公開情報のみ', description: '機密性のないデータ' },
];

const DATA_STORAGE_OPTIONS = [
  { id: 'no_storage', label: 'データを保存しない', description: 'リアルタイム処理のみ' },
  { id: 'session_only', label: 'セッション中のみ', description: 'セッション終了で削除' },
  { id: 'short_term', label: '短期保存（30日以内）', description: '一時的なキャッシュ' },
  { id: 'long_term', label: '長期保存', description: '30日以上の保存' },
  { id: 'indefinite', label: '無期限保存', description: '削除しない' },
  { id: 'ai_training', label: 'AI学習に使用', description: 'モデル改善に活用' },
  { id: 'analytics', label: '分析・統計に使用', description: '匿名化統計' },
  { id: 'third_party', label: '第三者と共有', description: 'パートナー、広告等' },
];

const DATA_TRANSMISSION_OPTIONS = [
  {
    value: 'external_api',
    label: '外部APIに送信',
    description: 'OpenAI、Claude等のクラウドAPIを使用',
  },
  {
    value: 'local',
    label: 'ローカル処理のみ',
    description: '自社サーバーまたはオンプレミスで完結',
  },
  {
    value: 'both',
    label: '両方',
    description: '一部をローカル、一部を外部で処理',
  },
];

export function StepDataHandling({ data, onChange }: StepDataHandlingProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          データの取り扱い
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          AIに入力されるデータの種類と取り扱い方法を教えてください。
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            入力データの種類 <span className="text-red-500">*</span>
          </label>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <CheckboxGroup
              options={INPUT_DATA_TYPES}
              selectedValues={data.inputDataTypes || []}
              onChange={(values) => onChange({ ...data, inputDataTypes: values })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            データの送信先 <span className="text-red-500">*</span>
          </label>
          <div className="bg-gray-50 rounded-lg p-4">
            <RadioGroup
              name="dataTransmission"
              options={DATA_TRANSMISSION_OPTIONS}
              value={data.dataTransmission || ''}
              onChange={(value) =>
                onChange({
                  ...data,
                  dataTransmission: value as DiagnosisInput['dataTransmission'],
                })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            データの保存・利用 <span className="text-red-500">*</span>
          </label>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <CheckboxGroup
              options={DATA_STORAGE_OPTIONS}
              selectedValues={data.dataStorage || []}
              onChange={(values) => onChange({ ...data, dataStorage: values })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
