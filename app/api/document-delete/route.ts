import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/neo4j/query-api-client';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');
  const memberEmail = searchParams.get('email');

  if (!fileName || !memberEmail) {
    return NextResponse.json({ error: 'fileName と email は必須です' }, { status: 400 });
  }

  let session;
  try {
    session = getSession();

    // ステップ1: 存在確認（削除権限チェック）
    //   - 該当メンバーがアップロードしたドキュメントのみ
    //   - isDefault = true のデフォルト文書は削除不可
    const checkResult = await session.run(
      `
      MATCH (d:Document {fileName: $fileName, uploadedBy: $memberEmail})
      WHERE NOT coalesce(d.isDefault, false) = true
      RETURN count(d) AS cnt
      `,
      { fileName, memberEmail }
    );

    const cntRaw = checkResult.records[0]?.get('cnt');
    const docCount = cntRaw != null && typeof cntRaw === 'object' && 'toNumber' in cntRaw
      ? cntRaw.toNumber()
      : Number(cntRaw ?? 0);

    if (docCount === 0) {
      return NextResponse.json(
        { error: 'ドキュメントが見つからないか、削除権限がありません' },
        { status: 404 }
      );
    }

    // ステップ2: 削除実行（Chunk → Document の順）
    await session.run(
      `
      MATCH (d:Document {fileName: $fileName, uploadedBy: $memberEmail})
      WHERE NOT coalesce(d.isDefault, false) = true
      OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
      DETACH DELETE c, d
      `,
      { fileName, memberEmail }
    );

    // ステップ3: Member の documentCount を更新
    await session.run(
      `
      MATCH (m:Member {email: $memberEmail})
      SET m.documentCount = CASE
        WHEN coalesce(m.documentCount, 1) > 0 THEN m.documentCount - 1
        ELSE 0
      END
      `,
      { memberEmail }
    );

    console.log(`[Document Delete] Deleted: ${fileName} by ${memberEmail}`);
    return NextResponse.json({ success: true, fileName });
  } catch (error) {
    console.error('[Document Delete] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '削除に失敗しました' },
      { status: 500 }
    );
  } finally {
    if (session) await session.close();
  }
}
