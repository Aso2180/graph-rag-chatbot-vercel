# GAIS GraphRAG Chatbot - Pre-Deployment Checklist

## 🚀 Vercel Deployment Preparation

### ✅ Phase 1: Code Preparation

#### 1. Clean Working Directory
```bash
# Remove test files and logs
rm -rf uploads/*
rm -rf test-uploads/*
rm -f *.log
rm -f test-*.js debug-*.js

# Keep only production-ready uploads if needed
```

#### 2. Environment Files
- [ ] Create `.env.production` with placeholder values ✅
- [ ] Remove sensitive data from `.env.local`
- [ ] Ensure `.gitignore` excludes all env files ✅

#### 3. Dependencies Check
```bash
# Ensure all dependencies are in package.json
npm install --save pdf-parse-new
npm install --save-dev @types/node-fetch
```

### ✅ Phase 2: GitHub Repository Setup

#### 1. Initialize Git Repository
```bash
# If not already initialized
git init
git remote add origin https://github.com/[username]/gais-graphrag-chatbot.git
```

#### 2. Commit Production Code
```bash
# Add all production files
git add .
git commit -m "feat: GAIS GraphRAG Chatbot - Production Release v1.0"
git push -u origin main
```

### ✅ Phase 3: Vercel Configuration

#### 1. Environment Variables to Set in Vercel Dashboard

**🔴 Required (Must Set)**
```bash
NEO4J_URI=neo4j+s://bf116132.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=[Your Neo4j Password]
ANTHROPIC_API_KEY=[Your Claude API Key]
TAVILY_API_KEY=[Your Tavily API Key]
NODE_ENV=production
```

**🟡 Optional (Recommended)**
```bash
NEXT_PUBLIC_APP_URL=[Your Vercel URL]
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=50
MAX_UPLOAD_SIZE=20971520
UPLOAD_TIMEOUT_MS=300000
```

#### 2. Vercel Project Settings
```yaml
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node.js Version: 18.x
Region: Tokyo (nrt1)
```

### ✅ Phase 4: Pre-Flight Checks

#### 1. Local Build Test
```bash
# Clean build test
npm run build
npm run start
```

#### 2. API Endpoints Test
- [ ] `/api/chat` - Chat functionality
- [ ] `/api/upload` - PDF upload
- [ ] `/api/graph-search` - GraphRAG search
- [ ] `/api/member-stats` - Member statistics
- [ ] `/api/web-search` - Tavily integration

#### 3. Security Review
- [ ] No hardcoded secrets in code
- [ ] All API keys in environment variables
- [ ] Rate limiting configured
- [ ] File upload validation active
- [ ] CORS headers configured

### ✅ Phase 5: Database Verification

#### 1. Neo4j Aura Status
- [ ] Connection test successful ✅
- [ ] Production indexes created ✅
- [ ] Member nodes functional ✅
- [ ] Upload tracking working ✅
- [ ] IP allowlist configured (pending)

#### 2. Data Integrity
- [ ] 6 GAIS documents present ✅
- [ ] 3 member records active ✅
- [ ] Search indexes operational ✅

### 🚦 Deployment Decision Points

#### Ready to Deploy When:
1. ✅ Build completes without errors
2. ✅ All environment variables documented
3. ✅ GitHub repository ready
4. ✅ Neo4j Aura production-ready
5. ✅ Security checklist complete

#### Hold Deployment If:
1. ❌ Build errors exist
2. ❌ Missing API keys
3. ❌ Database connection issues
4. ❌ Security vulnerabilities found

### 📋 Quick Deploy Commands

```bash
# 1. Final commit
git add .
git commit -m "chore: production deployment ready"
git push origin main

# 2. Vercel deployment (if using CLI)
vercel --prod

# 3. Or use Vercel Dashboard
# - Import GitHub repository
# - Configure environment variables
# - Deploy
```

### 🔍 Post-Deployment Verification

#### Immediate Checks (First 5 minutes)
1. [ ] Site loads at production URL
2. [ ] Chat interface functional
3. [ ] PDF upload works
4. [ ] Dashboard displays
5. [ ] No console errors

#### Extended Testing (First hour)
1. [ ] Upload test PDF as GAIS member
2. [ ] Verify GraphRAG search
3. [ ] Check member statistics
4. [ ] Test rate limiting
5. [ ] Monitor error logs

### 📞 Support Contacts

**Technical Issues:**
- Vercel Support: https://vercel.com/support
- Neo4j Aura: https://support.neo4j.com
- Anthropic: https://support.anthropic.com

**GAIS Internal:**
- Technical Lead: [Contact Info]
- Database Admin: [Contact Info]
- Security Team: [Contact Info]

---

**🚀 Ready for Production Deployment!**

Once all checklist items are complete, proceed with confidence to deploy the GAIS GraphRAG Chatbot to production.