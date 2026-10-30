'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Slider,
  Tooltip,
  Space,
  Tag,
  Divider,
  InputNumber,
  Select,
  App,
  Modal,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SaveOutlined,
  UndoOutlined,
  ClearOutlined,
  DownloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined,
  PlusOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import styles from './segmentation.module.css';

// 预设超市/第一视角具身场景分类标签
const INITIAL_CLASSES = [
  { id: 'cart', name: '购物车 (Shopping Cart)', color: '#3b82f6', hotkey: '1', count: 0 },
  { id: 'yellow_bottle', name: '黄盖罐装物 (Yellow Can)', color: '#eab308', hotkey: '2', count: 0 },
  { id: 'chips', name: '乐事薯片 (Chips Bag/Tube)', color: '#ef4444', hotkey: '3', count: 0 },
  { id: 'shelf', name: '货架层板 (Shelf Rack)', color: '#10b981', hotkey: '4', count: 0 },
  { id: 'hand', name: '人手/机械手 (Hands/Arms)', color: '#ec4899', hotkey: '5', count: 0 },
  { id: 'bread_snack', name: '烘焙与零食 (Bakery Goods)', color: '#8b5cf6', hotkey: '6', count: 0 },
  { id: 'fridge', name: '立式冰柜 (Freezer/Fridge)', color: '#06b6d4', hotkey: '7', count: 0 },
  { id: 'floor', name: '地面通道 (Floor)', color: '#64748b', hotkey: '8', count: 0 },
];

