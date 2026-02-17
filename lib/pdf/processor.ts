import { readFile } from 'fs/promises';
import { env } from '@/lib/config/env';
import { getSession } from '@/lib/neo4j/query-api-client';

interface PDFChunk {
  content: string;
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}

export async function processMDFromBuffer(buffer: Buffer, fileName: string, memberEmail?: string) {
  console.log(`Starting MD processing for: ${fileName}`);

  const text = buffer.toString('utf-8');
  console.log(`MD parsed: ${text.length} characters`);

  const metadata = {
    title: fileName.replace(/\.md$/i, ''),
    author: 'Unknown',
    subject: 'Markdown document',
    keywords: '',
    creationDate: new Date(),
    pageCount: 1,
    fileName: fileName,
    uploadedBy: memberEmail || 'anonymous',
    uploadedAt: new Date(),
    organization: 'GAIS',
  };

  const chunks = splitTextIntoChunks(text, 1000);

  let neo4jSaved = false;
  try {
    await savePDFToNeo4j(metadata, chunks);
    neo4jSaved = true;
    console.log(`MD processing completed: ${chunks.length} chunks created and saved to Neo4j`);
  } catch (error) {
    console.warn(`Neo4j save failed, but MD was processed successfully:`, error instanceof Error ? error.message : 'Unknown error');
  }

  return {
    success: true,
    metadata,
    chunkCount: chunks.length,
    neo4jSaved,
  };
}

export async function processPDFForNeo4jFromBuffer(buffer: Buffer, fileName: string, memberEmail?: string) {
  console.log(`Starting PDF processing for: ${fileName}`);
  console.log(`Buffer size: ${buffer.length} bytes`);
  
  try {
    // PDF解析
    console.log('Loading pdf-parse-new module...');
    // @ts-ignore - Using pdf-parse-new which has v1 compatible API
    const pdf = await import('pdf-parse-new');
    console.log('Parsing PDF...');
    const pdfData = await pdf.default(buffer);
    console.log(`PDF parsed: ${pdfData.numpages} pages, ${pdfData.text.length} characters`);
    
    // メタデータ抽出（GAIS会員情報を含む）
    const metadata = {
      title: pdfData.info?.Title || fileName,
      author: pdfData.info?.Author || 'Unknown',
      subject: pdfData.info?.Subject || '',
      keywords: pdfData.info?.Keywords || '',
      creationDate: pdfData.info?.CreationDate || new Date(),
      pageCount: pdfData.numpages,
      fileName: fileName,
      // GAIS会員情報
      uploadedBy: memberEmail || 'anonymous',
      uploadedAt: new Date(),
      organization: 'GAIS'
    };
    
    // テキストをチャンクに分割
    const chunks = splitTextIntoChunks(pdfData.text, 1000); // 1000文字ごとにチャンク分割
    
    // Neo4jに保存（失敗した場合はワーニングのみ）
    let neo4jSaved = false;
    try {
      await savePDFToNeo4j(metadata, chunks);
      neo4jSaved = true;
      console.log(`PDF processing completed: ${chunks.length} chunks created and saved to Neo4j`);
    } catch (error) {
      console.warn(`Neo4j save failed, but PDF was processed successfully:`, error instanceof Error ? error.message : 'Unknown error');
    }
    
    return {
      success: true,
      metadata,
      chunkCount: chunks.length,
      neo4jSaved
    };
    
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function processPDFForNeo4j(filePath: string, fileName: string, memberEmail?: string) {
  console.log(`Starting PDF processing for: ${fileName}`);
  
  try {
    // PDFファイルを読み込み
    const dataBuffer = await readFile(filePath);
    
    // PDF解析
    // @ts-ignore - Using pdf-parse-new which has v1 compatible API
    const pdf = await import('pdf-parse-new');
    const pdfData = await pdf.default(dataBuffer);
    console.log(`PDF parsed: ${pdfData.numpages} pages, ${pdfData.text.length} characters`);
    
    // メタデータ抽出（GAIS会員情報を含む）
    const metadata = {
      title: pdfData.info?.Title || fileName,
      author: pdfData.info?.Author || 'Unknown',
      subject: pdfData.info?.Subject || '',
      keywords: pdfData.info?.Keywords || '',
      creationDate: pdfData.info?.CreationDate || new Date(),
      pageCount: pdfData.numpages,
      fileName: fileName,
      // GAIS会員情報
      uploadedBy: memberEmail || 'anonymous',
      uploadedAt: new Date(),
      organization: 'GAIS'
    };
    
    // テキストをチャンクに分割
    const chunks = splitTextIntoChunks(pdfData.text, 1000); // 1000文字ごとにチャンク分割
    
    // Neo4jに保存
    await savePDFToNeo4j(metadata, chunks);
    
    console.log(`PDF processing completed: ${chunks.length} chunks created`);
    return {
      success: true,
      metadata,
      chunkCount: chunks.length
    };
    
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function splitTextIntoChunks(text: string, chunkSize: number): PDFChunk[] {
  const chunks: PDFChunk[] = [];
  const sentences = text.split(/[。！？\.\!\?]+/);
  let currentChunk = '';
  let currentIndex = 0;
  let pageNumber = 1;
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    // ページ番号の推定（改ページ文字で判断）
    const pageBreaks = (sentence.match(/\f/g) || []).length;
    pageNumber += pageBreaks;
    
    if (currentChunk.length + trimmedSentence.length > chunkSize && currentChunk.length > 0) {
      // 現在のチャンクを保存
      chunks.push({
        content: currentChunk.trim(),
        pageNumber: pageNumber,
        startIndex: currentIndex,
        endIndex: currentIndex + currentChunk.length
      });
      
      currentIndex += currentChunk.length;
      currentChunk = trimmedSentence + '。';
    } else {
      currentChunk += trimmedSentence + '。';
    }
  }
  
  // 最後のチャンクを保存
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      pageNumber: pageNumber,
      startIndex: currentIndex,
      endIndex: currentIndex + currentChunk.length
    });
  }
  
  return chunks;
}

