'use client';

import { AppStep } from '@/types/userContext';

interface StepNavigationProps {
  currentStep: AppStep;
  completedSteps: Set<AppStep>;
  onStepClick: (step: AppStep) => void;
}

const steps = [
  { step: 1 as AppStep, label: '利用状況', icon: '1' },
  { step: 2 as AppStep, label: 'リスク分析', icon: '2' },
  { step: 3 as AppStep, label: '規約生成', icon: '3' },
];

export function StepNavigation({ currentStep, completedSteps, onStepClick }: StepNavigationProps) {
  const getStepStatus = (step: AppStep): 'current' | 'completed' | 'upcoming' => {
    if (step === currentStep) return 'current';
    if (completedSteps.has(step)) return 'completed';
    return 'upcoming';
  };

  const isClickable = (step: AppStep): boolean => {
    // 完了したステップはクリック可能（戻れる）
    if (completedSteps.has(step)) return true;
    // 現在のステップもクリック可能
    if (step === currentStep) return true;
    // 次のステップは現在のステップが完了していればクリック可能
    if (step === currentStep + 1 && completedSteps.has(currentStep)) return true;
    return false;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4 mb-3 sm:mb-4">
      <div className="flex items-center justify-center">
        {steps.map((item, index) => {
          const status = getStepStatus(item.step);
          const clickable = isClickable(item.step);

          return (
            <div key={item.step} className="flex items-center">
              {/* ステップアイコン */}
              <button
                onClick={() => clickable && onStepClick(item.step)}
                disabled={!clickable}
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-base
                  ${status === 'current'
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : status === 'completed'
                    ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                `}
              >
                {/* アイコン/チェックマーク */}
                <span className={`
                  w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold
                  ${status === 'current'
                    ? 'bg-white text-blue-600'
                    : status === 'completed'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-500'}
                `}>
                  {status === 'completed' ? '✓' : item.icon}
                </span>
                {/* ラベル */}
                <span className="hidden sm:inline">{item.label}</span>
              </button>

              {/* コネクター */}
              {index < steps.length - 1 && (
                <div className={`
                  w-4 sm:w-8 h-0.5 mx-1 sm:mx-2
                  ${completedSteps.has(item.step) ? 'bg-green-400' : 'bg-gray-200'}
                `} />
              )}
            </div>
          );
        })}
      </div>

      {/* おすすめの使い方（モバイル向け補足） */}
      <div className="mt-2 sm:mt-3 text-center text-[10px] sm:text-xs text-gray-500 sm:hidden">
        {currentStep === 1 && '利用状況を入力してください'}
        {currentStep === 2 && '法的リスクを確認してください'}
        {currentStep === 3 && '利用規約を作成してください'}
      </div>
    </div>
  );
}