export default function ClientPage() {
  const router = useRouter();
  const { message } = App.useApp();

  // 视频与播放控制
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // 标注层
  const overlayCanvasRef = useRef(null); // 光标与预览辅助层
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(788.7);
  const [fps] = useState(30);
  const [playbackRate, setPlaybackRate] = useState(1);

  // 缩放与平移视口
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // 标注工具
  const [tool, setTool] = useState('brush'); // 'brush' | 'eraser' | 'polygon'
  const [brushSize, setBrushSize] = useState(25);
  const [maskOpacity, setMaskOpacity] = useState(0.55);
  const [activeClassId, setActiveClassId] = useState('yellow_bottle');
  const [classes, setClasses] = useState(INITIAL_CLASSES);

  // 多边形模式暂存点
  const [polyPoints, setPolyPoints] = useState([]);

  // 历史栈 (Undo 支持)
  const historyStackRef = useRef({}); // frameIndex -> Array of ImageData
  const [historyLength, setHistoryLength] = useState(0);

  // 关键帧掩码保存存储 (frameIndex -> ImageData)
  const [annotatedFrames, setAnnotatedFrames] = useState(new Set([0, 11833]));
  const masksStoreRef = useRef({});

  // 鼠标交互状态
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);

  const currentFrame = Math.floor(currentTime * fps);
  const totalFrames = Math.floor(duration * fps);
  const activeClass = classes.find((c) => c.id === activeClassId) || classes[0];

  // 格式化时间码 00:00:00
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  // 视频加载与同步
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 788.7);
      initCanvasSize();
    }
  };

  const initCanvasSize = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!video || !canvas || !overlay) return;

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 1040;
    canvas.width = vw;
    canvas.height = vh;
    overlay.width = vw;
    overlay.height = vh;

    // 默认加载示例标注 (第0帧或当前帧)
    restoreMaskForFrame(Math.floor((video.currentTime || 0) * fps));
  };

  // 切换帧时恢复/保存掩码
  const restoreMaskForFrame = (fIdx) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (masksStoreRef.current[fIdx]) {
      ctx.putImageData(masksStoreRef.current[fIdx], 0, 0);
    }
    saveHistoryState();
  };

  const saveMaskForCurrentFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 检查是否有像素
    let hasPixels = false;
    for (let i = 3; i < imgData.data.length; i += 40) {
      if (imgData.data[i] > 10) {
        hasPixels = true;
        break;
      }
    }

    masksStoreRef.current[currentFrame] = imgData;
    setAnnotatedFrames((prev) => {
      const next = new Set(prev);
      if (hasPixels) next.add(currentFrame);
      else next.delete(currentFrame);
      return next;
    });
  };

  // 保存历史快照
  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (!historyStackRef.current[currentFrame]) {
      historyStackRef.current[currentFrame] = [];
    }
    const stack = historyStackRef.current[currentFrame];
    if (stack.length > 15) stack.shift();
    stack.push(data);
    setHistoryLength(stack.length);
  };

  // 撤销 Undo
  const handleUndo = () => {
    const stack = historyStackRef.current[currentFrame];
    if (!stack || stack.length <= 1) {
      message.info('当前帧暂无可撤销记录');
      return;
    }
    stack.pop(); // 弹出当前
    const prev = stack[stack.length - 1];
    const canvas = canvasRef.current;
    if (canvas && prev) {
      const ctx = canvas.getContext('2d');
      ctx.putImageData(prev, 0, 0);
      masksStoreRef.current[currentFrame] = prev;
      setHistoryLength(stack.length);
      message.success('已撤销一步操作');
    }
  };

  // 清空当前帧标注
  const handleClearCurrent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveMaskForCurrentFrame();
    saveHistoryState();
    message.info('已清除当前帧像素掩码');
  };

  // 坐标转换：屏幕坐标 -> 原始 Canvas 像素坐标
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // 绘制光标辅助环
  const drawOverlayCursor = (coords) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : activeClass.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (tool === 'polygon' && polyPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
      for (let i = 1; i < polyPoints.length; i++) {
        ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
      }
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = activeClass.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 绘制顶点
      polyPoints.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = activeClass.color;
        ctx.stroke();
      });
    }
  };

  // 鼠标交互绘制
  const handleMouseDown = (e) => {
    if (e.button === 1 || e.altKey) {
      // 滚轮中键或 Alt 拖拽画布
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (e.button !== 0) return;
    const coords = getCanvasCoords(e);

    if (tool === 'brush' || tool === 'eraser') {
      isDrawingRef.current = true;
      lastPosRef.current = coords;
      drawStroke(coords, coords);
    } else if (tool === 'polygon') {
      // 多边形打点
      setPolyPoints((prev) => [...prev, coords]);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    const coords = getCanvasCoords(e);
    drawOverlayCursor(coords);

    if (isDrawingRef.current && (tool === 'brush' || tool === 'eraser')) {
      if (lastPosRef.current) {
        drawStroke(lastPosRef.current, coords);
      }
      lastPosRef.current = coords;
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPosRef.current = null;
      saveMaskForCurrentFrame();
      saveHistoryState();
    }
  };

  // 笔刷渲染
  const drawStroke = (from, to) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activeClass.color;
    }

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  };

  // 闭合多边形并填充
  const handleFinishPolygon = () => {
    if (polyPoints.length < 3) {
      message.warning('多边形至少需要 3 个顶点');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
    for (let i = 1; i < polyPoints.length; i++) {
      ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = activeClass.color;
    ctx.fill();
    ctx.restore();

    setPolyPoints([]);
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const oCtx = overlay.getContext('2d');
      oCtx.clearRect(0, 0, overlay.width, overlay.height);
    }

    saveMaskForCurrentFrame();
    saveHistoryState();
    message.success(`已生成【${activeClass.name}】多边形分割区域`);
  };

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 空格控制播放/暂停
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
      // 数字键 1-8 选标签
      const classByKey = classes.find((c) => c.hotkey === e.key);
      if (classByKey) {
        setActiveClassId(classByKey.id);
        message.info(`已切换当前类别: ${classByKey.name}`);
      }
      // B: 画笔, E: 橡皮, P: 多边形
      if (e.key === 'b' || e.key === 'B') setTool('brush');
      if (e.key === 'e' || e.key === 'E') setTool('eraser');
      if (e.key === 'p' || e.key === 'P') setTool('polygon');

      // Enter: 闭合多边形
      if (e.key === 'Enter' && tool === 'polygon' && polyPoints.length >= 3) {
        handleFinishPolygon();
      }
      // Escape: 取消多边形
      if (e.key === 'Escape' && tool === 'polygon') {
        setPolyPoints([]);
      }
      // [ / ]: 改变笔刷大小
      if (e.key === '[') setBrushSize((prev) => Math.max(2, prev - 4));
      if (e.key === ']') setBrushSize((prev) => Math.min(100, prev + 4));

      // Ctrl/Cmd + Z: 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      // 方向键单帧步进
      if (e.key === 'ArrowLeft') stepFrame(-1);
      if (e.key === 'ArrowRight') stepFrame(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [classes, tool, polyPoints, activeClassId, currentTime, isPlaying]);

  // 播放/暂停控制
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
      restoreMaskForFrame(Math.floor(video.currentTime * fps));
    }
  };

  // 单帧跳转
  const stepFrame = (stepCount) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    const newTime = Math.max(0, Math.min(duration, video.currentTime + stepCount / fps));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    restoreMaskForFrame(Math.floor(newTime * fps));
  };

  // 导出分割掩码标注数据 (JSON + PNG Mask Base64)
  const handleExport = () => {
    const exportData = {
      videoSource: '8925c733f9d6b464d49675015e4118e7.mov',
      resolution: [1280, 1040],
      totalDuration: duration,
      fps: fps,
      annotatedFramesCount: annotatedFrames.size,
      annotatedFrames: Array.from(annotatedFrames),
      classes: classes,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segmentation_annotation_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('已导出语义分割标注规范与帧索引数据！');
  };

  return (
    <div className={styles.workspace}>
      {/* 顶部导航与操作栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ color: '#94a3b8' }} />}
            onClick={() => router.push('/annotation/long-video-workbench')}
          />
          <Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div className={styles.toolbarTitle}>
              具身智能第一视角 · 视频语义分割标注工作台
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              源文件: 8925c733f9d6b464d49675015e4118e7.mov (1280x1040 / 30FPS / 13.1min)
            </div>
          </div>
          <span className={`${styles.statusPill} ${styles.statusPillLive}`}>
            <span className={styles.statusDot}></span>
            H.264 硬件解码实时流
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <Tooltip title="撤销上一次画笔绘制 (Ctrl+Z)">
            <Button
              icon={<UndoOutlined />}
              onClick={handleUndo}
              disabled={historyLength <= 1}
              style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              撤销
            </Button>
          </Tooltip>
          <Tooltip title="清空当前帧全部掩码">
            <Button
              danger
              icon={<ClearOutlined />}
              onClick={handleClearCurrent}
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}
            >
              清空本帧
            </Button>
          </Tooltip>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            导出标注
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => {
              saveMaskForCurrentFrame();
              message.success(`已保存第 ${currentFrame} 帧语义分割结果`);
            }}
            style={{ background: '#3b82f6' }}
          >
            保存本帧
          </Button>
        </div>
      </div>

      {/* 主工作区 */}
      <div className={styles.mainArea}>
        {/* 左侧：物体标签库与画笔工具 */}
        <div className={styles.leftSidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>分割类别库 (Class Labels)</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              快捷键 1-8 快速切换绘制物体类别
            </div>
          </div>

          <div className={styles.labelList}>
            {classes.map((cls) => {
              const isActive = cls.id === activeClassId;
              return (
                <div
                  key={cls.id}
                  className={`${styles.labelItem} ${isActive ? styles.labelItemActive : ''}`}
                  onClick={() => setActiveClassId(cls.id)}
                >
                  <div
                    className={styles.labelColor}
                    style={{ background: cls.color }}
                  />
                  <div className={styles.labelName}>{cls.name}</div>
                  <div className={styles.labelHotkey}>{cls.hotkey}</div>
                </div>
              );
            })}
          </div>

          {/* 绘制工具切换 */}
          <div className={styles.toolPanel}>
            <div className={styles.toolPanelTitle}>绘制工具模式</div>
            <div className={styles.toolGrid}>
              <div
                className={`${styles.toolBtn} ${tool === 'brush' ? styles.toolBtnActive : ''}`}
                onClick={() => setTool('brush')}
              >
                <div className={styles.toolBtnIcon}>🖌️</div>
                <div className={styles.toolBtnLabel}>自由画笔 (B)</div>
              </div>
              <div
                className={`${styles.toolBtn} ${tool === 'eraser' ? styles.toolBtnActive : ''}`}
                onClick={() => setTool('eraser')}
              >
                <div className={styles.toolBtnIcon}>🧹</div>
                <div className={styles.toolBtnLabel}>橡皮擦 (E)</div>
              </div>
              <div
                className={`${styles.toolBtn} ${tool === 'polygon' ? styles.toolBtnActive : ''}`}
                onClick={() => setTool('polygon')}
              >
                <div className={styles.toolBtnIcon}>📐</div>
                <div className={styles.toolBtnLabel}>多边形 (P)</div>
              </div>
              <div
                className={styles.toolBtn}
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
              >
                <div className={styles.toolBtnIcon}>🎯</div>
                <div className={styles.toolBtnLabel}>重置视角</div>
              </div>
            </div>

            {/* 多边形闭合按钮 */}
            {tool === 'polygon' && (
              <div style={{ marginTop: 8 }}>
                <Button
                  block
                  type="primary"
                  size="small"
                  onClick={handleFinishPolygon}
                  disabled={polyPoints.length < 3}
                  style={{ background: '#10b981', borderColor: '#10b981', fontSize: 12 }}
                >
                  完成多边形 (Enter) [{polyPoints.length} 点]
                </Button>
              </div>
            )}

            {/* 笔刷半径调节 */}
            <div className={styles.brushSizeControl}>
              <span className={styles.brushSizeLabel}>半径: {brushSize}px</span>
              <Slider
                min={2}
                max={100}
                value={brushSize}
                onChange={setBrushSize}
                style={{ flex: 1, margin: 0 }}
              />
            </div>

            {/* 掩码透明度调节 */}
            <div className={styles.opacityControl}>
              <span className={styles.opacityLabel}>透明度: {Math.round(maskOpacity * 100)}%</span>
              <Slider
                min={0.1}
                max={1.0}
                step={0.05}
                value={maskOpacity}
                onChange={setMaskOpacity}
                style={{ flex: 1, margin: 0 }}
              />
            </div>
          </div>

          {/* 快捷键指南 */}
          <div className={styles.shortcutsPanel}>
            <div className={styles.shortcutsTitle}>常用快捷键</div>
            <div className={styles.shortcutRow}>
              <span className={styles.shortcutDesc}>播放 / 暂停</span>
              <span className={styles.shortcutKey}>Space</span>
            </div>
            <div className={styles.shortcutRow}>
              <span className={styles.shortcutDesc}>单帧步进 (前/后)</span>
              <span className={styles.shortcutKey}>&larr; / &rarr;</span>
            </div>
            <div className={styles.shortcutRow}>
              <span className={styles.shortcutDesc}>画笔半径缩放</span>
              <span className={styles.shortcutKey}>[ / ]</span>
            </div>
            <div className={styles.shortcutRow}>
              <span className={styles.shortcutDesc}>平移画布</span>
              <span className={styles.shortcutKey}>Alt + 拖拽</span>
            </div>
          </div>
        </div>

        {/* 中间：视频与掩码画布 */}
        <div className={styles.canvasArea} ref={containerRef}>
          <div className={styles.canvasContainer}>
            <div
              className={styles.canvasStack}
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'center center',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* 底层：原始视频播放器 */}
              <video
                ref={videoRef}
                src="/videos/annotation_source.mp4"
                className={styles.videoElement}
                style={{ width: 1280, height: 1040 }}
                playsInline
                muted
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onEnded={() => setIsPlaying(false)}
              />

              {/* 中层：分割掩码绘制 Canvas */}
              <canvas
                ref={canvasRef}
                className={styles.drawCanvas}
                style={{
                  width: 1280,
                  height: 1040,
                  opacity: maskOpacity,
                }}
              />

              {/* 顶层：交互预览光标辅助 Canvas */}
              <canvas
                ref={overlayCanvasRef}
                className={styles.overlayCanvas}
                style={{ width: 1280, height: 1040 }}
              />
            </div>
          </div>

          {/* 缩放浮层 */}
          <div className={styles.zoomInfo}>
            <Button
              type="text"
              size="small"
              icon={<ZoomOutOutlined style={{ color: '#94a3b8' }} />}
              onClick={() => setZoom((prev) => Math.max(0.4, prev - 0.1))}
            />
            <span className={styles.zoomText}>{Math.round(zoom * 100)}%</span>
            <Button
              type="text"
              size="small"
              icon={<ZoomInOutlined style={{ color: '#94a3b8' }} />}
              onClick={() => setZoom((prev) => Math.min(3.0, prev + 0.1))}
            />
          </div>

          {/* 底部时间轴控制 */}
          <div className={styles.timelineBar}>
            <div className={styles.timelineTop}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={styles.timeCode}>{formatTime(currentTime)}</span>
                <span className={styles.frameInfo}>
                  帧: {currentFrame} / {totalFrames} (FPS: {fps})
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                已标记关键帧数: <b style={{ color: '#22d3ee' }}>{annotatedFrames.size}</b>
              </div>
            </div>

            {/* 可拖拽时间轴 */}
            <div
              className={styles.timelineTrack}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const targetTime = frac * duration;
                if (videoRef.current) {
                  videoRef.current.currentTime = targetTime;
                  setCurrentTime(targetTime);
                  restoreMaskForFrame(Math.floor(targetTime * fps));
                }
              }}
            >
              <div
                className={styles.timelineProgress}
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div
                className={styles.timelinePlayhead}
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />

              {/* 关键帧标记点 */}
              {Array.from(annotatedFrames).map((f) => (
                <div
                  key={f}
                  className={styles.keyframeMarker}
                  style={{ left: `${(f / totalFrames) * 100}%` }}
                  title={`已标注第 ${f} 帧`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetTime = f / fps;
                    if (videoRef.current) {
                      videoRef.current.currentTime = targetTime;
                      setCurrentTime(targetTime);
                      restoreMaskForFrame(f);
                    }
                  }}
                />
              ))}
            </div>

            {/* 播放与倍速控制 */}
            <div className={styles.controlsRow}>
              <div className={styles.playControls}>
                <Button
                  icon={<StepBackwardOutlined />}
                  size="small"
                  onClick={() => stepFrame(-1)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                >
                  -1 帧
                </Button>
                <Button
                  type="primary"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={togglePlay}
                  style={{ background: isPlaying ? '#e11d48' : '#2563eb' }}
                >
                  {isPlaying ? '暂停' : '播放'}
                </Button>
                <Button
                  icon={<StepForwardOutlined />}
                  size="small"
                  onClick={() => stepFrame(1)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                >
                  +1 帧
                </Button>
                <Button
                  size="small"
                  onClick={() => stepFrame(30)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}
                >
                  +1 秒
                </Button>
              </div>

              <div className={styles.speedControls}>
                <span className={styles.speedLabel}>播放速度:</span>
                {[0.5, 1.0, 2.0, 4.0].map((rate) => (
                  <Button
                    key={rate}
                    size="small"
                    type={playbackRate === rate ? 'primary' : 'default'}
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (videoRef.current) videoRef.current.playbackRate = rate;
                    }}
                    style={{
                      fontSize: 11,
                      background: playbackRate === rate ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                    }}
                  >
                    {rate}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：关键帧标注清单与元数据 */}
        <div className={styles.rightSidebar}>
          <div className={styles.rightSidebarHeader}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
              关键帧掩码队列 ({annotatedFrames.size})
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              点击直接跳转至已标注关键帧进行微调
            </div>
          </div>

          <div className={styles.annotationList}>
            {Array.from(annotatedFrames)
              .sort((a, b) => a - b)
              .map((f) => {
                const isActive = Math.abs(f - currentFrame) <= 1;
                return (
                  <div
                    key={f}
                    className={`${styles.annotationItem} ${isActive ? styles.annotationItemActive : ''}`}
                    onClick={() => {
                      const t = f / fps;
                      if (videoRef.current) {
                        videoRef.current.currentTime = t;
                        setCurrentTime(t);
                        restoreMaskForFrame(f);
                      }
                    }}
                  >
                    <div className={styles.annotationItemHeader}>
                      <div className={styles.annotationItemLabel}>
                        <div
                          className={styles.annotationItemDot}
                          style={{ background: '#3b82f6' }}
                        />
                        <span className={styles.annotationItemName}>Frame #{f}</span>
                      </div>
                      <span className={styles.annotationItemFrame}>{formatTime(f / fps)}</span>
                    </div>
                    <div className={styles.annotationItemMeta}>
                      <span className={styles.annotationItemTag}>已生成全像素掩码</span>
                      <span className={styles.annotationItemTag}>多类别融合</span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* 属性与统计 */}
          <div className={styles.statsFooter}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>当前画面时间:</span>
              <span className={styles.statValue}>{formatTime(currentTime)}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>总帧数 / 进度:</span>
              <span className={styles.statValue}>
                {Math.round((currentFrame / totalFrames) * 100)}% ({currentFrame}/{totalFrames})
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>输出格式:</span>
              <span className={styles.statValue}>COCO / Cityscapes Mask</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>标注工具状态:</span>
              <span className={styles.statValue} style={{ color: '#4ade80' }}>
                就绪 (Ready)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
