import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'report';
  const hand = searchParams.get('hand') || 'left';
  const logFile = searchParams.get('file') || 'txt'; // 'txt' or 'log'

  const basePath = process.env.LUMING_SESSION_PATH || path.join(process.env.HOME || '', 'Desktop', 'session_028');

  if (!fs.existsSync(basePath)) {
    return NextResponse.json({ error: 'Session directory not found' }, { status: 404 });
  }

  try {
    // 1. Quality report JSON
    if (type === 'report') {
      const jsonPath = path.join(basePath, 'quality_report', 'quality_report.json');
      if (!fs.existsSync(jsonPath)) {
        return NextResponse.json({ error: 'Quality report JSON not found' }, { status: 404 });
      }
      const data = fs.readFileSync(jsonPath, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }

    // 2. Logs / Text files
    if (type === 'log') {
      let filePath = '';
      if (logFile === 'log') {
        filePath = path.join(basePath, 'quality_report', 'check.log');
      } else if (logFile === 'txt') {
        filePath = path.join(basePath, 'quality_report', 'quality_report.txt');
      } else if (logFile === 'left_timestamps') {
        filePath = path.join(basePath, 'left_hand_250801DR48FP26003296', 'RGB_Images', 'timestamps.csv');
      } else if (logFile === 'right_timestamps') {
        filePath = path.join(basePath, 'right_hand_250801DR48FP26003349', 'RGB_Images', 'timestamps.csv');
      } else if (logFile === 'left_queue') {
        filePath = path.join(basePath, 'left_hand_250801DR48FP26003296', 'queue_lengths.csv');
      } else if (logFile === 'right_queue') {
        filePath = path.join(basePath, 'right_hand_250801DR48FP26003349', 'queue_lengths.csv');
      } else if (logFile === 'transforms_lr') {
        filePath = path.join(basePath, 'relative_transforms_left_to_right.txt');
      } else if (logFile === 'transforms_rl') {
        filePath = path.join(basePath, 'relative_transforms_right_to_left.txt');
      } else {
        return NextResponse.json({ error: 'Invalid file parameter' }, { status: 400 });
      }

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: `${logFile} file not found` }, { status: 404 });
      }

      let data = '';
      if (logFile.startsWith('transforms')) {
        const fullData = fs.readFileSync(filePath, 'utf-8');
        const lines = fullData.split('\n');
        data = lines.slice(0, 500).join('\n') + `\n\n... (由于文件大小，已省略其余 ${lines.length - 500} 行数据) ...`;
      } else {
        data = fs.readFileSync(filePath, 'utf-8');
      }

      return new Response(data, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // 3. Trajectory data
    if (type === 'trajectory') {
      let trajFile = '';
      if (hand === 'left') {
        trajFile = path.join(basePath, 'left_hand_250801DR48FP26003296', 'Merged_Trajectory', 'merged_trajectory.txt');
      } else {
        trajFile = path.join(basePath, 'right_hand_250801DR48FP26003349', 'Merged_Trajectory', 'merged_trajectory.txt');
      }

      if (!fs.existsSync(trajFile)) {
        return NextResponse.json({ error: 'Trajectory file not found' }, { status: 404 });
      }

      const rawContent = fs.readFileSync(trajFile, 'utf-8');
      const lines = rawContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      const totalPoints = lines.length;
      if (totalPoints === 0) {
        return NextResponse.json([]);
      }

      // Downsample to ~200 points for charting
      const targetPointsCount = 200;
      const step = Math.max(1, Math.floor(totalPoints / targetPointsCount));
      const points = [];

      for (let i = 0; i < totalPoints; i += step) {
        const parts = lines[i].trim().split(/\s+/);
        if (parts.length >= 4) {
          const timestamp = parseFloat(parts[0]);
          const tx = parseFloat(parts[1]);
          const ty = parseFloat(parts[2]);
          const tz = parseFloat(parts[3]);
          const qx = parts[4] ? parseFloat(parts[4]) : 0;
          const qy = parts[5] ? parseFloat(parts[5]) : 0;
          const qz = parts[6] ? parseFloat(parts[6]) : 0;
          const qw = parts[7] ? parseFloat(parts[7]) : 1;

          points.push({
            time: timestamp,
            x: tx,
            y: ty,
            z: tz,
            qx,
            qy,
            qz,
            qw
          });
        }
      }

      // Compute velocities between consecutive points
      const trajectories = points.map((p, idx) => {
        if (idx === 0) {
          return { ...p, speed: 0 };
        }
        const prev = points[idx - 1];
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        const dz = p.z - prev.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const dt = p.time - prev.time;
        const speed = dt > 0 ? dist / dt : 0;
        return { ...p, speed };
      });

      return NextResponse.json(trajectories);
    }

    return NextResponse.json({ error: 'Unknown query type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
