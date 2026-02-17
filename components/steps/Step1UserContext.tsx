'use client';

import { useState } from 'react';
import { UserContext, canProceedToStep2 } from '@/types/userContext';

interface Step1UserContextProps {
  userContext: UserContext;
  onUpdate: (updates: Partial<UserContext>) => void;
  onNext: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  memberEmail: string;
  onMemberEmailChange: (email: string) => void;
  isLoading: boolean;
}

interface CheckboxItemProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  tooltip?: string;
  disabled?: boolean;
}

function CheckboxItem({ id, checked, onChange, label, tooltip, disabled = false }: CheckboxItemProps) {
  return (
    <label
      htmlFor={id}
      className={`
        relative flex items-center p-3 rounded-lg border-2 transition-all
        ${disabled
          ? 'cursor-not-allowed opacity-50 bg-gray-100 border-gray-200'
          : checked
          ? 'border-blue-500 bg-blue-50 cursor-pointer'
          : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'}
      `}
      title={tooltip}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
      />
      <span className={`ml-2 text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
      {tooltip && (
        <span className="ml-1 text-gray-400 text-xs" title={tooltip}>?</span>
      )}
    </label>
  );
}

export function Step1UserContext({
  userContext,
  onUpdate,
  onNext,
  onFileUpload,
  memberEmail,
  onMemberEmailChange,
  isLoading,
}: Step1UserContextProps) {
  const canProceed = canProceedToStep2(userContext);
  const [showGitHub, setShowGitHub] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubResult, setGithubResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGitHubImport = async () => {
    if (!githubUrl.trim() || !memberEmail) return;
    setGithubLoading(true);
    setGithubResult(null);
    try {
      const res = await fetch('/api/import/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: githubUrl.trim(), memberEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setGithubResult({
          type: 'success',
          message: `✓ ${data.repo} から ${data.imported}件のMDファイルを取得しました`,
        });
        onUpdate({ hasPDFUploaded: true });
      } else {
        setGithubResult({ type: 'error', message: data.error || '取得に失敗しました' });
      }
    } catch {
      setGithubResult({ type: 'error', message: 'ネットワークエラーが発生しました' });
    } finally {
      setGithubLoading(false);
    }
  };

  const updateContentType = (key: keyof UserContext['contentTypes'], value: boolean) => {
    onUpdate({
      contentTypes: {
        ...userContext.contentTypes,
        [key]: value,
      },
    });
  };

  const updateUsagePurpose = (key: keyof UserContext['usagePurposes'], value: boolean) => {
    onUpdate({
      usagePurposes: {
        ...userContext.usagePurposes,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          あなたの状況を選択してください
        </h2>
        <p className="text-sm text-gray-600">
          選択内容に基づいて、適切な法的リスク分析を行います
        </p>
      </div>

      {/* 基本情報 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">1</span>
          基本情報
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxItem
            id="basic-internal"
            checked={userContext.isInternalUse}
            onChange={(checked) => {
              onUpdate({
                isInternalUse: checked,
                // 社内利用をONにしたら、社外向けの利用目的をすべてクリア
                ...(checked && {
                  usagePurposes: {
                    ...userContext.usagePurposes,
                    companyIntroduction: false,
                    recruitment: false,
                    marketing: false,
                    customerService: false,
                    productIntegration: false,
                  }
                })
              });
            }}
            label="社内利用"
            tooltip="社内のみでAIを利用（社外には公開しない）"
          />
          <CheckboxItem
            id="basic-corporate"
            checked={userContext.isCorporate}
            onChange={(checked) => onUpdate({ isCorporate: checked })}
            label="法人サービス"
            tooltip="法人としてAIサービスを提供"
          />
          <CheckboxItem
            id="basic-registration"
            checked={userContext.hasRegistration}
            onChange={(checked) => onUpdate({ hasRegistration: checked })}
            label="会員登録あり"
            tooltip="ユーザー登録機能を持つサービス"
          />
          <CheckboxItem
            id="basic-api"
            checked={userContext.hasExternalAPI}
            onChange={(checked) => onUpdate({ hasExternalAPI: checked })}
            label="外部API利用"
            tooltip="OpenAI等の外部APIを使用"
          />
        </div>
      </div>

      {/* AI生成コンテンツの種類 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">2</span>
          AI生成コンテンツの種類
          <span className="text-xs font-normal text-gray-500">（複数選択可）</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxItem
            id="content-text"
            checked={userContext.contentTypes.text}
            onChange={(checked) => updateContentType('text', checked)}
            label="テキスト生成"
            tooltip="文章・記事・レポート等のテキストコンテンツ"
          />
          <CheckboxItem
            id="content-image"
            checked={userContext.contentTypes.image}
            onChange={(checked) => updateContentType('image', checked)}
            label="画像生成"
            tooltip="AI生成画像・イラスト・デザイン素材"
          />
          <CheckboxItem
            id="content-video"
            checked={userContext.contentTypes.video}
            onChange={(checked) => updateContentType('video', checked)}
            label="動画生成"
            tooltip="AI生成動画・アニメーション"
          />
          <CheckboxItem
            id="content-audio"
            checked={userContext.contentTypes.audio}
            onChange={(checked) => updateContentType('audio', checked)}
            label="音声生成"
            tooltip="AI音声・ナレーション・音楽"
          />
        </div>
      </div>

      {/* AI生成コンテンツの利用目的 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">3</span>
          AI生成コンテンツの利用目的
          <span className="text-xs font-normal text-gray-500">（複数選択可）</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <CheckboxItem
            id="purpose-training"
            checked={userContext.usagePurposes.internalTraining}
            onChange={(checked) => updateUsagePurpose('internalTraining', checked)}
            label="社内利用（研修・教育）"
            tooltip="社内研修資料、教育コンテンツ、eラーニング教材等"
          />
          <CheckboxItem
            id="purpose-operations"
            checked={userContext.usagePurposes.internalOperations}
            onChange={(checked) => updateUsagePurpose('internalOperations', checked)}
            label="社内利用（業務効率化）"
            tooltip="会議資料、議事録作成、社内文書作成等"
          />
          <CheckboxItem
            id="purpose-company"
            checked={userContext.usagePurposes.companyIntroduction}
            onChange={(checked) => updateUsagePurpose('companyIntroduction', checked)}
            label="会社案内・サービス紹介"
            tooltip="コーポレートサイト、サービス紹介、営業資料等"
            disabled={userContext.isInternalUse}
          />
          <CheckboxItem
            id="purpose-recruitment"
            checked={userContext.usagePurposes.recruitment}
            onChange={(checked) => updateUsagePurpose('recruitment', checked)}
            label="採用・リクルート"
            tooltip="採用サイト、仕事内容紹介、社員インタビュー等"
            disabled={userContext.isInternalUse}
          />
          <CheckboxItem
            id="purpose-marketing"
            checked={userContext.usagePurposes.marketing}
            onChange={(checked) => updateUsagePurpose('marketing', checked)}
            label="マーケティング・広告"
            tooltip="広告素材、SNS投稿、プロモーション動画等"
            disabled={userContext.isInternalUse}
          />
          <CheckboxItem
            id="purpose-customer"
            checked={userContext.usagePurposes.customerService}
            onChange={(checked) => updateUsagePurpose('customerService', checked)}
            label="顧客向けサービス提供"
            tooltip="ユーザーへのAI生成コンテンツ直接提供"
            disabled={userContext.isInternalUse}
          />
          <CheckboxItem
            id="purpose-product"
            checked={userContext.usagePurposes.productIntegration}
            onChange={(checked) => updateUsagePurpose('productIntegration', checked)}
            label="商品・製品への組込み"
            tooltip="製品・サービスの一部としてAI生成物を使用"
            disabled={userContext.isInternalUse}
          />
        </div>
      </div>

      {/* 参考資料の追加（PDF Upload） */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <span className="text-lg">📎</span>
          参考資料を追加（任意）
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          PDFまたはMarkdown（.md）ファイルをアップロードすると、より正確な分析が可能になります
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              GAIS会員メールアドレス
            </label>
            <input
              type="email"
              value={memberEmail}
              onChange={(e) => onMemberEmailChange(e.target.value)}
              placeholder="例: member@example.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>gais@test.com</strong>：全会員共通のデフォルトドキュメント（AI法的リスク資料）をDashboardから閲覧できます
              </p>
              <p className="text-xs text-blue-700 mt-1">
                ※ 自分のPDF/Markdownをアップロードする場合は、ご自身のメールアドレスに変更してください
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              ファイル（PDF / Markdown）
            </label>
            <input
              type="file"
              accept=".pdf,.md"
              onChange={onFileUpload}
              disabled={isLoading || !memberEmail}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-50"
            />
            {!memberEmail && (
              <p className="text-xs text-gray-500 mt-1">
                ※ PDFをアップロードするにはメールアドレスを入力してください
              </p>
            )}
          </div>

          {userContext.hasPDFUploaded && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 px-3 py-2 rounded-lg">
              <span>✓</span>
              <span>参考資料がアップロードされています</span>
            </div>
          )}
        </div>
      </div>

      {/* 上級者向け：GitHubからMDファイルを取得 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGitHub(!showGitHub)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <span>⚙️</span>
            上級者向け：GitHubリポジトリからMDファイルを取得（任意）
          </span>
          <span className="text-gray-400 text-xs">{showGitHub ? '▲' : '▼'}</span>
        </button>

        {showGitHub && (
          <div className="px-4 py-4 space-y-3 bg-white">
            <p className="text-xs text-gray-600">
              パブリックGitHubリポジトリ内の<strong>.mdファイルのみ</strong>を一括取得し、分析に活用します。
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              ⚠️ パブリックリポジトリのみ対応しています。プライベートリポジトリは取得できません。
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                GitHubリポジトリURL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="例: https://github.com/yourname/yourrepo"
                disabled={githubLoading || !memberEmail}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              {!memberEmail && (
                <p className="text-xs text-gray-500 mt-1">
                  ※ 取得するにはメールアドレスを入力してください
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleGitHubImport}
              disabled={!githubUrl.trim() || !memberEmail || githubLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {githubLoading ? '取得中...' : 'MDファイルを取得する'}
            </button>

            {githubResult && (
              <p className={`text-xs px-3 py-2 rounded ${
                githubResult.type === 'success'
                  ? 'text-green-700 bg-green-50 border border-green-200'
                  : 'text-red-700 bg-red-50 border border-red-200'
              }`}>
                {githubResult.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 次へボタン */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onNext}
          disabled={!canProceed || isLoading}
          className={`
            px-8 py-3 rounded-lg font-bold text-lg transition-all
            ${canProceed && !isLoading
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          `}
        >
          次へ：法的リスクを確認する →
        </button>
      </div>

      {!canProceed && (
        <p className="text-center text-sm text-gray-500">
          ※ 最低1つの項目を選択してください
        </p>
      )}
    </div>
  );
}
