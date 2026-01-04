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
}

interface DocumentInfo {
  title: string;
  fileName: string;
  uploadedAt: string;
  pageCount: number;
  chunkCount: number;
}

export async function GET(request: NextRequest) {
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

    const session = getSession();

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
        return NextResponse.json({
          memberEmail,
          organization: 'GAIS',
          documentCount: 0,
          totalPages: 0,
          totalChunks: 0,
          lastUploadDate: null,
          recentDocuments: []
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

      const memberStats: MemberStatistics = {
        memberEmail: stats.get('memberEmail') || memberEmail,
        organization: stats.get('organization') || 'GAIS',
        documentCount: stats.get('documentCount') || 0,
        totalPages: stats.get('totalPages') || 0,
        totalChunks: stats.get('totalChunks') || 0,
        lastUploadDate: stats.get('lastUploadDate'),
        recentDocuments
      };

      const response = NextResponse.json(memberStats);
      addRateLimitHeaders(response, rateLimitResult);
      return response;

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('Member stats error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve member statistics' },
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