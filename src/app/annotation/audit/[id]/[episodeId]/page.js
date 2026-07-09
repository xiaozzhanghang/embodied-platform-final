'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Button, Tag, Space, Typography, App, Badge, Divider, Select, 
  Input, Row, Col, Progress, Switch, Tooltip, Radio, Card, List, Form, Modal, Checkbox
} from 'antd';
import { 
  CloseOutlined, SearchOutlined, ReloadOutlined, AuditOutlined, EyeOutlined, 
  CheckCircleOutlined, FullscreenOutlined, PlayCircleOutlined, 
  CheckOutlined, InfoCircleOutlined, SelectOutlined, BorderOutlined, AimOutlined, 
  VideoCameraOutlined, LeftOutlined, RightOutlined, PauseOutlined, StepBackwardOutlined, 
  StepForwardOutlined, CaretRightOutlined, CaretLeftOutlined, UndoOutlined, 
  DeleteOutlined, QuestionCircleOutlined, SettingOutlined, CalendarOutlined, 
  ClockCircleOutlined, NodeIndexOutlined, PlusOutlined, EditOutlined, 
  ArrowRightOutlined, CheckSquareOutlined, RocketOutlined, SettingFilled,
  SlidersOutlined, ExclamationCircleOutlined, DoubleLeftOutlined, DoubleRightOutlined,
  CloudUploadOutlined, PlaySquareOutlined, LayoutOutlined, FolderOpenOutlined, 
  SaveOutlined, BulbOutlined, GlobalOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Text, Paragraph } = Typography;
const { Option } = Select;

