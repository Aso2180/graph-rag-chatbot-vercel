// In production (Vercel), environment variables are already loaded
// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const dotenv = require('dotenv');
    const path = require('path');
    const fs = require('fs');

    // .env.local を優先的に読み込む（Next.jsの標準に合わせる）
    const envLocalPath = path.resolve(process.cwd(), '.env.local');
    const envPath = path.resolve(process.cwd(), '.env');

    if (fs.existsSync(envLocalPath)) {
      dotenv.config({ path: envLocalPath, override: true });
      console.log('Loaded environment from .env.local');
    } else if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
      console.log('Loaded environment from .env');
    }
  } catch (error) {
    console.log('Running in production mode, dotenv not needed');
  }
}

export const env = {
  NEO4J_URI: process.env.NEO4J_URI || 'neo4j+s://12cc4171.databases.neo4j.io',
  NEO4J_USER: process.env.NEO4J_USER || 'neo4j',
  NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  SERPAPI_KEY: process.env.SERPAPI_KEY,
  MODEL_NAME: process.env.MODEL_NAME,
  NODE_ENV: process.env.NODE_ENV
};

// Debug logging for production
if (process.env.NODE_ENV === 'production') {
  console.log('Environment check:', {
    NEO4J_URI: env.NEO4J_URI,
    NEO4J_USER: env.NEO4J_USER,
    NEO4J_PASSWORD_SET: !!env.NEO4J_PASSWORD,
    ANTHROPIC_KEY_SET: !!env.ANTHROPIC_API_KEY,
    TAVILY_KEY_SET: !!env.TAVILY_API_KEY,
    NODE_ENV: env.NODE_ENV
  });
}