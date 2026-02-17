import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit';
import { performContentCheck, sanitizeFileName, formatFileSize } from '@/lib/moderation/content-check';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Force rebuild - timestamp: 2025-01-06T17:40:00Z

export async function POST(request: NextRequest) {
  console.log('Upload endpoint called at:', new Date().toISOString());
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
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
    
    // Log file details for debugging
    console.log('Upload request received:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      memberEmail: memberEmail
    });
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds limit. Maximum size is ${formatFileSize(maxSize)}` },
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
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `${Date.now()}-${sanitizedName}`;

    // ファイル種別に応じた解析とNeo4jへの保存
    const isMD = file.name.toLowerCase().endsWith('.md');
    if (isMD) {
      await processMDForGraphRAG(buffer, fileName, memberEmail);
    } else {
      await processPDFForGraphRAG(buffer, fileName, memberEmail);
    }

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
    console.error('Upload error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    
    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('FormData')) {
        return NextResponse.json(
          { error: 'Failed to parse upload data. Please try a smaller file.' },
          { status: 400 }
        );
      }
      if (error.message.includes('Neo4j') || error.message.includes('connect')) {
        return NextResponse.json(
          { error: 'Database connection failed. Please try again later.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function processPDFForGraphRAG(buffer: Buffer, fileName: string, memberEmail: string) {
  try {
    const { processPDFForNeo4jFromBuffer } = await import('@/lib/pdf/processor');
    const result = await processPDFForNeo4jFromBuffer(buffer, fileName, memberEmail);
    console.log(`PDF processing completed: ${fileName}`, result);
    return result;
  } catch (error) {
    console.error(`PDF processing failed: ${fileName}`, error);
    throw error;
  }
}

async function processMDForGraphRAG(buffer: Buffer, fileName: string, memberEmail: string) {
  try {
    const { processMDFromBuffer } = await import('@/lib/pdf/processor');
    const result = await processMDFromBuffer(buffer, fileName, memberEmail);
    console.log(`MD processing completed: ${fileName}`, result);
    return result;
  } catch (error) {
    console.error(`MD processing failed: ${fileName}`, error);
    throw error;
  }
}