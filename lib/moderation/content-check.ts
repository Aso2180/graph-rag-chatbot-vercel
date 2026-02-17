/**
 * GAIS コンテンツモデレーションシステム
 * PDFアップロードの検証とモデレーション
 */

export interface ContentCheckResult {
  allowed: boolean;
  reason?: string;
  warnings?: string[];
}

export interface FileInfo {
  name: string;
  type: string;
  size: number;
  content?: Buffer;
}

// ファイルタイプとサイズの制限
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/markdown',
  'text/x-markdown',
  'text/plain',         // ブラウザによってはMDをtext/plainとして送信する場合がある
];
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// 禁止ファイル名のパターン
const PROHIBITED_PATTERNS = [
  /\.(exe|bat|cmd|sh|ps1|vbs|js|jar)$/i,  // 実行可能ファイル
  /^\..*$/,                                // 隠しファイル
  /[<>:"|?*]/,                            // 無効な文字
];

// 疑わしいコンテンツのキーワード（PDF内容検査用）
const SUSPICIOUS_KEYWORDS = [
  'virus', 'malware', 'trojan',
  'hack', 'crack', 'keygen',
  'password', 'credential',
];

/**
 * ファイルの基本チェック
 */
export function checkFileBasics(file: FileInfo): ContentCheckResult {
  const warnings: string[] = [];
  
  // ファイルタイプチェック（MIMEタイプまたは拡張子で判定）
  const isMD = file.name.toLowerCase().endsWith('.md');
  const isPDF = file.name.toLowerCase().endsWith('.pdf');
  const isAllowedType = ALLOWED_FILE_TYPES.includes(file.type) || isMD || isPDF;
  if (!isAllowedType) {
    return {
      allowed: false,
      reason: `許可されていないファイル形式です。PDFまたはMarkdown（.md）ファイルのみアップロード可能です。（検出: ${file.type}）`
    };
  }

  // ファイルサイズチェック
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      allowed: false,
      reason: `ファイルサイズが大きすぎます。最大${MAX_FILE_SIZE_MB}MBまでアップロード可能です。（検出: ${sizeMB}MB）`
    };
  }

  // ファイルサイズが小さすぎる場合
  if (file.size < 1024) { // 1KB未満
    warnings.push('ファイルサイズが非常に小さいです。内容が含まれていない可能性があります。');
  }

  // ファイル名チェック
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(file.name)) {
      return {
        allowed: false,
        reason: '無効なファイル名です。実行可能ファイルや特殊文字を含むファイル名は使用できません。'
      };
    }
  }

  // ファイル名が長すぎる場合
  if (file.name.length > 255) {
    return {
      allowed: false,
      reason: 'ファイル名が長すぎます。255文字以内にしてください。'
    };
  }

  // 日本語ファイル名の場合の警告
  if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(file.name)) {
    warnings.push('ファイル名に日本語が含まれています。システムによっては正しく処理されない可能性があります。');
  }

  return {
    allowed: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * アップロード履歴チェック（重複防止）
 */
export interface UploadHistory {
  fileName: string;
  fileHash?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export function checkDuplicateUpload(
  file: FileInfo,
  memberEmail: string,
  recentUploads: UploadHistory[]
): ContentCheckResult {
  // 同じメンバーが最近同じファイル名でアップロードしているか確認
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentSameFile = recentUploads.find(upload => 
    upload.uploadedBy === memberEmail &&
    upload.fileName === file.name &&
    upload.uploadedAt > oneHourAgo
  );

  if (recentSameFile) {
    return {
      allowed: false,
      reason: '同じファイルが1時間以内にアップロードされています。重複アップロードを防ぐため、しばらくお待ちください。'
    };
  }

  return {
    allowed: true
  };
}

/**
 * 総合的なコンテンツチェック
 */
export async function performContentCheck(
  file: FileInfo,
  memberEmail: string,
  recentUploads: UploadHistory[] = []
): Promise<ContentCheckResult> {
  // 1. 基本チェック
  const basicCheck = checkFileBasics(file);
  if (!basicCheck.allowed) {
    return basicCheck;
  }

  // 2. 重複チェック
  const duplicateCheck = checkDuplicateUpload(file, memberEmail, recentUploads);
  if (!duplicateCheck.allowed) {
    return duplicateCheck;
  }

  // 3. すべてのチェックをパスした場合
  const allWarnings = [
    ...(basicCheck.warnings || []),
    ...(duplicateCheck.warnings || []),
  ];

  return {
    allowed: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined
  };
}

/**
 * ファイルサイズのフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 安全なファイル名の生成
 */
export function sanitizeFileName(fileName: string): string {
  // 危険な文字を除去
  let safe = fileName.replace(/[<>:"|?*]/g, '');
  
  // パスセパレータを除去
  safe = safe.replace(/[/\\]/g, '-');
  
  // 連続するドットを単一に
  safe = safe.replace(/\.+/g, '.');
  
  // 先頭と末尾の空白とドットを除去
  safe = safe.trim().replace(/^\.+|\.+$/g, '');
  
  // 空の場合はデフォルト名
  if (!safe) {
    safe = `document_${Date.now()}.pdf`;
  }
  
  return safe;
}