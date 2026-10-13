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

function generateLegAnimations() {
  const steps = 36;
  const bx = 550, by = 485, r = 38; // BB center
  const hx = 480, hy = 345; // Hip joint
  const l1 = 78, l2 = 78;
  
  let rightLegCSS = `@keyframes rightLegMotion {\n`;
  let leftLegCSS = `@keyframes leftLegMotion {\n`;
  let rightFootCSS = `@keyframes rightFootMotion {\n`;
  let leftFootCSS = `@keyframes leftFootMotion {\n`;
  let rightCrankCSS = `@keyframes rightCrankMotion {\n`;
  let leftCrankCSS = `@keyframes leftCrankMotion {\n`;
  let rightPedalCSS = `@keyframes rightPedalMotion {\n`;
  let leftPedalCSS = `@keyframes leftPedalMotion {\n`;

  for (let i = 0; i <= steps; i++) {
    const pct = ((i / steps) * 100).toFixed(2);
    const rightDeg = (i * 360 / steps);
    const leftDeg = (rightDeg + 180) % 360;

    // Right leg calculations
    const rRad = (rightDeg - 90) * Math.PI / 180;
    const rPx = bx + r * Math.cos(rRad);
    const rPy = by + r * Math.sin(rRad);
    const rIK = solveIK(hx, hy, rPx, rPy, l1, l2, true);

    // Left leg calculations (slightly shifted hip for 3D depth)
    const lRad = (leftDeg - 90) * Math.PI / 180;
    const lPx = bx + r * Math.cos(lRad);
    const lPy = by + r * Math.sin(lRad);
    const lIK = solveIK(hx - 12, hy - 6, lPx, lPy, l1, l2, true);

    rightLegCSS += `  ${pct}% { d: path('M ${hx} ${hy} Q ${rIK.kneeX.toFixed(1)} ${rIK.kneeY.toFixed(1)} ${rPx.toFixed(1)} ${rPy.toFixed(1)}'); }\n`;
    leftLegCSS += `  ${pct}% { d: path('M ${hx - 12} ${hy - 6} Q ${lIK.kneeX.toFixed(1)} ${lIK.kneeY.toFixed(1)} ${lPx.toFixed(1)} ${lPy.toFixed(1)}'); }\n`;

    const rAnkleAngle = (Math.sin(rRad) * 12).toFixed(1);
    const lAnkleAngle = (Math.sin(lRad) * 12).toFixed(1);
    
    rightFootCSS += `  ${pct}% { transform: translate(${rPx.toFixed(1)}px, ${rPy.toFixed(1)}px) rotate(${rAnkleAngle}deg); }\n`;
    leftFootCSS += `  ${pct}% { transform: translate(${lPx.toFixed(1)}px, ${lPy.toFixed(1)}px) rotate(${lAnkleAngle}deg); }\n`;

    // Cranks
    rightCrankCSS += `  ${pct}% { transform: rotate(${rightDeg.toFixed(1)}deg); }\n`;
    leftCrankCSS += `  ${pct}% { transform: rotate(${leftDeg.toFixed(1)}deg); }\n`;

    // Pedals stay horizontal
    rightPedalCSS += `  ${pct}% { transform: translate(${rPx.toFixed(1)}px, ${rPy.toFixed(1)}px); }\n`;
    leftPedalCSS += `  ${pct}% { transform: translate(${lPx.toFixed(1)}px, ${lPy.toFixed(1)}px); }\n`;
  }

  rightLegCSS += `}\n`;
  leftLegCSS += `}\n`;
  rightFootCSS += `}\n`;
  leftFootCSS += `}\n`;
  rightCrankCSS += `}\n`;
  leftCrankCSS += `}\n`;
  rightPedalCSS += `}\n`;
  leftPedalCSS += `}\n`;

  return {
    rightLegCSS, leftLegCSS, rightFootCSS, leftFootCSS,
    rightCrankCSS, leftCrankCSS, rightPedalCSS, leftPedalCSS
  };
}

const legAnims = generateLegAnimations();

// Generate spokes for wheels
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

