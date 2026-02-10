import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/neo4j/query-api-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName parameter is required' },
        { status: 400 }
      );
    }

    console.log('Fetching document content for:', fileName);

    const session = getSession();

    try {
      // ドキュメントとそのチャンクを取得
      const result = await session.run(
        `
        MATCH (d:Document {fileName: $fileName})
        OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
        WITH d, c
        ORDER BY c.chunkIndex
        RETURN d.title as title,
               d.fileName as fileName,
               d.pageCount as pageCount,
               collect({
                 text: c.content,
                 chunkIndex: c.chunkIndex,
                 pageNumber: c.pageNumber
               }) as chunks
        LIMIT 1
        `,
        { fileName }
      );

      if (!result.records || result.records.length === 0) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      const record = result.records[0];
      const documentData = {
        title: record.get('title'),
        fileName: record.get('fileName'),
        pageCount: record.get('pageCount'),
        chunks: record.get('chunks')
          .filter((chunk: any) => chunk.text) // テキストがあるチャンクのみ
          .sort((a: any, b: any) => (a.chunkIndex || 0) - (b.chunkIndex || 0)) // チャンクインデックスでソート
      };

      console.log('Document content retrieved:', {
        title: documentData.title,
        chunkCount: documentData.chunks.length
      });

      return NextResponse.json(documentData);
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Document content fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve document content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
