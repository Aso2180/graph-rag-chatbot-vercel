'use client';

type DiagnosisStep = 'init' | 'graph-search' | 'analyzing' | 'complete';

interface DiagnosisProgressProps {
  currentStep: DiagnosisStep;
  estimatedTimeRemaining?: number;
}

export function DiagnosisProgress({
  currentStep,
  estimatedTimeRemaining,
}: DiagnosisProgressProps) {
  const steps = [
    { id: 'init', label: '準備中', icon: '⚙️' },
    { id: 'graph-search', label: '関連情報を検索中', icon: '🔍' },
    { id: 'analyzing', label: 'AIがリスクを分析中', icon: '🤖' },
    { id: 'complete', label: '完了', icon: '✓' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progressPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `約${seconds}秒`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `約${minutes}分`;
    }
    return `約${minutes}分${remainingSeconds}秒`;
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-200 p-6 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">リスク分析中</h3>
        {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
          <div className="text-sm font-medium text-blue-600">
            残り {formatTime(estimatedTimeRemaining)}
          </div>
        )}
      </div>

      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-600 text-right">
          {Math.round(progressPercentage)}% 完了
        </div>
      </div>

      {/* ステップ表示 */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const status = getStepStatus(index);

          return (
            <div
              key={step.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all
                ${status === 'active' ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}
              `}
            >
              <div className="w-8 flex justify-center">
                {status === 'completed' && (
                  <span className="text-green-500 text-xl">✓</span>
                )}
                {status === 'active' && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                  </div>
                )}
                {status === 'pending' && (
                  <span className="text-gray-400">{step.icon}</span>
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  status === 'active' ? 'text-blue-700' :
                  status === 'completed' ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ヒント */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 GraphRAGで関連情報を検索し、AIが包括的なリスク分析を行っています。
        </p>
      </div>
    </div>
  );
}