const html = `<!DOCTYPE html>
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
      background: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .stage-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      max-width: 1400px;
      max-height: 820px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      border-radius: 16px;
      overflow: hidden;
      background: #1e293b;
    }
    svg.canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* ========================================================
       CSS KEYFRAMES 核心动画控制系统
       ======================================================== */

    /* 1. 双轮旋转 (转速与踩踏完全同步：1.0s / 周) */
    .wheel-rear {
      transform-origin: 340px 485px;
      animation: spinWheel 1s linear infinite;
    }
    .wheel-front {
      transform-origin: 760px 485px;
      animation: spinWheel 1s linear infinite;
    }
    @keyframes spinWheel {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* 2. 踩踏传动系统：曲柄与踏板 (周期 1.0s) */
    .crank-right {
      transform-origin: 550px 485px;
      animation: spinWheel 1s linear infinite;
    }
    .crank-left {
      transform-origin: 550px 485px;
      animation: spinWheelLeft 1s linear infinite;
    }
    @keyframes spinWheelLeft {
      from { transform: rotate(180deg); }
      to { transform: rotate(540deg); }
    }

    /* 3. 动力学反向运动学 (IK) 腿部与脚掌绑定动画 */
    ${legAnims.rightLegCSS}
    ${legAnims.leftLegCSS}
    ${legAnims.rightFootCSS}
    ${legAnims.leftFootCSS}
    ${legAnims.rightPedalCSS}
    ${legAnims.leftPedalCSS}

    .pelican-leg-right {
      animation: rightLegMotion 1s linear infinite;
    }
    .pelican-leg-left {
      animation: leftLegMotion 1s linear infinite;
    }
    .pelican-foot-right {
      animation: rightFootMotion 1s linear infinite;
    }
    .pelican-foot-left {
      animation: leftFootMotion 1s linear infinite;
    }
    .pedal-right {
      animation: rightPedalMotion 1s linear infinite;
    }
    .pedal-left {
      animation: leftPedalMotion 1s linear infinite;
    }

    /* 4. 鹈鹕躯干呼吸与踩踏颠簸起伏 (上下与微俯仰) */
    .pelican-body-group {
      animation: pelicanBob 0.5s ease-in-out infinite alternate;
      transform-origin: 480px 360px;
    }
    @keyframes pelicanBob {
      0% { transform: translateY(0px) rotate(0deg); }
      100% { transform: translateY(3.5px) rotate(1.2deg); }
    }

    /* 5. 翅膀轻微扇动以维持高速行车平衡 */
    .pelican-wing {
      transform-origin: 470px 290px;
      animation: wingFlap 0.5s ease-in-out infinite alternate;
    }
    @keyframes wingFlap {
      0% { transform: rotate(0deg) scale(1); }
      100% { transform: rotate(-4.5deg) scale(0.98); }
    }

    /* 6. 红色运动围巾向后高速飘逸 */
    .scarf-tail-1 {
      transform-origin: 435px 235px;
      animation: scarfWave1 0.28s ease-in-out infinite alternate;
    }
    .scarf-tail-2 {
      transform-origin: 430px 240px;
      animation: scarfWave2 0.32s ease-in-out infinite alternate 0.08s;
    }
    @keyframes scarfWave1 {
      0% { transform: rotate(0deg) skewX(0deg); }
      100% { transform: rotate(9deg) skewX(6deg) translateY(-2px); }
    }
    @keyframes scarfWave2 {
      0% { transform: rotate(-3deg) scaleY(0.95); }
      100% { transform: rotate(12deg) scaleY(1.05) translateY(-3px); }
    }

    /* 7. 喉囊微颤动 (迎风气流轻微膨胀颤动) */
    .throat-pouch {
      transform-origin: 600px 230px;
      animation: pouchJiggle 0.45s ease-in-out infinite alternate;
    }
    @keyframes pouchJiggle {
      0% { transform: scale(1) rotate(0deg); }
      100% { transform: scale(1.025, 0.985) rotate(-0.8deg); }
    }

    /* 8. 海边公路多层次背景视差后移 */
    /* 远景云朵 (极慢速) */
    .cloud-layer {
      animation: moveClouds 24s linear infinite;
    }
    @keyframes moveClouds {
      0% { transform: translateX(0); }
      100% { transform: translateX(-600px); }
    }

    /* 远景海面浪花与海鸥 (中慢速) */
    .ocean-waves {
      animation: moveWaves 8s linear infinite;
    }
    @keyframes moveWaves {
      0% { transform: translateX(0); }
      100% { transform: translateX(-400px); }
    }

    /* 中景海岸悬崖与防护木桩 (中速) */
    .fence-layer {
      animation: moveFence 2.2s linear infinite;
    }
    @keyframes moveFence {
      0% { transform: translateX(0); }
      100% { transform: translateX(-480px); }
    }

    /* 近景地面与路面黄色虚线标线 (高速：与车轮转速一致) */
    .road-marks {
      animation: moveRoad 0.5s linear infinite;
    }
    @keyframes moveRoad {
      0% { transform: translateX(0); }
      100% { transform: translateX(-300px); }
    }

    /* 迎面风线与光斑速度感粒子 */
    .speed-lines {
      animation: moveSpeed 0.4s linear infinite;
    }
    @keyframes moveSpeed {
      0% { transform: translateX(0); opacity: 0.9; }
      100% { transform: translateX(-600px); opacity: 0.2; }
    }

    /* UI 悬浮标签 */
    .hud-badge {
      position: absolute;
      top: 18px;
      left: 20px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      padding: 10px 18px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #f8fafc;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 10;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .hud-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .hud-title {
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .hud-specs {
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="stage-container">
    <div class="hud-badge">
      <div class="hud-dot"></div>
      <span class="hud-title">California Brown Pelican · Cycling Engine</span>
      <span class="hud-specs">100% Native SVG + CSS Keyframes IK</span>
    </div>

    <svg class="canvas" viewBox="0 0 1100 680" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- 渐变配置 -->
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="35%" stop-color="#7dd3fc"/>
          <stop offset="65%" stop-color="#bae6fd"/>
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

        <!-- 车架钛合金金属漆渐变 -->
        <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#06b6d4"/>
          <stop offset="50%" stop-color="#0891b2"/>
          <stop offset="100%" stop-color="#0e7490"/>
        </linearGradient>

        <!-- 鹈鹕喉囊细腻皮膜渐变 -->
        <linearGradient id="pouchGrad" x1="20%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#fdba74"/>
          <stop offset="45%" stop-color="#fb923c"/>
          <stop offset="85%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>

        <!-- 鹈鹕嘴喙角质层渐变 -->
        <linearGradient id="billGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#64748b"/>
          <stop offset="40%" stop-color="#94a3b8"/>
          <stop offset="85%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>

        <!-- 褐羽毛层次渐变 -->
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

        <!-- 滤镜阴影 -->
        <filter id="bikeShadow" x="-10%" y="-10%" width="120%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.45 0"/>
          <feOffset dx="0" dy="16"/>
          <feBlend in="SourceGraphic" in2="blurOut" mode="normal"/>
        </filter>
      </defs>

      <!-- ================= 1. 天空与远景海滨 ================= -->
      <rect x="0" y="0" width="1100" height="420" fill="url(#skyGrad)"/>

      <!-- 太阳 -->
      <circle cx="920" cy="110" r="42" fill="url(#sunGrad)" opacity="0.9"/>
      <circle cx="920" cy="110" r="58" fill="#fef08a" opacity="0.25"/>

      <!-- 远景移动云层 (无缝双胞平移) -->
      <g class="cloud-layer">
        <!-- 循环片段 1 -->
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
        <!-- 循环片段 2 (偏移 +600px) -->
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
      <g class="ocean-waves" opacity="0.45" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round">
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

      <!-- 移动木质防护栏 (无缝平移) -->
      <g class="fence-layer">
        <!-- 8根桩柱与连接横木 (双倍拼接支持平滑循环) -->
        <g stroke="#78350f" stroke-width="6" fill="#92400e">
          <!-- 桩柱 -->
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
        <!-- 横栏缆索 -->
        <path d="M 0 355 L 1500 355 M 0 375 L 1500 375" stroke="#b45309" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- ================= 3. 近景海滨公路 ================= -->
      <!-- 路缘石 -->
      <rect x="0" y="400" width="1100" height="15" fill="url(#curbGrad)"/>
      <line x1="0" y1="400" x2="1100" y2="400" stroke="#f8fafc" stroke-width="1.5"/>

      <!-- 沥青路面 -->
      <rect x="0" y="415" width="1100" height="265" fill="url(#roadGrad)"/>

      <!-- 路面路标线 (高速后移，营造向前飞驰速度感) -->
      <g class="road-marks">
        <!-- 边缘白实线 -->
        <line x1="0" y1="435" x2="1400" y2="435" stroke="#f8fafc" stroke-width="4" stroke-opacity="0.9"/>

        <!-- 中央明黄虚线 (每 300px 重复循环) -->
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
      <!-- 左曲柄 (180度反向) -->
      <g class="crank-left">
        <line x1="550" y1="485" x2="550" y2="523" stroke="#64748b" stroke-width="7" stroke-linecap="round"/>
        <circle cx="550" cy="523" r="5" fill="#475569"/>
      </g>

      <!-- 左脚踏板 -->
      <g class="pedal-left">
        <rect x="-16" y="-5" width="32" height="10" rx="3" fill="#334155" stroke="#1e293b" stroke-width="1.5"/>
        <line x1="-12" y1="0" x2="12" y2="0" stroke="#f59e0b" stroke-width="2"/>
      </g>

      <!-- 左腿骨骼与脚掌 (通过精确 IK 实时贴合在左踏板上) -->
      <path class="pelican-leg-left" d="M 468 339 Q 470 410 550 523" fill="none" stroke="#ca8a04" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="pelican-foot-left">
        <!-- 蹼足紧紧扣在踏板上 -->
        <path d="M -12 2 L 18 2 L 12 -7 L -2 -4 Z" fill="#a16207" stroke="#713f12" stroke-width="1.2"/>
      </g>


      <!-- ================= 6. 自行车机械总成 (后轮、菱形车架、链条、前轮) ================= -->
      <!-- (1) 后轮总成 -->
      <g class="wheel-rear">
        <!-- 外胎 -->
        <circle cx="340" cy="485" r="96" fill="none" stroke="#1e293b" stroke-width="16"/>
        <!-- 胎纹防滑齿 -->
        <circle cx="340" cy="485" r="102" fill="none" stroke="#334155" stroke-width="2.5" stroke-dasharray="4 6"/>
        <!-- 轮圈 -->
        <circle cx="340" cy="485" r="88" fill="none" stroke="url(#rimGrad)" stroke-width="4.5"/>
        <circle cx="340" cy="485" r="84" fill="none" stroke="#0f172a" stroke-width="1.5"/>
        <!-- 16 根高精辐条 -->
        ${rearSpokes}
        <!-- 后飞轮小齿盘与花鼓轴心 -->
        <circle cx="340" cy="485" r="18" fill="#475569" stroke="#cbd5e1" stroke-width="2"/>
        <circle cx="340" cy="485" r="8" fill="#1e293b"/>
      </g>

      <!-- (2) 前轮总成 -->
      <g class="wheel-front">
        <!-- 外胎 -->
        <circle cx="760" cy="485" r="96" fill="none" stroke="#1e293b" stroke-width="16"/>
        <circle cx="760" cy="485" r="102" fill="none" stroke="#334155" stroke-width="2.5" stroke-dasharray="4 6"/>
        <circle cx="760" cy="485" r="88" fill="none" stroke="url(#rimGrad)" stroke-width="4.5"/>
        <circle cx="760" cy="485" r="84" fill="none" stroke="#0f172a" stroke-width="1.5"/>
        <!-- 16 根高精辐条 -->
        ${frontSpokes}
        <!-- 前轮花鼓轴心 -->
        <circle cx="760" cy="485" r="12" fill="#475569" stroke="#cbd5e1" stroke-width="2"/>
        <circle cx="760" cy="485" r="6" fill="#1e293b"/>
      </g>

      <!-- (3) 闭合传动链条与大齿盘 -->
      <!-- 闭合链条 (后轮飞轮至中轴大齿盘) -->
      <path d="M 340 472 L 550 460 A 26 26 0 0 1 550 510 L 340 498 A 14 14 0 0 1 340 472 Z"
            fill="none" stroke="#334155" stroke-width="5" stroke-linejoin="round"/>
      <path d="M 340 472 L 550 460 M 550 510 L 340 498"
            fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 3"/>

      <!-- 中轴大牙盘 (Chainring) -->
      <circle cx="550" cy="485" r="28" fill="#475569" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="550" cy="485" r="22" fill="#1e293b" stroke="#64748b" stroke-width="1.5" stroke-dasharray="5 4"/>
      <!-- 中轴镂空减重孔 -->
      <circle cx="550" cy="473" r="4" fill="#0f172a"/>
      <circle cx="560" cy="482" r="4" fill="#0f172a"/>
      <circle cx="550" cy="495" r="4" fill="#0f172a"/>
      <circle cx="540" cy="482" r="4" fill="#0f172a"/>

      <!-- (4) 经典标准菱形车架 (Diamond Frame) 结构 -->
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
        <!-- 舒适复古皮座鞍 -->
        <path d="M 430 330 C 445 320, 480 320, 505 326 C 515 328, 510 336, 495 336 C 465 336, 440 338, 430 330 Z"
              fill="#78350f" stroke="#451a03" stroke-width="2"/>
        <circle cx="450" cy="328" r="1.5" fill="#f59e0b"/>
        <circle cx="470" cy="328" r="1.5" fill="#f59e0b"/>

        <!-- 车把立管 (Stem) 与运动公路车把 (Handlebar) -->
        <line x1="685" y1="320" x2="680" y2="280" stroke="#64748b" stroke-width="7"/>
        <line x1="680" y1="280" x2="705" y2="275" stroke="#64748b" stroke-width="7"/>
        <!-- 弯把造型与黑色吸汗把带 -->
        <path d="M 705 275 C 725 275, 735 290, 725 315 C 720 325, 705 325, 700 320"
              fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
        <!-- 刹车手柄 -->
        <path d="M 725 295 L 728 318" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- ================= 7. 加州褐鹕 (California Brown Pelican) 角色总成 ================= -->
      <!-- 整体躯干附带微颠簸呼吸联动动画 -->
      <g class="pelican-body-group">

        <!-- (1) 尾羽 (深灰褐色层叠扇尾) -->
        <g id="pelican-tail">
          <path d="M 410 310 C 370 325, 360 345, 385 350 C 410 355, 430 335, 440 320 Z" fill="#44403c"/>
          <path d="M 400 320 C 365 335, 360 355, 380 360 C 405 365, 425 345, 435 330 Z" fill="#292524"/>
          <!-- 羽纹阴影 -->
          <line x1="410" y1="325" x2="380" y2="345" stroke="#1c1917" stroke-width="2"/>
        </g>

        <!-- (2) 躯干与胸脯 (褐羽层次、肌肉体态微前倾，呈现认真蹬车发力感) -->
        <g id="pelican-torso">
          <!-- 丰满厚实的身躯 -->
          <path d="M 430 290 C 410 330, 440 380, 490 380 C 530 380, 560 340, 545 290 C 535 260, 460 250, 430 290 Z"
                fill="url(#featherBrownGrad)" stroke="#292524" stroke-width="2.5"/>

          <!-- 腹部和侧肋浅色羽毛斑纹 (加州褐鹕特征：腹侧银灰-暗褐交织) -->
          <path d="M 450 315 C 445 350, 475 375, 505 375 C 520 375, 535 360, 530 335 C 500 340, 475 325, 450 315 Z"
                fill="#57534e" opacity="0.85"/>
          <!-- 细腻羽鳞层次线 -->
          <path d="M 460 305 Q 475 315 490 305 M 450 325 Q 470 338 490 325 M 465 345 Q 485 358 505 345"
                fill="none" stroke="#78716c" stroke-width="2" stroke-linecap="round"/>
        </g>

        <!-- (3) 优美的 S 型颈部 (加州褐鹕繁殖羽：后颈栗红/深褐，前颈乳白/浅金) -->
        <g id="pelican-neck">
          <!-- 后颈栗褐色粗壮肌群 -->
          <path d="M 450 270 C 455 220, 505 210, 530 190 C 545 180, 560 200, 545 230 C 530 260, 510 275, 485 285 Z"
                fill="url(#neckChestGrad)"/>
          <!-- 前颈明亮金黄-象牙白喉道羽毛 -->
          <path d="M 485 285 C 510 275, 535 245, 545 220 C 555 195, 575 190, 580 185 C 570 215, 550 255, 510 285 Z"
                fill="#fef3c7" opacity="0.95"/>
        </g>

        <!-- (4) 巨大喉囊 (加州褐鹕标志性特征：弹性深色黄橙色大囊袋，垂悬于下颌) -->
        <g id="pelican-pouch" class="throat-pouch">
          <!-- 饱满的大喉囊 -->
          <path d="M 585 185 C 640 195, 680 230, 650 270 C 625 300, 560 305, 545 255 C 540 235, 550 200, 585 185 Z"
                fill="url(#pouchGrad)" stroke="#c2410c" stroke-width="2.5"/>
          <!-- 喉囊微血管与皮肤伸缩纹理 -->
          <path d="M 585 205 Q 615 240 590 275" fill="none" stroke="#ea580c" stroke-width="2" opacity="0.7"/>
          <path d="M 610 205 Q 640 245 615 280" fill="none" stroke="#ea580c" stroke-width="2" opacity="0.6"/>
          <path d="M 635 210 Q 655 245 635 265" fill="none" stroke="#ea580c" stroke-width="1.5" opacity="0.5"/>
          <!-- 喉囊底部饱满高光 -->
          <ellipse cx="610" cy="275" rx="25" ry="12" fill="#ffedd5" opacity="0.35"/>
        </g>

        <!-- (5) 头部与长喙 (长达 30cm+ 的壮硕长喙，末端带尖锐小倒钩) -->
        <g id="pelican-head">
          <!-- 头部基底 (浅黄/白色羽冠) -->
          <path d="M 545 175 C 540 145, 575 135, 610 150 C 625 155, 630 175, 615 188 C 590 200, 555 195, 545 175 Z"
                fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
          <!-- 头部后脑可爱的蓬松羽冠 -->
          <path d="M 550 160 C 530 150, 535 135, 555 140 C 545 130, 555 125, 570 135 Z" fill="#fef9c3"/>

          <!-- 标志性坚固上喙 (Maxilla) -->
          <path d="M 605 160 L 765 188 C 778 191, 782 198, 775 205 C 770 210, 762 208, 755 202 L 600 180 Z"
                fill="url(#billGrad)" stroke="#475569" stroke-width="2.5" stroke-linejoin="round"/>
          <!-- 喙尖标志性锋利下弯小钩 (Nail hook) -->
          <path d="M 768 189 C 780 193, 782 206, 772 210 C 768 206, 767 197, 760 194 Z" fill="#d97706"/>
          <!-- 喙中央角质龙骨脊线与侧鼻沟 -->
          <line x1="615" y1="168" x2="760" y2="194" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>
          <line x1="620" y1="174" x2="740" y2="196" stroke="#475569" stroke-width="1.2"/>

          <!-- 下喙边框 (支撑大喉囊上缘) -->
          <line x1="600" y1="182" x2="760" y2="202" stroke="#334155" stroke-width="2.5"/>

          <!-- 认真坚毅蹬车的眼神 (Focused & Determined eye) -->
          <!-- 眼眶裸皮浅蓝粉色晕圈 -->
          <circle cx="585" cy="162" r="10" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
          <!-- 巩膜与眼白 -->
          <circle cx="586" cy="162" r="7.5" fill="#ffffff"/>
          <!-- 黑色瞳孔直视前方路面 -->
          <circle cx="588" cy="162" r="4.2" fill="#0f172a"/>
          <!-- 眼神高光 (坚毅、专注、充满活力) -->
          <circle cx="587" cy="160" r="1.6" fill="#ffffff"/>
          <circle cx="590" cy="164" r="0.8" fill="#ffffff"/>
          <!-- 认真发力紧蹙的眉羽 (Serious determined eyebrow) -->
          <path d="M 574 154 Q 587 155 597 158" stroke="#854d0e" stroke-width="3.5" stroke-linecap="round" fill="none"/>

          <!-- 脸颊粉嫩小腮红 (增添卡通生动可爱感) -->
          <ellipse cx="578" cy="176" rx="6" ry="4" fill="#f43f5e" opacity="0.45"/>
        </g>

        <!-- (6) 迎风招展的红色骑行长围巾 (动态飘逸，展现强烈前冲气流) -->
        <g id="pelican-scarf">
          <!-- 围巾领圈 -->
          <path d="M 525 215 C 545 210, 565 220, 555 240 C 535 255, 515 240, 525 215 Z"
                fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
          <path d="M 532 218 Q 548 226 542 238" fill="none" stroke="#fca5a5" stroke-width="2"/>

          <!-- 围巾尾巴 1 (向后上方波浪形剧烈飘摆) -->
          <g class="scarf-tail-1">
            <path d="M 525 225 C 475 220, 420 190, 360 205 C 410 220, 460 240, 520 238 Z"
                  fill="#dc2626" stroke="#991b1b" stroke-width="1.8"/>
            <!-- 流苏装饰 -->
            <path d="M 360 205 L 350 202 M 360 207 L 348 208 M 362 210 L 352 214"
                  stroke="#fef08a" stroke-width="2.5" stroke-linecap="round"/>
          </g>

          <!-- 围巾尾巴 2 (向后略偏下方微延时飘摆) -->
          <g class="scarf-tail-2">
            <path d="M 520 232 C 465 235, 410 215, 345 228 C 400 245, 450 255, 515 245 Z"
                  fill="#b91c1c" stroke="#7f1d1d" stroke-width="1.8"/>
            <path d="M 345 228 L 335 226 M 345 231 L 334 233 M 346 235 L 336 238"
                  stroke="#fef08a" stroke-width="2.5" stroke-linecap="round"/>
          </g>
        </g>

        <!-- (7) 翅膀与手部抓握 (羽毛层次清晰，轻微扇动维持高速平衡，翼尖紧握车把) -->
        <g id="pelican-wing" class="pelican-wing">
          <!-- 覆羽层 (浅棕黄羽毛) -->
          <path d="M 460 270 C 495 260, 535 280, 540 310 C 540 335, 500 355, 465 340 C 445 330, 440 285, 460 270 Z"
                fill="#78716c" stroke="#44403c" stroke-width="2"/>

          <!-- 次级飞羽 (深褐灰色羽毛层次) -->
          <path d="M 470 295 C 510 295, 555 315, 560 345 C 530 365, 485 365, 460 340 Z"
                fill="#57534e" stroke="#292524" stroke-width="1.8"/>

          <!-- 初级飞羽与前伸翼腕 (向前下方延伸紧扣车把，呈专业破风骑行姿势) -->
          <path d="M 520 310 C 560 310, 640 295, 715 285 C 725 283, 730 293, 715 300 C 660 325, 580 350, 515 345 Z"
                fill="#44403c" stroke="#1c1917" stroke-width="2"/>

          <!-- 翼尖羽指牢牢扣住把横与刹把 (Gripping the handlebar) -->
          <g id="wing-hand">
            <path d="M 705 280 C 720 276, 730 286, 722 298 C 715 304, 702 300, 700 290 Z"
                  fill="#292524" stroke="#0f172a" stroke-width="1.5"/>
            <path d="M 712 284 C 724 286, 725 296, 718 302" fill="none" stroke="#a8a29e" stroke-width="1.8" stroke-linecap="round"/>
          </g>

          <!-- 翅羽纹理装饰线 -->
          <path d="M 480 285 Q 510 300 535 295" stroke="#a8a29e" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M 475 305 Q 515 320 545 315" stroke="#a8a29e" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M 470 325 Q 510 340 540 335" stroke="#a8a29e" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        </g>

      </g> <!-- 结束 pelican-body-group -->


      <!-- ================= 8. 右侧(近端) 腿部、踏板、曲柄 ================= -->
      <!-- 右曲柄 (正相 0-360 度循环) -->
      <g class="crank-right">
        <line x1="550" y1="485" x2="550" y2="447" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round"/>
        <circle cx="550" cy="447" r="6" fill="#64748b"/>
      </g>

      <!-- 右脚踏板 (随踩踏平动，保持水平承托) -->
      <g class="pedal-right">
        <rect x="-18" y="-6" width="36" height="12" rx="3.5" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
        <line x1="-14" y1="0" x2="14" y2="0" stroke="#f59e0b" stroke-width="3"/>
        <circle cx="-10" cy="0" r="1.5" fill="#ffffff"/>
        <circle cx="10" cy="0" r="1.5" fill="#ffffff"/>
      </g>

      <!-- 右腿骨骼与黄色蹼足 (通过精确 IK 数学解算，脚掌全程 100% 严丝合缝紧锁踏板) -->
      <path class="pelican-leg-right" d="M 480 345 Q 470 410 550 447" fill="none" stroke="#eab308" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="pelican-foot-right">
        <!-- 强健有力的三趾黄色大蹼足紧扣踏板 -->
        <path d="M -14 3 L 22 3 C 24 3, 25 -2, 21 -4 L 14 -8 L 0 -5 L -8 -1 Z"
              fill="#ca8a04" stroke="#854d0e" stroke-width="2" stroke-linejoin="round"/>
        <!-- 蹼蹼纹理与脚爪细节 -->
        <line x1="-2" y1="-3" x2="18" y2="1" stroke="#eab308" stroke-width="2"/>
        <polygon points="21,-3 25,2 20,3" fill="#451a03"/>
      </g>

      <!-- ================= 9. 速度线与海风粒子 (增强前行冲击感) ================= -->
      <g class="speed-lines" stroke="#ffffff" stroke-linecap="round" opacity="0.6">
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

fs.writeFileSync('pelican_bike_masterpiece.html', html, 'utf8');
console.log('Successfully written pelican_bike_masterpiece.html!');
