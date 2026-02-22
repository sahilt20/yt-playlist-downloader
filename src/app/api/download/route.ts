import { NextResponse } from 'next/server';
import { create } from 'youtube-dl-exec';
import os from 'os';
import path from 'path';

const ytDlpPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp');
const ytdl = create(ytDlpPath);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const format = searchParams.get('format') || 'mp4';

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // Create downloads directory in the user's home/Downloads folder
            const downloadsDir = path.join(os.homedir(), 'Downloads', 'YT_Downloads');

            const args: any = {
                output: path.join(downloadsDir, '%(playlist_title)s', '%(title)s.%(ext)s'),
                noWarnings: true,
            };

            if (format === 'mp3') {
                args.extractAudio = true;
                args.audioFormat = 'mp3';
                args.audioQuality = 0;
            } else {
                // High quality mp4
                args.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
                args.mergeOutputFormat = 'mp4';
            }

            const subprocess = ytdl.exec(url, args);

            subprocess.stdout?.on('data', (data) => {
                const text = data.toString();
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stdout', text })}\n\n`));
            });

            subprocess.stderr?.on('data', (data) => {
                const text = data.toString();
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stderr', text })}\n\n`));
            });

            subprocess.on('close', (code) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', code })}\n\n`));
                controller.close();
            });

            subprocess.on('error', (err) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`));
                controller.close();
            });
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
