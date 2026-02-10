import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/neo4j/query-api-client';
import { checkRateLimit, getClientIp, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit';

interface MemberStatistics {
  memberEmail: string;
  organization: string;
  documentCount: number;
  totalPages: number;
  totalChunks: number;
  lastUploadDate: string | null;
  recentDocuments: DocumentInfo[];
  defaultDocuments: DocumentInfo[];
}

interface DocumentInfo {
  title: string;
  fileName: string;
  uploadedAt: string;
  pageCount: number;
  chunkCount: number;
}

export async function GET(request: NextRequest) {
  console.log('Member stats API called');
  
  try {
    // IPベースのレート制限
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, 'graphSearch');
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // クエリパラメータからメールアドレスを取得
    const { searchParams } = new URL(request.url);
    const memberEmail = searchParams.get('email');

    if (!memberEmail) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    let session;
    try {
      session = getSession();
      console.log('Neo4j session created successfully');
    } catch (error) {
      console.error('Failed to create Neo4j session:', error);
      // Return empty stats when Neo4j is unavailable
      return NextResponse.json({
        memberEmail,
        organization: 'GAIS',
        documentCount: 0,
        totalPages: 0,
        totalChunks: 0,
        lastUploadDate: null,
        recentDocuments: [],
        defaultDocuments: [],
        error: 'Database temporarily unavailable'
      });
    }

    try {
      // 会員の統計情報を取得
      const statsResult = await session.run(`
        MATCH (d:Document)
        WHERE d.uploadedBy = $email AND d.organization = 'GAIS'
        OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
        WITH d, count(c) as chunkCount
        RETURN 
          d.uploadedBy as memberEmail,
          d.organization as organization,
          count(DISTINCT d) as documentCount,
          sum(d.pageCount) as totalPages,
          sum(chunkCount) as totalChunks,
          max(d.uploadedAt) as lastUploadDate
      `, { email: memberEmail });

      if (statsResult.records.length === 0) {
        // メンバー自身のドキュメントはないが、デフォルトドキュメントを取得
        let defaultDocuments: DocumentInfo[] = [];
        try {
          const defaultDocsResult = await session.run(`
            MATCH (d:Document)
            WHERE d.isDefault = true
            OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
            WITH d, count(c) as chunkCount
            RETURN
              d.title as title,
              d.fileName as fileName,
              d.uploadedAt as uploadedAt,
              d.pageCount as pageCount,
              chunkCount
            ORDER BY d.uploadedAt DESC
          `);

          defaultDocuments = defaultDocsResult.records.map(record => ({
            title: record.get('title'),
            fileName: record.get('fileName'),
            uploadedAt: record.get('uploadedAt'),
            pageCount: record.get('pageCount'),
            chunkCount: record.get('chunkCount')
          }));
        } catch (error) {
          console.warn('Failed to fetch default documents:', error);
          defaultDocuments = [];
        }

        return NextResponse.json({
          memberEmail,
          organization: 'GAIS',
          documentCount: 0,
          totalPages: 0,
          totalChunks: 0,
          lastUploadDate: null,
          recentDocuments: [],
          defaultDocuments
        });
      }

      const stats = statsResult.records[0];

      // 最近のアップロード文書を取得
      const recentDocsResult = await session.run(`
        MATCH (d:Document)
        WHERE d.uploadedBy = $email AND d.organization = 'GAIS'
        OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
        WITH d, count(c) as chunkCount
        RETURN 
          d.title as title,
          d.fileName as fileName,
          d.uploadedAt as uploadedAt,
          d.pageCount as pageCount,
          chunkCount
        ORDER BY d.uploadedAt DESC
        LIMIT 5
      `, { email: memberEmail });

      const recentDocuments: DocumentInfo[] = recentDocsResult.records.map(record => ({
        title: record.get('title'),
        fileName: record.get('fileName'),
        uploadedAt: record.get('uploadedAt'),
        pageCount: record.get('pageCount'),
        chunkCount: record.get('chunkCount')
      }));

      // デフォルトドキュメントを取得（全ユーザーに表示）
      let defaultDocuments: DocumentInfo[] = [];
      try {
        const defaultDocsResult = await session.run(`
          MATCH (d:Document)
          WHERE d.isDefault = true
          OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
          WITH d, count(c) as chunkCount
          RETURN
            d.title as title,
            d.fileName as fileName,
            d.uploadedAt as uploadedAt,
            d.pageCount as pageCount,
            chunkCount
          ORDER BY d.uploadedAt DESC
        `);

        defaultDocuments = defaultDocsResult.records.map(record => ({
          title: record.get('title'),
          fileName: record.get('fileName'),
          uploadedAt: record.get('uploadedAt'),
          pageCount: record.get('pageCount'),
          chunkCount: record.get('chunkCount')
        }));
      } catch (error) {
        console.warn('Failed to fetch default documents:', error);
        // デフォルトドキュメントの取得に失敗しても続行
        defaultDocuments = [];
      }

      const memberStats: MemberStatistics = {
        memberEmail: stats.get('memberEmail') || memberEmail,
        organization: stats.get('organization') || 'GAIS',
        documentCount: stats.get('documentCount') || 0,
        totalPages: stats.get('totalPages') || 0,
        totalChunks: stats.get('totalChunks') || 0,
        lastUploadDate: stats.get('lastUploadDate'),
        recentDocuments,
        defaultDocuments
      };

      const response = NextResponse.json(memberStats);
      addRateLimitHeaders(response, rateLimitResult);
      return response;

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('Member stats error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // 開発環境では詳細なエラー情報を返す
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Failed to retrieve member statistics',
        ...(isDev && {
          details: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? error.constructor.name : typeof error
        })
      },
      { status: 500 }
    );
  }
}

