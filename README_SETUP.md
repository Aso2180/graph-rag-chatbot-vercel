# Graph RAG Chatbot Setup Guide

This application uses Claude 3.5 Sonnet (claude-3-5-sonnet-20241022) for conversational AI with graph database context from Neo4j.

## Prerequisites

1. Node.js 18+ installed
2. Neo4j database running (locally or cloud)
3. Anthropic API key

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory with:

```env
# Anthropic API Key for Claude 3.5 Sonnet
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Neo4j Database Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password_here

# Application Settings (Claude 3.5 Sonnet model)
MODEL_NAME=claude-3-5-sonnet-20241022
```

### 3. Start Neo4j Database

If using local Neo4j:
```bash
# Using Docker
docker run -d --name neo4j \
  -p 7687:7687 -p 7474:7474 \
  -e NEO4J_AUTH=neo4j/your_password_here \
  neo4j:latest
```

### 4. Run the Application

Development mode:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
graph-rag-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # Chat API endpoint using Claude 3.5 Sonnet
│   └── page.tsx              # Main page
├── components/
│   └── ChatInterface.tsx     # Chat UI component
├── lib/
│   ├── anthropic/
│   │   └── client.ts         # Anthropic client configuration
│   └── neo4j/
│       ├── client.ts         # Neo4j connection
│       └── queries.ts        # Graph query functions
└── .env.local                # Environment configuration
```

## Features

- **Claude 3.5 Sonnet Integration**: Uses the latest Claude model for high-quality responses
- **Graph Context**: Queries Neo4j to provide relevant context to the AI
- **Toggle Graph Context**: Option to enable/disable graph database context
- **Real-time Chat Interface**: Clean, responsive UI for chatting with the AI

## API Endpoint

### POST `/api/chat`

Request body:
```json
{
  "message": "Your question here",
  "useGraphContext": true
}
```

Response:
```json
{
  "response": "Claude's response",
  "graphContextUsed": true,
  "model": "claude-3-5-sonnet-20241022"
}
```

## Troubleshooting

1. **Neo4j Connection Issues**: Ensure Neo4j is running and credentials are correct
2. **API Key Issues**: Verify your Anthropic API key is valid and has access to Claude 3.5 Sonnet
3. **TypeScript Errors**: Run `npm run build` to check for type errors

## Testing with Claude 3.5 Sonnet

1. Start the application
2. Open http://localhost:3000
3. Try these test queries:
   - With graph context: Ask about entities in your Neo4j database
   - Without graph context: Ask general questions
4. Toggle the "Use Graph Context" checkbox to see the difference