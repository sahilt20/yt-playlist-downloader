import { NextResponse } from 'next/server';
import { create } from 'youtube-dl-exec';
import path from 'path';

const ytDlpPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp');
const ytdl = create(ytDlpPath);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const info = await ytdl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      flatPlaylist: true,
    });

    return NextResponse.json(info);
  } catch (error: any) {
    console.error('Error fetching video info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video information or playlist', details: error?.message || String(error), stack: error?.stack },
      { status: 500 }
    );
  }
}
