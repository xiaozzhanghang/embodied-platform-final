import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hand = searchParams.get('hand') || 'left';
  
  const basePath = process.env.LUMING_SESSION_PATH || path.join(process.env.HOME || '', 'Desktop', 'session_028');
  let videoPath = '';
  
  if (hand === 'left') {
    videoPath = path.join(basePath, 'left_hand_250801DR48FP26003296', 'RGB_Images', 'video.mp4');
  } else {
    videoPath = path.join(basePath, 'right_hand_250801DR48FP26003349', 'RGB_Images', 'video.mp4');
  }

  if (!fs.existsSync(videoPath)) {
    return new Response('Video not found', { status: 404 });
  }

  try {
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize || end >= fileSize) {
        return new Response('Requested range not satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` }
        });
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': 'video/mp4',
      };

      const stream = new ReadableStream({
        start(controller) {
          file.on('data', (chunk) => controller.enqueue(chunk));
          file.on('end', () => controller.close());
          file.on('error', (err) => controller.error(err));
        },
        cancel() {
          file.destroy();
        }
      });

      return new Response(stream, {
        status: 206,
        headers: head
      });
    } else {
      const head = {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      };
      const file = fs.createReadStream(videoPath);
      
      const stream = new ReadableStream({
        start(controller) {
          file.on('data', (chunk) => controller.enqueue(chunk));
          file.on('end', () => controller.close());
          file.on('error', (err) => controller.error(err));
        },
        cancel() {
          file.destroy();
        }
      });

      return new Response(stream, {
        status: 200,
        headers: head
      });
    }
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
