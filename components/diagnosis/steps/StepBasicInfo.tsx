'use client';

import React from 'react';
import { DiagnosisInput } from '@/types/diagnosis';

interface StepBasicInfoProps {
  data: Partial<DiagnosisInput>;
  onChange: (data: Partial<DiagnosisInput>) => void;
}

export function StepBasicInfo({ data, onChange }: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          アプリケーションの基本情報
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          開発中または運用中のAIアプリケーションについて教えてください。
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="appName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            アプリケーション名（任意）
          </label>
          <input
            type="text"
            id="appName"
            value={data.appName || ''}
            onChange={(e) => onChange({ ...data, appName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例: AIチャットアシスタント"
          />
        </div>

        <div>
          <label
            htmlFor="appDescription"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            アプリケーションの概要 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="appDescription"
            value={data.appDescription || ''}
            onChange={(e) => onChange({ ...data, appDescription: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例: ユーザーからの質問に対してAIが回答を生成するチャットボットです。企業の社内ナレッジベースと連携し、社員の業務効率化を支援します。"
          />
          <p className="text-xs text-gray-500 mt-1">
            アプリケーションの目的、主な機能、想定される利用シーンを記述してください。
          </p>
        </div>

        <div>
          <label
            htmlFor="pricingModel"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            料金モデル <span className="text-red-500">*</span>
          </label>
          <select
            id="pricingModel"
            value={data.pricingModel || ''}
            onChange={(e) => onChange({ ...data, pricingModel: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">選択してください</option>
            <option value="free">無料</option>
            <option value="freemium">フリーミアム（基本無料＋有料機能）</option>
            <option value="subscription">サブスクリプション</option>
            <option value="pay_per_use">従量課金</option>
            <option value="one_time">買い切り</option>
            <option value="enterprise">企業向けライセンス</option>
            <option value="internal">社内利用のみ</option>
          </select>
        </div>
      </div>
    </div>
  );
}