export default function AnnotationAuditWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  const instanceId = params.id;
  const episodeId = params.episodeId;

  // Retrieve current annotation type and mode from URL
  const [annoType, setAnnoType] = useState('范围标注');
  const [workMode, setWorkMode] = useState('annotate'); 

  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    const modeFromUrl = searchParams.get('mode');
    if (typeFromUrl) setAnnoType(typeFromUrl);
    if (modeFromUrl) setWorkMode(modeFromUrl);
  }, [searchParams]);

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(50);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const totalFrames = 120; 

  // Format dynamic epoch timestamp based on current frame: 2024/10/23 16:25:37.985
  const getDynamicTimestamp = (frame) => {
    const baseTimeMs = new Date('2024-10-23T16:25:37.000Z').getTime();
    const frameDurationMs = 33; // ~30fps
    const targetTime = new Date(baseTimeMs + (frame * frameDurationMs));
    const pad = (n) => String(n).padStart(2, '0');
    const ms = String(targetTime.getMilliseconds()).padStart(3, '0');
    return `${targetTime.getFullYear()}/${pad(targetTime.getMonth() + 1)}/${pad(targetTime.getDate())} ${pad(targetTime.getHours())}:${pad(targetTime.getMinutes())}:${pad(targetTime.getSeconds())}.${ms}`;
  };

  const currentTime = (currentFrame * 0.033).toFixed(3);

  // 1. Point Annotation specific states
  const [pointColor, setPointColor] = useState('#722ed1'); 
  const [flatSize, setFlatSize] = useState('5px');
  const [hoverX, setHoverX] = useState(0.5); 
  const [points, setPoints] = useState([
    { id: 101, x: 0.350, y: 0.450, color: '#722ed1', frame: 0, label: '手腕关节点' },
    { id: 102, x: 0.320, y: 0.520, color: '#1890ff', frame: 0, label: '接触目标点' },
    { id: 201, x: 0.380, y: 0.460, color: '#722ed1', frame: 15, label: '手腕关节点' },
    { id: 202, x: 0.350, y: 0.550, color: '#1890ff', frame: 15, label: '接触目标点' },
    { id: 301, x: 0.420, y: 0.480, color: '#722ed1', frame: 30, label: '手腕关节点' },
    { id: 302, x: 0.380, y: 0.580, color: '#1890ff', frame: 30, label: '接触目标点' }
  ]);

  // 2. Bounding Box specific states
  const [activeHand, setActiveHand] = useState('left'); 
  const [bboxes, setBboxes] = useState([
    { id: 1001, hand: 'left', x1: 0.10, y1: 0.12, x2: 0.55, y2: 0.85, frame: 0, label: '机器人左手' },
    { id: 1002, hand: 'right', x1: 0.48, y1: 0.38, x2: 0.82, y2: 0.90, frame: 0, label: '机器人右手' },
    { id: 2001, hand: 'left', x1: 0.11, y1: 0.14, x2: 0.58, y2: 0.88, frame: 15, label: '机器人左手' },
    { id: 2002, hand: 'right', x1: 0.50, y1: 0.40, x2: 0.84, y2: 0.92, frame: 15, label: '机器人右手' },
    { id: 3001, hand: 'left', x1: 0.12, y1: 0.16, x2: 0.60, y2: 0.91, frame: 30, label: '机器人左手' },
    { id: 3002, hand: 'right', x1: 0.52, y1: 0.42, x2: 0.86, y2: 0.94, frame: 30, label: '机器人右手' }
  ]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawCurrent, setDrawCurrent] = useState({ x: 0, y: 0 });

  // 3. Range Annotation specific states
  const [selectedStepId, setSelectedStepId] = useState(1); 
  const [steps, setSteps] = useState([
    { id: 1, text: '右手从置物架抓取药品到药房工作台', startFrame: 0, endFrame: 15, total: 16, status: 'success', color: '#13c2c2' },
    { id: 2, text: '右手从置物架侧医疗废弃物垃圾桶到医疗废弃物垃圾棚', startFrame: 15, endFrame: 30, total: 16, status: 'success', color: '#722ed1' },
    { id: 3, text: '双手从台面上方放置托盘到桌子', startFrame: 30, endFrame: 45, total: 16, status: 'success', color: '#1890ff' },
    { id: 4, text: '双手从桌子拿起托盘到台面上方', startFrame: 45, endFrame: 60, total: 16, status: 'success', color: '#52c41a' },
    { id: 5, text: '右手从桌子拿起盘子到台面上方', startFrame: 60, endFrame: 75, total: 16, status: 'success', color: '#faad14' },
    { id: 6, text: '右手从台面上方放置盘子到托盘正中', startFrame: 75, endFrame: 90, total: 16, status: 'success', color: '#ff4d4f' },
    { id: 7, text: '右手从桌子拿起叉子到台面上方', startFrame: 90, endFrame: 100, total: 11, status: 'success', color: '#eb2f96' },
    { id: 8, text: '右手从台面上方放置叉子到盘子右侧', startFrame: 100, endFrame: 110, total: 11, status: 'success', color: '#13c2c2' },
    { id: 9, text: '左手从桌子拿起餐刀到台面上方', startFrame: 110, endFrame: 120, total: 11, status: 'success', color: '#722ed1' }
  ]);
  const [controllerQuality, setControllerQuality] = useState('success');
  const [activeTabKey, setActiveTabKey] = useState('1'); 
  const timelineRef = useRef(null);
  const [draggingHandle, setDraggingHandle] = useState(null); 
  const [showDevNotes, setShowDevNotes] = useState(false);

  // 4. Grid Cameras active switches mapping (Used for both Range mode and Semantic 2x2 mode)
  const [gridCameras, setGridCameras] = useState({
    grid1: 'camera_head_left_color',
    grid2: 'camera_head_right_color',
    grid3: 'camera_hand_left_color',
    grid4: 'joints'
  });

  // 5. Semantic Temporal Annotation specific states
  const [newRangeStart, setNewRangeStart] = useState(0);
  const [newRangeEnd, setNewRangeEnd] = useState(30);
  const [semanticSegments, setSemanticSegments] = useState([
    { id: 1, start: 0, end: 15, text: '从 桌面 捡起 箱子', enText: 'pick box from desktop', color: '#13c2c2' },
    { id: 2, start: 15, end: 30, text: '从 桌面 捡起 猕猴桃', enText: 'pick Kiwi from desktop', color: '#722ed1' }
  ]);

  // Modal State for Add Annotation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [semanticActiveTab, setSemanticActiveTab] = useState('标注');

  // Structured Template Builder States
  const [selectedSkill, setSelectedSkill] = useState('pick {A} from {B}');
  const [selectedObject, setSelectedObject] = useState('box');
  const [selectedTarget, setSelectedTarget] = useState('desktop');
  const [selectedOptions, setSelectedOptions] = useState(['右手']);

  // Predefined custom dropdown items
  const objectDropdownList = [
    { label: '彩色杯子', value: 'colored cup' },
    { label: 'Brush (刷子)', value: 'Brush' },
    { label: 'Colored spoons (彩色勺子)', value: 'Colored spoons' },
    { label: 'Eraser (橡皮)', value: 'Eraser' },
    { label: 'Green Kumquat (黄桔子)', value: 'Green Kumquat' },
    { label: 'Strawberry (草莓)', value: 'Strawberry' },
    { label: 'Cheerilee (车厘子)', value: 'Cheerilee' },
    { label: 'Fig (无花果)', value: 'Fig' }
  ];

  const targetDropdownList = [
    { label: 'desktop (桌面)', value: 'desktop' },
    { label: 'shelves (货架)', value: 'shelves' },
    { label: 'bookshelf (书架)', value: 'bookshelf' },
    { label: 'table (桌子)', value: 'table' },
    { label: 'Fruit Bowl (果盘)', value: 'Fruit Bowl' }
  ];

  // Helper to compile preview text dynamically
  const getCompiledText = () => {
    let en = selectedSkill;
    let cn = '';
    
    // Determine translation mapping
    if (selectedSkill.includes('pick')) {
      cn = `从 B 捡起 A`;
    } else if (selectedSkill.includes('place')) {
      cn = `放置 A 到 B`;
    } else if (selectedSkill.includes('move')) {
      cn = `移动 A 到 B`;
    } else if (selectedSkill.includes('wipe')) {
      cn = `用 A 擦拭 B`;
    } else if (selectedSkill.includes('turn')) {
      cn = `转动 A`;
    }

    // Replace templates
    const objNameEn = selectedObject;
    const objNameCn = objectDropdownList.find(x => x.value === selectedObject)?.label.split(' ')[0] || selectedObject;

    const tgtNameEn = selectedTarget;
    const tgtNameCn = targetDropdownList.find(x => x.value === selectedTarget)?.label.split(' ')[0] || selectedTarget;

    en = en.replace('{A}', objNameEn).replace('{B}', tgtNameEn);
    cn = cn.replace('A', objNameCn).replace('B', tgtNameCn);

    return { en, cn };
  };

  // Immediate Action when Stop is Clicked/Pressed: Set End point AND open Modal Dialog!
  const handleStopAction = (frameVal) => {
    const endVal = frameVal !== undefined ? frameVal : currentFrame;
    setNewRangeEnd(endVal);
    setIsAddModalOpen(true);
    message.info(`🏁 动作停止在 ${endVal} 帧，已唤起新增语义段弹窗`);
  };

  const handleSaveSemanticSegment = () => {
    const { en, cn } = getCompiledText();
    const formattedText = `${cn} (${selectedOptions.join('/')})`;
    const formattedEn = `${en} (${selectedOptions.join('/')})`;

    const newSeg = {
      id: Date.now(),
      start: newRangeStart,
      end: newRangeEnd,
      text: formattedText,
      enText: formattedEn,
      color: ['#13c2c2', '#722ed1', '#1890ff', '#52c41a', '#faad14'][semanticSegments.length % 5]
    };
    setSemanticSegments([...semanticSegments, newSeg]);
    message.success(`成功保存语义区间段: [${newRangeStart} - ${newRangeEnd}f]`);
    setIsAddModalOpen(false);

    // Pre-populate next range start at current end
    setNewRangeStart(newRangeEnd);
    setNewRangeEnd(Math.min(totalFrames, newRangeEnd + 20));
  };

  // Keyboard Event Listener for Pipeline Annotation (Q / R / Enter / Space / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (annoType !== '语义标注') return;
      
      // If typing in input, don't trigger shortcuts
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setNewRangeStart(currentFrame);
        message.info(`🚩 [快捷键 Q] 记录动作起始帧: ${currentFrame}f`);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleStopAction(currentFrame);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsAddModalOpen(true);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        message.success('时序语义标注数据已上传至服务器并保存！');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [annoType, currentFrame, newRangeStart, newRangeEnd, semanticSegments]);

  const handleGridCameraChange = (gridKey, value) => {
    setGridCameras(prev => ({ ...prev, [gridKey]: value }));
    message.info(`视角已切换为 ${value}`);
  };

  const [activeCamera, setActiveCamera] = useState('camera_head_left_color');

  // Timeline dragging effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingHandle || !timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const pct = (clientX - rect.left) / rect.width;
      let frame = Math.round(pct * totalFrames);
      frame = Math.max(0, Math.min(totalFrames, frame));

      if (annoType === '语义标注') {
        return;
      }

      setSteps((prevSteps) => {
        return prevSteps.map((step) => {
          if (step.id === selectedStepId) {
            const updated = { ...step };
            if (draggingHandle === 'start') {
              updated.startFrame = Math.max(0, Math.min(frame, step.endFrame - 1));
            } else if (draggingHandle === 'end') {
              updated.endFrame = Math.max(step.startFrame + 1, Math.min(totalFrames, frame));
            }
            updated.total = updated.endFrame - updated.startFrame;
            return updated;
          }
          return step;
        });
      });
    };

    const handleMouseUp = () => {
      setDraggingHandle(null);
    };

    if (draggingHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [draggingHandle, selectedStepId, totalFrames, annoType]);

  const handleFrameChange = (frame) => {
    setCurrentFrame(frame);
  };

  // Viewport interactions (Clicks and Drags)
  const handleViewportMouseDown = (e) => {
    if (workMode === 'view') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (annoType.includes('框')) {
      setIsDrawing(true);
      setDrawStart({ x, y });
      setDrawCurrent({ x, y });
    }
  };

  const handleViewportMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (annoType === '点标注') {
      setHoverX(x);
    }

    if (isDrawing && annoType.includes('框')) {
      setDrawCurrent({ x, y });
    }
  };

  const handleViewportMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const x1 = parseFloat(Math.min(drawStart.x, x).toFixed(3));
    const y1 = parseFloat(Math.min(drawStart.y, y).toFixed(3));
    const x2 = parseFloat(Math.max(drawStart.x, x).toFixed(3));
    const y2 = parseFloat(Math.max(drawStart.y, y).toFixed(3));

    const width = x2 - x1;
    const height = y2 - y1;

    if (width > 0.01 && height > 0.01) {
      const newBbox = {
        id: Date.now(),
        hand: activeHand,
        x1,
        y1,
        x2,
        y2,
        frame: currentFrame,
        label: activeHand === 'left' ? '机器人左手' : '机器人右手'
      };
      setBboxes([...bboxes, newBbox]);
      message.success(`已添加${activeHand === 'left' ? '左手(黄)' : '右手(绿)'}框`);
    } else {
      const defW = 0.15;
      const defH = 0.2;
      const newBbox = {
        id: Date.now(),
        hand: activeHand,
        x1: parseFloat((x - defW / 2).toFixed(3)),
        y1: parseFloat((y - defH / 2).toFixed(3)),
        x2: parseFloat((x + defW / 2).toFixed(3)),
        y2: parseFloat((y + defH / 2).toFixed(3)),
        frame: currentFrame,
        label: activeHand === 'left' ? '机器人左手' : '机器人右手'
      };
      setBboxes([...bboxes, newBbox]);
      message.success(`已在点击位置添加${activeHand === 'left' ? '左手' : '右手'}框`);
    }
  };

  const handleViewportClickPoint = (e) => {
    if (annoType !== '点标注' || workMode === 'view') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) / rect.width).toFixed(3));
    const y = parseFloat(((e.clientY - rect.top) / rect.height).toFixed(3));

    const newPoint = {
      id: Date.now(),
      x,
      y,
      color: pointColor,
      frame: currentFrame,
      label: `关键点_${points.length + 1}`
    };
    setPoints([...points, newPoint]);
    message.success(`已添加坐标点: [${x}, ${y}]`);
  };

  const handleDeleteBbox = (id) => {
    setBboxes(bboxes.filter(b => b.id !== id));
  };
  const handleDeletePoint = (id) => {
    setPoints(points.filter(p => p.id !== id));
  };

  const currentFrameBboxes = bboxes.filter(b => b.frame === currentFrame);
  const currentFramePoints = points.filter(p => p.frame === currentFrame);

  const handleAddRecordedRange = () => {
    const lastStep = steps[steps.length - 1];
    const newStart = lastStep ? lastStep.endFrame : 0;
    const newEnd = Math.min(totalFrames, newStart + 30);
    
    const newStep = {
      id: steps.length + 1,
      text: `新增自定义动作步骤 ${steps.length + 1}`,
      startFrame: newStart,
      endFrame: newEnd,
      total: newEnd - newStart,
      status: 'success',
      color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#eb2f96'][steps.length % 5]
    };
    setSteps([...steps, newStep]);
    setSelectedStepId(newStep.id);
    message.success('已新增步骤段落！');
  };

  const handleStepSelect = (id) => {
    setSelectedStepId(id);
    const activeStep = steps.find(s => s.id === id);
    if (activeStep) {
      setCurrentFrame(activeStep.startFrame);
      message.info(`已切换至步骤 ${id}`);
    }
  };

  const handleStepFrameChange = (index, field, value) => {
    const updatedSteps = [...steps];
    const valNum = parseInt(value) || 0;
    updatedSteps[index][field] = valNum;
    if (field === 'startFrame' || field === 'endFrame') {
      updatedSteps[index].total = Math.max(0, updatedSteps[index].endFrame - updatedSteps[index].startFrame);
    }
    setSteps(updatedSteps);
  };

  // Dynamic viewport renderer depending on grid cameras settings
  const renderGridContent = (camKey) => {
    if (camKey === 'joints') {
      return (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ position: 'absolute', top: 8, left: 8, background: '#10b981', color: '#fff', fontSize: '9px', padding: '1px 6px', borderRadius: 3, fontWeight: 'bold', zIndex: 2 }}>三维仿真模型 (55 FPS)</div>
          
          {/* Simulated 3D wireframe grid */}
          <div style={{ 
            width: '180%', 
            height: '180%', 
            opacity: 0.18, 
            backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.4) 1px, transparent 1px)', 
            backgroundSize: '24px 24px', 
            transform: 'perspective(140px) rotateX(60deg) translateY(-20px)', 
            transformOrigin: 'top center',
            position: 'absolute'
          }} />
          
          {/* Skeleton Joint Sticks */}
          <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            {/* Draw bones */}
            <line x1="50%" y1="50%" x2="40%" y2="60%" stroke="#22d3ee" strokeWidth="3" />
            <line x1="40%" y1="60%" x2="42%" y2="78%" stroke="#22d3ee" strokeWidth="3" />
            <line x1="50%" y1="50%" x2="60%" y2="62%" stroke="#3b82f6" strokeWidth="3" strokeDasharray="3" />
            <line x1="60%" y1="62%" x2="58%" y2="80%" stroke="#3b82f6" strokeWidth="3" />
            
            {/* Draw joints */}
            <circle cx="50%" cy="50%" r="6" fill="#e11d48" />
            <circle cx="40%" cy="60%" r="5" fill="#f59e0b" />
            <circle cx="42%" cy="78%" r="5" fill="#10b981" />
            <circle cx="60%" cy="62%" r="5" fill="#2563eb" />
            <circle cx="58%" cy="80%" r="5" fill="#10b981" />
          </svg>
        </div>
      );
    }

    const filters = {
      camera_head_left_color: 'none',
      camera_head_right_color: 'saturate(0.8) brightness(1.05) hue-rotate(-20deg)',
      camera_hand_left_color: 'hue-rotate(35deg) brightness(0.9)',
      camera_hand_right_color: 'hue-rotate(85deg) saturate(1.1) brightness(0.85)',
      camera_usb_left: 'brightness(0.7) sepia(0.2)',
      camera_usb_right: 'contrast(1.2) saturate(0.8)'
    };

    if (camKey === 'camera_usb_fisheye') {
      return (
        <div style={{ flex: 1, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative' }}>
          <div style={{ width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #555' }}>
            <img src="/assets/robot_view.png" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.3)' }} />
          </div>
        </div>
      );
    }

    const imgSrc = '/assets/robot_view.png';

    return (
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%' }}>
        <img 
          src={imgSrc} 
          alt={camKey} 
          style={{ 
            position: 'absolute', 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            filter: filters[camKey] || 'none',
            pointerEvents: 'none'
          }} 
        />
      </div>
    );
  };

  // ----------------------------------------------------
  // RENDER METHOD 1: 语义时序标注工作台 (Left Control, Right 2x2 Grid)
  // ----------------------------------------------------
  if (annoType === '语义标注') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f5f7', color: '#0f172a', overflow: 'hidden', fontFamily: 'monospace' }}>
        
        {/* Top Header (Light Mode) */}
        <div style={{ height: '40px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', zIndex: 10 }}>
          <Space size={18}>
          </Space>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', letterSpacing: '0.05em' }}>
            20241023_office_ManIdentifyDualArm_162519 (语义标注工作台)
          </div>
          <Space size={16}>
            <Space size={4}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>开发说明:</span>
              <Switch 
                checked={showDevNotes} 
                onChange={setShowDevNotes} 
                size="small" 
                checkedChildren="显" 
                unCheckedChildren="隐" 
              />
            </Space>
            <Divider orientation="vertical" style={{ height: 16, margin: 0 }} />
            <Tooltip title="快捷键帮助">
              <BulbOutlined style={{ color: '#eab308', cursor: 'pointer' }} />
            </Tooltip>
            <Button 
              type="primary" 
              size="small"
              icon={<CloudUploadOutlined />} 
              style={{ background: '#eab308', borderColor: '#eab308', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              onClick={() => message.success('已将标注时序语义上传至服务器并保存！')}
            >
              保存并上传 (Ctrl+S)
            </Button>
            <CloseOutlined style={{ color: '#64748b', cursor: 'pointer' }} onClick={() => router.push(`/annotation/audit/${instanceId}`)} />
          </Space>
        </div>

        {/* Workspace Body (Left 2x2 Grid, Right Control) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT COLUMN: 4 Viewports Grid (Light Mode) */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10, padding: '12px' }}>
            
            {/* Viewport 1 (Top Left) */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', zIndex: 2 }}>
                <Select value={gridCameras.grid1} size="small" variant="borderless" style={{ width: 280, fontSize: 10, color: '#334155' }} onChange={(val) => handleGridCameraChange('grid1', val)}>
                  <Option value="camera_head_left_color">/rgb/dicolor/image_raw/compressed (主视角)</Option>
                  <Option value="camera_head_right_color">/rgb/dicolor/image_raw/compressed (副视角)</Option>
                  <Option value="camera_hand_left_color">/rgb/depth/image_raw/colorized (深度图)</Option>
                  <Option value="joints">joints.json (三维仿真模型)</Option>
                  <Option value="camera_usb_left">/usb_cam_left/jpeg_raw/compressed (左手操)</Option>
                  <Option value="camera_usb_fisheye">/usb_cam_fisheye/jpeg_raw/compressed (鱼眼镜头)</Option>
                  <Option value="camera_usb_right">/usb_cam_right/jpeg_raw/compressed (侧边视角)</Option>
                </Select>
                <Button size="small" type="text" icon={<FullscreenOutlined style={{ color: '#64748b' }} />} />
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {renderGridContent(gridCameras.grid1)}
              </div>
            </div>

            {/* Viewport 2 (Top Right) */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', zIndex: 2 }}>
                <Select value={gridCameras.grid2} size="small" variant="borderless" style={{ width: 280, fontSize: 10, color: '#334155' }} onChange={(val) => handleGridCameraChange('grid2', val)}>
                  <Option value="camera_head_left_color">/rgb/dicolor/image_raw/compressed (主视角)</Option>
                  <Option value="camera_head_right_color">/rgb/dicolor/image_raw/compressed (副视角)</Option>
                  <Option value="camera_hand_left_color">/rgb/depth/image_raw/colorized (深度图)</Option>
                  <Option value="joints">joints.json (三维仿真模型)</Option>
                  <Option value="camera_usb_left">/usb_cam_left/jpeg_raw/compressed (左手操)</Option>
                  <Option value="camera_usb_fisheye">/usb_cam_fisheye/jpeg_raw/compressed (鱼眼镜头)</Option>
                  <Option value="camera_usb_right">/usb_cam_right/jpeg_raw/compressed (侧边视角)</Option>
                </Select>
                <Button size="small" type="text" icon={<FullscreenOutlined style={{ color: '#64748b' }} />} />
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {renderGridContent(gridCameras.grid2)}
              </div>
            </div>

            {/* Viewport 3 (Bottom Left) */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', zIndex: 2 }}>
                <Select value={gridCameras.grid3} size="small" variant="borderless" style={{ width: 280, fontSize: 10, color: '#334155' }} onChange={(val) => handleGridCameraChange('grid3', val)}>
                  <Option value="camera_head_left_color">/rgb/dicolor/image_raw/compressed (主视角)</Option>
                  <Option value="camera_head_right_color">/rgb/dicolor/image_raw/compressed (副视角)</Option>
                  <Option value="camera_hand_left_color">/rgb/depth/image_raw/colorized (深度图)</Option>
                  <Option value="joints">joints.json (三维仿真模型)</Option>
                  <Option value="camera_usb_left">/usb_cam_left/jpeg_raw/compressed (左手操)</Option>
                  <Option value="camera_usb_fisheye">/usb_cam_fisheye/jpeg_raw/compressed (鱼眼镜头)</Option>
                  <Option value="camera_usb_right">/usb_cam_right/jpeg_raw/compressed (侧边视角)</Option>
                </Select>
                <Button size="small" type="text" icon={<FullscreenOutlined style={{ color: '#64748b' }} />} />
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {renderGridContent(gridCameras.grid3)}
              </div>
            </div>

            {/* Viewport 4 (Bottom Right) */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', zIndex: 2 }}>
                <Select value={gridCameras.grid4} size="small" variant="borderless" style={{ width: 280, fontSize: 10, color: '#334155' }} onChange={(val) => handleGridCameraChange('grid4', val)}>
                  <Option value="camera_head_left_color">/rgb/dicolor/image_raw/compressed (主视角)</Option>
                  <Option value="camera_head_right_color">/rgb/dicolor/image_raw/compressed (副视角)</Option>
                  <Option value="camera_hand_left_color">/rgb/depth/image_raw/colorized (深度图)</Option>
                  <Option value="joints">joints.json (三维仿真模型)</Option>
                  <Option value="camera_usb_left">/usb_cam_left/jpeg_raw/compressed (左手操)</Option>
                  <Option value="camera_usb_fisheye">/usb_cam_fisheye/jpeg_raw/compressed (鱼眼镜头)</Option>
                  <Option value="camera_usb_right">/usb_cam_right/jpeg_raw/compressed (侧边视角)</Option>
                </Select>
                <Button size="small" type="text" icon={<FullscreenOutlined style={{ color: '#64748b' }} />} />
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {renderGridContent(gridCameras.grid4)}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Control Panel (White Theme) */}
          <div style={{ width: '260px', background: '#f4f4f5', borderLeft: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column', color: '#18181b' }}>
            
            {/* Sidebar Tab headers */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e4e4e7', background: '#fff' }}>
              {['标签', '统计', '标注'].map((tab) => {
                const isActive = semanticActiveTab === tab;
                return (
                  <div 
                    key={tab}
                    onClick={() => setSemanticActiveTab(tab)}
                    style={{ 
                      flex: 1, 
                      padding: '10px 0', 
                      textAlign: 'center', 
                      fontSize: '11px', 
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#2563eb' : '#71717a',
                      borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {tab}
                  </div>
                );
              })}
            </div>

            {/* Right Column interactive content based on active tab */}
            <div style={{ flex: 1, padding: '14px', overflowY: 'auto', background: '#fff' }}>
              
              {semanticActiveTab === '标注' && (
                <>
                  {/* Shortcut Card info */}
                  <div style={{ border: '1px solid #e4e4e7', borderRadius: 6, background: '#fafafa', padding: '10px', marginBottom: 14 }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', borderBottom: '1px solid #e4e4e7', paddingBottom: 4, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span>⌨️ 键盘快捷操作流</span>
                      <Tag color="blue" style={{ fontSize: 9, margin: 0 }}>Active</Tag>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#555' }}>开始截取</span>
                        <kbd style={{ background: '#f1f1f1', padding: '1px 4px', border: '1px solid #ccc', borderRadius: 3 }}>Q</kbd>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#555' }}>结束并弹窗</span>
                        <kbd style={{ background: '#f1f1f1', padding: '1px 4px', border: '1px solid #ccc', borderRadius: 3 }}>R</kbd>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#555' }}>激活标注</span>
                        <kbd style={{ background: '#f1f1f1', padding: '1px 4px', border: '1px solid #ccc', borderRadius: 3 }}>Enter</kbd>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#555' }}>上传并保存</span>
                        <kbd style={{ background: '#f1f1f1', padding: '1px 4px', border: '1px solid #ccc', borderRadius: 3 }}>Ctrl+S</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons to Start & Stop */}
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563', marginBottom: 6 }}>操作手柄录制：</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <Button 
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      style={{ flex: 1.2, fontSize: '12px', height: 32, background: '#2563eb', borderColor: '#2563eb', fontWeight: 'bold' }} 
                      onClick={() => { setNewRangeStart(currentFrame); message.success(`🚩 已记录开始帧: ${currentFrame}f`); }}
                    >
                      ▶ 开始 [Q]
                    </Button>
                    
                    <Button 
                      danger
                      type="primary"
                      icon={<PauseOutlined />}
                      style={{ flex: 1.2, fontSize: '12px', height: 32, fontWeight: 'bold' }} 
                      onClick={() => handleStopAction(currentFrame)}
                    >
                      ⏸ 结束 [R]
                    </Button>
                  </div>

                  {/* Modal manual trigger */}
                  <Button 
                    type="dashed" 
                    block 
                    size="middle" 
                    icon={<PlusOutlined />}
                    style={{ fontSize: '11px', color: '#4b5563', borderStyle: 'dashed', marginBottom: 18 }}
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    手动添加标注
                  </Button>

                  {/* List of segment blocks in sidebar */}
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>已标注区间 ({semanticSegments.length})</span>
                    <span style={{ fontSize: 9, color: '#9ca3af' }}>点击定位</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {semanticSegments.map(seg => (
                      <div 
                        key={seg.id} 
                        style={{ 
                          background: '#fafafa', 
                          border: '1px solid #e4e4e7', 
                          borderRadius: 4, 
                          padding: '8px 10px',
                          fontSize: '11px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1f2937', fontWeight: 'bold', marginBottom: 4 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }} title={seg.text}>
                            {seg.text}
                          </span>
                          <DeleteOutlined 
                            style={{ color: '#ef4444', cursor: 'pointer' }} 
                            onClick={() => setSemanticSegments(semanticSegments.filter(x => x.id !== seg.id))}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: 10 }}>
                          <span>区间: {seg.start} - {seg.end}f</span>
                          <span style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 'bold' }} onClick={() => setCurrentFrame(seg.start)}>跳转定位</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {semanticActiveTab === '标签' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '11px' }}>
                  <div style={{ padding: '6px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: 4, fontWeight: 'bold' }}>
                    💡 提示：点击词条可快速装载拼装弹窗
                  </div>

                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 6 }}>动作技能 (Skills)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['pick', 'place', 'move', 'wipe', 'turn'].map(sk => (
                        <Tag 
                          key={sk} 
                          color="blue" 
                          style={{ cursor: 'pointer', margin: 0 }}
                          onClick={() => {
                            if (sk === 'pick') setSelectedSkill('pick {A} from {B}');
                            else if (sk === 'place') setSelectedSkill('place {A} on {B}');
                            else if (sk === 'move') setSelectedSkill('move {A} to {B}');
                            else if (sk === 'wipe') setSelectedSkill('{A} wipe {B}');
                            else if (sk === 'turn') setSelectedSkill('turn {A}');
                            setIsAddModalOpen(true);
                            message.info(`已快速设定技能: ${sk}`);
                          }}
                        >
                          {sk}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 6 }}>物体类别 (Objects)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['box', 'Kiwi', 'cup', 'spoon', 'strawberry', 'beer'].map(obj => (
                        <Tag 
                          key={obj} 
                          color="cyan" 
                          style={{ cursor: 'pointer', margin: 0 }}
                          onClick={() => {
                            setSelectedObject(obj === 'beer' ? 'small pack of beer' : obj);
                            setIsAddModalOpen(true);
                            message.info(`已快速设定对象: ${obj}`);
                          }}
                        >
                          {obj}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 6 }}>目标容器/位置 (Targets)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['desktop', 'shelves', 'bookshelf', 'table', 'Fruit Bowl'].map(tgt => (
                        <Tag 
                          key={tgt} 
                          color="green" 
                          style={{ cursor: 'pointer', margin: 0 }}
                          onClick={() => {
                            setSelectedTarget(tgt);
                            setIsAddModalOpen(true);
                            message.info(`已快速设定目标: ${tgt}`);
                          }}
                        >
                          {tgt}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {semanticActiveTab === '统计' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '11px', color: '#334155' }}>
                  
                  {/* Coverage status */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px', background: '#fafafa' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a', marginBottom: 8 }}>📊 标注时序覆盖率</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>已覆盖帧数:</span>
                      <strong>
                        {semanticSegments.reduce((acc, curr) => acc + (curr.end - curr.start), 0)}f / {totalFrames}f
                      </strong>
                    </div>
                    <Progress 
                      percent={Math.min(100, Math.round((semanticSegments.reduce((acc, curr) => acc + (curr.end - curr.start), 0) / totalFrames) * 100))} 
                      size="small" 
                      status="active" 
                      strokeColor="#2563eb"
                    />
                  </div>

                  {/* Summary details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>已标区间总数:</span>
                      <strong>{semanticSegments.length} 段</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>平均区间长度:</span>
                      <strong>
                        {(semanticSegments.reduce((acc, curr) => acc + (curr.end - curr.start), 0) / Math.max(1, semanticSegments.length)).toFixed(1)} 帧
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>采集帧率 (FPS):</span>
                      <strong>30 FPS</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>数据类型:</span>
                      <strong>双臂手眼协同数据集</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>标注质量评级:</span>
                      <Tag color="green" style={{ margin: 0, fontSize: 9 }}>A 级优秀</Tag>
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Design Notes for Semantic mode */}
              {showDevNotes && (
                <div style={{ 
                  marginTop: 14, 
                  background: '#f8fafc', 
                  border: '1px dashed #cbd5e1', 
                  borderRadius: 6, 
                  padding: '10px',
                  fontSize: '10px'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📖 语义标注开发说明
                  </div>
                  <ul style={{ paddingLeft: 12, margin: 0, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <li><strong>双栏布局调整</strong>: 主视区 2x2 网格居左（75%），控制面板居右（25%），契合主流工作流。</li>
                    <li><strong>时序轴高亮与跳转</strong>: 标注列表中显示每段已标区间，点击「跳转定位」可以直接更新主进度轴。</li>
                    <li><strong>快速词典预填</strong>: 标签页支持点击常用「技能/物体/目标」卡片，秒级拉起添加标注 Modal 并自动预选字段。</li>
                    <li><strong>时序覆盖率</strong>: 统计面板下根据各区间自动累加并渲染覆盖率 Progress 进度条。</li>
                  </ul>
                </div>
              )}

            </div>
          </div>
          </div>


        {/* Playback Control Bar (Light Mode) */}
        <div style={{ background: '#fff', borderTop: '1px solid #cbd5e1', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          
          {/* Progress Slider bar */}
          <div 
            style={{ height: '6px', background: '#e4e4e7', borderRadius: '3px', position: 'relative', cursor: 'pointer' }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              let frame = Math.round(pct * totalFrames);
              setCurrentFrame(Math.max(0, Math.min(totalFrames, frame)));
            }}
          >
            {/* Draw current frame line */}
            <div style={{ position: 'absolute', top: '-4px', left: `${(currentFrame / totalFrames) * 100}%`, width: '10px', height: '14px', background: '#ef4444', borderRadius: '2px', cursor: 'col-resize' }} />
            
            {/* Render saved ranges overlay on timeline */}
            {semanticSegments.map(seg => (
              <div 
                key={seg.id}
                style={{
                  position: 'absolute',
                  left: `${(seg.start / totalFrames) * 100}%`,
                  width: `${((seg.end - seg.start) / totalFrames) * 100}%`,
                  height: '100%',
                  background: seg.color,
                  opacity: 0.4
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Epoch Timestamp in bottom-left */}
            <span style={{ fontSize: '11px', color: '#4b5563' }}>
              {getDynamicTimestamp(currentFrame)}
            </span>

            {/* Playback Buttons */}
            <Space size={16}>
              <Button type="text" icon={<StepBackwardOutlined style={{ color: '#475569' }} />} onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))} />
              <Button 
                type="text" 
                icon={isPlaying ? <PauseOutlined style={{ color: '#2563eb' }} /> : <PlayCircleOutlined style={{ color: '#2563eb' }} />} 
                onClick={() => setIsPlaying(!isPlaying)} 
                style={{ background: '#f4f4f5', borderRadius: '50%', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              />
              <Button type="text" icon={<StepForwardOutlined style={{ color: '#475569' }} />} onClick={() => setCurrentFrame(Math.min(totalFrames, currentFrame + 1))} />
            </Space>

            {/* Right: annotation info and speed */}
            <Space size={16}>
              <span style={{ fontSize: '11px', color: '#4b5563' }}>
                帧数: <strong>{currentFrame}f</strong> / {totalFrames}f
              </span>
              <Select defaultValue={1} size="small" variant="borderless" style={{ width: 60, color: '#475569' }} onChange={setPlaybackSpeed}>
                <Option value={0.5}>0.5x</Option>
                <Option value={1}>1.0x</Option>
                <Option value={2}>2.0x</Option>
              </Select>
              
              <Radio.Group size="small" value={annoType} onChange={(e) => setAnnoType(e.target.value)} buttonStyle="solid">
                <Radio.Button value="框标注">返回其它标注</Radio.Button>
              </Radio.Group>
            </Space>
          </div>
        </div>

        {/* ----------------------------------------------------
            POPUP MODAL: 添加标注 (Construct Sentence template)
            ---------------------------------------------------- */}
        <Modal
          title={<span style={{ fontSize: '14px', fontWeight: 'bold' }}>添加标注</span>}
          open={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
          footer={null}
          width={720}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* 1. 技能 Select row */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '80px', fontWeight: 'bold', fontSize: '12px' }}>技能</span>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { value: 'pick {A} from {B}', label: 'pick {A} from {B}\n从 {B} 捡起 {A}' },
                  { value: 'place {A} on {B}', label: 'place {A} on {B}\n放置 {A} 到 {B}' },
                  { value: 'move {A} to {B}', label: 'move {A} to {B}\n移动 {A} 到 {B}' },
                  { value: '{A} wipe {B}', label: '{A} wipe {B}\n用 {A} 擦拭 {B}' },
                  { value: 'turn {A}', label: 'turn {A}\n转动 {A}' }
                ].map(item => (
                  <div 
                    key={item.value}
                    onClick={() => setSelectedSkill(item.value)}
                    style={{
                      border: selectedSkill === item.value ? '2px solid #22c55e' : '1px solid #d9d9d9',
                      borderRadius: 4,
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      background: selectedSkill === item.value ? '#f0fdf4' : '#fff',
                      whiteSpace: 'pre-line',
                      textAlign: 'center'
                    }}
                  >
                    {item.label}
                  </div>
                ))}
                
                <Select value={selectedSkill} size="small" style={{ width: 120 }} onChange={setSelectedSkill}>
                  <Option value="pick {A} from {B}">{"pick {A} from {B}"}</Option>
                  <Option value="place {A} on {B}">{"place {A} on {B}"}</Option>
                  <Option value="custom">自定义技能</Option>
                </Select>
                <Button size="small" icon={<PlusOutlined />} />
              </div>
            </div>

            {/* 2. 对象 Select row */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '80px', fontWeight: 'bold', fontSize: '12px' }}>对象</span>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { value: 'box', label: 'box\n箱子' },
                  { value: 'Kiwi', label: 'Kiwi\n猕猴桃' },
                  { value: 'Fruit Bowl', label: 'Fruit Bowl\n果盘' },
                  { value: 'book', label: 'book\n书' },
                  { value: 'small pack of beer', label: 'small pack of beer\n小包装啤酒' }
                ].map(item => (
                  <div 
                    key={item.value}
                    onClick={() => setSelectedObject(item.value)}
                    style={{
                      border: selectedObject === item.value ? '2px solid #22c55e' : '1px solid #d9d9d9',
                      borderRadius: 4,
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      background: selectedObject === item.value ? '#f0fdf4' : '#fff',
                      whiteSpace: 'pre-line',
                      textAlign: 'center'
                    }}
                  >
                    {item.label}
                  </div>
                ))}

                <Select value={selectedObject} size="small" style={{ width: 120 }} onChange={setSelectedObject}>
                  {objectDropdownList.map(obj => (
                    <Option key={obj.value} value={obj.value}>{obj.label}</Option>
                  ))}
                </Select>
                <Button size="small" icon={<PlusOutlined />} />
              </div>
            </div>

            {/* 3. 目标 Select row */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '80px', fontWeight: 'bold', fontSize: '12px' }}>目标</span>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { value: 'desktop', label: 'desktop\n桌面' },
                  { value: 'shelves', label: 'shelves\n货架' },
                  { value: 'bookshelf', label: 'bookshelf\n书架' },
                  { value: 'table', label: 'table\n桌子' },
                  { value: 'Fruit Bowl', label: 'Fruit Bowl\n果盘' }
                ].map(item => (
                  <div 
                    key={item.value}
                    onClick={() => setSelectedTarget(item.value)}
                    style={{
                      border: selectedTarget === item.value ? '2px solid #22c55e' : '1px solid #d9d9d9',
                      borderRadius: 4,
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      background: selectedTarget === item.value ? '#f0fdf4' : '#fff',
                      whiteSpace: 'pre-line',
                      textAlign: 'center'
                    }}
                  >
                    {item.label}
                  </div>
                ))}

                <Select value={selectedTarget} size="small" style={{ width: 120 }} onChange={setSelectedTarget}>
                  {targetDropdownList.map(tgt => (
                    <Option key={tgt.value} value={tgt.value}>{tgt.label}</Option>
                  ))}
                </Select>
                <Button size="small" icon={<PlusOutlined />} />
              </div>
            </div>

            {/* 4. 选项 Checkbox row */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '80px', fontWeight: 'bold', fontSize: '12px' }}>选项</span>
              <Checkbox.Group 
                options={['左手', '右手']} 
                value={selectedOptions} 
                onChange={setSelectedOptions} 
              />
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Dynamic sentence compiled preview in green */}
            <div style={{ padding: '12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#52c41a', fontFamily: 'monospace' }}>
                {getCompiledText().en}
              </div>
              <div style={{ fontSize: '14px', color: '#389e0d', marginTop: 4, fontWeight: 'bold' }}>
                {getCompiledText().cn}
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button onClick={() => {
                const customPrompt = prompt('请输入自定义自然语言指令:', getCompiledText().cn);
                if (customPrompt) {
                  const newSeg = {
                    id: Date.now(),
                    start: newRangeStart,
                    end: newRangeEnd,
                    text: customPrompt,
                    enText: 'custom instruction',
                    color: '#fa8c16'
                  };
                  setSemanticSegments([...semanticSegments, newSeg]);
                  setIsAddModalOpen(false);
                  message.success('已存入自定义指令段！');
                }
              }}>
                ✏️ 自定义
              </Button>
              <Button 
                type="primary" 
                style={{ background: '#22c55e', borderColor: '#22c55e', color: '#fff', fontWeight: 'bold' }}
                onClick={handleSaveSemanticSegment}
              >
                ＋ 激活标注
              </Button>
            </div>

          </div>
        </Modal>

      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER METHOD 2: 经典视频标注工作台 (White Theme - Standard Modes)
  // ----------------------------------------------------
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f5f7', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Area */}
      <div style={{ 
        background: '#fff', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '10px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16} align="center" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>
              test_job_{annoType}
            </span>
            <Divider orientation="vertical" style={{ height: 16, borderColor: '#cbd5e1' }} />
            
            {/* Status Badges */}
            <Space size={8}>
              <span style={{ fontSize: 11, color: '#64748b' }}>解析状态</span>
              <Tag color="success" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: 11, margin: 0, padding: '0 8px', borderRadius: 4, fontWeight: 500 }}>解析完成</Tag>
              
              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>质检状态</span>
              <span style={{ border: '1px solid #16a34a', color: '#16a34a', background: '#f0fdf4', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>优秀</span>
            </Space>
          </Space>

          {/* Quick switches */}
          <Space>
            <Space size={4}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>开发说明:</span>
              <Switch 
                checked={showDevNotes} 
                onChange={setShowDevNotes} 
                size="small" 
                checkedChildren="显" 
                unCheckedChildren="隐" 
              />
            </Space>
            <Divider orientation="vertical" style={{ height: 16, margin: 0 }} />
            <Radio.Group size="small" value={annoType} onChange={(e) => setAnnoType(e.target.value)} buttonStyle="solid">
              <Radio.Button value="框标注">框标注</Radio.Button>
              <Radio.Button value="点标注">点标注</Radio.Button>
              <Radio.Button value="范围标注">范围标注</Radio.Button>
              <Radio.Button value="范围&框标注">范围&框</Radio.Button>
              <Radio.Button value="语义标注">语义标注 (Q/R)</Radio.Button>
            </Radio.Group>
            <Divider orientation="vertical" />
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => message.success('工作进度已保存')}>保存暂存</Button>
            <Space size={12}>
              <Button type="text" size="small" icon={<SlidersOutlined />} style={{ color: '#64748b' }} />
              <Button type="text" size="small" icon={<SettingOutlined />} style={{ color: '#64748b' }} />
              <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => router.push(`/annotation/audit/${instanceId}`)} style={{ color: '#64748b' }} />
            </Space>
          </Space>
        </div>

        {/* Metadata */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748b' }}>
          <Space size={20}>
            <span>任务ID: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>8751</strong></span>
            <span>实例ID: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>{instanceId || '11249'}</strong></span>
            <span>数据序号: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>766794</strong></span>
            <span>当前目录: <span style={{ color: '#475569', fontFamily: 'monospace' }}>collect-data/8751_{instanceId || '11249'}/566c5a3e33314c3a97179c853f0efe37</span></span>
          </Space>
        </div>
      </div>

      {/* Main workspace panels */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '12px', gap: 12 }}>
        
        {/* Left column Viewport */}
        <div style={{ flex: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {annoType === '范围标注' ? (
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10 }}>
              {/* Grid 1 */}
              <div style={{ background: '#fafafa', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff', zIndex: 2 }}>
                  <Select value={gridCameras.grid1} size="small" variant="borderless" style={{ width: 220, fontSize: 11, fontWeight: 500 }} onChange={(val) => handleGridCameraChange('grid1', val)}>
                    <Option value="camera_head_left_color">camera_head_left_color_color</Option>
                    <Option value="camera_head_right_color">camera_head_right_color_color</Option>
                    <Option value="camera_hand_left_color">camera_hand_left_color_color</Option>
                    <Option value="camera_hand_right_color">camera_hand_right_color_color</Option>
                    <Option value="joints">joints.json (3D 模型)</Option>
                  </Select>
                  <Button size="small" type="text" icon={<FullscreenOutlined />} />
                </div>
                {renderGridContent(gridCameras.grid1)}
              </div>

              {/* Grid 2 */}
              <div style={{ background: '#fafafa', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff', zIndex: 2 }}>
                  <Select value={gridCameras.grid2} size="small" variant="borderless" style={{ width: 220, fontSize: 11, fontWeight: 500 }} onChange={(val) => handleGridCameraChange('grid2', val)}>
                    <Option value="camera_head_left_color">camera_head_left_color_color</Option>
                    <Option value="camera_head_right_color">camera_head_right_color_color</Option>
                    <Option value="camera_hand_left_color">camera_hand_left_color_color</Option>
                    <Option value="camera_hand_right_color">camera_hand_right_color_color</Option>
                    <Option value="joints">joints.json (3D 模型)</Option>
                  </Select>
                  <Button size="small" type="text" icon={<FullscreenOutlined />} />
                </div>
                {renderGridContent(gridCameras.grid2)}
              </div>

              {/* Grid 3 */}
              <div style={{ background: '#fafafa', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff', zIndex: 2 }}>
                  <Select value={gridCameras.grid3} size="small" variant="borderless" style={{ width: 220, fontSize: 11, fontWeight: 500 }} onChange={(val) => handleGridCameraChange('grid3', val)}>
                    <Option value="camera_head_left_color">camera_head_left_color_color</Option>
                    <Option value="camera_head_right_color">camera_head_right_color_color</Option>
                    <Option value="camera_hand_left_color">camera_hand_left_color_color</Option>
                    <Option value="camera_hand_right_color">camera_hand_right_color_color</Option>
                    <Option value="joints">joints.json (3D 模型)</Option>
                  </Select>
                  <Button size="small" type="text" icon={<FullscreenOutlined />} />
                </div>
                {renderGridContent(gridCameras.grid3)}
              </div>

              {/* Grid 4 */}
              <div style={{ background: '#fafafa', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #cbd5e1', background: '#fff', zIndex: 2 }}>
                  <Space size={4}>
                    <Select value={gridCameras.grid4} size="small" variant="borderless" style={{ width: 100, fontSize: 11, fontWeight: 500 }} onChange={(val) => handleGridCameraChange('grid4', val)}>
                      <Option value="camera_head_left">camera_head_left</Option>
                      <Option value="camera_head_right">camera_head_right</Option>
                      <Option value="camera_hand_left">camera_hand_left</Option>
                      <Option value="camera_hand_right">camera_hand_right</Option>
                      <Option value="joints">joints.json</Option>
                    </Select>
                    {gridCameras.grid4 === 'joints' && <Tag color="cyan" style={{ fontSize: 9, margin: 0 }}>机器人</Tag>}
                  </Space>
                  <Button size="small" type="text" icon={<FullscreenOutlined />} />
                </div>
                {renderGridContent(gridCameras.grid4)}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                <Select value={activeCamera} size="small" variant="borderless" style={{ width: 240, fontSize: 12, fontWeight: 600 }} onChange={setActiveCamera}>
                  <Option value="camera_head_left_color">camera_head_left_color_color (主视角)</Option>
                  <Option value="camera_head_right_color">camera_head_right_color_color</Option>
                  <Option value="camera_hand_left_color">camera_hand_left_color_color</Option>
                  <Option value="camera_hand_right_color">camera_hand_right_color_color</Option>
                </Select>
                <Button size="small" type="text" icon={<FullscreenOutlined />} />
              </div>

              {/* Central canvas viewport */}
              <div 
                onMouseDown={handleViewportMouseDown}
                onMouseMove={handleViewportMouseMove}
                onMouseUp={handleViewportMouseUp}
                onClick={handleViewportClickPoint}
                style={{ 
                  flex: 1, 
                  background: '#09090b', 
                  position: 'relative', 
                  cursor: 'crosshair',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src="/assets/robot_view.png" 
                  alt="Robot Workspace Camera Feed"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                    filter: activeCamera === 'camera_head_left_color' ? 'none' :
                            activeCamera === 'camera_head_right_color' ? 'saturate(0.8) brightness(1.05) hue-rotate(-20deg)' :
                            activeCamera === 'camera_hand_left_color' ? 'hue-rotate(35deg) brightness(0.9)' :
                            'hue-rotate(85deg) saturate(1.1) brightness(0.85)',
                    pointerEvents: 'none'
                  }}
                />

                {annoType === '点标注' && (
                  <div style={{ 
                    position: 'absolute', top: 0, bottom: 0, 
                    left: `${hoverX * 100}%`, width: '1px', 
                    borderLeft: '1px solid rgba(255,255,255,0.4)', zIndex: 2, pointerEvents: 'none' 
                  }} />
                )}

                {isDrawing && annoType.includes('框') && (
                  <div style={{
                    position: 'absolute',
                    border: `2px dashed ${activeHand === 'left' ? '#faad14' : '#52c41a'}`,
                    background: `${activeHand === 'left' ? '#faad14' : '#52c41a'}15`,
                    left: `${Math.min(drawStart.x, drawCurrent.x) * 100}%`,
                    top: `${Math.min(drawStart.y, drawCurrent.y) * 100}%`,
                    width: `${Math.abs(drawCurrent.x - drawStart.x) * 100}%`,
                    height: `${Math.abs(drawCurrent.y - drawStart.y) * 100}%`,
                    pointerEvents: 'none',
                    zIndex: 10
                  }} />
                )}

                {annoType.includes('框') && currentFrameBboxes.map(bbox => {
                  const isYellow = bbox.hand === 'left';
                  const color = isYellow ? '#faad14' : '#52c41a';
                  return (
                    <div 
                      key={bbox.id} 
                      style={{ 
                        position: 'absolute', 
                        top: `${bbox.y1 * 100}%`, 
                        left: `${bbox.x1 * 100}%`, 
                        width: `${(bbox.x2 - bbox.x1) * 100}%`, 
                        height: `${(bbox.y2 - bbox.y1) * 100}%`, 
                        border: `2px solid ${color}`, 
                        background: `${color}15`, 
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: 5
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBbox(bbox.id);
                      }}
                    >
                      <span style={{ position: 'absolute', top: -16, left: -2, background: color, color: '#fff', fontSize: '9px', padding: '0 4px', borderRadius: '2px 2px 0 0', fontWeight: 'bold' }}>
                        {bbox.label}
                      </span>
                    </div>
                  );
                })}

                {annoType === '点标注' && currentFramePoints.map(p => (
                  <div 
                    key={p.id} 
                    style={{ 
                      position: 'absolute', 
                      top: `${p.y * 100}%`, 
                      left: `${p.x * 100}%`, 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      background: p.color, 
                      border: '2px solid #fff', 
                      transform: 'translate(-50%, -50%)', 
                      cursor: 'pointer',
                      zIndex: 6
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePoint(p.id);
                    }}
                  >
                    <span style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '8px', padding: '1px 4px', borderRadius: 3, whiteSpace: 'nowrap' }}>
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column Panels */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 6, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Header tabs */}
          <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', padding: '0 8px' }}>
            {['动作步骤', '区域段管理', 'VLA', '错误帧管理'].map((tab, idx) => (
              <div 
                key={tab}
                onClick={() => setActiveTabKey(String(idx + 1))}
                style={{ 
                  padding: '12px 14px', 
                  fontSize: '12px', 
                  cursor: 'pointer',
                  fontWeight: activeTabKey === String(idx + 1) ? 700 : 500,
                  color: activeTabKey === String(idx + 1) ? '#1677ff' : '#64748b',
                  borderBottom: activeTabKey === String(idx + 1) ? '2px solid #1677ff' : '2px solid transparent'
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
            {activeTabKey === '1' && (
              <div>
                {annoType === '点标注' && (
                  <div style={{ marginBottom: 12, padding: 8, background: '#fafafa', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>点标注配置：</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      {[
                        { color: '#722ed1', label: '手腕' },
                        { color: '#1890ff', label: '接触点' },
                        { color: '#ff4d4f', label: '物体' },
                        { color: '#52c41a', label: '爪部' }
                      ].map(item => (
                        <div 
                          key={item.color} 
                          onClick={() => setPointColor(item.color)}
                          style={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: '50%', 
                            background: item.color, 
                            cursor: 'pointer',
                            border: pointColor === item.color ? '2px solid #000' : '2px solid #fff'
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                )}

                {annoType.includes('框') && (
                  <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                    <Button size="small" block style={{ background: activeHand === 'left' ? '#faad14' : '#fff', color: activeHand === 'left' ? '#fff' : '#64748b' }} onClick={() => setActiveHand('left')}>左手框(黄)</Button>
                    <Button size="small" block style={{ background: activeHand === 'right' ? '#52c41a' : '#fff', color: activeHand === 'right' ? '#fff' : '#64748b' }} onClick={() => setActiveHand('right')}>右手框(绿)</Button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Space>
                    <span style={{ fontSize: 12, color: '#64748b' }}>动作步骤 ({steps.length})</span>
                    {showDevNotes && (
                      <Badge count="交互 ①" style={{ backgroundColor: '#1677ff', fontSize: 9, transform: 'scale(0.8)', margin: 0 }} />
                    )}
                  </Space>
                  <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={handleAddRecordedRange} style={{ fontSize: 10 }}>增加步骤</Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {steps.map((step, idx) => {
                    const isSelected = selectedStepId === step.id;
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => handleStepSelect(step.id)}
                        style={{ 
                          border: isSelected ? '1px solid #1677ff' : '1px solid #e2e8f0', 
                          borderLeft: isSelected ? '5px solid #1677ff' : '1px solid #e2e8f0', 
                          borderRadius: 6, 
                          background: isSelected ? 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)' : '#fafafa',
                          padding: isSelected ? '12px 12px 12px 8px' : '12px',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 4px 12px rgba(22, 119, 255, 0.15)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: isSelected ? 700 : 600, color: isSelected ? '#0958d9' : '#1f2937' }}>
                            {step.id}. {step.text}
                          </span>
                          <Tag color="success">正确</Tag>
                        </div>
                        <Row gutter={8} style={{ fontSize: 11 }} onClick={(e) => e.stopPropagation()}>
                          <Col span={8}>
                            <div>开始帧</div>
                            <Input size="small" value={step.startFrame} onChange={(e) => handleStepFrameChange(idx, 'startFrame', e.target.value)} />
                          </Col>
                          <Col span={8}>
                            <div>结束帧</div>
                            <Input size="small" value={step.endFrame} onChange={(e) => handleStepFrameChange(idx, 'endFrame', e.target.value)} />
                          </Col>
                          <Col span={8}>
                            <div>总共</div>
                            <Input size="small" disabled value={step.total} />
                          </Col>
                        </Row>
                      </div>
                    );
                  })}
                </div>

                {/* 交互开发说明 (Developer Design Notes) */}
                <div style={{ 
                  marginTop: 20, 
                  background: '#f8fafc', 
                  border: '1px dashed #cbd5e1', 
                  borderRadius: 6, 
                  padding: '12px' 
                }}>
                  <div style={{ fontSize: 11, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📖 交互设计开发说明
                  </div>
                  <ul style={{ paddingLeft: 16, margin: 0, fontSize: 10, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <li><strong>选中态增强</strong>: 右侧选中卡片带有蓝色厚边与浅蓝渐变；播放轴对应动作块自动浮起并带有外发光。</li>
                    <li><strong>时序轴双滑块微调</strong>: 选中步骤后，播放条两端生成蓝色垂直微调手柄，支持鼠标/手势按住直接拖动。</li>
                    <li><strong>键盘流支持</strong>: 支持空格播放/暂停，左右键单帧微调，结合 Alt/Shift 键可变速跳转。</li>
                    <li><strong>双向数据绑定</strong>: 修改右侧「开始帧/结束帧」输入框后，底部播放轴滑块坐标实时计算重绘，反之亦然。</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div 
          ref={timelineRef}
          style={{ position: 'relative', height: 20, background: '#e2e8f0', borderRadius: 4, cursor: 'pointer' }}
          onClick={(e) => {
            const rect = timelineRef.current.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            setCurrentFrame(Math.max(0, Math.min(totalFrames, Math.round(pct * totalFrames))));
          }}
        >
          {steps.map(step => {
            const isSelected = selectedStepId === step.id;
            return (
              <div 
                key={step.id} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStepSelect(step.id);
                  setCurrentFrame(step.startFrame);
                }}
                style={{
                  position: 'absolute',
                  left: `${(step.startFrame / totalFrames) * 100}%`,
                  width: `${((step.endFrame - step.startFrame) / totalFrames) * 100}%`,
                  height: isSelected ? '26px' : '100%',
                  top: isSelected ? -3 : 0,
                  background: step.color,
                  opacity: isSelected ? 1 : 0.4,
                  borderRadius: '2px',
                  border: isSelected ? '1.5px solid #1677ff' : 'none',
                  boxShadow: isSelected ? '0 0 10px rgba(22, 119, 255, 0.7)' : 'none',
                  zIndex: isSelected ? 10 : 2,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
              >
                {/* Drag handles for selected step */}
                {isSelected && (
                  <>
                    {showDevNotes && (
                      <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', background: '#1677ff', color: '#fff', fontSize: 8, padding: '1px 4px', borderRadius: 3, whiteSpace: 'nowrap', zIndex: 100, fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        交互 ②
                      </div>
                    )}
                    {/* Left Handle (Start Frame) */}
                    <div 
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingHandle('start');
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setDraggingHandle('start');
                      }}
                      style={{
                        position: 'absolute',
                        left: -4,
                        top: -3,
                        width: 8,
                        height: '26px',
                        background: '#1677ff',
                        border: '1.5px solid #fff',
                        borderRadius: '3px',
                        cursor: 'col-resize',
                        zIndex: 15,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div style={{ width: 1, height: 10, background: '#fff' }} />
                    </div>

                    {/* Right Handle (End Frame) */}
                    <div 
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingHandle('end');
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setDraggingHandle('end');
                      }}
                      style={{
                        position: 'absolute',
                        right: -4,
                        top: -3,
                        width: 8,
                        height: '26px',
                        background: '#1677ff',
                        border: '1.5px solid #fff',
                        borderRadius: '3px',
                        cursor: 'col-resize',
                        zIndex: 15,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div style={{ width: 1, height: 10, background: '#fff' }} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
          <div style={{ position: 'absolute', left: `${(currentFrame / totalFrames) * 100}%`, top: 0, width: 3, height: '100%', background: '#ef4444' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button type="text" icon={<PlayCircleOutlined />} onClick={() => setIsPlaying(!isPlaying)} />
            <span style={{ fontSize: 11 }}>{currentTime}s / {currentFrame}f</span>
          </Space>
          <Space>
            <Button type="primary" size="small" onClick={() => router.push(`/annotation/audit/${instanceId}`)}>完成标注</Button>
          </Space>
        </div>
      </div>

    </div>
  );
}

// Simple dynamic chevron component
function ChevronDown() {
  return (
    <span style={{ display: 'inline-block', transform: 'scale(0.7)', marginLeft: '2px' }}>▼</span>
  );
}

AnnotationAuditWorkspacePage.getLayout = function getLayout(page) {
  return (
    <MainLayout>
      {page}
    </MainLayout>
  );
};