async function savePDFToNeo4j(metadata: any, chunks: PDFChunk[]) {
  console.log('Environment check in processor:');
  console.log('NEO4J_URI:', env.NEO4J_URI);
  console.log('NEO4J_USER:', env.NEO4J_USER);
  console.log('NEO4J_PASSWORD exists:', !!env.NEO4J_PASSWORD);
  
  let session;
  try {
    console.log('Creating Neo4j session...');
    session = getSession();
    console.log('Neo4j session created successfully');
  } catch (error) {
    console.error('Failed to create Neo4j session:', error);
    throw new Error('Database connection failed');
  }
  
  try {
    // 1. Documentノードを作成（GAIS会員情報を含む）
    const docResult = await session.run(
      `
      CREATE (d:Document {
        title: $title,
        author: $author,
        subject: $subject,
        keywords: $keywords,
        fileName: $fileName,
        pageCount: $pageCount,
        createdAt: datetime(),
        uploadedAt: datetime(),
        uploadedBy: $uploadedBy,
        organization: $organization
      })
      
      // アップロード履歴の記録
      MERGE (m:Member {email: $uploadedBy})
      ON CREATE SET 
        m.organization = $organization,
        m.firstUploadAt = datetime(),
        m.documentCount = 1
      ON MATCH SET 
        m.documentCount = COALESCE(m.documentCount, 0) + 1,
        m.lastUploadAt = datetime()
      
      CREATE (m)-[:UPLOADED {at: datetime()}]->(d)
      
      RETURN d, elementId(d) as docId
      `,
      metadata
    );
    
    const docId = docResult.records[0].get('docId');
    console.log(`Document created with ID: ${docId}`);
    
    // 2. 各チャンクを保存
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      await session.run(
        `
        MATCH (d:Document) WHERE elementId(d) = $docId
        CREATE (c:Chunk {
          content: $content,
          pageNumber: $pageNumber,
          chunkIndex: $chunkIndex,
          startIndex: $startIndex,
          endIndex: $endIndex,
          createdAt: datetime()
        })
        CREATE (d)-[:CONTAINS {order: $chunkIndex}]->(c)
        `,
        {
          docId: docId,
          content: chunk.content,
          pageNumber: chunk.pageNumber,
          chunkIndex: i,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex
        }
      );
    }
    
    // 3. エンティティ抽出（キーワードベース）
    const importantTerms = extractImportantTerms(chunks.map(c => c.content).join(' '));
    
    for (const term of importantTerms) {
      await session.run(
        `
        MATCH (d:Document) WHERE elementId(d) = $docId
        MERGE (e:Entity {name: $term, type: 'auto_extracted'})
        ON CREATE SET e.createdAt = datetime()
        MERGE (d)-[:MENTIONS]->(e)
        `,
        { docId: docId, term: term }
      );
    }
    
    // 4. 法的リスク関連のタグ付け
    const legalRiskKeywords = ['著作権', '肖像権', 'プライバシー', 'AI生成', '法的リスク', 'ライセンス', '商用利用'];
    const hasLegalRiskContent = chunks.some(chunk => 
      legalRiskKeywords.some(keyword => chunk.content.includes(keyword))
    );
    
    if (hasLegalRiskContent) {
      await session.run(
        `
        MATCH (d:Document) WHERE elementId(d) = $docId
        SET d.hasLegalRiskContent = true
        SET d:LegalDocument
        `,
        { docId: docId }
      );
    }
    
    console.log('Successfully saved PDF to Neo4j');
    
  } catch (error) {
    console.error('Failed to save PDF to Neo4j:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw error;
  } finally {
    if (session) {
      await session.close();
    }
  }
}

function extractImportantTerms(text: string): string[] {
  // 重要な用語を抽出（簡易版）
  const importantPatterns = [
    /AI生成[コンテンツ動画画像音声]*/g,
    /[A-Za-z]+\s*[A-Za-z]*(?:AI|生成)/g,
    /(?:Veo|Canva|Suno|Runway|Sora)/g,
    /(?:著作権|肖像権|プライバシー権|知的財産権)/g,
    /(?:ディープフェイク|フェイク動画)/g
  ];
  
  const terms = new Set<string>();
  
  for (const pattern of importantPatterns) {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      if (match.length > 2 && match.length < 50) {
        terms.add(match.trim());
      }
    });
  }
  
  return Array.from(terms);
}