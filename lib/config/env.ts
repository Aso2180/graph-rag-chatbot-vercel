import * as dotenv from 'dotenv';
import * as path from 'path';

// Force reload environment variables for API routes
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env'),
  override: true 
});

export const env = {
  NEO4J_URI: process.env.NEO4J_URI || 'neo4j+s://bf116132.databases.neo4j.io',
  NEO4J_USER: process.env.NEO4J_USER || 'neo4j',
  NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || 'WxYHqHNKFarbahtYX2BeE2RHXE7WOxC6gC7Nv9-Ms40',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  SERPAPI_KEY: process.env.SERPAPI_KEY,
  MODEL_NAME: process.env.MODEL_NAME,
  NODE_ENV: process.env.NODE_ENV
};