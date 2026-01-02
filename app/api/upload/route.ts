import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { checkRateLimit, getClientIp, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit';
import { performContentCheck, sanitizeFileName, formatFileSize } from '@/lib/moderation/content-check';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const memberEmail = formData.get('memberEmail') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!memberEmail) {
      return NextResponse.json(
        { error: 'Member email is required' },
        { status: 400 }
      );
    }

    // レート制限チェック（メールアドレスベース）
    const rateLimitResult = checkRateLimit(memberEmail, 'upload');
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // コンテンツモデレーション
    const contentCheck = await performContentCheck(
      {
        name: file.name,
        type: file.type,
        size: file.size,
      },
      memberEmail,
      [] // TODO: 実際の履歴を取得
    );

    if (!contentCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Content check failed',
          message: contentCheck.reason,
          fileInfo: {
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type
          }
        },
        { status: 400 }
      );
    }

    // 警告がある場合はログに記録
    if (contentCheck.warnings) {
      console.warn('Content warnings:', contentCheck.warnings);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // アップロードディレクトリを作成
    const uploadDir = join(process.cwd(), 'uploads');
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `${Date.now()}-${sanitizedName}`;
    const filePath = join(uploadDir, fileName);

    // ディレクトリが存在しない場合は作成
    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      // ディレクトリが存在しない場合
      const fs = require('fs');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);
      } else {
        throw error;
      }
    }

    // PDF解析とNeo4jへの保存（GAIS会員情報を含む）
    await processPDFForGraphRAG(filePath, fileName, memberEmail);

    const response = NextResponse.json({
      message: 'File uploaded successfully',
      fileName,
      fileSize: file.size,
      uploadedBy: memberEmail,
      organization: 'GAIS',
      status: 'completed'
    });

    // レート制限ヘッダーを追加
    addRateLimitHeaders(response, rateLimitResult);
    return response;

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

async function processPDFForGraphRAG(filePath: string, fileName: string, memberEmail: string) {
  try {
    const { processPDFForNeo4j } = await import('@/lib/pdf/processor');
    const result = await processPDFForNeo4j(filePath, fileName, memberEmail);
    console.log(`PDF processing completed: ${fileName}`, result);
    return result;
  } catch (error) {
    console.error(`PDF processing failed: ${fileName}`, error);
    throw error;
  }
}