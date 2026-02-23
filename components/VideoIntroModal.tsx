'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoIntroModal({ isOpen, onClose }: VideoIntroModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // モーダルが開いたときに動画を最初に戻す（自動再生はしない）
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
    } else if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsMaximized(false);
    }
  }, [isOpen]);

  // Escapeキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMaximized) {
          setIsMaximized(false);
        } else {
          handleClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isMaximized]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideIntroVideo', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* モーダルコンテンツ */}
      <div
        className={`fixed z-50 bg-white shadow-2xl transition-all duration-300 ${
          isMaximized
            ? 'inset-0 w-full h-full rounded-none'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[540px] max-h-[90vh] rounded-lg'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-modal-title"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 id="video-modal-title" className="text-base sm:text-lg font-semibold text-gray-800">
            アプリの使い方紹介
          </h2>
          <div className="flex items-center gap-2">
            {/* 最大化/最小化ボタン */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              title={isMaximized ? '元のサイズに戻す' : '最大化'}
              aria-label={isMaximized ? '元のサイズに戻す' : '最大化'}
            >
              {isMaximized ? (
                // 最小化アイコン
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                  />
                </svg>
              ) : (
                // 最大化アイコン
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              )}
            </button>
            {/* 閉じるボタン */}
            <button
              onClick={handleClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              aria-label="閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* ボディ */}
        <div
          className={`flex flex-col items-center justify-center p-4 ${
            isMaximized ? 'h-[calc(100vh-120px)]' : 'max-h-[calc(90vh-120px)]'
          }`}
        >
          {/* 動画プレーヤー */}
          <div
            className={`bg-black rounded-lg overflow-hidden shadow-2xl ${
              isMaximized ? 'w-full h-full flex items-center justify-center' : 'w-full aspect-[9/16] max-w-[540px]'
            }`}
          >
            <video
              ref={videoRef}
              controls
              className={`${isMaximized ? 'max-w-full max-h-full' : 'w-full h-full object-contain'}`}
              controlsList="nodownload"
              playsInline
            >
              <source src="/intro-video.mp4" type="video/mp4" />
              お使いのブラウザは動画タグをサポートしていません。
            </video>
          </div>

          {/* 説明文 */}
          {!isMaximized && (
            <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center">
              このアプリの使い方や事例を紹介する動画です（1分26秒）
            </p>
          )}
        </div>

        {/* フッター */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
          {/* チェックボックス */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-gray-700 group-hover:text-gray-900">
              次回からこの動画を表示しない
            </span>
          </label>

          {/* 閉じるボタン */}
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
          >
            閉じる
          </button>
        </div>
      </div>
    </>
  );
}
