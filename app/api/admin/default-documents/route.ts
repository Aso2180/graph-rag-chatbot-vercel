import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/neo4j/query-api-client';

// デフォルトドキュメントを設定・取得するAPI

export async function POST(request: NextRequest) {
  console.log('Set default documents API called');

  try {
    const { fileName, isDefault = true } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    let session;
    try {
      session = getSession();
      console.log('Neo4j session created successfully');
    } catch (error) {
      console.error('Failed to create Neo4j session:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    try {
      // 指定されたファイル名のドキュメントにisDefaultフラグを設定
      const result = await session.run(
        `
        MATCH (d:Document)
        WHERE d.fileName = $fileName
        SET d.isDefault = $isDefault
        RETURN d.title as title, d.fileName as fileName, d.isDefault as isDefault, d.uploadedBy as uploadedBy
        `,
        { fileName, isDefault }
      );

      if (result.records.length === 0) {
        return NextResponse.json(
          { error: 'Document not found', fileName },
          { status: 404 }
        );
      }

      const doc = result.records[0];

      console.log(`Document ${fileName} set as default: ${isDefault}`);

      return NextResponse.json({
        success: true,
        message: `Document marked as ${isDefault ? 'default' : 'non-default'}`,
        document: {
          title: doc.get('title'),
          fileName: doc.get('fileName'),
          isDefault: doc.get('isDefault'),
          uploadedBy: doc.get('uploadedBy')
        }
      });

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('Set default documents error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to set default documents' },
      { status: 500 }
    );
  }
}

// デフォルトドキュメントのリストを取得
export async function GET(request: NextRequest) {
  console.log('Get default documents API called');

  try {
    let session;
    try {
      session = getSession();
      console.log('Neo4j session created successfully');
    } catch (error) {
      console.error('Failed to create Neo4j session:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    try {
      // デフォルトドキュメントを取得
      const result = await session.run(`
        MATCH (d:Document)
        WHERE d.isDefault = true
        OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
        WITH d, count(c) as chunkCount
        RETURN
          d.title as title,
          d.fileName as fileName,
          d.uploadedBy as uploadedBy,
          d.uploadedAt as uploadedAt,
          d.pageCount as pageCount,
          d.isDefault as isDefault,
          chunkCount
        ORDER BY d.uploadedAt DESC
      `);

      const defaultDocuments = result.records.map(record => ({
        title: record.get('title'),
        fileName: record.get('fileName'),
        uploadedBy: record.get('uploadedBy'),
        uploadedAt: record.get('uploadedAt'),
        pageCount: record.get('pageCount'),
        isDefault: record.get('isDefault'),
        chunkCount: record.get('chunkCount')
      }));

      return NextResponse.json({
        success: true,
        count: defaultDocuments.length,
        documents: defaultDocuments
      });

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('Get default documents error:', error);
    return NextResponse.json(
      { error: 'Failed to get default documents' },
      { status: 500 }
    );
  }
}
