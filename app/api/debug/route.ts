import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/config/env';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const debugInfo = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    envVars: {
      ANTHROPIC_KEY_SET: !!env.ANTHROPIC_API_KEY,
      ANTHROPIC_KEY_LENGTH: env.ANTHROPIC_API_KEY?.length || 0,
      ANTHROPIC_KEY_PREFIX: env.ANTHROPIC_API_KEY?.substring(0, 10) || 'NOT_SET',
      NEO4J_URI: env.NEO4J_URI,
      NEO4J_USER: env.NEO4J_USER,
      NEO4J_PASSWORD_SET: !!env.NEO4J_PASSWORD,
      SERPAPI_KEY_SET: !!env.SERPAPI_KEY,
      SERPAPI_KEY_LENGTH: env.SERPAPI_KEY?.length || 0,
      TAVILY_KEY_SET: !!env.TAVILY_API_KEY,
      TAVILY_KEY_LENGTH: env.TAVILY_API_KEY?.length || 0,
    },
    tests: {
      serpApiTest: null as any,
      anthropicTest: null as any,
      neo4jTest: null as any
    }
  };

  // Test SERP API
  try {
    if (env.SERPAPI_KEY) {
      const serpResponse = await axios.get('https://serpapi.com/search', {
        params: {
          api_key: env.SERPAPI_KEY,
          q: 'test',
          engine: 'google',
          num: 1
        },
        timeout: 5000
      });
      debugInfo.tests.serpApiTest = {
        status: 'success',
        hasResults: !!(serpResponse.data as any).organic_results
      };
    } else {
      debugInfo.tests.serpApiTest = { status: 'no_key' };
    }
  } catch (error: any) {
    debugInfo.tests.serpApiTest = {
      status: 'error',
      message: error.message,
      code: error.response?.status
    };
  }

  // Test Anthropic API
  try {
    if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        },
        {
          headers: {
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      debugInfo.tests.anthropicTest = {
        status: 'success',
        model: (response.data as any).model
      };
    } else {
      debugInfo.tests.anthropicTest = { status: 'no_key' };
    }
  } catch (error: any) {
    debugInfo.tests.anthropicTest = {
      status: 'error',
      message: error.message,
      code: error.response?.status,
      data: error.response?.data
    };
  }

  // Test Neo4j connection
  try {
    const neo4j = require('neo4j-driver');
    const driver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD)
    );
    
    const session = driver.session();
    await session.run('RETURN 1 as test');
    await session.close();
    await driver.close();
    
    debugInfo.tests.neo4jTest = { status: 'success' };
  } catch (error: any) {
    debugInfo.tests.neo4jTest = {
      status: 'error',
      message: error.message
    };
  }

  return NextResponse.json(debugInfo);
}