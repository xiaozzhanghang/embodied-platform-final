'use client';

import React, { useState } from 'react';
import Image from 'next/image';

/**
 * SplineRobotFloatingCharacter - Next.js 轻量级 3D 角色悬浮展示组件
 *
 * 特性：
 * 1. 零 3D Canvas / 零 WebGL Runtime（不加载 @splinetool/runtime，节省数十 MB 内存与大量 CPU/GPU）
 * 2. 支持两种轻量化渲染模式：
 *    - 'png_css': 透明高清 PNG (115KB) + 硬件加速 CSS 呼吸漂浮动画（超低资源消耗）
 *    - 'animated_webp': 512x512 15FPS 循环动态透明 WebP (888KB)（真实眨眼/摇头/微呼吸微动作）
 * 3. 严格 Alpha 通道无黑白底、支持背景无缝融入、鼠标悬停与状态气泡交互。
 */
export default function SplineRobotFloatingCharacter({
  initialMode = 'animated_webp', // 'png_css' | 'animated_webp'
  size = 280, // 像素宽高
  position = 'bottom-right', // 'bottom-right' | 'bottom-left' | 'inline'
  showControls = true,
  statusText = '具身智能助手在线',
  enableCursorTracking = true, // NEXBOT 标志性鼠标注视跟随
  className = ''
}) {
  const [mode, setMode] = useState(initialMode);
  const [isHovered, setIsHovered] = useState(false);
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(false);
  const [cursorOffset, setCursorOffset] = useState({ rotX: 0, rotY: 0, headX: 0, headY: 0 });

  // NEXBOT 风格的轻量级鼠标全局注视追踪（零 WebGL/零 3D Canvas 开销）
  React.useEffect(() => {
    if (!enableCursorTracking) return;

    const handleMouseMove = (e) => {
      // 计算鼠标相对于屏幕中心的归一化偏移量 (-1.0 到 +1.0)
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;

      // 转换为角色微视角倾斜角 (左右偏航 -12°~+12°, 上下俯仰 -8°~+8°)
      setCursorOffset({
        rotY: nx * 14,
        rotX: -ny * 9,
        headX: nx * 8,
        headY: ny * 5
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableCursorTracking]);

  // 位置样式
  const positionStyles = {
    'bottom-right': {
      position: 'fixed',
      right: '28px',
      bottom: '28px',
      zIndex: 9999
    },
    'bottom-left': {
      position: 'fixed',
      left: '28px',
      bottom: '28px',
      zIndex: 9999
    },
    inline: {
      position: 'relative',
      display: 'inline-flex'
    }
  }[position] || { position: 'relative' };

  return (
    <div
      className={`spline-robot-character-container ${className}`}
      style={{
        ...positionStyles,
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        pointerEvents: 'auto'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 状态对话小气泡 */}
      {!isBubbleDismissed && (
        <div
          style={{
            marginBottom: '10px',
            padding: '6px 14px',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '16px',
            color: '#f8fafc',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 242, 254, 0.2)',
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.04)' : 'scale(1)'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}
          />
          <span>{statusText}</span>
          <button
            onClick={() => setIsBubbleDismissed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '0 2px',
              lineHeight: 1
            }}
            title="关闭提示"
          >
            ×
          </button>
        </div>
      )}

      {/* 核心角色展示区域（融合 NEXBOT 标志性 3D 透视鼠标注视与转头） */}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          cursor: 'pointer',
          perspective: '800px'
        }}
      >
        {/* 角色本体透视包装器（跟随鼠标偏航与俯仰） */}
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transform: `rotateY(${cursorOffset.rotY}deg) rotateX(${cursorOffset.rotX}deg) translate3d(${cursorOffset.headX * 0.5}px, ${cursorOffset.headY * 0.5}px, 0px)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.12s ease-out'
          }}
        >
          {/* 角色本体渲染 */}
          {mode === 'png_css' ? (
            /* 模式 A：透明静态 PNG + CSS 硬件加速上下平滑漂浮 + 鼠标注视跟随 */
            <div
              className="spline-robot-floating-css"
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                animation: 'splineRobotFloat 3.2s ease-in-out infinite'
              }}
            >
              <img
                src="/robot-character/spline_robot_static.png"
                alt="Spline 3D Character"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: isHovered ? 'drop-shadow(0 0 16px rgba(0, 242, 254, 0.45))' : 'none',
                  transition: 'filter 0.3s ease'
                }}
              />
            </div>
          ) : mode === 'transparent_video' ? (
            /* 模式 C：透明视频 (WebM VP9 + Safari HEVC with Alpha) 16.9秒全动作流 */
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.3s ease'
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'none',
                  transition: 'filter 0.3s ease'
                }}
              >
                <source src="/robot-character/spline_robot_transparent.mp4" type='video/mp4; codecs="hvc1"' />
                <source src="/robot-character/spline_robot_transparent.webm" type="video/webm" />
              </video>
            </div>
          ) : (
            /* 模式 B：动态透明 WebP（含实际眨眼、左右转头、摆臂挥手）+ 鼠标朝向倾角跟随 */
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.3s ease'
              }}
            >
              <img
                src="/robot-character/spline_robot_animated.webp"
                alt="Spline 3D Animated Character"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: isHovered ? 'drop-shadow(0 0 16px rgba(0, 242, 254, 0.45))' : 'none',
                  transition: 'filter 0.3s ease'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 悬停快捷切换控制器 */}
      {showControls && (
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '3px 6px',
            opacity: isHovered ? 1 : 0.6,
            transition: 'opacity 0.2s ease'
          }}
        >
          <button
            onClick={() => setMode('png_css')}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: mode === 'png_css' ? 600 : 400,
              color: mode === 'png_css' ? '#00f2fe' : '#94a3b8',
              background: mode === 'png_css' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            A. PNG+CSS
          </button>
          <button
            onClick={() => setMode('animated_webp')}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: mode === 'animated_webp' ? 600 : 400,
              color: mode === 'animated_webp' ? '#34d399' : '#94a3b8',
              background: mode === 'animated_webp' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            B. 动态WebP
          </button>
          <button
            onClick={() => setMode('transparent_video')}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: mode === 'transparent_video' ? 600 : 400,
              color: mode === 'transparent_video' ? '#38bdf8' : '#94a3b8',
              background: mode === 'transparent_video' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            C. 透明视频
          </button>
        </div>
      )}

      {/* CSS 硬件加速关键帧定义 */}
      <style jsx>{`
        @keyframes splineRobotFloat {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(0.8deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}
