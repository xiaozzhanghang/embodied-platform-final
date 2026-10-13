import fs from 'fs';

function solveIK(hx, hy, px, py, l1, l2, bendRight = true) {
  const dx = px - hx;
  const dy = py - hy;
  const dist = Math.hypot(dx, dy);
  const maxReach = (l1 + l2) * 0.999;
  const d = Math.min(dist, maxReach);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const midX = hx + (a * dx) / d;
  const midY = hy + (a * dy) / d;
  const sign = bendRight ? 1 : -1;
  const kneeX = midX + sign * (h * dy) / d;
  const kneeY = midY - sign * (h * dx) / d;
  return { kneeX, kneeY, px, py };
}

function quadToCubic(p0x, p0y, p1x, p1y, p2x, p2y) {
  const c1x = p0x + (2/3) * (p1x - p0x);
  const c1y = p0y + (2/3) * (p1y - p0y);
  const c2x = p2x + (2/3) * (p1x - p2x);
  const c2y = p2y + (2/3) * (p1y - p2y);
  return { c1x, c1y, c2x, c2y };
}

function buildAllKeyframes() {
  const steps = 36;
  const bx = 550, by = 485, r = 38;
  const hx = 480, hy = 345, l1 = 78, l2 = 78;
  const lhx = 468, lhy = 340; // left hip

  let rLegCSS = '@keyframes rightLegPathAnim {\n';
  let lLegCSS = '@keyframes leftLegPathAnim {\n';
  let rFootCSS = '@keyframes rightFootAnim {\n';
  let lFootCSS = '@keyframes leftFootAnim {\n';
  let rPedalCSS = '@keyframes rightPedalAnim {\n';
  let lPedalCSS = '@keyframes leftPedalAnim {\n';

  for (let i = 0; i <= steps; i++) {
    const pct = ((i / steps) * 100).toFixed(2);
    const rDeg = (i * 360 / steps);
    const lDeg = (rDeg + 180) % 360;

    // Right leg (near side)
    const rRad = (rDeg - 90) * Math.PI / 180;
    const rPx = bx + r * Math.cos(rRad);
    const rPy = by + r * Math.sin(rRad);
    const rIK = solveIK(hx, hy, rPx, rPy, l1, l2, true);
    const rCubic = quadToCubic(hx, hy, rIK.kneeX, rIK.kneeY, rPx, rPy);

    rLegCSS += `  ${pct}% { d: path('M ${hx} ${hy} C ${rCubic.c1x.toFixed(1)} ${rCubic.c1y.toFixed(1)}, ${rCubic.c2x.toFixed(1)} ${rCubic.c2y.toFixed(1)}, ${rPx.toFixed(1)} ${rPy.toFixed(1)}'); }\n`;

    const rAnkleTilt = (Math.sin(rRad) * 12).toFixed(1);
    rFootCSS += `  ${pct}% { transform: translate(${rPx.toFixed(1)}px, ${rPy.toFixed(1)}px) rotate(${rAnkleTilt}deg); }\n`;
    rPedalCSS += `  ${pct}% { transform: translate(${rPx.toFixed(1)}px, ${rPy.toFixed(1)}px); }\n`;

    // Left leg (far side)
    const lRad = (lDeg - 90) * Math.PI / 180;
    const lPx = bx + r * Math.cos(lRad);
    const lPy = by + r * Math.sin(lRad);
    const lIK = solveIK(lhx, lhy, lPx, lPy, l1, l2, true);
    const lCubic = quadToCubic(lhx, lhy, lIK.kneeX, lIK.kneeY, lPx, lPy);

    lLegCSS += `  ${pct}% { d: path('M ${lhx} ${lhy} C ${lCubic.c1x.toFixed(1)} ${lCubic.c1y.toFixed(1)}, ${lCubic.c2x.toFixed(1)} ${lCubic.c2y.toFixed(1)}, ${lPx.toFixed(1)} ${lPy.toFixed(1)}'); }\n`;

    const lAnkleTilt = (Math.sin(lRad) * 12).toFixed(1);
    lFootCSS += `  ${pct}% { transform: translate(${lPx.toFixed(1)}px, ${lPy.toFixed(1)}px) rotate(${lAnkleTilt}deg); }\n`;
    lPedalCSS += `  ${pct}% { transform: translate(${lPx.toFixed(1)}px, ${lPy.toFixed(1)}px); }\n`;
  }

  rLegCSS += '}\n';
  lLegCSS += '}\n';
  rFootCSS += '}\n';
  lFootCSS += '}\n';
  rPedalCSS += '}\n';
  lPedalCSS += '}\n';

  return { rLegCSS, lLegCSS, rFootCSS, lFootCSS, rPedalCSS, lPedalCSS };
}

const anims = buildAllKeyframes();

