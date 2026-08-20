'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Button, Tag, Space, Typography, App, Badge, Divider, Select, 
  Input, Row, Col, Progress, Switch, Tooltip, Radio, Card, List, Form, Modal, Checkbox, InputNumber, Slider
} from 'antd';
import { 
  CloseOutlined, CloseCircleOutlined, SearchOutlined, ReloadOutlined, AuditOutlined, EyeOutlined,
  CheckCircleOutlined, CheckCircleFilled, FullscreenOutlined, FullscreenExitOutlined, PlayCircleOutlined, 
  CheckOutlined, InfoCircleOutlined, SelectOutlined, BorderOutlined, AimOutlined, 
  VideoCameraOutlined, LeftOutlined, RightOutlined, PauseOutlined, StepBackwardOutlined, 
  StepForwardOutlined, CaretRightOutlined, CaretLeftOutlined, UndoOutlined, 
  DeleteOutlined, QuestionCircleOutlined, SettingOutlined, CalendarOutlined, 
  ClockCircleOutlined, NodeIndexOutlined, PlusOutlined, EditOutlined, 
  ArrowRightOutlined, CheckSquareOutlined, RocketOutlined, SettingFilled,
  SlidersOutlined, ExclamationCircleOutlined, DoubleLeftOutlined, DoubleRightOutlined,
  CloudUploadOutlined, PlaySquareOutlined, LayoutOutlined, FolderOpenOutlined, 
  SaveOutlined, BulbOutlined, GlobalOutlined, TagOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { AppModal, StatusTag } from '@/components/ui';

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
  const [deviceType, setDeviceType] = useState(null); 

  // 设备类型配置
const DEVICE_TYPES = {
  'galaxy': { name: '银河机器人', annoType: '范围标注' },
  'luming': { name: '鹿鸣机器人', annoType: '语义标注' },
};

useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    const modeFromUrl = searchParams.get('mode');
    if (typeFromUrl) setAnnoType(typeFromUrl);
    if (modeFromUrl) setWorkMode(modeFromUrl);

    // 从 URL 参数获取设备类型
    const deviceFromUrl = searchParams.get('device');
    if (deviceFromUrl) {
      setDeviceType(deviceFromUrl);
      // 只有当 URL 中没有明确指定 type 时，才根据设备类型自动跳转
      if (!typeFromUrl) {
        const deviceConfig = DEVICE_TYPES[deviceFromUrl];
        if (deviceConfig) {
          setAnnoType(deviceConfig.annoType);
        }
      }
    } else {
      // 默认设备为 galaxy
      setDeviceType('galaxy');
    }
  }, [searchParams, instanceId]);

  // Episode list for auto-navigation (mirrors list page data)
  const allEpisodeIds = Array.from({ length: 20 }, (_, i) => ({
    id: 744101 + i,
    annoType: i % 2 === 0 ? '语义标注' : '范围标注',
  }));

  // Complete annotation and auto-navigate to next episode
  const handleCompleteAnnotation = () => {
    const currentIdx = allEpisodeIds.findIndex(ep => String(ep.id) === String(episodeId));
    const nextEp = currentIdx >= 0 ? allEpisodeIds[currentIdx + 1] : null;
    if (nextEp) {
      message.success(`标注完成！自动跳转到下一条数据 #${nextEp.id}...`);
      setTimeout(() => {
        router.push(`/annotation/audit/${instanceId}/${nextEp.id}?type=${encodeURIComponent(nextEp.annoType)}&mode=annotate`);
      }, 600);
    } else {
      message.success('所有数据标注完成！返回列表页');
      setTimeout(() => {
        router.push(`/annotation/audit/${instanceId}?tab=annotated`);
      }, 600);
    }
  };

  // QC Pass action: auto-navigate to next episode or QA detail page
  const handlePassQc = () => {
    const currentIdx = allEpisodeIds.findIndex(ep => String(ep.id) === String(episodeId));
    const nextEp = currentIdx >= 0 ? allEpisodeIds[currentIdx + 1] : null;
    if (nextEp) {
      message.success(`✅ 质检通过！自动跳转到下一条数据 #${nextEp.id}...`);
      setTimeout(() => {
        router.push(`/annotation/audit/${instanceId}/${nextEp.id}?type=${encodeURIComponent(nextEp.annoType)}&mode=audit`);
      }, 600);
    } else {
      message.success('✅ 该数据包全部数据质检完成！返回质检列表');
      setTimeout(() => {
        router.push(`/collection/qa/${instanceId}`);
      }, 600);
    }
  };

  // Audit / QC Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedQuickTag, setSelectedQuickTag] = useState(null);

  // QC / Audit Reject action: pop up modal to get reason, then navigate
  const handleConfirmReject = () => {
    if (!rejectReason && !selectedQuickTag) {
      message.error('请填写或选择审核不通过理由');
      return;
    }
    const finalReason = selectedQuickTag ? `${selectedQuickTag}：${rejectReason || '已打回重新标注'}` : rejectReason;
    setIsRejectModalOpen(false);
    
    const currentIdx = allEpisodeIds.findIndex(ep => String(ep.id) === String(episodeId));
    const nextEp = currentIdx >= 0 ? allEpisodeIds[currentIdx + 1] : null;
    if (nextEp) {
      message.warning(`❌ 审核不通过（理由：${finalReason}），已打回标注员重新标注！跳转到下一条 #${nextEp.id}...`);
      setTimeout(() => {
        router.push(`/annotation/audit/${instanceId}/${nextEp.id}?type=${encodeURIComponent(nextEp.annoType)}&mode=audit`);
      }, 600);
    } else {
      message.warning(`❌ 审核不通过（理由：${finalReason}），已打回标注员重新标注！返回审核列表`);
      setTimeout(() => {
        router.push(`/annotation/review-list?instanceId=${instanceId}`);
      }, 600);
    }
  };

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(30);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenCamera, setFullscreenCamera] = useState('camera_head_left_color');
  const totalFrames = 1200; 



  // Playback timer simulation
  useEffect(() => {
    let intervalId;
    if (isPlaying) {
      const intervalMs = 33 / playbackSpeed; // ~30 fps simulation
      intervalId = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= totalFrames) {
            setIsPlaying(false);
            return totalFrames;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, playbackSpeed, totalFrames]);

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
  const [selectedStepId, setSelectedStepId] = useState(null); 
  const [steps, setSteps] = useState([
    { id: 1, text: '右手从置物架抓取药品到药房工作台', startFrame: 0, endFrame: 300, total: 300, status: 'success', color: '#13c2c2' },
    { id: 2, text: '右手从置物架侧医疗废弃物垃圾桶到医疗废弃物垃圾棚', startFrame: 301, endFrame: 600, total: 300, status: 'success', color: '#722ed1' },
    { id: 3, text: '双手从台面上方放置托盘到桌子', startFrame: 601, endFrame: 900, total: 300, status: 'success', color: '#1890ff' },
    { id: 4, text: '双手从桌子拿起托盘到台面上方', startFrame: 901, endFrame: 1200, total: 300, status: 'success', color: '#52c41a' }
  ]);
  const [controllerQuality, setControllerQuality] = useState('success');
  const [activeTabKey, setActiveTabKey] = useState('1');
  const timelineRef = useRef(null);
  const semanticTimelineRef = useRef(null);

  // Red Line Playhead State (Decoupled from video playback, independently draggable with mouse)
  const [redLineFrame, setRedLineFrame] = useState(180);
  const isDraggingRedLineRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingRedLineRef.current && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        const frame = Math.max(0, Math.min(totalFrames, Math.round(pct * totalFrames)));
        setRedLineFrame(frame);
        setCurrentFrame(frame);
      }
    };
    const handleMouseUp = () => {
      if (isDraggingRedLineRef.current) {
        isDraggingRedLineRef.current = false;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [totalFrames]);
  const [draggingHandle, setDraggingHandle] = useState(null);
  const [draggingSegmentId, setDraggingSegmentId] = useState(null);
  const [showDevNotes, setShowDevNotes] = useState(false);

  // Use a single ref object for drag state - updated synchronously to avoid stale closures
  const dragStateRef = useRef({
    handle: null,
    segmentId: null,
    selectedStepId: null,
    timelineRect: null
  });

  // Keep dragStateRef in sync with state
  useEffect(() => {
    dragStateRef.current.handle = draggingHandle;
  }, [draggingHandle]);

  useEffect(() => {
    dragStateRef.current.segmentId = draggingSegmentId;
  }, [draggingSegmentId]);

  useEffect(() => {
    dragStateRef.current.selectedStepId = selectedStepId;
  }, [selectedStepId]);

  // Refs for synchronous access in mousemove handlers
  const draggingHandleRef = useRef(null);
  const draggingSegmentIdRef = useRef(null);
  const selectedStepIdRef = useRef(selectedStepId);

  useEffect(() => {
    selectedStepIdRef.current = selectedStepId;
  }, [selectedStepId]);

  // Synchronously set refs + state together so mousemove reads correct values immediately
  const startDrag = (segId, handle) => {
    draggingHandleRef.current = handle;
    draggingSegmentIdRef.current = segId;
    setDraggingHandle(handle);
    setDraggingSegmentId(segId);
  };

  // 4. Grid Cameras active switches mapping (Used for both Range mode and Semantic 2x2 mode)
  const [gridCameras, setGridCameras] = useState({
    grid1: 'camera_head_left_color',
    grid2: 'camera_head_right_color',
    grid3: 'camera_hand_left_color',
    grid4: 'joints'
  });

  // ============ 标注模版生成与套用状态 ============
  const [isSaveTplModalOpen, setIsSaveTplModalOpen] = useState(false);
  const [isApplyTplModalOpen, setIsApplyTplModalOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [savedTemplates, setSavedTemplates] = useState([]);

  // 加载已保存标注模版
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('embodied_anno_templates');
      if (saved) {
        try {
          setSavedTemplates(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        const defaultAnnoTemplates = [
          {
            id: 'tpl_default_1',
            name: '🍽️ 餐厅餐盘整理标准标注模版',
            desc: '覆盖完整的双臂就餐收拾工序，包括托盘抓取、餐盘理顺、餐叉摆放，适配鹿鸣双臂机器人。',
            stepCount: 9,
            creator: '系统内置',
            createTime: '2026-07-12 10:15:30',
            steps: [
              { text: '右手从置物架抓取托盘并放置在餐桌上', startFrame: 0, endFrame: 15 },
              { text: '左手拿起杯子平稳放置到托盘边缘', startFrame: 15, endFrame: 30 },
              { text: '右手从餐桌抓取待收碗盘并叠放', startFrame: 30, endFrame: 45 },
              { text: '双手端起装载碗盘的托盘至工作区', startFrame: 45, endFrame: 60 },
              { text: '右手取消毒布快速擦拭餐桌残留油渍', startFrame: 60, endFrame: 75 },
              { text: '右手放置餐盘到清洗机架格内', startFrame: 75, endFrame: 90 },
              { text: '右手拿起备用刀叉整理归置', startFrame: 90, endFrame: 100 },
              { text: '左手协助校正主干刀叉位置', startFrame: 100, endFrame: 110 },
              { text: '双手清洁理顺并退回初始安全点', startFrame: 110, endFrame: 120 }
            ]
          },
          {
            id: 'tpl_default_2',
            name: '📦 工业打包贴标标准标注模版',
            desc: '标准的6工步纸箱开箱封底及贴标工段步骤，适配Galbot真机采集数据。',
            stepCount: 6,
            creator: '系统内置',
            createTime: '2026-07-14 16:40:00',
            steps: [
              { text: '双手抓取纸箱并开箱定位', startFrame: 0, endFrame: 20 },
              { text: '右手取底部泡沫垫并放入纸箱', startFrame: 20, endFrame: 40 },
              { text: '右手抓取核心金属支架入箱', startFrame: 40, endFrame: 65 },
              { text: '左手取顶部泡沫垫覆盖定位', startFrame: 65, endFrame: 80 },
              { text: '双手折叠两侧箱盖合拢', startFrame: 80, endFrame: 100 },
              { text: '双手持胶带机封口封箱', startFrame: 100, endFrame: 120 }
            ]
          }
        ];
        setSavedTemplates(defaultAnnoTemplates);
        localStorage.setItem('embodied_anno_templates', JSON.stringify(defaultAnnoTemplates));
      }
    }
  }, [isApplyTplModalOpen, isSaveTplModalOpen]);

  // 弹出保存模版 Modal
  const openSaveTplModal = () => {
    const defaultName = `${annoType}模版_${new Date().toLocaleDateString().replace(/\//g, '')}_${Math.floor(100 + Math.random() * 900)}`;
    setTplName(defaultName);
    setTplDesc(`包含 ${steps.length} 个动作步骤，覆盖 ${steps.length > 0 ? steps[steps.length - 1].endFrame : 0} 帧区间`);
    setIsSaveTplModalOpen(true);
  };

  // 确认保存模版
  const handleSaveTemplate = () => {
    if (!tplName.trim()) {
      message.warning('请输入模版名称');
      return;
    }
    const newTpl = {
      id: `tpl_${Date.now()}`,
      name: tplName,
      desc: tplDesc,
      steps: steps.map(s => ({ text: s.text, startFrame: s.startFrame, endFrame: s.endFrame })),
      stepCount: steps.length,
      creator: '当前用户',
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    const updated = [newTpl, ...savedTemplates];
    setSavedTemplates(updated);
    localStorage.setItem('embodied_anno_templates', JSON.stringify(updated));
    setIsSaveTplModalOpen(false);
    message.success(`标注模版「${tplName}」生成并保存成功！可在任务模版或批量标注中查看`);
  };

  // 确认套用模版
  const handleApplyTemplate = (tpl) => {
    if (!tpl || !tpl.steps || tpl.steps.length === 0) return;
    
    const colors = ['#13c2c2', '#722ed1', '#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#eb2f96'];
    const mapped = tpl.steps.map((step, idx) => ({
      id: idx + 1,
      text: step.text,
      startFrame: step.startFrame,
      endFrame: step.endFrame,
      total: step.endFrame - step.startFrame,
      status: 'success',
      color: colors[idx % colors.length]
    }));

    setSteps(mapped);
    if (mapped.length > 0) {
      setSelectedStepId(mapped[0].id);
    }
    setIsApplyTplModalOpen(false);
    message.success(`已成功批量套用模版「${tpl.name}」的动作步骤及帧数范围！请进一步核对校验动作帧数。`);
  };

  // 自然语言描述模式状态与同步
  const [annotationInputMode, setAnnotationInputMode] = useState('structured'); // 'structured' 或 'natural'
  const [customNaturalText, setCustomNaturalText] = useState('');
  const [customNaturalTextEn, setCustomNaturalTextEn] = useState('');
  const [selectedRefStepId, setSelectedRefStepId] = useState(null);
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  // 5. Semantic Temporal Annotation specific states
  const [newRangeStart, setNewRangeStart] = useState(30);
  const [newRangeEnd, setNewRangeEnd] = useState(30);
  const [isRecording, setIsRecording] = useState(false);
  const [semanticSegments, setSemanticSegments] = useState([
    { id: 1, start: 0, end: 15, text: '从 桌面 捡起 箱子', enText: 'pick box from desktop', color: '#13c2c2' },
    { id: 2, start: 15, end: 30, text: '从 桌面 捡起 猕猴桃', enText: 'pick Kiwi from desktop', color: '#722ed1' }
  ]);
  const [selectedSegmentId, setSelectedSegmentId] = useState(null);

  // Modal State for Add Annotation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [semanticActiveTab, setSemanticActiveTab] = useState('标注');

  // Structured Template Builder States
  const [selectedSkill, setSelectedSkill] = useState('pick {A} from {B}');
  const [selectedObject, setSelectedObject] = useState('box');
  const [selectedTarget, setSelectedTarget] = useState('desktop');
  const [selectedOptions, setSelectedOptions] = useState(['右手']);

  // Predefined lists as component states for dynamic expansion
  const [skillOptions, setSkillOptions] = useState([
    { value: 'pick {A} from {B}', label: 'pick {A} from {B}\n从 {B} 捡起 {A}' },
    { value: 'place {A} on {B}', label: 'place {A} on {B}\n放置 {A} 到 {B}' },
    { value: 'move {A} to {B}', label: 'move {A} to {B}\n移动 {A} 到 {B}' },
    { value: '{A} wipe {B}', label: '{A} wipe {B}\n用 {A} 擦拭 {B}' },
    { value: 'turn {A}', label: 'turn {A}\n转动 {A}' }
  ]);

  const [objectOptions, setObjectOptions] = useState([
    { value: 'box', label: 'box\n箱子' },
    { value: 'Kiwi', label: 'Kiwi\n猕猴桃' },
    { value: 'Fruit Bowl', label: 'Fruit Bowl\n果盘' },
    { value: 'book', label: 'book\n书' },
    { value: 'small pack of beer', label: 'small pack of beer\n小包装啤酒' }
  ]);

  const [objectDropdownList, setObjectDropdownList] = useState([
    { label: '彩色杯子', value: 'colored cup' },
    { label: 'Brush (刷子)', value: 'Brush' },
    { label: 'Colored spoons (彩色勺子)', value: 'Colored spoons' },
    { label: 'Eraser (橡皮)', value: 'Eraser' },
    { label: 'Green Kumquat (黄桔子)', value: 'Green Kumquat' },
    { label: 'Strawberry (草莓)', value: 'Strawberry' },
    { label: 'Cheerilee (车厘子)', value: 'Cheerilee' },
    { label: 'Fig (无花果)', value: 'Fig' }
  ]);

  const [targetOptions, setTargetOptions] = useState([
    { value: 'desktop', label: 'desktop\n桌面' },
    { value: 'shelves', label: 'shelves\n货架' },
    { value: 'bookshelf', label: 'bookshelf\n书架' },
    { value: 'table', label: 'table\n桌子' },
    { value: 'Fruit Bowl', label: 'Fruit Bowl\n果盘' }
  ]);

  const [skillDropdownList, setSkillDropdownList] = useState([
    { label: 'open {A} (打开)', value: 'open {A}' },
    { label: 'close {A} (关闭)', value: 'close {A}' },
    { label: 'insert {A} into {B} (插入)', value: 'insert {A} into {B}' },
    { label: 'press {A} (按下)', value: 'press {A}' },
    { label: 'pull {A} (拉出)', value: 'pull {A}' }
  ]);

  const [targetDropdownList, setTargetDropdownList] = useState([
    { label: 'sink (水槽)', value: 'sink' },
    { label: 'drawer (抽屉)', value: 'drawer' },
    { label: 'cabinet (柜子)', value: 'cabinet' },
    { label: 'trash can (垃圾桶)', value: 'trash can' },
    { label: 'floor (地面)', value: 'floor' }
  ]);

  // Click handlers for adding custom values to dropdowns
  const handleAddSkill = () => {
    Modal.confirm({
      title: '添加自定义技能',
      icon: <PlusOutlined style={{ color: '#22c55e' }} />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4, fontWeight: 'bold' }}>英文技能模板 (如: pick {'{A}'} from {'{B}'})</div>
            <Input id="newSkillEn" placeholder="英文，可包含占位符" />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4, fontWeight: 'bold' }}>中文含义 (如: 从 {'{B}'} 捡起 {'{A}'})</div>
            <Input id="newSkillCn" placeholder="中文含义，可包含占位符" />
          </div>
        </div>
      ),
      okText: '添加并选中',
      cancelText: '取消',
      onOk: () => {
        const en = document.getElementById('newSkillEn')?.value;
        const cn = document.getElementById('newSkillCn')?.value;
        if (!en) {
          message.error('英文模板不能为空');
          return Promise.reject();
        }
        const newValue = en;
        const newLabel = cn ? `${en} (${cn})` : en;
        setSkillDropdownList(prev => [...prev, { label: newLabel, value: newValue }]);
        setSelectedSkill(newValue);
        message.success(`成功添加并自动选中新技能: ${newValue}`);
      }
    });
  };

  const handleAddObject = () => {
    Modal.confirm({
      title: '添加自定义对象',
      icon: <PlusOutlined style={{ color: '#22c55e' }} />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4, fontWeight: 'bold' }}>英文名称 (如: Apple)</div>
            <Input id="newObjEn" placeholder="英文名" />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4, fontWeight: 'bold' }}>中文翻译 (如: 苹果)</div>
            <Input id="newObjCn" placeholder="中文名" />
          </div>
        </div>
      ),
      okText: '添加并选中',
      cancelText: '取消',
      onOk: () => {
        const en = document.getElementById('newObjEn')?.value;
        const cn = document.getElementById('newObjCn')?.value;
        if (!en) {
          message.error('英文名称不能为空');
          return Promise.reject();
        }
        const newValue = en;
        setObjectDropdownList(prev => [...prev, { label: cn ? `${cn} (${en})` : en, value: newValue }]);
        setSelectedObject(newValue);
        message.success(`成功添加并自动选中新对象: ${newValue}`);
      }
    });
  };

  const handleAddTarget = () => {
    Modal.confirm({
      title: '添加自定义目标位置',
      icon: <PlusOutlined style={{ color: '#22c55e' }} />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4, fontWeight: 'bold' }}>英文名称 (如: cabinet)</div>
            <Input id="newTgtEn" placeholder="英文名" />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4, fontWeight: 'bold' }}>中文翻译 (如: 柜子)</div>
            <Input id="newTgtCn" placeholder="中文名" />
          </div>
        </div>
      ),
      okText: '添加并选中',
      cancelText: '取消',
      onOk: () => {
        const en = document.getElementById('newTgtEn')?.value;
        const cn = document.getElementById('newTgtCn')?.value;
        if (!en) {
          message.error('英文名称不能为空');
          return Promise.reject();
        }
        const newValue = en;
        setTargetDropdownList(prev => [...prev, { label: cn ? `${cn} (${en})` : en, value: newValue }]);
        setSelectedTarget(newValue);
        message.success(`成功添加并自动选中新目标: ${newValue}`);
      }
    });
  };

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

  useEffect(() => {
    if (isAddModalOpen) {
      const { cn, en } = getCompiledText();
      setCustomNaturalText(cn);
      setCustomNaturalTextEn(en);
      setAnnotationInputMode('structured');
      setSelectedRefStepId(null);
      setShowCustomInputs(false);
    }
  }, [isAddModalOpen]);

  // Direct Start Action (Set Start Frame of active step & start video playback)
  const handleStartAction = (frameVal) => {
    if (selectedStepId === null) {
      message.warning('请先在下方列表中选中某一个动作步骤！');
      return;
    }
    const startVal = frameVal !== undefined ? frameVal : currentFrame;
    setSteps(prev => prev.map(s => {
      if (s.id === selectedStepId) {
        const newEnd = startVal >= s.endFrame ? Math.min(totalFrames, startVal + 20) : s.endFrame;
        return {
          ...s,
          startFrame: startVal,
          endFrame: newEnd,
          total: Math.max(0, newEnd - startVal)
        };
      }
      return s;
    }));

    // Auto play video
    setIsPlaying(true);
    setIsRecording(true);

    const activeStep = steps.find(s => s.id === selectedStepId);
    message.success(`🚩 已锁定步骤「${activeStep?.text || ''}」起始帧为 ${startVal} 帧，视频开始播放▶️`);
  };

  // Direct Stop/Annotate Action (Set End Frame of active step & pause video playback)
  const handleStopAction = (frameVal) => {
    if (selectedStepId === null) {
      message.warning('请先在下方列表中选中某一个动作步骤！');
      return;
    }
    const endVal = frameVal !== undefined ? frameVal : currentFrame;

    // Auto pause video
    setIsPlaying(false);
    setIsRecording(false);

    setSteps(prev => prev.map(s => {
      if (s.id === selectedStepId) {
        const newStart = endVal <= s.startFrame ? Math.max(0, endVal - 15) : s.startFrame;
        return {
          ...s,
          startFrame: newStart,
          endFrame: endVal,
          total: Math.max(0, endVal - newStart)
        };
      }
      return s;
    }));

    const activeStep = steps.find(s => s.id === selectedStepId);
    message.success(`✅ 视频已暂停⏸️！已锁定步骤「${activeStep?.text || ''}」结束帧为 ${endVal} 帧`);
  };

  const handleStepTextChange = (id, newText) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, text: newText } : s));
  };

  const handleImportActionTemplate = (tplKey) => {
    const templatesMap = {
      act_1: [
        { text: '双手开箱并放置底泡沫垫', startFrame: 0, endFrame: 300 },
        { text: '右手取零部件放入纸箱', startFrame: 301, endFrame: 600 },
        { text: '左手取顶泡沫垫覆盖定位', startFrame: 601, endFrame: 900 },
        { text: '双手折叠两侧箱盖并封箱', startFrame: 901, endFrame: 1200 }
      ],
      act_2: [
        { text: '右手识别定位目标书籍', startFrame: 0, endFrame: 300 },
        { text: '右手避障靠近目标书籍', startFrame: 301, endFrame: 600 },
        { text: '右手牢固抓取目标书籍', startFrame: 601, endFrame: 900 },
        { text: '右手平稳放置在目标桌面上', startFrame: 901, endFrame: 1200 }
      ],
      act_3: [
        { text: '双手识别并定位餐盘位置', startFrame: 0, endFrame: 300 },
        { text: '双手避障靠近餐盘两端', startFrame: 301, endFrame: 600 },
        { text: '双手牢固夹紧并抬起餐盘', startFrame: 601, endFrame: 900 },
        { text: '双手平稳移动至指定收拾区', startFrame: 901, endFrame: 1200 }
      ]
    };
    const templateSteps = templatesMap[tplKey] || templatesMap.act_2;
    const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#eb2f96', '#722ed1', '#13c2c2'];
    const newSteps = templateSteps.map((st, idx) => ({
      id: idx + 1,
      text: st.text,
      startFrame: st.startFrame,
      endFrame: st.endFrame,
      total: st.endFrame - st.startFrame,
      status: 'success',
      color: colors[idx % colors.length]
    }));
    setSteps(newSteps);
    setSelectedStepId(1);
    message.success('已成功从动作模版套用步骤及默认帧区间！可直接在线修改描述文字');
  };

  const handleSaveSemanticSegment = () => {
    let formattedText = '';
    let formattedEn = '';

    if (annotationInputMode === 'natural') {
      if (!customNaturalText.trim()) {
        message.warning('请输入自然语言描述内容');
        return;
      }
      formattedText = customNaturalText.trim();
      formattedEn = customNaturalTextEn.trim() || 'custom instruction';
    } else {
      const { en, cn } = getCompiledText();
      formattedText = `${cn} (${selectedOptions.join('/')})`;
      formattedEn = `${en} (${selectedOptions.join('/')})`;
    }

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

    // Reset inputs
    setCustomNaturalText('');
    setCustomNaturalTextEn('');
    setAnnotationInputMode('structured');

    // Pre-populate next range start at current end
    setNewRangeStart(newRangeEnd);
    setNewRangeEnd(Math.min(totalFrames, newRangeEnd + 20));
  };

  // Keyboard Event Listener for Pipeline Annotation (Q / R / W / Space / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If typing in input or textarea, don't trigger global hotkeys
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        handleStartAction(currentFrame);
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleStopAction(currentFrame);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        message.success('标注数据已保存到服务器！');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentFrame, selectedStepId, steps]);

  const handleGridCameraChange = (gridKey, value) => {
    setGridCameras(prev => ({ ...prev, [gridKey]: value }));
    message.info(`视角已切换为 ${value}`);
  };

  const [activeCamera, setActiveCamera] = useState('camera_head_left_color');

  // Timeline dragging effect - useEffect handles adding/removing global listeners
  useEffect(() => {
    // Always add listeners when component mounts
    const handleMouseMove = (e) => {
      // Check if we're actually dragging
      const currentHandle = draggingHandleRef.current;
      const currentSegmentId = draggingSegmentIdRef.current;
      if (!currentHandle && !currentSegmentId) return;

      // Determine timeline rect from active timelineRef or fallback
      const rect = (timelineRef.current || semanticTimelineRef.current)?.getBoundingClientRect();
      if (!rect) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const pct = (clientX - rect.left) / rect.width;
      let frame = Math.round(pct * totalFrames);
      frame = Math.max(0, Math.min(totalFrames, frame));

      // Update steps array (rendered on timelineRef) for both 范围标注 and 语义标注
      const targetId = currentSegmentId || selectedStepIdRef.current;
      if (targetId) {
        setSteps(prevSteps => prevSteps.map(step => {
          if (step.id !== targetId) return step;
          const updated = { ...step };
          if (currentHandle === 'start') {
            updated.startFrame = Math.max(0, Math.min(frame, step.endFrame - 1));
          } else if (currentHandle === 'end') {
            updated.endFrame = Math.max(step.startFrame + 1, Math.min(totalFrames, frame));
          } else if (currentHandle === 'move') {
            const len = step.endFrame - step.startFrame;
            const newStart = Math.max(0, Math.min(frame, totalFrames - len));
            updated.startFrame = newStart;
            updated.endFrame = newStart + len;
          }
          updated.total = updated.endFrame - updated.startFrame;
          return updated;
        }));
      }
    };

    const handleMouseUp = () => {
      draggingHandleRef.current = null;
      draggingSegmentIdRef.current = null;
      setDraggingHandle(null);
      setDraggingSegmentId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [totalFrames, annoType]);

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
      setRedLineFrame(activeStep.startFrame);
      message.info(`已切换至步骤 ${id} (对齐首帧 ${activeStep.startFrame}f)`);
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
        
        {/* Video OSD Time HUD Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6,
          padding: '4px 10px',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          pointerEvents: 'none'
        }}>
          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
            ⏱️ 00:00:{String(Math.floor(currentFrame * 0.0333)).padStart(2, '0')}.{String(Math.floor((currentFrame * 33.33) % 1000)).padStart(3, '0')}s
          </span>
          <span style={{ color: '#64748b' }}>|</span>
          <span style={{ color: '#facc15' }}>30 FPS</span>
          <span style={{ color: '#64748b' }}>|</span>
          <span style={{ color: '#f43f5e' }}>{currentFrame} / {totalFrames} 帧</span>
        </div>

        {/* Absolute Epoch Timestamp Overlay */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 10,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          borderRadius: 4,
          padding: '2px 8px',
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontSize: '10px',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          📅 {getDynamicTimestamp(currentFrame)}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // RENDER METHOD 1: 语义时序标注工作台 (Left Control, Right 2x2 Grid)
  // ----------------------------------------------------
  if (false && annoType === '语义标注') {
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
            <CloseOutlined style={{ color: '#64748b', cursor: 'pointer' }} onClick={() => router.push(`/annotation/audit/${instanceId}`)} />
          </Space>
        </div>

        {/* Workspace Body (Left 2x2 Grid, Right Control) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT COLUMN: Single Video Viewport (Semantic Video) */}
          <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', zIndex: 2 }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <VideoCameraOutlined style={{ color: '#1677ff' }} />
                  /rgb/dicolor/image_raw/compressed (主视角相机视频)
                </span>
                <Tag color="blue" variant="filled" style={{ margin: 0, fontSize: '11px' }}>主视角相机</Tag>
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {renderGridContent('camera_head_left_color')}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Control Panel (White Theme) */}
          <div style={{ width: '320px', background: '#f4f4f5', borderLeft: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column', color: '#18181b' }}>
            
            {/* Sidebar Tab headers */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e4e4e7', background: '#fff' }}>
              {['标注', '标签', '统计'].map((tab) => {
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

                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563', marginBottom: 6 }}>帧区间设定 (直接记录不弹框)：</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <Button
                      type="primary"
                      style={{ flex: 1, fontSize: '11px', height: 32, background: '#2563eb', borderColor: '#2563eb', fontWeight: 'bold' }}
                      onClick={() => handleStartAction(currentFrame)}
                    >
                      开始 [Q]
                    </Button>

                    <Button
                      type="primary"
                      style={{ flex: 1, fontSize: '11px', height: 32, fontWeight: 'bold', background: '#fa8c16', borderColor: '#fa8c16' }}
                      onClick={() => handleStopAction(currentFrame)}
                    >
                      标注 [W/R]
                    </Button>
                  </div>

                  {/* User Guide Banner */}
                  <div style={{ 
                    padding: '8px 10px', 
                    background: '#f8fafc', 
                    borderRadius: 6, 
                    border: '1px dashed #cbd5e1', 
                    fontSize: '11px', 
                    color: '#64748b', 
                    marginBottom: 16,
                    lineHeight: '1.5'
                  }}>
                    💡 <strong>零弹框操作流</strong>：<br />
                    1. 点击右侧某个步骤设为当前选中态。<br />
                    2. 按 <strong>Q</strong> 或点击“开始”设置起始帧，按 <strong>W/R</strong> 或点击“标注”设置结束帧。<br />
                    3. 在底部播放轴按住手柄自由拖拽微调帧区间。
                  </div>

                  {/* List of segment blocks in sidebar */}
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>已标注区间 ({semanticSegments.length})</span>
                    <span style={{ fontSize: 9, color: '#9ca3af' }}>点击定位</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {semanticSegments.map(seg => (
                      <div
                        key={seg.id}
                        onClick={() => setSelectedSegmentId(seg.id)}
                        style={{
                          background: selectedSegmentId === seg.id ? 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)' : '#fafafa',
                          border: selectedSegmentId === seg.id ? '1px solid #1677ff' : '1px solid #e2e8f0',
                          borderLeft: selectedSegmentId === seg.id ? '5px solid #1677ff' : '1px solid #e2e8f0',
                          borderRadius: 6,
                          padding: selectedSegmentId === seg.id ? '12px 12px 12px 8px' : '12px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          boxShadow: selectedSegmentId === seg.id ? '0 4px 12px rgba(22, 119, 255, 0.15)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1f2937', fontWeight: 'bold', marginBottom: selectedSegmentId === seg.id ? 6 : 4 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }} title={seg.text}>
                            {seg.text}
                          </span>
                          <DeleteOutlined
                            style={{ color: '#ef4444', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSemanticSegments(semanticSegments.filter(x => x.id !== seg.id));
                              if (selectedSegmentId === seg.id) setSelectedSegmentId(null);
                            }}
                          />
                        </div>
                        {selectedSegmentId === seg.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <InputNumber
                              size="small"
                              style={{ width: 80, fontSize: 10 }}
                              value={seg.start}
                              min={0}
                              max={seg.end - 1}
                              onChange={(val) => {
                                const cleanVal = val === null ? 0 : val;
                                setSemanticSegments(semanticSegments.map(s => s.id === seg.id ? { ...s, start: Math.max(0, Math.min(cleanVal, seg.end - 1)) } : s));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              prefix="起:"
                            />
                            <InputNumber
                              size="small"
                              style={{ width: 80, fontSize: 10 }}
                              value={seg.end}
                              min={seg.start + 1}
                              max={totalFrames}
                              onChange={(val) => {
                                const cleanVal = val === null ? 0 : val;
                                setSemanticSegments(semanticSegments.map(s => s.id === seg.id ? { ...s, end: Math.min(totalFrames, Math.max(cleanVal, seg.start + 1)) } : s));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              prefix="止:"
                            />
                            <Button
                              size="small"
                              type="link"
                              style={{ fontSize: 9, padding: 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentFrame(seg.start);
                              }}
                            >
                              跳转
                            </Button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: 10 }}>
                            <span>区间: {seg.start} - {seg.end}f</span>
                            <span style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); setCurrentFrame(seg.start); }}>跳转定位</span>
                          </div>
                        )}
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
                    <li><strong>录制控制优化</strong>: 原“结束”按钮变更为“标记 [R]”呼出标注配置弹框，并增加绿色“💾 保存”按钮本地暂存标注修改。</li>
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
            ref={semanticTimelineRef}
            style={{ height: '24px', background: '#e4e4e7', borderRadius: '4px', position: 'relative', cursor: 'pointer', overflow: 'visible' }}
            onClick={(e) => {
              const rect = semanticTimelineRef.current?.getBoundingClientRect();
              if (!rect) return;
              const pct = (e.clientX - rect.left) / rect.width;
              let frame = Math.round(pct * totalFrames);
              setCurrentFrame(Math.max(0, Math.min(totalFrames, frame)));
            }}
          >
            {/* Draw current frame line */}
            <div style={{ position: 'absolute', top: '-4px', left: `${(currentFrame / totalFrames) * 100}%`, width: '2px', height: '32px', background: '#ef4444', borderRadius: '1px', zIndex: 30, pointerEvents: 'none' }} />
            
            {/* Draw active recording range */}
            {isRecording && (
              <div
                style={{
                  position: 'absolute',
                  left: `${(Math.min(newRangeStart, currentFrame) / totalFrames) * 100}%`,
                  width: `${(Math.abs(currentFrame - newRangeStart) / totalFrames) * 100}%`,
                  height: '100%',
                  top: 0,
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1.5px dashed #ef4444',
                  borderRadius: 2,
                  zIndex: 5,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulseOpacity 1.5s infinite ease-in-out'
                }}
              >
                <span style={{ fontSize: '8px', color: '#dc2626', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#dc2626', display: 'inline-block' }} />
                  录制中 {Math.min(newRangeStart, currentFrame)}-{Math.max(newRangeStart, currentFrame)}f
                </span>
              </div>
            )}

            {/* Draw pending unsaved segment range */}
            {!isRecording && isAddModalOpen && (
              <div
                style={{
                  position: 'absolute',
                  left: `${(Math.min(newRangeStart, newRangeEnd) / totalFrames) * 100}%`,
                  width: `${(Math.abs(newRangeEnd - newRangeStart) / totalFrames) * 100}%`,
                  height: '100%',
                  top: 0,
                  background: 'rgba(250, 140, 22, 0.25)',
                  border: '1.5px dashed #fa8c16',
                  borderRadius: 2,
                  zIndex: 6,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '8px', color: '#ea580c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#fa8c16', display: 'inline-block' }} />
                  待保存 {Math.min(newRangeStart, newRangeEnd)}-{Math.max(newRangeStart, newRangeEnd)}f
                </span>
              </div>
            )}

            {/* Render saved ranges overlay on timeline */}
            {semanticSegments.map(seg => {
              const isSelected = selectedSegmentId === seg.id;
              return (
              <div
                key={seg.id}
                style={{
                  position: 'absolute',
                  left: `${(seg.start / totalFrames) * 100}%`,
                  width: `${((seg.end - seg.start) / totalFrames) * 100}%`,
                  height: isSelected ? '30px' : '100%',
                  top: isSelected ? -3 : 0,
                  background: isSelected ? `linear-gradient(180deg, ${seg.color}ee, ${seg.color}cc)` : seg.color,
                  opacity: isSelected ? 1 : 0.4,
                  cursor: isSelected ? 'move' : 'pointer',
                  borderRadius: isSelected ? 4 : 2,
                  border: isSelected ? '2px solid #0ea5e9' : 'none',
                  boxShadow: isSelected ? '0 0 0 3px rgba(14, 165, 233, 0.3), 0 0 16px rgba(14, 165, 233, 0.4)' : 'none',
                  zIndex: isSelected ? 10 : 2,
                  transition: 'all 0.15s ease',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSegmentId(seg.id);
                  setCurrentFrame(seg.start);
                }}
                onMouseDown={(e) => {
                  if (!isSelected) return;
                  e.stopPropagation();
                  startDrag(seg.id, 'move');
                }}
              >
                {/* Left Handle for Start Frame */}
                {isSelected && (
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startDrag(seg.id, 'start');
                    }}
                    style={{
                      position: 'absolute',
                      left: -8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 12,
                      height: 26,
                      background: '#fff',
                      border: '2px solid #0ea5e9',
                      borderRadius: 5,
                      cursor: 'col-resize',
                      zIndex: 15,
                      boxShadow: '0 2px 8px rgba(14, 165, 233, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Grip lines */}
                    <div style={{ display: 'flex', gap: 2 }}>
                      <div style={{ width: 1.5, height: 14, background: '#0ea5e9', borderRadius: 1 }} />
                      <div style={{ width: 1.5, height: 14, background: '#0ea5e9', borderRadius: 1 }} />
                    </div>
                  </div>
                )}
                {/* Right Handle for End Frame */}
                {isSelected && (
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startDrag(seg.id, 'end');
                    }}
                    style={{
                      position: 'absolute',
                      right: -8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 12,
                      height: 26,
                      background: '#fff',
                      border: '2px solid #0ea5e9',
                      borderRadius: 5,
                      cursor: 'col-resize',
                      zIndex: 15,
                      boxShadow: '0 2px 8px rgba(14, 165, 233, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Grip lines */}
                    <div style={{ display: 'flex', gap: 2 }}>
                      <div style={{ width: 1.5, height: 14, background: '#0ea5e9', borderRadius: 1 }} />
                      <div style={{ width: 1.5, height: 14, background: '#0ea5e9', borderRadius: 1 }} />
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Left: Navigation */}
            <Space size={12}>
              <Button type="text" icon={<LeftOutlined style={{ color: '#64748b' }} />} onClick={() => setCurrentFrame(0)} />
              <span style={{ fontSize: '11px', color: '#4b5563' }}>{getDynamicTimestamp(currentFrame)}</span>
              <Button type="text" icon={<RightOutlined style={{ color: '#64748b' }} />} onClick={() => setCurrentFrame(totalFrames)} />
            </Space>

            {/* Center: Playback Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', borderRadius: 20, padding: '4px 12px', border: '1px solid #e4e4e7' }}>
              <Button type="text" icon={<DoubleLeftOutlined style={{ color: '#64748b', fontSize: 10 }} />} onClick={() => message.info('上一条标注数据')} size="small" />
              <Button type="text" icon={<StepBackwardOutlined style={{ color: '#64748b' }} />} onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))} />
              <Button
                type="primary"
                icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ borderRadius: '50%', width: 36, height: 36, minWidth: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)' }}
              />
              <Button type="text" icon={<StepForwardOutlined style={{ color: '#64748b' }} />} onClick={() => setCurrentFrame(Math.min(totalFrames, currentFrame + 1))} />
              <Button type="text" icon={<DoubleRightOutlined style={{ color: '#64748b', fontSize: 10 }} />} onClick={() => message.info('下一条标注数据')} size="small" />
              <Divider orientation="vertical" style={{ height: 20, margin: '0 4px' }} />
              <Button type="text" icon={<ReloadOutlined style={{ color: '#64748b' }} />} size="small" />
              <Select defaultValue={1} size="small" variant="borderless" style={{ width: 50, color: '#475569' }} onChange={setPlaybackSpeed}>
                <Option value={0.5}>0.5x</Option>
                <Option value={1}>1x</Option>
                <Option value={2}>2x</Option>
              </Select>
            </div>

            {/* Right: Action Buttons */}
            <Space size={8}>
              <Button
                size="small"
                style={{
                  background: '#f9f0ff',
                  borderColor: '#d3adf7',
                  color: '#722ed1',
                  borderRadius: 4,
                }}
                onClick={openSaveTplModal}
              >
                生成标注模版
              </Button>
              <Button
                size="small"
                type="primary"
                style={{ borderRadius: 4 }}
                onClick={handleCompleteAnnotation}
              >
                完成标注(T)
              </Button>
              <Button
                size="small"
                style={{
                  background: '#fff2e8',
                  borderColor: '#ffbb96',
                  color: '#d48806',
                  borderRadius: 4,
                }}
                onClick={() => message.warning('已标记为质检不合格')}
              >
                质检不合格
              </Button>
              <Button
                size="small"
                style={{
                  background: '#f6ffed',
                  borderColor: '#b7eb8f',
                  color: '#52c41a',
                  borderRadius: 4,
                }}
                onClick={() => message.success('抽检通过')}
              >
                抽检通过
              </Button>
              <Button
                size="small"
                danger
                style={{ borderRadius: 4 }}
                onClick={() => message.error('抽检不通过')}
              >
                抽检不通过
              </Button>
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
          width={960}
          styles={{ body: { padding: '16px 24px' } }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* 0. 帧区间配置 (Manual Frame Range Config) */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <span style={{ width: '80px', fontWeight: 'bold', fontSize: '12px', color: '#334155' }}>帧区间</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>开始帧:</span>
                <InputNumber 
                  min={0} 
                  max={totalFrames} 
                  value={newRangeStart} 
                  onChange={(val) => {
                    const cleanVal = val === null ? 0 : val;
                    setNewRangeStart(cleanVal);
                    if (cleanVal >= newRangeEnd) {
                      setNewRangeEnd(Math.min(totalFrames, cleanVal + 1));
                    }
                  }} 
                  style={{ width: 85 }}
                  size="small"
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>结束帧:</span>
                <InputNumber 
                  min={0} 
                  max={totalFrames} 
                  value={newRangeEnd} 
                  onChange={(val) => {
                    const cleanVal = val === null ? 0 : val;
                    setNewRangeEnd(cleanVal);
                    if (cleanVal <= newRangeStart) {
                      setNewRangeStart(Math.max(0, cleanVal - 1));
                    }
                  }} 
                  style={{ width: 85 }}
                  size="small"
                />
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                  (已选区间长度: <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{Math.abs(newRangeEnd - newRangeStart)}</span> 帧)
                </span>
              </div>
            </div>

            {/* Mode switcher for Structured Template vs Natural Language */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#faf5ff', padding: '8px 12px', borderRadius: 6, border: '1px solid #d8b4fe', margin: '4px 0' }}>
              <span style={{ width: '80px', fontWeight: 'bold', fontSize: '12px', color: '#6b21a8' }}>描述模式</span>
              <Radio.Group 
                size="small" 
                value={annotationInputMode} 
                onChange={(e) => setAnnotationInputMode(e.target.value)} 
                buttonStyle="solid"
              >
                <Radio.Button value="structured">💡 结构化模版拼装</Radio.Button>
                <Radio.Button value="natural">✍️ 自然语言描述</Radio.Button>
              </Radio.Group>
            </div>

            {annotationInputMode === 'structured' ? (
              <>
                {/* 1. 技能 Select row */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '80px', fontWeight: 'bold', fontSize: '12px' }}>技能</span>
                  <div style={{ flex: 1, display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4 }}>
                    {(() => {
                      const isSkillInQuickOptions = skillOptions.some(opt => opt.value === selectedSkill);
                      return (
                        <>
                          {skillOptions.map(item => {
                            const isSelected = selectedSkill === item.value && isSkillInQuickOptions;
                            return (
                              <div 
                                key={item.value}
                                onClick={() => setSelectedSkill(item.value)}
                                style={{
                                  border: isSelected ? '2px solid #22c55e' : '1px solid #d9d9d9',
                                  borderRadius: 4,
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  background: isSelected ? '#f0fdf4' : '#fff',
                                  whiteSpace: 'pre-line',
                                  textAlign: 'center',
                                  fontWeight: isSelected ? 'bold' : 'normal',
                                  flexShrink: 0
                                }}
                              >
                                {item.label}
                              </div>
                            );
                          })}
                          
                          <Select 
                            value={isSkillInQuickOptions ? undefined : selectedSkill} 
                            placeholder="选择更多技能..."
                            size="small" 
                            style={{ width: 170, flexShrink: 0 }} 
                            onChange={setSelectedSkill}
                            popupRender={(menu) => (
                              <>
                                {menu}
                                <Divider style={{ margin: '4px 0' }} />
                                <Button 
                                  type="text" 
                                  block 
                                  icon={<PlusOutlined />} 
                                  onClick={handleAddSkill}
                                  style={{ textAlign: 'left', padding: '4px 12px', fontSize: '11px', color: '#1677ff' }}
                                >
                                  新增自定义技能
                                </Button>
                              </>
                            )}
                          >
                            {skillDropdownList.map(opt => (
                              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                            ))}
                          </Select>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 2. 对象 Select row */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '80px', fontWeight: 'bold', fontSize: '12px' }}>对象</span>
                  <div style={{ flex: 1, display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4 }}>
                    {(() => {
                      const isObjectInQuickOptions = objectOptions.some(opt => opt.value === selectedObject);
                      return (
                        <>
                          {objectOptions.map(item => {
                            const isSelected = selectedObject === item.value && isObjectInQuickOptions;
                            return (
                              <div 
                                key={item.value}
                                onClick={() => setSelectedObject(item.value)}
                                style={{
                                  border: isSelected ? '2px solid #22c55e' : '1px solid #d9d9d9',
                                  borderRadius: 4,
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  background: isSelected ? '#f0fdf4' : '#fff',
                                  whiteSpace: 'pre-line',
                                  textAlign: 'center',
                                  fontWeight: isSelected ? 'bold' : 'normal',
                                  flexShrink: 0
                                }}
                              >
                                {item.label}
                              </div>
                            );
                          })}

                          <Select 
                            value={isObjectInQuickOptions ? undefined : selectedObject} 
                            placeholder="选择更多对象..."
                            size="small" 
                            style={{ width: 170, flexShrink: 0 }} 
                            onChange={setSelectedObject}
                            popupRender={(menu) => (
                              <>
                                {menu}
                                <Divider style={{ margin: '4px 0' }} />
                                <Button 
                                  type="text" 
                                  block 
                                  icon={<PlusOutlined />} 
                                  onClick={handleAddObject}
                                  style={{ textAlign: 'left', padding: '4px 12px', fontSize: '11px', color: '#1677ff' }}
                                >
                                  新增自定义对象
                                </Button>
                              </>
                            )}
                          >
                            {objectDropdownList.map(obj => (
                              <Option key={obj.value} value={obj.value}>{obj.label}</Option>
                            ))}
                          </Select>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 3. 目标 Select row */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '80px', fontWeight: 'bold', fontSize: '12px' }}>目标</span>
                  <div style={{ flex: 1, display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4 }}>
                    {(() => {
                      const isTargetInQuickOptions = targetOptions.some(opt => opt.value === selectedTarget);
                      return (
                        <>
                          {targetOptions.map(item => {
                            const isSelected = selectedTarget === item.value && isTargetInQuickOptions;
                            return (
                              <div 
                                 key={item.value}
                                 onClick={() => setSelectedTarget(item.value)}
                                 style={{
                                   border: isSelected ? '2px solid #22c55e' : '1px solid #d9d9d9',
                                   borderRadius: 4,
                                   padding: '4px 10px',
                                   fontSize: '11px',
                                   cursor: 'pointer',
                                   background: isSelected ? '#f0fdf4' : '#fff',
                                   whiteSpace: 'pre-line',
                                   textAlign: 'center',
                                   fontWeight: isSelected ? 'bold' : 'normal',
                                   flexShrink: 0
                                 }}
                              >
                                {item.label}
                              </div>
                            );
                          })}

                          <Select 
                            value={isTargetInQuickOptions ? undefined : selectedTarget} 
                            placeholder="选择更多目标..."
                            size="small" 
                            style={{ width: 170, flexShrink: 0 }} 
                            onChange={setSelectedTarget}
                            popupRender={(menu) => (
                              <>
                                {menu}
                                <Divider style={{ margin: '4px 0' }} />
                                <Button 
                                  type="text" 
                                  block 
                                  icon={<PlusOutlined />} 
                                  onClick={handleAddTarget}
                                  style={{ textAlign: 'left', padding: '4px 12px', fontSize: '11px', color: '#1677ff' }}
                                >
                                  新增自定义目标
                                </Button>
                              </>
                            )}
                          >
                            {targetDropdownList.map(tgt => (
                              <Option key={tgt.value} value={tgt.value}>{tgt.label}</Option>
                            ))}
                          </Select>
                        </>
                      );
                    })()}
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
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#475569', marginBottom: 6 }}>📋 历史/模版动作步骤 (点击直接选中)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', marginBottom: 6 }}>
                    {steps.map((st, idx) => {
                      const isSelected = selectedRefStepId === st.id;
                      return (
                        <div 
                          key={st.id || idx}
                          onClick={() => {
                            setSelectedRefStepId(st.id);
                            setCustomNaturalText(st.text);
                            // Auto generate simple english action translation context
                            let enPlaceholder = 'execute task step';
                            if (st.text.includes('抓取')) enPlaceholder = 'grasp item';
                            else if (st.text.includes('放置')) enPlaceholder = 'place item';
                            else if (st.text.includes('拿起')) enPlaceholder = 'pick up item';
                            else if (st.text.includes('擦拭')) enPlaceholder = 'wipe surface';
                            else if (st.text.includes('整理')) enPlaceholder = 'rearrange items';
                            setCustomNaturalTextEn(enPlaceholder);
                            message.success(`已选中步骤 ${idx + 1}: ${st.text}`);
                          }}
                          style={{
                            padding: '8px 12px',
                            background: isSelected ? '#f0fdf4' : '#f8fafc',
                            borderRadius: 6,
                            fontSize: '11px',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #22c55e' : '1px solid #e2e8f0',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ 
                              background: isSelected ? '#22c55e' : (st.color || '#1677ff'), 
                              color: '#fff', 
                              width: 18, 
                              height: 18, 
                              borderRadius: '50%', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: 10, 
                              fontWeight: 'bold', 
                              flexShrink: 0 
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ color: isSelected ? '#166534' : '#334155', fontWeight: isSelected ? 'bold' : 500 }}>{st.text}</span>
                          </div>
                          {isSelected && <CheckCircleFilled style={{ color: '#22c55e', fontSize: '14px' }} />}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ textAlign: 'right', marginTop: 4 }}>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => setShowCustomInputs(!showCustomInputs)}
                      style={{ fontSize: '11px', padding: 0 }}
                    >
                      {showCustomInputs ? '🙈 收起自定义输入栏' : '✏️ 找不到对应步骤？手动输入自定义描述'}
                    </Button>
                  </div>
                </div>
                {showCustomInputs && (
                  <>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#475569', marginBottom: 6 }}>✍️ 自然语言描述 (中文)</div>
                      <Input 
                        value={customNaturalText} 
                        onChange={(e) => {
                          setSelectedRefStepId(null);
                          setCustomNaturalText(e.target.value);
                        }} 
                        placeholder="在此处输入新描述，例如：右手从置物架抓取药品放至工作台..." 
                        style={{ borderRadius: 6, padding: '8px 12px' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#475569', marginBottom: 6 }}>🔤 英文指令映射 (English Instruction - 选填)</div>
                      <Input 
                        value={customNaturalTextEn} 
                        onChange={(e) => {
                          setSelectedRefStepId(null);
                          setCustomNaturalTextEn(e.target.value);
                        }} 
                        placeholder="Enter English corresponding action description, e.g. pick box from desktop..." 
                        style={{ borderRadius: 6, padding: '8px 12px' }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <Divider style={{ margin: '8px 0' }} />

            {/* Dynamic sentence compiled preview in green */}
            <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #b7eb8f', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#15803d', fontFamily: 'monospace' }}>
                {annotationInputMode === 'natural' ? (customNaturalTextEn || 'custom_instruction') : getCompiledText().en}
              </div>
              <div style={{ fontSize: '15px', color: '#166534', marginTop: 4, fontWeight: 'bold' }}>
                {annotationInputMode === 'natural' ? (customNaturalText || '请输入描述内容...') : `${getCompiledText().cn} (${selectedOptions.join('/')})`}
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              {annotationInputMode === 'structured' ? (
                <Button 
                  onClick={() => {
                    const { cn, en } = getCompiledText();
                    setCustomNaturalText(`${cn} (${selectedOptions.join('/')})`);
                    setCustomNaturalTextEn(`${en} (${selectedOptions.join('/')})`);
                    setAnnotationInputMode('natural');
                  }}
                  icon={<EditOutlined />}
                >
                  自定义描述
                </Button>
              ) : (
                <Button 
                  onClick={() => setAnnotationInputMode('structured')}
                  icon={<BulbOutlined />}
                >
                  模版拼接
                </Button>
              )}
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

        {/* ============ POPUP MODAL: 生成标注模版 ============ */}
        <AppModal
          title={<span style={{ fontSize: '15px', fontWeight: 'bold' }}>💾 生成并保存标注模版</span>}
          open={isSaveTplModalOpen}
          onCancel={() => setIsSaveTplModalOpen(false)}
          onOk={handleSaveTemplate}
          okText="确认保存"
          cancelText="取消"
          width={580}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <div>
              <Text strong style={{ fontSize: '13px', color: '#334155' }}>标注模版名称</Text>
              <Input 
                value={tplName} 
                onChange={(e) => setTplName(e.target.value)} 
                placeholder="请输入模版名称..." 
                style={{ marginTop: 6, borderRadius: 6 }} 
              />
            </div>
            <div>
              <Text strong style={{ fontSize: '13px', color: '#334155' }}>模版描述说明</Text>
              <Input.TextArea 
                value={tplDesc} 
                onChange={(e) => setTplDesc(e.target.value)} 
                placeholder="请输入模版描述（如适用设备、场景说明等）..." 
                rows={3}
                style={{ marginTop: 6, borderRadius: 6 }} 
              />
            </div>
            <div>
              <Text strong style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: 8 }}>模版步骤预览 ({steps.length} 步)</Text>
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', background: '#f8fafc' }}>
                {steps.map((s, idx) => (
                  <div key={s.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx === steps.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '70%' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: s.color || '#1677ff',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 'bold'
                      }}>
                        {idx + 1}
                      </span>
                      <Text ellipsis style={{ fontSize: 12 }}>{s.text}</Text>
                    </div>
                    <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{s.startFrame} - {s.endFrame} 帧</Tag>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AppModal>

      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER METHOD 2: 经典视频标注工作台 (White Theme - Standard Modes)
  // ----------------------------------------------------
  return (
    <div className="ui-workspace" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f5f7', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Area */}
      <div className="ui-toolbar" style={{
        background: '#fff', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '10px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
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
              <StatusTag status="已完成">解析完成</StatusTag>
              
              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>质检状态</span>
              <StatusTag status="已通过">优秀</StatusTag>
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
            <Button 
              size="small" 
              type="primary" 
              ghost 
              icon={<ThunderboltOutlined style={{ color: '#ca8a04' }} />} 
              onClick={() => router.push(`/annotation/workbench-solutions?instanceId=${instanceId || '19884'}&episodeId=${episodeId || '744108'}&type=${encodeURIComponent(annoType)}&mode=${workMode}`)}
              style={{ fontSize: 11, borderColor: '#ca8a04', color: '#854d0e', background: '#fefce8' }}
            >
              长视频循环标注3套方案
            </Button>
            <Divider orientation="vertical" style={{ height: 16, margin: 0 }} />
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
            <div style={{ flex: 1, display: isFullscreen ? 'block' : 'grid', gridTemplateColumns: isFullscreen ? '1fr' : '1fr 1fr', gridTemplateRows: isFullscreen ? '1fr' : '1fr 1fr', gap: 10 }}>
              {/* Fullscreen Single Viewport */}
              {isFullscreen && (
                <div style={{ background: '#fafafa', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff', zIndex: 2 }}>
                    <Select value={fullscreenCamera} size="small" variant="borderless" style={{ width: 280, fontSize: 12, fontWeight: 500 }} onChange={(val) => setFullscreenCamera(val)}>
                      <Option value="camera_head_left_color">camera_head_left_color_color</Option>
                      <Option value="camera_head_right_color">camera_head_right_color_color</Option>
                      <Option value="camera_hand_left_color">camera_hand_left_color_color</Option>
                      <Option value="camera_hand_right_color">camera_hand_right_color_color</Option>
                      <Option value="joints">joints.json (3D 模型)</Option>
                    </Select>
                    <Button size="small" type="text" icon={<FullscreenExitOutlined />} onClick={() => setIsFullscreen(false)} />
                  </div>
                  {renderGridContent(fullscreenCamera)}
                </div>
              )}

              {/* Normal 4 Grid View */}
              {!isFullscreen && (
              <>
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
                  <Button size="small" type="text" icon={<FullscreenOutlined />} onClick={() => { setFullscreenCamera(gridCameras.grid1); setIsFullscreen(true); }} />
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
                  <Button size="small" type="text" icon={<FullscreenOutlined />} onClick={() => { setFullscreenCamera(gridCameras.grid2); setIsFullscreen(true); }} />
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
                  <Button size="small" type="text" icon={<FullscreenOutlined />} onClick={() => { setFullscreenCamera(gridCameras.grid3); setIsFullscreen(true); }} />
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
                  <Button size="small" type="text" icon={<FullscreenOutlined />} onClick={() => { setFullscreenCamera(gridCameras.grid4); setIsFullscreen(true); }} />
                </div>
                {renderGridContent(gridCameras.grid4)}
              </div>
              </>
              )}
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
                {/* Video OSD Time HUD Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  zIndex: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  pointerEvents: 'none'
                }}>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                    ⏱️ 00:00:{String(Math.floor(currentFrame * 0.0333)).padStart(2, '0')}.{String(Math.floor((currentFrame * 33.33) % 1000)).padStart(3, '0')}s
                  </span>
                  <span style={{ color: '#64748b' }}>|</span>
                  <span style={{ color: '#facc15' }}>30 FPS</span>
                  <span style={{ color: '#64748b' }}>|</span>
                  <span style={{ color: '#f43f5e' }}>{currentFrame} / {totalFrames} 帧</span>
                </div>

                {/* Absolute Epoch Timestamp Overlay */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  zIndex: 20,
                  pointerEvents: 'none'
                }}>
                  📅 {getDynamicTimestamp(currentFrame)}
                </div>

                {/* REC Recording Status Badge */}
                {isPlaying && selectedStepId !== null && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(239, 68, 68, 0.9)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: 16,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 25,
                    boxShadow: '0 2px 10px rgba(239, 68, 68, 0.5)'
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                    🔴 REC 正在动态打标录制中... [按 R 结束锁定]
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column Panels */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 6, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Header tabs */}
          <div className="ui-toolbar" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-start', minHeight: 0, padding: '0 8px' }}>
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

                {/* 操作手柄录制: 开始 [Q] & 标记 [R] */}
                <div style={{ marginBottom: 16, padding: '12px', background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>操作手柄录制：</span>
                    {selectedStepId !== null ? (
                      <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                        已选中步骤 #{selectedStepId}
                      </Tag>
                    ) : (
                      <Tag color="default" style={{ margin: 0, fontSize: 10 }}>
                        未选中步骤 (按钮已致灰)
                      </Tag>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: selectedStepId === null ? 6 : 0 }}>
                    <Button
                      type="primary"
                      disabled={selectedStepId === null}
                      style={{
                        flex: 1,
                        fontSize: '13px',
                        height: 38,
                        borderRadius: 10,
                        background: selectedStepId === null ? undefined : '#2563eb',
                        borderColor: selectedStepId === null ? undefined : '#2563eb',
                        fontWeight: 'bold',
                        boxShadow: selectedStepId === null ? undefined : '0 2px 6px rgba(37, 99, 235, 0.25)'
                      }}
                      onClick={() => handleStartAction(currentFrame)}
                    >
                      开始 [Q]
                    </Button>

                    <Button
                      type="primary"
                      disabled={selectedStepId === null}
                      style={{
                        flex: 1,
                        fontSize: '13px',
                        height: 38,
                        borderRadius: 10,
                        background: selectedStepId === null ? undefined : '#f97316',
                        borderColor: selectedStepId === null ? undefined : '#f97316',
                        fontWeight: 'bold',
                        boxShadow: selectedStepId === null ? undefined : '0 2px 6px rgba(249, 115, 22, 0.25)'
                      }}
                      onClick={() => handleStopAction(currentFrame)}
                    >
                      标记 [R]
                    </Button>
                  </div>
                  {selectedStepId === null && (
                    <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                      💡 请先在右侧或底部列表中点击选中某一个动作步骤
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 'bold', color: '#1e293b' }}>动作模版步骤 ({steps.length})</span>
                  <Space size={6}>
                    <Select
                      placeholder="动作模版"
                      size="small"
                      style={{ width: 110, fontSize: 11 }}
                      onChange={handleImportActionTemplate}
                      options={[
                        { value: 'act_1', label: '📦 工业打包模版' },
                        { value: 'act_2', label: '📚 桌面整理模版' },
                        { value: 'act_3', label: '🍽️ 餐盘收拾模版' }
                      ]}
                      allowClear
                    />
                    <Button 
                      size="small" 
                      type="primary" 
                      ghost 
                      icon={<PlusOutlined />} 
                      onClick={handleAddRecordedRange} 
                      style={{ fontSize: 11 }}
                    >
                      增加步骤
                    </Button>
                  </Space>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 560, overflowY: 'auto', paddingRight: 2 }}>
                  {steps.map((step, idx) => {
                    const isSelected = selectedStepId === step.id;
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => handleStepSelect(step.id)}
                        onFocus={() => handleStepSelect(step.id)}
                        style={{ 
                          border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0', 
                          borderLeft: isSelected ? '6px solid #2563eb' : '4px solid #cbd5e1', 
                          borderRadius: 8, 
                          background: isSelected ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#fafafa',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.2)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Header: Number, Editable Text Input, Frame Tag & Delete */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                            <span style={{ 
                              fontSize: 11, 
                              fontWeight: 'bold', 
                              color: isSelected ? '#1d4ed8' : '#64748b',
                              background: isSelected ? '#bfdbfe' : '#e2e8f0',
                              padding: '2px 6px',
                              borderRadius: 4,
                              flexShrink: 0
                            }}>
                              {String(step.id).padStart(2, '0')}
                            </span>
                            <Input 
                              size="small"
                              value={step.text}
                              onChange={(e) => handleStepTextChange(step.id, e.target.value)}
                              onFocus={() => handleStepSelect(step.id)}
                              placeholder="请输入/编辑动作描述..."
                              style={{
                                fontSize: 12,
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? '#1e40af' : '#1e293b',
                                borderColor: isSelected ? '#60a5fa' : '#d9d9d9',
                                background: '#ffffff'
                              }}
                            />
                          </div>
                          <Space size={4} style={{ flexShrink: 0 }}>
                            <Tag color={isSelected ? "blue" : "default"} style={{ margin: 0, fontSize: 11, fontWeight: isSelected ? 'bold' : 'normal' }}>
                              {step.startFrame} - {step.endFrame} 帧
                            </Tag>
                            <DeleteOutlined
                              style={{ color: '#ef4444', cursor: 'pointer', fontSize: 13, marginLeft: 4 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const filtered = steps.filter(x => x.id !== step.id);
                                const reindexed = filtered.map((x, i) => ({ ...x, id: i + 1 }));
                                setSteps(reindexed);
                                if (selectedStepId === step.id) {
                                  setSelectedStepId(reindexed.length > 0 ? reindexed[0].id : null);
                                }
                                message.success(`已删除动作步骤 ${step.id}`);
                              }}
                            />
                          </Space>
                        </div>

                        {/* Numeric Inputs for Start/End frame */}
                        <Row gutter={8} style={{ fontSize: 11 }}>
                          <Col span={8}>
                            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>起始帧</div>
                            <InputNumber 
                              size="small" 
                              value={step.startFrame} 
                              min={0}
                              max={step.endFrame - 1}
                              onChange={(val) => handleStepFrameChange(idx, 'startFrame', val)} 
                              onFocus={() => handleStepSelect(step.id)}
                              style={{ width: '100%' }}
                            />
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>结束帧</div>
                            <InputNumber 
                              size="small" 
                              value={step.endFrame} 
                              min={step.startFrame + 1}
                              max={totalFrames}
                              onChange={(val) => handleStepFrameChange(idx, 'endFrame', val)} 
                              onFocus={() => handleStepSelect(step.id)}
                              style={{ width: '100%' }}
                            />
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>帧时长</div>
                            <InputNumber size="small" disabled value={step.total} style={{ width: '100%' }} />
                          </Col>
                        </Row>
                      </div>
                    );
                  })}
                </div>


              </div>
            )}
          </div>
        </div>
      </div>

      {/* Playback Controls & Video Playback Axis */}
      <div className="ui-action-footer" style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
        
        {/* Dedicated Video Playback Slider Axis (视频播放轴) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
          <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold', fontFamily: 'monospace', minWidth: 65 }}>
            ▶ 播放轴
          </span>
          <div style={{ flex: 1, position: 'relative' }}>
            <Slider
              min={0}
              max={totalFrames}
              value={currentFrame}
              onChange={(val) => setCurrentFrame(val)}
              tooltip={{ formatter: (val) => `${val}f (00:00:${String(Math.floor(val * 0.0333)).padStart(2, '0')})` }}
              styles={{
                track: { background: '#2563eb', height: 6 },
                rail: { background: '#cbd5e1', height: 6 },
                handle: { borderColor: '#2563eb', width: 14, height: 14 }
              }}
              style={{ margin: '0' }}
            />
          </div>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 'bold', fontFamily: 'monospace', minWidth: 90, textAlign: 'right' }}>
            {currentFrame} / {totalFrames} f
          </span>
        </div>

        <div 
          ref={timelineRef}
          style={{ position: 'relative', height: 24, background: '#e2e8f0', borderRadius: 4, cursor: 'pointer', overflow: 'visible' }}
          onClick={(e) => {
            if (timelineRef.current) {
              const rect = timelineRef.current.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              setRedLineFrame(Math.max(0, Math.min(totalFrames, Math.round(pct * totalFrames))));
            }
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
                  if (timelineRef.current) {
                    const rect = timelineRef.current.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    setRedLineFrame(Math.max(0, Math.min(totalFrames, Math.round(pct * totalFrames))));
                  }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedStepId(step.id);
                  startDrag(step.id, 'move');
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setSelectedStepId(step.id);
                  startDrag(step.id, 'move');
                }}
                style={{
                  position: 'absolute',
                  left: `${(step.startFrame / totalFrames) * 100}%`,
                  width: `${((step.endFrame - step.startFrame) / totalFrames) * 100}%`,
                  height: isSelected ? '30px' : '100%',
                  top: isSelected ? -3 : 0,
                  background: isSelected ? `linear-gradient(180deg, ${step.color}ee, ${step.color}cc)` : step.color,
                  opacity: isSelected ? 1 : 0.4,
                  borderRadius: isSelected ? 4 : 2,
                  border: isSelected ? '2px solid #0ea5e9' : 'none',
                  boxShadow: isSelected ? '0 0 0 3px rgba(14, 165, 233, 0.3), 0 0 16px rgba(14, 165, 233, 0.4)' : 'none',
                  zIndex: isSelected ? 10 : 2,
                  transition: 'all 0.15s ease',
                  cursor: isSelected ? 'move' : 'pointer'
                }}
              >
                {/* Drag handles for selected step */}
                {isSelected && (
                  <>
                    {showDevNotes && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          Modal.info({
                            title: '💡 交互点 ②: 时序轴双滑块拖动与视频跳转',
                            width: 520,
                            content: (
                              <div style={{ fontSize: '12px', lineHeight: '1.6', marginTop: 10, fontFamily: 'sans-serif' }}>
                                <p style={{ marginBottom: 8 }}><strong>1. 双向手柄调节：</strong> 选中动作步骤后，播放条两端会自动渲染蓝色垂直微调手柄。支持鼠标/手势按住直接拖动，分别实时修改开始帧或结束帧。</p>
                                <p style={{ marginBottom: 8 }}><strong>2. 双向数据绑定：</strong> 拖动滑块时，右侧卡片输入框中的数值实时变化；若用户手动在右侧输入框修改数值，播放轴滑块坐标也等比例自动重绘。</p>
                                <p style={{ marginBottom: 0 }}><strong>3. 首帧对齐定位：</strong> 点击时序轴上的任何片段色块时，除了选中步骤，视频进度（Playhead）还会自动跳播对齐到该片段的起始帧（<code>startFrame</code>），方便迅速校验目标画面。</p>
                              </div>
                            ),
                            okText: '已了解'
                          });
                        }}
                        style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', background: '#1677ff', color: '#fff', fontSize: 8, padding: '1px 4px', borderRadius: 3, whiteSpace: 'nowrap', zIndex: 100, fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' }}
                      >
                        交互 ②
                      </div>
                    )}
                    {/* Left Handle (Start Frame) - Rounded pill style */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        startDrag(step.id, 'start');
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        startDrag(step.id, 'start');
                      }}
                      style={{
                        position: 'absolute',
                        left: -8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 12,
                        height: 26,
                        background: '#fff',
                        border: '2px solid #0ea5e9',
                        borderRadius: 5,
                        cursor: 'col-resize',
                        zIndex: 20,
                        boxShadow: '0 2px 8px rgba(14, 165, 233, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(14, 165, 233, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.4)';
                      }}
                    >
                      {/* Grip lines */}
                      <div style={{ display: 'flex', gap: 2 }}>
                        <div style={{ width: 1.5, height: 14, background: '#0ea5e9', borderRadius: 1 }} />
                        <div style={{ width: 1.5, height: 14, background: '#0ea5e9', borderRadius: 1 }} />
                      </div>
                    </div>

                    {/* Right Handle (End Frame) - Rounded pill style */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        startDrag(step.id, 'end');
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        startDrag(step.id, 'end');
                      }}
                      style={{
                        position: 'absolute',
                        right: -8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 12,
                        height: 26,
                        background: '#fff',
                        border: '2px solid #0ea5e9',
                        borderRadius: 5,
                        cursor: 'col-resize',
                        zIndex: 20,
                        boxShadow: '0 2px 8px rgba(14, 165, 233, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(14, 165, 233, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.4)';
                      }}
                    >
                      {/* Grip lines */}
                      <div style={{ display: 'flex', gap: 2 }}>
                        <div style={{ width: 1.5, height: 14, background: '#0ea5e9', borderRadius: 1 }} />
                        <div style={{ width: 1.5, height: 14, background: '#0ea5e9', borderRadius: 1 }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {/* Active Recording Progress Overlay when video is playing */}
          {isPlaying && selectedStepId !== null && (
            (() => {
              const activeStep = steps.find(s => s.id === selectedStepId);
              if (!activeStep) return null;
              const startPct = (activeStep.startFrame / totalFrames) * 100;
              const currentPct = (currentFrame / totalFrames) * 100;
              const widthPct = Math.max(0, currentPct - startPct);
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: `${startPct}%`,
                    width: `${widthPct}%`,
                    height: '100%',
                    top: 0,
                    background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.35) 0%, rgba(249, 115, 22, 0.75) 100%)',
                    border: '2px dashed #f97316',
                    borderRadius: 4,
                    zIndex: 15,
                    pointerEvents: 'none',
                    boxShadow: '0 0 12px rgba(249, 115, 22, 0.6)'
                  }}
                />
              );
            })()
          )}

          {/* Red Playhead line & glowing top cursor (Decoupled from video playback, independently draggable with mouse) */}
          <div 
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              isDraggingRedLineRef.current = true;
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
              isDraggingRedLineRef.current = true;
            }}
            style={{ 
              position: 'absolute', 
              left: `${(redLineFrame / totalFrames) * 100}%`, 
              top: -8, 
              height: '38px', 
              zIndex: 40, 
              cursor: 'grab', 
              transform: 'translateX(-50%)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              userSelect: 'none'
            }}
            title={`标注游标: ${redLineFrame} 帧 (在时序轴上随意点击或按住鼠标可左右拖动游标)`}
          >
            <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '9px solid #ef4444', filter: 'drop-shadow(0 2px 4px rgba(239,68,68,0.6))', cursor: 'grab' }} />
            <div style={{ width: 2, flex: 1, background: '#ef4444', boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16} align="center">
            <Button type="text" icon={<LeftOutlined />} onClick={() => setCurrentFrame(0)} title="跳至首帧" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace' }}>
                ⏱️ 00:00:{String(Math.floor(currentFrame * 0.0333)).padStart(2, '0')}.{String(Math.floor((currentFrame * 33.33) % 1000)).padStart(3, '0')} / 00:00:10.000
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                当前: {currentFrame}f / {totalFrames}f (30 FPS)
              </div>
            </div>
            <Button type="text" icon={<RightOutlined />} onClick={() => setCurrentFrame(totalFrames)} title="跳至尾帧" />
          </Space>

          {/* Center: Playback Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', borderRadius: 20, padding: '4px 12px', border: '1px solid #e4e4e7' }}>
            <Button type="text" icon={<DoubleLeftOutlined style={{ fontSize: 10 }} />} onClick={() => message.info('上一条标注数据')} size="small" />
            <Button type="text" icon={<StepBackwardOutlined />} onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))} />
            <Button
              type="primary"
              icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={() => {
                if (!isPlaying) {
                  // When clicking Play, start video playback from current redLineFrame position
                  setCurrentFrame(redLineFrame);
                }
                setIsPlaying(!isPlaying);
              }}
              style={{ borderRadius: '50%', width: 36, height: 36, minWidth: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)' }}
            />
            <Button type="text" icon={<StepForwardOutlined />} onClick={() => setCurrentFrame(Math.min(totalFrames, currentFrame + 1))} />
            <Button type="text" icon={<DoubleRightOutlined style={{ fontSize: 10 }} />} onClick={() => message.info('下一条标注数据')} size="small" />
            <Divider orientation="vertical" style={{ height: 20, margin: '0 4px' }} />
            <Button type="text" icon={<ReloadOutlined />} size="small" />
            <Select defaultValue={1} size="small" variant="borderless" style={{ width: 50, color: '#475569' }} onChange={setPlaybackSpeed}>
              <Option value={0.5}>0.5x</Option>
              <Option value={1}>1x</Option>
              <Option value={2}>2x</Option>
            </Select>
          </div>

          <Space size={12}>
            {workMode === 'annotate' && (
              <>
                <Button
                  size="small"
                  style={{
                    background: '#f9f0ff',
                    borderColor: '#d3adf7',
                    color: '#722ed1',
                    borderRadius: 4,
                  }}
                  onClick={openSaveTplModal}
                >
                  生成标注模版
                </Button>
                <Button
                  size="small"
                  type="primary"
                  style={{ borderRadius: 4 }}
                  onClick={handleCompleteAnnotation}
                >
                  完成标注(T)
                </Button>
              </>
            )}
            <Button
              size="middle"
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                fontWeight: 'bold',
                borderRadius: 6,
                padding: '0 20px',
              }}
              onClick={handlePassQc}
            >
              通过
            </Button>
            <Button
              size="middle"
              type="primary"
              danger
              icon={<CloseCircleOutlined />}
              style={{
                fontWeight: 'bold',
                borderRadius: 6,
                padding: '0 20px',
              }}
              onClick={() => {
                setRejectReason('');
                setSelectedQuickTag(null);
                setIsRejectModalOpen(true);
              }}
            >
              不通过
            </Button>
          </Space>
        </div>
      </div>

      {/* ============ POPUP MODAL: 审核不通过理由弹窗 ============ */}
      <AppModal
        title={<span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ff4d4f' }}>❌ 审核不通过 — 请输入驳回理由</span>}
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={handleConfirmReject}
        okText="确认驳回并重新标注"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        width={560}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 12 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 13 }}>快捷选择不合格原因：</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {['关键帧时机不准', '3D包围框不紧密', '动作步骤标签选错', '轨迹拟合偏移', '文字描述不规范'].map(tag => (
                <Tag.CheckableTag
                  key={tag}
                  checked={selectedQuickTag === tag}
                  onChange={checked => {
                    setSelectedQuickTag(checked ? tag : null);
                    if (checked && !rejectReason) setRejectReason(tag);
                  }}
                  style={{ borderRadius: 16, padding: '3px 12px', fontSize: 12 }}
                >
                  {tag}
                </Tag.CheckableTag>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              <span style={{ color: '#ff4d4f' }}>*</span> 详细不通过理由：
            </div>
            <Input.TextArea
              rows={4}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="请详细描述标注质量问题（例如：第320-450帧夹爪闭合时机提前、物体3D框包裹未贴合物体边缘等）..."
              maxLength={300}
              showCount
            />
          </div>
          <div style={{ padding: '8px 12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, fontSize: 12, color: '#d48806' }}>
            ⚠️ 确认驳回后，该 Episode 状态将变更为【未通过/审核驳回】，并自动回退至标注员工作台重新标注。
          </div>
        </div>
      </AppModal>

      {/* ============ POPUP MODAL: 生成并保存标注模版 (范围标注页) ============ */}
      <AppModal
        title={<span style={{ fontSize: '15px', fontWeight: 'bold' }}>💾 生成并保存标注模版</span>}
        open={isSaveTplModalOpen}
        onCancel={() => setIsSaveTplModalOpen(false)}
        onOk={handleSaveTemplate}
        okText="确认保存"
        cancelText="取消"
        width={580}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          <div>
            <Text strong style={{ fontSize: '13px', color: '#334155' }}>标注模版名称</Text>
            <Input 
              value={tplName} 
              onChange={(e) => setTplName(e.target.value)} 
              placeholder="请输入模版名称..." 
              style={{ marginTop: 6, borderRadius: 6 }} 
            />
          </div>
          <div>
            <Text strong style={{ fontSize: '13px', color: '#334155' }}>模版描述说明</Text>
            <Input.TextArea 
              value={tplDesc} 
              onChange={(e) => setTplDesc(e.target.value)} 
              placeholder="请输入模版描述（如适用设备、场景说明等）..." 
              rows={3}
              style={{ marginTop: 6, borderRadius: 6 }} 
            />
          </div>
          <div>
            <Text strong style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: 8 }}>模版步骤预览 ({steps.length} 步)</Text>
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', background: '#f8fafc' }}>
              {steps.map((s, idx) => (
                <div key={s.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx === steps.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '70%' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: s.color || '#1677ff',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}>
                      {idx + 1}
                    </span>
                    <Text ellipsis style={{ fontSize: 12 }}>{s.text}</Text>
                  </div>
                  <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{s.startFrame} - {s.endFrame} 帧</Tag>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppModal>

      {/* ============ POPUP MODAL: 批量标注 - 复用标注模版 (范围标注页) ============ */}
      <Modal
        title={<span style={{ fontSize: '15px', fontWeight: 'bold' }}>🚀 批量标注 - 复用标注模版</span>}
        open={isApplyTplModalOpen}
        onCancel={() => setIsApplyTplModalOpen(false)}
        footer={null}
        width={650}
      >
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
            选择预设或已保存的标注模版，系统将自动复制该模版的动作步骤及帧数范围。标注员套用后，只需在时间轴上快速核对校验帧区间即可，大幅降低重复动作的标注成本。
          </Text>

          {savedTemplates.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
              <FolderOpenOutlined style={{ fontSize: 32, color: '#94a3b8', marginBottom: 8 }} />
              <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>暂无已保存的标注模版</div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>您可以在左侧面板或下方操作栏中，将已标好的动作序列点击“生成标注模版”进行保存。</div>
            </div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {savedTemplates.map((tpl) => (
                <div 
                  key={tpl.id} 
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 16,
                    background: '#fff',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1890ff';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ width: '75%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong style={{ fontSize: 14 }}>{tpl.name}</Text>
                      <Tag color="cyan" style={{ fontSize: 11 }}>{tpl.stepCount} 动作</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{tpl.desc}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                      创建人: {tpl.creator} &nbsp;|&nbsp; 创建时间: {tpl.createTime}
                    </div>
                  </div>
                  <Button 
                    type="primary" 
                    onClick={() => handleApplyTemplate(tpl)}
                    style={{ borderRadius: 6, fontWeight: 600 }}
                  >
                    套用此模版
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

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