// 全体統計を取得するエンドポイント
export async function POST(request: NextRequest) {
  try {
    // IPベースのレート制限
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, 'graphSearch');
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    const session = getSession();

    try {
      // 全体統計を取得
      const overallStatsResult = await session.run(`
        MATCH (d:Document)
        WHERE d.organization = 'GAIS'
        OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
        OPTIONAL MATCH (d)-[:MENTIONS]->(e:Entity)
        RETURN 
          count(DISTINCT d) as totalDocuments,
          count(DISTINCT d.uploadedBy) as uniqueMembers,
          count(DISTINCT c) as totalChunks,
          count(DISTINCT e) as totalEntities,
          sum(d.pageCount) as totalPages
      `);

      // 上位貢献者
      const topContributorsResult = await session.run(`
        MATCH (d:Document)
        WHERE d.organization = 'GAIS' AND d.uploadedBy IS NOT NULL
        RETURN 
          d.uploadedBy as memberEmail,
          count(d) as documentCount,
          sum(d.pageCount) as totalPages
        ORDER BY documentCount DESC
        LIMIT 10
      `);

      // 最近のアップロード
      const recentUploadsResult = await session.run(`
        MATCH (d:Document)
        WHERE d.organization = 'GAIS'
        RETURN 
          d.title as title,
          d.uploadedBy as uploadedBy,
          d.uploadedAt as uploadedAt,
          d.pageCount as pageCount
        ORDER BY d.uploadedAt DESC
        LIMIT 10
      `);

      const overallStats = overallStatsResult.records[0];
      
      const response = NextResponse.json({
        overall: {
          totalDocuments: overallStats.get('totalDocuments') || 0,
          uniqueMembers: overallStats.get('uniqueMembers') || 0,
          totalChunks: overallStats.get('totalChunks') || 0,
          totalEntities: overallStats.get('totalEntities') || 0,
          totalPages: overallStats.get('totalPages') || 0
        },
        topContributors: topContributorsResult.records.map(record => ({
          memberEmail: record.get('memberEmail'),
          documentCount: record.get('documentCount'),
          totalPages: record.get('totalPages')
        })),
        recentUploads: recentUploadsResult.records.map(record => ({
          title: record.get('title'),
          uploadedBy: record.get('uploadedBy'),
          uploadedAt: record.get('uploadedAt'),
          pageCount: record.get('pageCount')
        }))
      });

      addRateLimitHeaders(response, rateLimitResult);
      return response;

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('Overall stats error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve overall statistics' },
      { status: 500 }
    );
  }
}