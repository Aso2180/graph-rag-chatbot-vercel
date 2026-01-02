/**
 * GAIS会員のメールアドレス検証ユーティリティ
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * メールアドレス形式の基本検証
 */
export function validateEmail(email: string): ValidationResult {
  // 基本的な空文字チェック
  if (!email || !email.trim()) {
    return {
      isValid: false,
      error: 'メールアドレスを入力してください'
    };
  }

  // 基本的なメールアドレス形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      error: '有効なメールアドレス形式で入力してください'
    };
  }

  // 長さチェック (一般的な制限)
  if (email.length > 254) {
    return {
      isValid: false,
      error: 'メールアドレスが長すぎます'
    };
  }

  return {
    isValid: true
  };
}

/**
 * GAIS会員情報の構造
 */
export interface GAISMember {
  email: string;
  registeredAt: Date;
  organization: string;
}

/**
 * 会員情報の正規化
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * アップロード制限のチェック用（将来実装用）
 */
export interface UploadLimits {
  maxFilesPerDay: number;
  maxFileSizeMB: number;
  allowedFileTypes: string[];
}

export const DEFAULT_UPLOAD_LIMITS: UploadLimits = {
  maxFilesPerDay: 10,
  maxFileSizeMB: 20,
  allowedFileTypes: ['application/pdf']
};

/**
 * アップロード権限チェック（基本版）
 */
export function validateUploadPermission(
  email: string, 
  fileType: string, 
  fileSizeMB: number
): ValidationResult {
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }

  if (!DEFAULT_UPLOAD_LIMITS.allowedFileTypes.includes(fileType)) {
    return {
      isValid: false,
      error: 'PDFファイルのみアップロード可能です'
    };
  }

  if (fileSizeMB > DEFAULT_UPLOAD_LIMITS.maxFileSizeMB) {
    return {
      isValid: false,
      error: `ファイルサイズは${DEFAULT_UPLOAD_LIMITS.maxFileSizeMB}MB以下にしてください`
    };
  }

  return {
    isValid: true
  };
}