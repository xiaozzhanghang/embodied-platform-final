'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  HAND_KEYPOINT_DEFS,
  HAND_SKELETON_CONNECTIONS,
  getInterpolatedHandPose
} from './handPoseConstants';

export default function HandKeypointCanvas({
  videoRef,
  currentFrame = 0,
  handFilter = 'all', // 'all' | 'left' | 'right'
  showBones = true,
  showPointLabels = true,
  showBBoxes = true,
  activeHand = 'right', // 'left' | 'right'
  selectedPointId = null,
  onSelectPoint = () => {},
  customKeyframes = {},
  onUpdatePoint = () => {},
  onTogglePlay = () => {},
}) {
  const canvasRef = useRef(null);
  const clickStartPosRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null); // { hand, pointId, x, y }
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef(null); // { hand, pointId }

  // 获取指定帧和手部的数据（优先自定义修改，若非采样帧则通过时序邻近帧连续插值）
  const getHandData = useCallback((hand) => {
    return getInterpolatedHandPose(currentFrame, hand, customKeyframes);
  }, [currentFrame, customKeyframes]);

  // 计算视频在当前容器内的 Letterboxing 渲染区域
  const getVideoRenderBox = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

    const rect = video.getBoundingClientRect();
    const videoW = video.videoWidth || 1920;
    const videoH = video.videoHeight || 1080;
    const containerW = rect.width;
    const containerH = rect.height;

    const videoRatio = videoW / videoH;
    const containerRatio = containerW / containerH;

    let renderW = containerW;
    let renderH = containerH;
    let offsetX = 0;
    let offsetY = 0;

    if (containerRatio > videoRatio) {
      // 左右黑边
      renderH = containerH;
      renderW = containerH * videoRatio;
      offsetX = (containerW - renderW) / 2;
    } else {
      // 上下黑边
      renderW = containerW;
      renderH = containerW / videoRatio;
      offsetY = (containerH - renderH) / 2;
    }

    return { renderW, renderH, offsetX, offsetY, containerW, containerH, videoW, videoH };
  }, [videoRef]);

  // 重绘画布
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const box = getVideoRenderBox();
    if (!box) return;

    // 同步画布物理像素尺寸
    if (canvas.width !== box.containerW || canvas.height !== box.containerH) {
      canvas.width = box.containerW;
      canvas.height = box.containerH;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const handsToDraw = handFilter === 'all' ? ['left', 'right'] : [handFilter];

    handsToDraw.forEach(hand => {
      const handData = getHandData(hand);
      if (!handData || !handData.points) return;

      const isHandActive = activeHand === hand;
      const points = handData.points;

      // 转换为当前屏幕像素坐标
      const screenCoords = points.map(p => ({
        ...p,
        screenX: box.offsetX + p.x * box.renderW,
        screenY: box.offsetY + p.y * box.renderH,
      }));

      // 1. 绘制包围盒 (Bounding Box)
      if (showBBoxes) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        screenCoords.forEach(p => {
          if (p.screenX < minX) minX = p.screenX;
          if (p.screenY < minY) minY = p.screenY;
          if (p.screenX > maxX) maxX = p.screenX;
          if (p.screenY > maxY) maxY = p.screenY;
        });

        const pad = 14;
        const boxX = minX - pad;
        const boxY = minY - pad;
        const boxW = (maxX - minX) + pad * 2;
        const boxH = (maxY - minY) + pad * 2;

        ctx.save();
        ctx.strokeStyle = hand === 'left' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // 标签
        const labelText = `${hand === 'left' ? '左手 (Left)' : '右手 (Right)'} · ${Math.round(handData.confidence * 100)}%`;
        ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = hand === 'left' ? 'rgba(8, 145, 178, 0.85)' : 'rgba(5, 150, 105, 0.85)';
        ctx.fillRect(boxX, boxY - 18, textWidth + 10, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, boxX + 5, boxY - 5);
        ctx.restore();
      }

      // 2. 绘制骨骼连线 (Skeleton Bones)
      if (showBones) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        HAND_SKELETON_CONNECTIONS.forEach(([i, j]) => {
          const p1 = screenCoords[i];
          const p2 = screenCoords[j];
          if (!p1 || !p2) return;

          // 发光骨骼样式
          ctx.beginPath();
          ctx.moveTo(p1.screenX, p1.screenY);
          ctx.lineTo(p2.screenX, p2.screenY);

          ctx.lineWidth = 3.5;
          ctx.strokeStyle = hand === 'left'
            ? (isHandActive ? '#00f2fe' : 'rgba(6, 182, 212, 0.65)')
            : (isHandActive ? '#10b981' : 'rgba(16, 185, 129, 0.65)');
          ctx.shadowColor = hand === 'left' ? 'rgba(0, 242, 254, 0.6)' : 'rgba(16, 185, 129, 0.6)';
          ctx.shadowBlur = 6;
          ctx.stroke();
        });
        ctx.restore();
      }

      // 3. 绘制关键点 (Keypoints Joints)
      screenCoords.forEach(p => {
        const isSelected = isHandActive && selectedPointId === p.id;
        const isHovered = hoveredPoint && hoveredPoint.hand === hand && hoveredPoint.pointId === p.id;

        // 如果未开启骨骼/标签且该点未被选中或悬停，跳过绘制以保持底层视频真实手势标注的清晰
        if (!showBones && !showPointLabels && !isSelected && !isHovered) {
          return;
        }

        ctx.save();

        // 选中 / 悬停的高亮外光环
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(p.screenX, p.screenY, 10, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.35)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = isSelected ? '#ef4444' : '#ffffff';
          ctx.stroke();
        }

        // 核心节点圆形
        ctx.beginPath();
        const r = isSelected ? 6.5 : (isHovered ? 5.5 : 4.5);
        ctx.arc(p.screenX, p.screenY, r, 0, Math.PI * 2);

        ctx.fillStyle = isSelected
          ? '#ef4444'
          : (hand === 'left' ? '#8b5cf6' : '#f59e0b');
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // 绘制点位数字序号 (0-20)
        if (showPointLabels) {
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(p.id), p.screenX, p.screenY - 9);
        }

        ctx.restore();
      });
    });

    // 4. 绘制悬停气泡提示 (Hover Tooltip)
    if (hoveredPoint && !isDraggingRef.current) {
      const { screenX, screenY, hand, pointId } = hoveredPoint;
      const pointDef = HAND_KEYPOINT_DEFS[pointId];
      if (pointDef) {
        ctx.save();
        const handLabel = hand === 'left' ? '左手' : '右手';
        const tipText = `${handLabel} #${pointId} · ${pointDef.name}`;
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        const tipW = ctx.measureText(tipText).width + 16;
        const tipH = 24;
        const tipX = Math.min(box.containerW - tipW - 10, screenX + 12);
        const tipY = Math.max(10, screenY - 30);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.roundRect ? ctx.roundRect(tipX, tipY, tipW, tipH, 4) : ctx.fillRect(tipX, tipY, tipW, tipH);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(tipText, tipX + 8, tipY + 16);
        ctx.restore();
      }
    }
  }, [getVideoRenderBox, handFilter, activeHand, selectedPointId, hoveredPoint, showBones, showPointLabels, showBBoxes, getHandData]);

  // 帧变化或参数变化触发重绘
  useEffect(() => {
    let animId;
    const render = () => {
      drawCanvas();
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [drawCanvas]);

  // 鼠标交互：点击、拖拽点位
  const handleMouseDown = (e) => {
    clickStartPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const box = getVideoRenderBox();
    if (!box) return;

    const handsToCheck = handFilter === 'all' ? ['right', 'left'] : [handFilter]; // 优先检测活跃手

    for (const hand of handsToCheck) {
      const handData = getHandData(hand);
      if (!handData || !handData.points) continue;

      for (const p of handData.points) {
        const screenX = box.offsetX + p.x * box.renderW;
        const screenY = box.offsetY + p.y * box.renderH;
        const dist = Math.hypot(mouseX - screenX, mouseY - screenY);

        if (dist <= 12) {
          isDraggingRef.current = true;
          dragTargetRef.current = { hand, pointId: p.id };
          onSelectPoint(hand, p.id);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const box = getVideoRenderBox();
    if (!box) return;

    if (isDraggingRef.current && dragTargetRef.current) {
      // 正在拖拽点位：转换为归一化坐标 (0~1)
      const normX = Math.min(0.99, Math.max(0.01, (mouseX - box.offsetX) / box.renderW));
      const normY = Math.min(0.99, Math.max(0.01, (mouseY - box.offsetY) / box.renderH));

      onUpdatePoint(dragTargetRef.current.hand, dragTargetRef.current.pointId, normX, normY);
      canvas.style.cursor = 'grabbing';
      return;
    }

    // 悬停检测
    const handsToCheck = handFilter === 'all' ? ['right', 'left'] : [handFilter];
    let found = null;

    for (const hand of handsToCheck) {
      const handData = getHandData(hand);
      if (!handData || !handData.points) continue;

      for (const p of handData.points) {
        const screenX = box.offsetX + p.x * box.renderW;
        const screenY = box.offsetY + p.y * box.renderH;
        const dist = Math.hypot(mouseX - screenX, mouseY - screenY);

        if (dist <= 10) {
          found = { hand, pointId: p.id, screenX, screenY };
          break;
        }
      }
      if (found) break;
    }

    setHoveredPoint(found);
    canvas.style.cursor = found ? 'pointer' : 'default';
  };

  const handleMouseUp = (e) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      dragTargetRef.current = null;
      if (canvasRef.current) canvasRef.current.style.cursor = 'default';
      return;
    }

    // 若非拖拽关键点，且点击位移极小（< 6px），判定为点击视频画布区域触发播放/暂停
    if (clickStartPosRef.current && e) {
      const dist = Math.hypot(e.clientX - clickStartPosRef.current.x, e.clientY - clickStartPosRef.current.y);
      const elapsed = Date.now() - clickStartPosRef.current.time;
      clickStartPosRef.current = null;
      if (dist < 6 && elapsed < 400) {
        onTogglePlay();
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 15,
        pointerEvents: 'auto',
      }}
    />
  );
}
