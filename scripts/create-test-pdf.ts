/**
 * Create a test PDF for upload functionality testing
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

// Simple PDF content (minimal PDF structure)
const createTestPDF = () => {
  const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(AI法的リスク分析テスト文書) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000275 00000 n 
0000000369 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
449
%%EOF`;

  const testDir = join(process.cwd(), 'test-uploads');
  const fs = require('fs');
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const filePath = join(testDir, 'gais-test-document.pdf');
  writeFileSync(filePath, content);
  
  console.log(`Test PDF created: ${filePath}`);
  console.log(`File size: ${fs.statSync(filePath).size} bytes`);
  
  return filePath;
};

// Create test PDF if called directly
if (require.main === module) {
  createTestPDF();
}

export { createTestPDF };