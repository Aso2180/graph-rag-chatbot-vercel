/**
 * Test Dashboard API Script
 * Safe for TypeScript strict mode & Next.js build
 */

type OverallStats = {
  overall: {
    totalDocuments: number;
    uniqueMembers: number;
    totalChunks: number;
    totalEntities: number;
  };
};

/**
 * unknown を安全に型チェックする
 */
function isOverallStats(data: unknown): data is OverallStats {
  if (
    typeof data === 'object' &&
    data !== null &&
    'overall' in data &&
    typeof (data as any).overall === 'object'
  ) {
    const o = (data as any).overall;
    return (
      typeof o.totalDocuments === 'number' &&
      typeof o.uniqueMembers === 'number' &&
      typeof o.totalChunks === 'number' &&
      typeof o.totalEntities === 'number'
    );
  }
  return false;
}

async function testDashboard() {
  console.log('📊 Dashboard API Test...\n');

  try {
    const overallStatsResponse = await fetch(
      'http://localhost:3000/api/dashboard/overall'
    );

    if (!overallStatsResponse.ok) {
      throw new Error(
        `Request failed: ${overallStatsResponse.status}`
      );
    }

    const data: unknown = await overallStatsResponse.json();

    if (!isOverallStats(data)) {
      console.error('❌ Invalid response format:', data);
      return;
    }

    console.log('✅ Overall Statistics API Response:');
    console.log(`   Total Documents: ${data.overall.totalDocuments}`);
    console.log(`   Unique Members: ${data.overall.uniqueMembers}`);
    console.log(`   Total Chunks: ${data.overall.totalChunks}`);
    console.log(`   Total Entities: ${data.overall.totalEntities}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error('❌ Dashboard test failed:', message);
  }
}

export { testDashboard };

if (require.main === module) {
  testDashboard().catch(err =>
    console.error(
      err instanceof Error ? err.message : String(err)
    )
  );
}
