'use client';

import { useState } from 'react';

interface AdvancedSettingsProps {
  useGraphContext: boolean;
  useWebSearch: boolean;
  onGraphContextChange: (value: boolean) => void;
  onWebSearchChange: (value: boolean) => void;
}

export function AdvancedSettings({
  useGraphContext,
  useWebSearch,
  onGraphContextChange,
  onWebSearchChange,
}: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-gray-200 mt-4 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-800"
      >
        <span className="flex items-center gap-2">
          <span className="text-gray-400">⚙</span>
          詳細設定（上級者向け）
        </span>
        <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
          <p className="text-xs text-gray-500 mb-2">
            ※ 通常は変更不要です
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useGraphContext}
              onChange={(e) => onGraphContextChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">内部知識ベースを使用</span>
              <p className="text-xs text-gray-500">専門知識データベースから関連情報を検索します</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useWebSearch}
              onChange={(e) => onWebSearchChange(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Web検索を使用</span>
              <p className="text-xs text-gray-500">最新の法規制情報をWeb検索で取得します</p>
            </div>
          </label>

          <div className="text-xs text-gray-400 pt-2 border-t border-gray-200">
            現在の設定: 内部知識ベース {useGraphContext ? '✓' : '✗'} | Web検索 {useWebSearch ? '✓' : '✗'}
          </div>
        </div>
      )}
    </div>
  );
}
