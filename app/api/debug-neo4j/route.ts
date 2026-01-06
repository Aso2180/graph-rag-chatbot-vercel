import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/config/env';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    neo4j: {
      uri: env.NEO4J_URI,
      user: env.NEO4J_USER,
      passwordSet: !!env.NEO4J_PASSWORD,
      uriFromProcessEnv: process.env.NEO4J_URI,
      userFromProcessEnv: process.env.NEO4J_USER,
      passwordSetFromProcessEnv: !!process.env.NEO4J_PASSWORD,
    },
    tests: {} as any
  };

  // Test 1: Parse URI
  try {
    const uri = env.NEO4J_URI || '';
    const hostname = uri.replace('neo4j+s://', '').replace('neo4j://', '');
    diagnostics.tests.uriParsing = {
      success: true,
      originalUri: uri,
      hostname: hostname,
      queryApiUrl: `https://${hostname}/db/neo4j/query/v2`
    };
  } catch (error) {
    diagnostics.tests.uriParsing = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Test 2: DNS Resolution using fetch
  try {
    const hostname = env.NEO4J_URI?.replace('neo4j+s://', '').replace('neo4j://', '') || '';
    const testUrl = `https://${hostname}`;
    
    // Try to fetch with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      diagnostics.tests.dnsResolution = {
        success: true,
        status: response.status,
        statusText: response.statusText,
        url: testUrl
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    diagnostics.tests.dnsResolution = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      isAborted: error instanceof Error && error.name === 'AbortError'
    };
  }

  // Test 3: Neo4j Query API Connection
  try {
    const { Neo4jQueryAPIClient } = await import('@/lib/neo4j/query-api-client');
    const client = new Neo4jQueryAPIClient();
    
    // Try a simple query
    const result = await client.run('RETURN 1 as test');
    
    diagnostics.tests.queryApi = {
      success: true,
      result: result[0]?.test === 1
    };
  } catch (error) {
    diagnostics.tests.queryApi = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : []
    };
  }

  // Test 4: Alternative hostnames
  const alternativeHosts = [
    'bf116132.databases.neo4j.io',
    'bf116132-databases-neo4j-io.neo4j.io',
    'aura.neo4j.io'
  ];
  
  diagnostics.tests.alternativeHosts = {};
  
  for (const host of alternativeHosts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      await fetch(`https://${host}`, { 
        method: 'HEAD',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      diagnostics.tests.alternativeHosts[host] = { reachable: true };
    } catch (error) {
      diagnostics.tests.alternativeHosts[host] = { 
        reachable: false,
        error: error instanceof Error ? error.message : 'Unknown'
      };
    }
  }

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}