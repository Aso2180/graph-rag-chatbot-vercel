import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface GitHubTreeItem {
  path: string;
  type: string;
  size?: number;
}

function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  const match = url.trim().match(/github\.com\/([^/]+)\/([^/]+?)(?:\/tree\/([^/\s]+))?(?:\/|\.git|$)/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    branch: match[3],
  };
}

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, memberEmail } = await request.json();

    if (!repoUrl) {
      return NextResponse.json({ error: 'リポジトリURLを入力してください' }, { status: 400 });
    }
    if (!memberEmail) {
      return NextResponse.json({ error: 'メールアドレスを入力してください' }, { status: 400 });
    }

    const repoInfo = parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      return NextResponse.json(
        { error: '無効なGitHubリポジトリURLです。例: https://github.com/yourname/yourrepo' },
        { status: 400 }
      );
    }

    const { owner, repo } = repoInfo;
    const apiHeaders: HeadersInit = { 'User-Agent': 'GAIS-App' };

    // デフォルトブランチを取得
    let branch = repoInfo.branch;
    if (!branch) {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: apiHeaders,
      });
      if (!repoRes.ok) {
        const status = repoRes.status;
        if (status === 404) {
          return NextResponse.json(
            { error: 'リポジトリが見つかりません。URLを確認するか、パブリックリポジトリかどうかご確認ください' },
            { status: 404 }
          );
        }
        if (status === 403) {
          return NextResponse.json(
            { error: 'GitHub APIのレート制限に達しました。しばらく待ってから再試行してください' },
            { status: 429 }
          );
        }
        return NextResponse.json({ error: 'リポジトリ情報の取得に失敗しました' }, { status: 500 });
      }
      const repoData = await repoRes.json();
      branch = repoData.default_branch;
    }

    // ファイルツリーを取得
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers: apiHeaders }
    );
    if (!treeRes.ok) {
      return NextResponse.json(
        { error: 'リポジトリのファイル一覧を取得できませんでした' },
        { status: 500 }
      );
    }

    const treeData = await treeRes.json();
    const mdFiles: GitHubTreeItem[] = (treeData.tree as GitHubTreeItem[]).filter(
      (item) => item.type === 'blob' && item.path.toLowerCase().endsWith('.md')
    );

    if (mdFiles.length === 0) {
      return NextResponse.json(
        { error: 'リポジトリ内にMarkdown（.md）ファイルが見つかりませんでした' },
        { status: 404 }
      );
    }

    // 各MDファイルを取得してNeo4jに保存
    const { processMDFromBuffer } = await import('@/lib/pdf/processor');
    const results: { path: string; success: boolean; error?: string }[] = [];

    for (const file of mdFiles) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
      try {
        const contentRes = await fetch(rawUrl, { headers: apiHeaders });
        if (!contentRes.ok) {
          results.push({ path: file.path, success: false, error: 'ファイルの取得に失敗' });
          continue;
        }
        const text = await contentRes.text();
        const buffer = Buffer.from(text, 'utf-8');
        const fileName = `${owner}_${repo}_${file.path.replace(/\//g, '_')}`;
        await processMDFromBuffer(buffer, fileName, memberEmail);
        results.push({ path: file.path, success: true });
      } catch (err) {
        results.push({ path: file.path, success: false, error: String(err) });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`[GitHub Import] ${owner}/${repo}: ${successCount}/${mdFiles.length} files imported`);

    return NextResponse.json({
      success: true,
      repo: `${owner}/${repo}`,
      branch,
      total: mdFiles.length,
      imported: successCount,
      results,
    });
  } catch (error) {
    console.error('[GitHub Import] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' },
      { status: 500 }
    );
  }
}