function generateSpokes(cx, cy, r, count = 16) {
  let spokes = '';
  for (let i = 0; i < count; i++) {
    const angle = (i * 360 / count) * Math.PI / 180;
    const x2 = (cx + r * Math.cos(angle)).toFixed(1);
    const y2 = (cy + r * Math.sin(angle)).toFixed(1);
    spokes += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#b0bec5" stroke-width="1.8" opacity="0.85" />\n`;
  }
  return spokes;
}

const rearSpokes = generateSpokes(340, 485, 96, 16);
const frontSpokes = generateSpokes(760, 485, 96, 16);

const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>加州褐鹕骑行海边公路 - 纯 CSS & SVG 动画</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #090d16;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    }
    .stage {
      position: relative;
      width: 100vw;
      height: 100vh;
      max-width: 1400px;
      max-height: 820px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
    }
    svg.viewport {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* ========================================================
       CSS KEYFRAMES 核心运动学动画系统
       ======================================================== */

    /* 1. 车轮持续旋转 (1.0s / 周，带辐条) */
    .wheel-rear {
      transform-origin: 340px 485px;
      animation: spinLinear 1s linear infinite;
    }
    .wheel-front {
      transform-origin: 760px 485px;
      animation: spinLinear 1s linear infinite;
    }
    @keyframes spinLinear {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* 2. 传动系统：中轴与曲柄 (周期 1.0s) */
    .crank-right {
      transform-origin: 550px 485px;
      animation: crankRightSpin 1s linear infinite;
    }
    @keyframes crankRightSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .crank-left {
      transform-origin: 550px 485px;
      animation: crankLeftSpin 1s linear infinite;
    }
    @keyframes crankLeftSpin {
      from { transform: rotate(180deg); }
      to { transform: rotate(540deg); }
    }

    /* 3. 踏板与腿部严丝合缝反向运动学 (IK) 绑定 */
    ${anims.rLegCSS}
    ${anims.lLegCSS}
    ${anims.rFootCSS}
    ${anims.lFootCSS}
    ${anims.rPedalCSS}
    ${anims.lPedalCSS}

    .pelican-leg-right {
      animation: rightLegPathAnim 1s linear infinite;
    }
    .pelican-leg-left {
      animation: leftLegPathAnim 1s linear infinite;
    }
    .pelican-foot-right {
      animation: rightFootAnim 1s linear infinite;
    }
    .pelican-foot-left {
      animation: leftFootAnim 1s linear infinite;
    }
    .pedal-box-right {
      animation: rightPedalAnim 1s linear infinite;
    }
    .pedal-box-left {
      animation: leftPedalAnim 1s linear infinite;
    }

    /* 4. 鹈鹕躯干发力起伏 (上下颠簸与向前俯仰) */
    .pelican-core {
      transform-origin: 480px 350px;
      animation: pelicanBobbing 0.5s ease-in-out infinite alternate;
    }
    @keyframes pelicanBobbing {
      0% { transform: translateY(0px) rotate(0deg); }
      100% { transform: translateY(3.5px) rotate(1deg); }
    }

    /* 5. 翅膀轻微扇动维持高速平衡 */
    .wing-motion {
      transform-origin: 485px 285px;
      animation: wingFlutter 0.5s ease-in-out infinite alternate;
    }
    @keyframes wingFlutter {
      0% { transform: rotate(0deg) scaleY(1); }
      100% { transform: rotate(-3.5deg) scaleY(0.97); }
    }

    /* 6. 红色骑行长围巾剧烈向后翻飞 */
    .scarf-tail-a {
      transform-origin: 425px 235px;
      animation: scarfFlowA 0.3s ease-in-out infinite alternate;
    }
    @keyframes scarfFlowA {
      0% { transform: rotate(0deg) skewX(0deg); }
      100% { transform: rotate(10deg) skewX(6deg) translateY(-3px); }
    }

    .scarf-tail-b {
      transform-origin: 420px 242px;
      animation: scarfFlowB 0.35s ease-in-out infinite alternate 0.08s;
    }
    @keyframes scarfFlowB {
      0% { transform: rotate(-4deg) scaleY(0.95); }
      100% { transform: rotate(14deg) scaleY(1.05) translateY(-4px); }
    }

    /* 7. 喉囊微颤 */
    .pouch-elastic {
      transform-origin: 585px 190px;
      animation: pouchBreathe 0.5s ease-in-out infinite alternate;
    }
    @keyframes pouchBreathe {
      0% { transform: scale(1) rotate(0deg); }
      100% { transform: scale(1.03, 0.98) rotate(-1deg); }
    }

    /* 8. 多层视差背景无限后移 */
    .clouds-pan {
      animation: panClouds 20s linear infinite;
    }
    @keyframes panClouds {
      from { transform: translateX(0); }
      to { transform: translateX(-600px); }
    }

    .waves-pan {
      animation: panWaves 7s linear infinite;
    }
    @keyframes panWaves {
      from { transform: translateX(0); }
      to { transform: translateX(-400px); }
    }

    .fence-pan {
      animation: panFence 2.2s linear infinite;
    }
    @keyframes panFence {
      from { transform: translateX(0); }
      to { transform: translateX(-480px); }
    }

    .road-pan {
      animation: panRoad 0.5s linear infinite;
    }
    @keyframes panRoad {
      from { transform: translateX(0); }
      to { transform: translateX(-300px); }
    }

    .speed-pan {
      animation: panSpeed 0.4s linear infinite;
    }
    @keyframes panSpeed {
      0% { transform: translateX(0); opacity: 0.8; }
      100% { transform: translateX(-600px); opacity: 0.15; }
    }

    /* HUD 标签 */
    .hud {
      position: absolute;
      top: 20px;
      left: 24px;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(12px);
      padding: 10px 18px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #f8fafc;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 10;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .hud-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: hudGlow 1.8s infinite;
    }
    @keyframes hudGlow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .hud-title {
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .hud-desc {
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="stage">
    <div class="hud">
      <div class="hud-dot"></div>
      <span class="hud-title">加州褐鹕 · 海边公路破风骑行</span>
      <span class="hud-desc">纯 CSS Keyframes 反向运动学 (IK) 踏板锁定系统</span>
    </div>

    <svg class="viewport" viewBox="0 0 1100 680" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- 渐变配置 -->
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="35%" stop-color="#7dd3fc"/>
          <stop offset="70%" stop-color="#bae6fd"/>
          <stop offset="100%" stop-color="#fef08a"/>
        </linearGradient>

        <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="50%" stop-color="#0369a1"/>
          <stop offset="100%" stop-color="#075985"/>
        </linearGradient>

        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#f97316"/>
        </linearGradient>

        <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#475569"/>
          <stop offset="15%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>

        <linearGradient id="curbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>

        <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#06b6d4"/>
          <stop offset="50%" stop-color="#0891b2"/>
          <stop offset="100%" stop-color="#0e7490"/>
        </linearGradient>

        <linearGradient id="pouchGrad" x1="20%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#fdba74"/>
          <stop offset="45%" stop-color="#fb923c"/>
          <stop offset="85%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>

        <linearGradient id="billGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#64748b"/>
          <stop offset="40%" stop-color="#94a3b8"/>
          <stop offset="85%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>

        <linearGradient id="featherBrownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#78716c"/>
          <stop offset="60%" stop-color="#57534e"/>
          <stop offset="100%" stop-color="#44403c"/>
        </linearGradient>

        <linearGradient id="neckChestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#451a03"/>
          <stop offset="40%" stop-color="#78350f"/>
          <stop offset="80%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#fef3c7"/>
        </linearGradient>

        <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e2e8f0"/>
          <stop offset="50%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>
      </defs>

      <!-- ================= 1. 天空与远景海滨 ================= -->
      <rect x="0" y="0" width="1100" height="420" fill="url(#skyGrad)"/>

      <!-- 太阳 -->
      <circle cx="920" cy="110" r="42" fill="url(#sunGrad)" opacity="0.9"/>
      <circle cx="920" cy="110" r="58" fill="#fef08a" opacity="0.25"/>

      <!-- 远景移动云层 -->
      <g class="clouds-pan">
        <g opacity="0.85">
          <ellipse cx="140" cy="85" rx="55" ry="24" fill="#ffffff"/>
          <ellipse cx="180" cy="75" rx="42" ry="30" fill="#ffffff"/>
          <ellipse cx="220" cy="90" rx="35" ry="20" fill="#ffffff"/>

          <ellipse cx="480" cy="120" rx="75" ry="28" fill="#ffffff"/>
          <ellipse cx="530" cy="105" rx="55" ry="34" fill="#ffffff"/>
          <ellipse cx="580" cy="125" rx="48" ry="22" fill="#ffffff"/>

          <ellipse cx="860" cy="70" rx="65" ry="25" fill="#ffffff"/>
          <ellipse cx="910" cy="55" rx="48" ry="30" fill="#ffffff"/>
        </g>
        <g opacity="0.85" transform="translate(600, 0)">
          <ellipse cx="140" cy="85" rx="55" ry="24" fill="#ffffff"/>
          <ellipse cx="180" cy="75" rx="42" ry="30" fill="#ffffff"/>
          <ellipse cx="220" cy="90" rx="35" ry="20" fill="#ffffff"/>

          <ellipse cx="480" cy="120" rx="75" ry="28" fill="#ffffff"/>
          <ellipse cx="530" cy="105" rx="55" ry="34" fill="#ffffff"/>
          <ellipse cx="580" cy="125" rx="48" ry="22" fill="#ffffff"/>

          <ellipse cx="860" cy="70" rx="65" ry="25" fill="#ffffff"/>
          <ellipse cx="910" cy="55" rx="48" ry="30" fill="#ffffff"/>
        </g>
      </g>

      <!-- 远景海平面与海洋 -->
      <rect x="0" y="240" width="1100" height="150" fill="url(#seaGrad)"/>

      <!-- 海面波浪移动视差 -->
      <g class="waves-pan" opacity="0.45" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round">
        <path d="M 0 255 Q 30 250 60 255 T 120 255 T 180 255 T 240 255 T 300 255 T 360 255 T 420 255 T 480 255 T 540 255 T 600 255 T 660 255 T 720 255 T 780 255 T 840 255 T 900 255 T 960 255 T 1020 255 T 1080 255 T 1140 255 T 1200 255 T 1260 255 T 1320 255 T 1380 255 T 1440 255 T 1500 255" />
        <path d="M 0 280 Q 40 274 80 280 T 160 280 T 240 280 T 320 280 T 400 280 T 480 280 T 560 280 T 640 280 T 720 280 T 800 280 T 880 280 T 960 280 T 1040 280 T 1120 280 T 1200 280 T 1280 280 T 1360 280 T 1440 280 T 1520 280" />
        <path d="M 0 310 Q 50 302 100 310 T 200 310 T 300 310 T 400 310 T 500 310 T 600 310 T 700 310 T 800 310 T 900 310 T 1000 310 T 1100 310 T 1200 310 T 1300 310 T 1400 310 T 1500 310" />
      </g>

      <!-- 远景海岛与灯塔 -->
      <path d="M 80 240 C 130 225, 180 235, 230 240 Z" fill="#047857" opacity="0.6"/>
      <path d="M 130 235 L 134 210 L 138 210 L 142 235 Z" fill="#f8fafc" opacity="0.8"/>
      <polygon points="133,210 143,210 138,204" fill="#dc2626"/>

      <!-- ================= 2. 中景海岸防护栏与沙滩护坡 ================= -->
      <path d="M 0 340 Q 300 335 600 342 T 1100 340 L 1100 390 L 0 390 Z" fill="#d97706" opacity="0.25"/>
      <path d="M 0 360 Q 400 355 800 362 T 1100 360 L 1100 410 L 0 410 Z" fill="#92400e" opacity="0.35"/>

      <!-- 移动木质防护栏 -->
      <g class="fence-pan">
        <g stroke="#78350f" stroke-width="6" fill="#92400e">
          <rect x="20" y="340" width="10" height="50" rx="2"/>
          <rect x="80" y="340" width="10" height="50" rx="2"/>
          <rect x="140" y="340" width="10" height="50" rx="2"/>
          <rect x="200" y="340" width="10" height="50" rx="2"/>
          <rect x="260" y="340" width="10" height="50" rx="2"/>
          <rect x="320" y="340" width="10" height="50" rx="2"/>
          <rect x="380" y="340" width="10" height="50" rx="2"/>
          <rect x="440" y="340" width="10" height="50" rx="2"/>

          <rect x="500" y="340" width="10" height="50" rx="2"/>
          <rect x="560" y="340" width="10" height="50" rx="2"/>
          <rect x="620" y="340" width="10" height="50" rx="2"/>
          <rect x="680" y="340" width="10" height="50" rx="2"/>
          <rect x="740" y="340" width="10" height="50" rx="2"/>
          <rect x="800" y="340" width="10" height="50" rx="2"/>
          <rect x="860" y="340" width="10" height="50" rx="2"/>
          <rect x="920" y="340" width="10" height="50" rx="2"/>
          
          <rect x="980" y="340" width="10" height="50" rx="2"/>
          <rect x="1040" y="340" width="10" height="50" rx="2"/>
          <rect x="1100" y="340" width="10" height="50" rx="2"/>
          <rect x="1160" y="340" width="10" height="50" rx="2"/>
          <rect x="1220" y="340" width="10" height="50" rx="2"/>
          <rect x="1280" y="340" width="10" height="50" rx="2"/>
          <rect x="1340" y="340" width="10" height="50" rx="2"/>
          <rect x="1400" y="340" width="10" height="50" rx="2"/>
        </g>
        <path d="M 0 355 L 1500 355 M 0 375 L 1500 375" stroke="#b45309" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- ================= 3. 近景海滨公路 ================= -->
      <rect x="0" y="400" width="1100" height="15" fill="url(#curbGrad)"/>
      <line x1="0" y1="400" x2="1100" y2="400" stroke="#f8fafc" stroke-width="1.5"/>

      <!-- 沥青路面 -->
      <rect x="0" y="415" width="1100" height="265" fill="url(#roadGrad)"/>

      <!-- 路面黄色虚线标线 -->
      <g class="road-pan">
        <line x1="0" y1="435" x2="1400" y2="435" stroke="#f8fafc" stroke-width="4" stroke-opacity="0.9"/>
        <g stroke="#facc15" stroke-width="7" stroke-linecap="round">
          <line x1="20" y1="605" x2="180" y2="605"/>
          <line x1="320" y1="605" x2="480" y2="605"/>
          <line x1="620" y1="605" x2="780" y2="605"/>
          <line x1="920" y1="605" x2="1080" y2="605"/>
          <line x1="1220" y1="605" x2="1380" y2="605"/>
        </g>
      </g>

      <!-- ================= 4. 自行车阴影 ================= -->
      <ellipse cx="550" cy="585" rx="300" ry="18" fill="#090d16" opacity="0.55"/>
      <ellipse cx="340" cy="582" rx="75" ry="10" fill="#05080e" opacity="0.65"/>
      <ellipse cx="760" cy="582" rx="75" ry="10" fill="#05080e" opacity="0.65"/>

      <!-- ================= 5. 左侧(远端) 腿部、踏板、曲柄 ================= -->
      <!-- 左腿骨骼路径 (CSS Keyframes C-Bezier 实时严密对准左踏板) -->
      <path class="pelican-leg-left" d="M 468 340 C 470 410, 520 480, 550 523"
            fill="none" stroke="#a16207" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- 左脚掌与蹼足 (实时贴合在左踏板上) -->
      <g class="pelican-foot-left">
        <path d="M -14 2 L 18 2 L 12 -7 L -4 -5 Z" fill="#854d0e" stroke="#581c87" stroke-width="0.8"/>
      </g>

      <!-- 左曲柄 (180度反向旋转) -->
      <g class="crank-left">
        <line x1="550" y1="485" x2="550" y2="523" stroke="#64748b" stroke-width="7" stroke-linecap="round"/>
        <circle cx="550" cy="523" r="5" fill="#475569"/>
      </g>

      <!-- 左脚踏板平台 (由绝对坐标关键帧平动，锁死在左曲柄末端与左脚蹼上) -->
      <g class="pedal-box-left">
        <rect x="-16" y="-5" width="32" height="10" rx="3" fill="#334155" stroke="#1e293b" stroke-width="1.5"/>
        <line x1="-12" y1="0" x2="12" y2="0" stroke="#f59e0b" stroke-width="2"/>
      </g>


      <!-- ================= 6. 自行车机械总成 (后轮、菱形车架、链条、前轮) ================= -->
      <!-- (1) 后轮总成 -->
      <g class="wheel-rear">
        <circle cx="340" cy="485" r="96" fill="none" stroke="#1e293b" stroke-width="16"/>
        <circle cx="340" cy="485" r="102" fill="none" stroke="#334155" stroke-width="2.5" stroke-dasharray="4 6"/>
        <circle cx="340" cy="485" r="88" fill="none" stroke="url(#rimGrad)" stroke-width="4.5"/>
        <circle cx="340" cy="485" r="84" fill="none" stroke="#0f172a" stroke-width="1.5"/>
        ${rearSpokes}
        <circle cx="340" cy="485" r="18" fill="#475569" stroke="#cbd5e1" stroke-width="2"/>
        <circle cx="340" cy="485" r="8" fill="#1e293b"/>
      </g>

      <!-- (2) 前轮总成 -->
      <g class="wheel-front">
        <circle cx="760" cy="485" r="96" fill="none" stroke="#1e293b" stroke-width="16"/>
        <circle cx="760" cy="485" r="102" fill="none" stroke="#334155" stroke-width="2.5" stroke-dasharray="4 6"/>
        <circle cx="760" cy="485" r="88" fill="none" stroke="url(#rimGrad)" stroke-width="4.5"/>
        <circle cx="760" cy="485" r="84" fill="none" stroke="#0f172a" stroke-width="1.5"/>
        ${frontSpokes}
        <circle cx="760" cy="485" r="12" fill="#475569" stroke="#cbd5e1" stroke-width="2"/>
        <circle cx="760" cy="485" r="6" fill="#1e293b"/>
      </g>

      <!-- (3) 闭合传动链条与大齿盘 -->
      <path d="M 340 472 L 550 460 A 26 26 0 0 1 550 510 L 340 498 A 14 14 0 0 1 340 472 Z"
            fill="none" stroke="#334155" stroke-width="5" stroke-linejoin="round"/>
      <path d="M 340 472 L 550 460 M 550 510 L 340 498"
            fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 3"/>

      <!-- 中轴大牙盘 -->
      <circle cx="550" cy="485" r="28" fill="#475569" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="550" cy="485" r="22" fill="#1e293b" stroke="#64748b" stroke-width="1.5" stroke-dasharray="5 4"/>
      <circle cx="550" cy="473" r="4" fill="#0f172a"/>
      <circle cx="560" cy="482" r="4" fill="#0f172a"/>
      <circle cx="550" cy="495" r="4" fill="#0f172a"/>
      <circle cx="540" cy="482" r="4" fill="#0f172a"/>

      <!-- (4) 标准菱形车架 (Diamond Frame) 结构 -->
      <g id="bicycle-frame" stroke-linecap="round" stroke-linejoin="round">
        <!-- 后下叉 (Chain Stay): 中轴 (550,485) -> 后轴 (340,485) -->
        <line x1="550" y1="485" x2="340" y2="485" stroke="url(#frameGrad)" stroke-width="9"/>

        <!-- 后上叉 (Seat Stay): 座管接头 (480,360) -> 后轴 (340,485) -->
        <line x1="480" y1="360" x2="340" y2="485" stroke="url(#frameGrad)" stroke-width="8"/>

        <!-- 立管 / 座管 (Seat Tube): 中轴 (550,485) -> 座管夹 (480,360) -->
        <line x1="550" y1="485" x2="480" y2="360" stroke="url(#frameGrad)" stroke-width="12"/>

        <!-- 下管 (Down Tube): 中轴 (550,485) -> 头管下端 (700,380) -->
        <line x1="550" y1="485" x2="700" y2="380" stroke="url(#frameGrad)" stroke-width="13"/>

        <!-- 上管 (Top Tube): 座管接头 (480,360) -> 头管上端 (685,320) -->
        <line x1="480" y1="360" x2="685" y2="320" stroke="url(#frameGrad)" stroke-width="10"/>

        <!-- 头管 (Head Tube): (685,320) -> (700,380) -->
        <line x1="685" y1="320" x2="700" y2="380" stroke="#0891b2" stroke-width="14"/>

        <!-- 前叉 (Front Fork): 头管下端 (700,380) -> 前轮轴 (760,485) -->
        <line x1="700" y1="380" x2="760" y2="485" stroke="url(#frameGrad)" stroke-width="10"/>

        <!-- 坐垫支管与车座 (Saddle) -->
        <line x1="480" y1="360" x2="465" y2="330" stroke="#475569" stroke-width="8"/>
        <!-- 复古牛皮车座 -->
        <path d="M 430 330 C 445 320, 480 320, 505 326 C 515 328, 510 336, 495 336 C 465 336, 440 338, 430 330 Z"
              fill="#78350f" stroke="#451a03" stroke-width="2"/>
        <circle cx="450" cy="328" r="1.5" fill="#f59e0b"/>
        <circle cx="470" cy="328" r="1.5" fill="#f59e0b"/>

        <!-- 把立 (Stem) 与公路车把 (Handlebar) -->
        <line x1="685" y1="320" x2="680" y2="280" stroke="#64748b" stroke-width="7"/>
        <line x1="680" y1="280" x2="705" y2="275" stroke="#64748b" stroke-width="7"/>
        <!-- 弯把造型 -->
        <path d="M 705 275 C 725 275, 735 290, 725 315 C 720 325, 705 325, 700 320"
              fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
        <!-- 刹车手柄 -->
        <path d="M 725 295 L 728 318" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- ================= 7. 加州褐鹕 (California Brown Pelican) 角色总成 ================= -->
      <g class="pelican-core">

        <!-- (1) 尾羽 (深灰褐覆羽) -->
        <g id="pelican-tail">
          <path d="M 410 310 C 370 325, 360 345, 385 350 C 410 355, 430 335, 440 320 Z" fill="#44403c"/>
          <path d="M 400 320 C 365 335, 360 355, 380 360 C 405 365, 425 345, 435 330 Z" fill="#292524"/>
          <line x1="410" y1="325" x2="380" y2="345" stroke="#1c1917" stroke-width="2"/>
        </g>

        <!-- (2) 躯干与胸脯 (褐羽层次、肌肉体态前倾专注) -->
        <g id="pelican-torso">
          <path d="M 430 290 C 410 330, 440 380, 490 380 C 530 380, 560 340, 545 290 C 535 260, 460 250, 430 290 Z"
                fill="url(#featherBrownGrad)" stroke="#292524" stroke-width="2.5"/>

          <path d="M 450 315 C 445 350, 475 375, 505 375 C 520 375, 535 360, 530 335 C 500 340, 475 325, 450 315 Z"
                fill="#57534e" opacity="0.85"/>
          <path d="M 460 305 Q 475 315 490 305 M 450 325 Q 470 338 490 325 M 465 345 Q 485 358 505 345"
                fill="none" stroke="#78716c" stroke-width="2" stroke-linecap="round"/>
        </g>

        <!-- (3) 优美的 S 型颈部 (后颈栗褐，前颈象牙白/金黄) -->
        <g id="pelican-neck">
          <path d="M 450 270 C 455 220, 505 210, 530 190 C 545 180, 560 200, 545 230 C 530 260, 510 275, 485 285 Z"
                fill="url(#neckChestGrad)"/>
          <path d="M 485 285 C 510 275, 535 245, 545 220 C 555 195, 575 190, 580 185 C 570 215, 550 255, 510 285 Z"
                fill="#fef3c7" opacity="0.95"/>
        </g>

        <!-- (4) 巨大喉囊 (加州褐鹕标志性特征：弹性大囊袋) -->
        <g id="pelican-pouch" class="pouch-elastic">
          <path d="M 585 185 C 640 195, 680 230, 650 270 C 625 300, 560 305, 545 255 C 540 235, 550 200, 585 185 Z"
                fill="url(#pouchGrad)" stroke="#c2410c" stroke-width="2.5"/>
          <path d="M 585 205 Q 615 240 590 275" fill="none" stroke="#ea580c" stroke-width="2" opacity="0.7"/>
          <path d="M 610 205 Q 640 245 615 280" fill="none" stroke="#ea580c" stroke-width="2" opacity="0.6"/>
          <path d="M 635 210 Q 655 245 635 265" fill="none" stroke="#ea580c" stroke-width="1.5" opacity="0.5"/>
          <ellipse cx="610" cy="275" rx="25" ry="12" fill="#ffedd5" opacity="0.35"/>
        </g>

        <!-- (5) 头部与长喙 (长壮喙，末端带尖钩) -->
        <g id="pelican-head">
          <!-- 头部基底 (浅黄/白色羽冠) -->
          <path d="M 545 175 C 540 145, 575 135, 610 150 C 625 155, 630 175, 615 188 C 590 200, 555 195, 545 175 Z"
                fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
          <!-- 头部后脑蓬松羽冠 -->
          <path d="M 550 160 C 530 150, 535 135, 555 140 C 545 130, 555 125, 570 135 Z" fill="#fef9c3"/>

          <!-- 复古破风骑行小帽 (Vintage Cycling Cap with flipped brim) -->
          <path d="M 552 150 C 555 130, 580 126, 612 138 C 618 141, 615 148, 605 150 C 585 148, 565 147, 552 150 Z"
                fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>
          <!-- 向上翻起的帽檐 -->
          <path d="M 605 140 C 622 134, 632 140, 628 146 C 618 148, 608 145, 605 140 Z"
                fill="#38bdf8" stroke="#0284c7" stroke-width="1.2"/>
          <line x1="562" y1="145" x2="602" y2="147" stroke="#f8fafc" stroke-width="2"/>

          <!-- 坚固上喙 (Maxilla) -->
          <path d="M 605 160 L 765 188 C 778 191, 782 198, 775 205 C 770 210, 762 208, 755 202 L 600 180 Z"
                fill="url(#billGrad)" stroke="#475569" stroke-width="2.5" stroke-linejoin="round"/>
          <!-- 喙尖倒钩 -->
          <path d="M 768 189 C 780 193, 782 206, 772 210 C 768 206, 767 197, 760 194 Z" fill="#d97706"/>
          <line x1="615" y1="168" x2="760" y2="194" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>
          <line x1="620" y1="174" x2="740" y2="196" stroke="#475569" stroke-width="1.2"/>

          <line x1="600" y1="182" x2="760" y2="202" stroke="#334155" stroke-width="2.5"/>

          <!-- 认真坚毅蹬车的眼神 -->
          <circle cx="585" cy="162" r="10" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
          <circle cx="586" cy="162" r="7.5" fill="#ffffff"/>
          <circle cx="588" cy="162" r="4.2" fill="#0f172a"/>
          <circle cx="587" cy="160" r="1.6" fill="#ffffff"/>
          <circle cx="590" cy="164" r="0.8" fill="#ffffff"/>
          <!-- 认真发力的坚毅眉羽 -->
          <path d="M 574 154 Q 587 155 597 158" stroke="#854d0e" stroke-width="3.5" stroke-linecap="round" fill="none"/>

          <!-- 脸颊萌萌腮红 -->
          <ellipse cx="578" cy="176" rx="6" ry="4" fill="#f43f5e" opacity="0.45"/>
        </g>

        <!-- (6) 迎风招展的红色骑行长围巾 -->
        <g id="pelican-scarf">
          <path d="M 525 215 C 545 210, 565 220, 555 240 C 535 255, 515 240, 525 215 Z"
                fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
          <path d="M 532 218 Q 548 226 542 238" fill="none" stroke="#fca5a5" stroke-width="2"/>

          <g class="scarf-tail-a">
            <path d="M 525 225 C 475 220, 420 190, 360 205 C 410 220, 460 240, 520 238 Z"
                  fill="#dc2626" stroke="#991b1b" stroke-width="1.8"/>
            <path d="M 360 205 L 350 202 M 360 207 L 348 208 M 362 210 L 352 214"
                  stroke="#fef08a" stroke-width="2.5" stroke-linecap="round"/>
          </g>

          <g class="scarf-tail-b">
            <path d="M 520 232 C 465 235, 410 215, 345 228 C 400 245, 450 255, 515 245 Z"
                  fill="#b91c1c" stroke="#7f1d1d" stroke-width="1.8"/>
            <path d="M 345 228 L 335 226 M 345 231 L 334 233 M 346 235 L 336 238"
                  stroke="#fef08a" stroke-width="2.5" stroke-linecap="round"/>
          </g>
        </g>

        <!-- (7) 真实鸟翼造型：层次羽翼，手腕自然下探紧握车把，飞羽轻扇平衡 -->
        <g id="pelican-wing" class="wing-motion">
          <!-- 肩部与大覆羽 (浅褐灰) -->
          <path d="M 455 275 C 490 260, 535 270, 545 300 C 545 325, 510 345, 470 340 C 445 335, 435 295, 455 275 Z"
                fill="#78716c" stroke="#44403c" stroke-width="2"/>

          <!-- 翼肘与中级飞羽 (深灰褐层次羽毛) -->
          <path d="M 470 295 C 510 288, 555 305, 565 332 C 540 355, 495 360, 465 335 Z"
                fill="#57534e" stroke="#292524" stroke-width="1.8"/>

          <!-- 叠层次级飞羽羽片 -->
          <path d="M 478 300 C 505 315, 540 318, 555 335" fill="none" stroke="#292524" stroke-width="2"/>
          <path d="M 488 318 C 510 330, 535 335, 545 348" fill="none" stroke="#292524" stroke-width="2"/>

          <!-- 前臂与翼手：从翼肘前伸下探至车把手 (流畅弧度自然下弯) -->
          <path d="M 525 312 C 565 320, 615 315, 665 298 C 690 290, 715 284, 720 288 C 722 295, 715 305, 690 315 C 630 338, 565 345, 518 336 Z"
                fill="#44403c" stroke="#1c1917" stroke-width="2"/>

          <!-- 初级飞羽羽尖向后破风散开 (Feather quills trailing back) -->
          <path d="M 485 340 C 460 360, 435 370, 415 375 C 440 365, 470 355, 495 342 Z" fill="#292524"/>
          <path d="M 495 345 C 475 368, 450 378, 430 382 C 455 372, 480 360, 505 347 Z" fill="#1c1917"/>

          <!-- 翼尖羽指牢牢扣握把横与刹车柄 -->
          <g transform="translate(712, 288)">
            <path d="M -10 -6 C 5 -10, 15 -2, 10 12 C 5 18, -6 14, -8 4 Z"
                  fill="#292524" stroke="#0f172a" stroke-width="1.5"/>
            <path d="M -4 -2 C 6 0, 7 8, 2 12" fill="none" stroke="#a8a29e" stroke-width="1.8" stroke-linecap="round"/>
          </g>

          <path d="M 475 285 Q 505 298 535 290" stroke="#a8a29e" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M 470 305 Q 510 318 545 310" stroke="#a8a29e" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        </g>

      </g> <!-- 结束 pelican-core -->


      <!-- ================= 8. 右侧(近端) 腿部、踏板、曲柄 ================= -->
      <!-- 右腿骨骼路径 (CSS Keyframes C-Bezier 实时严密对准右踏板) -->
      <path class="pelican-leg-right" d="M 480 345 C 500 410, 530 460, 550 447"
            fill="none" stroke="#ca8a04" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- 右脚蹼足 (由绝对关键帧平动，锁死在右踏板与曲柄末端) -->
      <g class="pelican-foot-right">
        <!-- 强健有力的三趾黄色大蹼足紧扣踏板 -->
        <path d="M -14 3 L 22 3 C 24 3, 25 -2, 21 -4 L 14 -8 L 0 -5 L -8 -1 Z"
              fill="#ca8a04" stroke="#854d0e" stroke-width="2" stroke-linejoin="round"/>
        <line x1="-2" y1="-3" x2="18" y2="1" stroke="#eab308" stroke-width="2"/>
        <polygon points="21,-3 25,2 20,3" fill="#451a03"/>
      </g>

      <!-- 右曲柄 (0-360 度循环) -->
      <g class="crank-right">
        <line x1="550" y1="485" x2="550" y2="447" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round"/>
        <circle cx="550" cy="447" r="6" fill="#64748b"/>
      </g>

      <!-- 右脚踏板平台 (由绝对关键帧平动，锁死在右曲柄末端与脚蹼上) -->
      <g class="pedal-box-right">
        <rect x="-18" y="-6" width="36" height="12" rx="3.5" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
        <line x1="-14" y1="0" x2="14" y2="0" stroke="#f59e0b" stroke-width="3"/>
        <circle cx="-10" cy="0" r="1.5" fill="#ffffff"/>
        <circle cx="10" cy="0" r="1.5" fill="#ffffff"/>
      </g>

      <!-- ================= 9. 迎面速度线与海风粒子 ================= -->
      <g class="speed-pan" stroke="#ffffff" stroke-linecap="round" opacity="0.6">
        <line x1="850" y1="200" x2="720" y2="200" stroke-width="2.5" stroke-dasharray="20 40"/>
        <line x1="1000" y1="260" x2="880" y2="260" stroke-width="3" stroke-dasharray="35 50"/>
        <line x1="680" y1="160" x2="550" y2="160" stroke-width="2" stroke-dasharray="15 30"/>
        <line x1="920" y1="380" x2="780" y2="380" stroke-width="3" stroke-dasharray="40 60"/>
        <line x1="1100" y1="520" x2="950" y2="520" stroke-width="4" stroke-dasharray="50 80"/>
        <line x1="750" y1="560" x2="620" y2="560" stroke-width="2" stroke-dasharray="20 40"/>
      </g>

    </svg>
  </div>
</body>
</html>
`;

fs.writeFileSync('california_pelican_bicycle.html', fullHtml, 'utf8');
console.log('Masterpiece successfully written to california_pelican_bicycle.html!');
