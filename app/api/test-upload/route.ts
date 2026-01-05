import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/config/env';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  console.log('Test upload endpoint called');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
    neo4j: {
      uri: !!env.NEO4J_URI,
      user: !!env.NEO4J_USER,
      password: !!env.NEO4J_PASSWORD,
      uriValue: env.NEO4J_URI?.substring(0, 20) + '...'
    },
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method
  };

  try {
    // Test FormData parsing
    let formDataTest: any = { success: false, error: '' };
    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const email = formData.get('memberEmail');
      
      formDataTest = {
        success: true,
        error: '',
        fileExists: !!file,
        emailExists: !!email,
        fileName: file instanceof File ? file.name : 'Not a file',
        fileSize: file instanceof File ? file.size : 0,
        fileType: file instanceof File ? file.type : 'Unknown'
      };
    } catch (e) {
      formDataTest.error = e instanceof Error ? e.message : 'Unknown error';
    }

    // Test Neo4j connection
    let neo4jTest: any = { success: false, error: '' };
    try {
      const { getSession } = await import('@/lib/neo4j/query-api-client');
      const session = getSession();
      const result = await session.run('RETURN 1 as test');
      await session.close();
      neo4jTest = { success: true, error: '' };
    } catch (e) {
      neo4jTest.error = e instanceof Error ? e.message : 'Unknown error';
    }

    // Test PDF parser
    let pdfParserTest: any = { success: false, error: '' };
    try {
      const pdf = await import('pdf-parse-new');
      pdfParserTest = { 
        success: true, 
        error: '',
        moduleLoaded: !!pdf.default
      };
    } catch (e) {
      pdfParserTest.error = e instanceof Error ? e.message : 'Unknown error';
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      tests: {
        formData: formDataTest,
        neo4j: neo4jTest,
        pdfParser: pdfParserTest
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      diagnostics
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test upload endpoint',
    description: 'POST a file to test upload functionality'
  });
}