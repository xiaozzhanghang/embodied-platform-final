'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, App, Badge, Select, Row, Col, Form, Tooltip, Statistic, Divider, Modal, Radio, Progress, List, Upload, InputNumber, Alert, Checkbox, Slider } from 'antd';
import { CloseOutlined, SearchOutlined, ReloadOutlined, LeftOutlined, EyeOutlined, EditOutlined, UndoOutlined, AuditOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, MinusCircleOutlined, CopyOutlined, LoadingOutlined, UploadOutlined, InboxOutlined, ThunderboltOutlined, RobotOutlined, VideoCameraOutlined, SafetyCertificateOutlined, CompressOutlined, ArrowsAltOutlined, MinusOutlined, DownOutlined, UpOutlined, SyncOutlined, CheckCircleFilled, FullscreenOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { PageHeader, StatusTag, TableToolbarActions } from '@/components/ui';
import { STATIC_ROUTES, buildStaticHref } from '@/lib/staticRoutes';

const { Title, Text } = Typography;
const { Option } = Select;

export const ANNO_TYPES = ['范围标注', '手势标注', '语义标注'];

const annoTypeColors = {
  '动作范围标注': 'blue',
  '范围标注': 'blue',
  '手势标注': 'green',
  '语义标注': 'purple',
};

const annoStatusConfig = {
  '已标注': { color: 'success', icon: <CheckCircleOutlined /> },
  '未标注': { color: 'default', icon: <MinusCircleOutlined /> },
  '待校验': { color: 'warning', icon: <ClockCircleOutlined /> },
};

const auditStatusConfig = {
  '未审核': { color: 'default' },
  '审核中': { color: 'processing' },
  '通过': { color: 'success' },
  '不通过': { color: 'error' },
};

// 专一标注类型 Episode 生成函数：严格保证每个任务详情页内 100% 仅有一种标注类型！
const generateEpisodesForType = (type, instId) => {
  const annoType = type === '动作范围标注' ? '范围标注' : type;

  if (annoType === '手势标注') {
    const gestureTasks = [
      '工装模块电动拧紧装配双手手势标定 (DM_20260814173416_001)',
      '双手21关节手势关键点标定 (Google MediaPipe 3D)',
      '螺栓拾取双手抓握触觉姿态标定 (GoPro_Right)',
      '电池包稳固双手接触点标定 (EgoCam_LeftRight)',
      '电批扳机按压食指关节点标定 (GoPro_Macro)',
      '双目第一视角双手骨骼点标定 (ZED2i_Stereo)',
      '精细捏合手势姿态分类标定 (GoPro_Zoom)',
      '双手托举物料位姿标定 (EgoCam_Wide)',
      '工具抓放手势接触临界点标定 (GoPro_Hero11_02)',
      '工装螺母精确定位手势标定 (EgoCam_Macro)'
    ];

    return Array.from({ length: 20 }).map((_, i) => {
      const id = 744108 + i;
      const annoStatus = i === 0 ? '未标注' : i < 6 ? '已标注' : i < 14 ? (i % 2 === 0 ? '未标注' : '待校验') : '未标注';
      const auditStatus = annoStatus === '已标注' ? ['通过', '审核中', '未审核', '不通过'][i % 4] : annoStatus === '待校验' ? '审核中' : '未审核';
      const totalFrames = i === 0 ? 9168 : 4800 + i * 240;
      const taskName = gestureTasks[i % gestureTasks.length];

      return {
        key: `gesture-${id}`,
        id,
        episodeId: String(id),
        taskName,
        instance: `实例_${instId}_${String(i + 1).padStart(3, '0')}`,
        annoTaskName: `双手21关节关键点标定_${['张三', '李四', '王五', '赵六'][i % 4]}`,
        device: i % 2 === 0 ? 'Ego第一视角头戴相机 (GoPro)' : '双目立体视觉相机 (ZED 2i)',
        annoType: '手势标注',
        targetType: '手势标注',
        totalFrames,
        manualTime: annoStatus === '已标注' ? '2026-07-08 09:15:20' : '',
        modelTime: '2026-07-08 08:35:00',
        parseStatus: '解析完成',
        annoStatus,
        auditStatus,
        hasError: i === 4 || i === 12,
        segments: annoStatus !== '未标注' ? [
          { start: Math.round(totalFrames * 0.1), end: Math.round(totalFrames * 0.35), text: '双手抓握准备：拇指食指精准捏合姿态标定', color: '#16a34a' },
          { start: Math.round(totalFrames * 0.4), end: Math.round(totalFrames * 0.8), text: '触碰工装：双手21关节点解剖级定位与接触受力判定', color: '#2563eb' }
        ] : []
      };
    });
  }

  if (annoType === '语义标注') {
    const semanticTasks = [
      '抓取猕猴桃放置果盘语义解析 (Galbot_Episode_01)',
      '移动高脚杯至清洗区原子动作语义 (Galbot_Episode_02)',
      '旋转微调液压阀门动作语义四元组 (Industrial_Episode_03)',
      '装配工具盒开盖取螺丝刀操作语义 (Assembly_Episode_04)',
      '细粒度动作语义四元组标定 (Galbot_Episode_05)',
      '双臂协同物料搬运语义解析 (DualArm_Episode_06)',
      '工位清洁与物料归位语义解析 (Clean_Episode_07)',
      '托盘装载与定点放置操作语义 (Place_Episode_08)',
      '抽屉开关与工具抓取原子动作 (Drawer_Episode_09)',
      '多视角动作语义意图分类 (Intent_Episode_10)'
    ];

    return Array.from({ length: 20 }).map((_, i) => {
      const id = 744108 + i;
      const annoStatus = i === 0 ? '未标注' : i < 6 ? '已标注' : i < 14 ? (i % 2 === 0 ? '未标注' : '待校验') : '未标注';
      const auditStatus = annoStatus === '已标注' ? ['通过', '审核中', '未审核', '不通过'][i % 4] : annoStatus === '待校验' ? '审核中' : '未审核';
      const totalFrames = i === 0 ? 2400 : 1800 + i * 120;
      const taskName = semanticTasks[i % semanticTasks.length];

      return {
        key: `semantic-${id}`,
        id,
        episodeId: String(id),
        taskName,
        instance: `实例_${instId}_${String(i + 1).padStart(3, '0')}`,
        annoTaskName: `动作语义四元组标定_${['张三', '李四', '王五', '赵六'][i % 4]}`,
        device: '双臂手眼协同设备 (Galbot-1.16)',
        annoType: '语义标注',
        targetType: '语义标注',
        totalFrames,
        manualTime: annoStatus === '已标注' ? '2026-07-08 09:12:16' : '',
        modelTime: '2026-07-08 08:30:00',
        parseStatus: '解析完成',
        annoStatus,
        auditStatus,
        hasError: i === 3 || i === 11,
        segments: annoStatus !== '未标注' ? [
          { start: Math.round(totalFrames * 0.15), end: Math.round(totalFrames * 0.45), text: 'pick {Kiwi} from {desktop} [Agent: 右手, Skill: Pick, Object: 猕猴桃]', color: '#2563eb' },
          { start: Math.round(totalFrames * 0.55), end: Math.round(totalFrames * 0.9), text: 'place {Kiwi} on {Fruit Bowl} [Agent: 双手, Skill: Place, Object: 果盘]', color: '#16a34a' }
        ] : []
      };
    });
  }

  // 默认：范围标注 (动作时序范围切分)
  const rangeTasks = [
    '螺丝预装配示教录像 (ego_cam1)',
    '电池模组紧固装配示教 (ego_cam2)',
    '零部件扫码与对齐示教 (station_cam)',
    '充电口盖板扣合装配示教 (ego_cam1)',
    '电动拧紧枪回位示教 (station_cam2)',
    '托盘抓取与定点放置示教 (cam_top)',
    '右侧紧固件装配示教 (ego_cam1)',
    '工装卡爪开合动作切分 (station_cam)',
    '双目时钟同步二维码校准 (ego_cam1)',
    '工装基准对齐时序标定 (station_cam2)'
  ];

  return Array.from({ length: 20 }).map((_, i) => {
    const id = 744108 + i;
    const annoStatus = i === 0 ? '未标注' : i < 6 ? '已标注' : i < 14 ? (i % 2 === 0 ? '未标注' : '待校验') : '未标注';
    const auditStatus = annoStatus === '已标注' ? ['通过', '审核中', '未审核', '不通过'][i % 4] : annoStatus === '待校验' ? '审核中' : '未审核';
    const totalFrames = i === 0 ? 3454 : 2600 + i * 180;
    const taskName = rangeTasks[i % rangeTasks.length];

    return {
      key: `range-${id}`,
      id,
      episodeId: String(id),
      taskName,
      instance: `实例_${instId}_${String(i + 1).padStart(3, '0')}`,
      annoTaskName: `打螺丝工步时序范围切分_${['张三', '李四', '王五', '赵六'][i % 4]}`,
      device: '天奇新动力 (Ego-Cam1)',
      annoType: '范围标注',
      targetType: '范围标注',
      totalFrames,
      manualTime: annoStatus === '已标注' ? '2026-07-08 09:12:16' : '',
      modelTime: '2026-07-08 08:30:00',
      parseStatus: '解析完成',
      annoStatus,
      auditStatus,
      hasError: i === 3 || i === 11,
      segments: annoStatus !== '未标注' ? [
        { start: 0, end: Math.round(totalFrames * 0.15), text: '双手持手机近景展示二维码完成时钟同步对齐', color: '#2563eb' },
        { start: Math.round(totalFrames * 0.15), end: Math.round(totalFrames * 0.4), text: '右手向前探出拾取电动螺栓枪并移至待命区', color: '#16a34a' },
        { start: Math.round(totalFrames * 0.4), end: totalFrames, text: '双手扶持电池模组，对准预装配螺栓紧固拧紧', color: '#7c3aed' }
      ] : []
    };
  });
};

export default function AnnotationAuditEpisodeListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instanceId = searchParams.get('id') || '19884';
  const typeParam = searchParams.get('type');

  // 根据 URL 参数或 instanceId 确定当前任务唯一且固定的标注类型（手势标注 / 范围标注 / 语义标注）
  const currentAnnoType = useMemo(() => {
    if (typeParam) {
      if (typeParam === '动作范围标注' || typeParam === '范围标注') return '范围标注';
      if (typeParam === '手势标注') return '手势标注';
      if (typeParam === '语义标注') return '语义标注';
    }
    // 优先读取 localStorage 中的任务配置
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('embodied_anno_tasks_v2');
        if (saved) {
          const list = JSON.parse(saved);
          const found = list.find(t => String(t.instanceId) === String(instanceId) || String(t.id) === String(instanceId));
          if (found && found.annoType) {
            return found.annoType === '动作范围标注' ? '范围标注' : found.annoType;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    // 默认映射：19883为手势标注，19882为语义标注，19884为范围标注
    if (String(instanceId) === '19883') return '手势标注';
    if (String(instanceId) === '19882') return '语义标注';
    return '范围标注';
  }, [typeParam, instanceId]);

  const [activeAnnoTab, setActiveAnnoTab] = useState('unannotated');
  const [tableDensity, setTableDensity] = useState('middle');
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const { message } = App.useApp();

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveAnnoTab(tabFromUrl);
    }
  }, [searchParams]);

  const [filterAnnoStatus, setFilterAnnoStatus] = useState(null);
  const [filterAuditStatus, setFilterAuditStatus] = useState(null);
  const [filterId, setFilterId] = useState('');

  // Stateful list of episodes for dynamic updates: 100% 遵循单一标注类型 currentAnnoType
  const [episodes, setEpisodes] = useState(() => generateEpisodesForType(currentAnnoType, instanceId));

  useEffect(() => {
    setEpisodes(generateEpisodesForType(currentAnnoType, instanceId));
  }, [currentAnnoType, instanceId]);

  // Table Row Selection States
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  // Batch Annotation Configurations
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBatchModalMinimized, setIsBatchModalMinimized] = useState(false);
  const [batchTemplateId, setBatchTemplateId] = useState(null);
  const [batchStrategy, setBatchStrategy] = useState('proportional');
  const [batchTargetScope, setBatchTargetScope] = useState('unannotated'); // 'selected' | 'unannotated' | 'all'
  const [isCopying, setIsCopying] = useState(false);
  const [copyProgress, setCopyProgress] = useState(0);

  // AI Annotation States (支持后台小窗口非阻塞流式处理)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiModalMinimized, setIsAiModalMinimized] = useState(false);
  const [isFloatingWidgetCollapsed, setIsFloatingWidgetCollapsed] = useState(false);
  const [aiInferenceStep, setAiInferenceStep] = useState('config'); // 'config' | 'inferring' | 'review' | 'applying' | 'completed'
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressStage, setAiProgressStage] = useState('');
  const [aiApplyProgress, setAiApplyProgress] = useState(0);
  const [aiApplyCurrentIndex, setAiApplyCurrentIndex] = useState(0);
  const [aiApplyTotal, setAiApplyTotal] = useState(0);
  const [aiApplyCurrentEpisode, setAiApplyCurrentEpisode] = useState('');
  const [aiModel, setAiModel] = useState('local_qwen');
  const [aiMode, setAiMode] = useState('full_segmentation'); // 'full_segmentation' | 'window_sliding' | 'template_align'
  const [aiFramesPerWindow, setAiFramesPerWindow] = useState(6);
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(85);
  const [aiStrategy, setAiStrategy] = useState('append'); // 'append' | 'replace' | 'conflict_detect'
  const [aiCandidateSteps, setAiCandidateSteps] = useState([]);
  const [aiSelectedCandidateIds, setAiSelectedCandidateIds] = useState([]);
  const [aiAudit, setAiAudit] = useState({
    latencyMs: 1180,
    tokens: 2420,
    traceId: 'qwen_06ffd6466ef0',
    endpoint: 'qwen2.5-vl-7b (HTTP 200 OK)'
  });

  const aiApplyIntervalRef = useRef(null);
  const aiInferenceTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      if (aiApplyIntervalRef.current) clearInterval(aiApplyIntervalRef.current);
      aiInferenceTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Template Search & Category Filter State
  const [templateSearchKeyword, setTemplateSearchKeyword] = useState('');
  const [templateCategoryTab, setTemplateCategoryTab] = useState('all');
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

  // Upload Data Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadForm] = Form.useForm();

  // Dynamic template properties based on active selection type
  const getActiveBatchType = () => {
    if (selectedRows.length === 0) return '语义标注';
    return selectedRows[0].annoType;
  };

  const activeBatchType = getActiveBatchType();

  // Rich system presets library
  const systemPresetLibrary = [
    {
      id: 'SYSTEM_PRESET_1',
      taskName: '工业纸箱打包封装与装箱模版',
      category: 'dual_arm',
      device: '双臂手眼协同设备 (Galbot-1.16)',
      annoType: '语义标注',
      stepMode: '结构化四元组',
      totalFrames: 180,
      usageCount: 1420,
      segments: [
        { start: 0, end: 45, text: '[右手] [抓取] [工业纸箱] [展开封底]', color: '#2563eb' },
        { start: 46, end: 90, text: '[左手] [扶持] [纸箱侧边] [稳固姿态]', color: '#16a34a' },
        { start: 91, end: 135, text: '[右手] [装填] [零件泡沫] [放入底部]', color: '#d97706' },
        { start: 136, end: 180, text: '[双臂] [搬运] [已封装纸箱] [置入托盘]', color: '#7c3aed' }
      ]
    },
    {
      id: 'SYSTEM_PRESET_2',
      taskName: '桌面书籍与物品整理摆放模版',
      category: 'single_arm',
      device: '单臂物理遥操设备 (Air-SN201)',
      annoType: '范围标注',
      stepMode: '自然语言Prompt',
      totalFrames: 150,
      usageCount: 890,
      segments: [
        { start: 10, end: 50, text: '机械臂靠近桌面散落书籍并完成边缘识别', color: '#13c2c2' },
        { start: 55, end: 105, text: '吸附抓取书籍并平移至书架指定插槽', color: '#1890ff' },
        { start: 110, end: 145, text: '推进对齐书脊并缓慢松开夹爪复位', color: '#52c41a' }
      ]
    },
    {
      id: 'SYSTEM_PRESET_3',
      taskName: '餐盘清理与双臂协同搬运模版',
      category: 'dual_arm',
      device: '双臂手眼协同设备 (Galbot-1.16)',
      annoType: '语义标注',
      stepMode: '结构化四元组',
      totalFrames: 160,
      usageCount: 650,
      segments: [
        { start: 15, end: 55, text: '[双臂] [靠近] [餐台托盘] [调整夹角]', color: '#2563eb' },
        { start: 60, end: 110, text: '[双手] [合力托举] [餐盘] [离地平移]', color: '#16a34a' },
        { start: 115, end: 155, text: '[双手] [放置] [托盘] [餐具回收架]', color: '#7c3aed' }
      ]
    },
    {
      id: 'SYSTEM_PRESET_4',
      taskName: '抽屉开关与精细物品抓取模版',
      category: 'single_arm',
      device: '单臂物理遥操设备 (Air-SN201)',
      annoType: '范围标注',
      stepMode: '自然语言Prompt',
      totalFrames: 140,
      usageCount: 520,
      segments: [
        { start: 10, end: 40, text: '末端夹爪对准抽屉把手并拉开至最大开度', color: '#13c2c2' },
        { start: 45, end: 95, text: '伸手探入抽屉精准抓取目标药品包装盒', color: '#fa8c16' },
        { start: 100, end: 135, text: '取出药品并顺势将抽屉推回复位', color: '#1890ff' }
      ]
    },
    {
      id: 'SYSTEM_PRESET_5',
      taskName: '系统预设标准示范模版 (双臂猕猴桃抓取)',
      category: 'dual_arm',
      device: '双臂手眼协同设备 (Galbot-1.16)',
      annoType: '语义标注',
      stepMode: '结构化四元组',
      totalFrames: 120,
      usageCount: 2310,
      segments: [
        { start: 18, end: 54, text: 'pick {Kiwi} from {desktop}', color: '#2563eb' },
        { start: 66, end: 102, text: 'place {Kiwi} on {Fruit Bowl}', color: '#16a34a' }
      ]
    }
  ];

  const annotatedTemplates = episodes.filter(ep => 
    ep.annoStatus === '已标注' && 
    ep.segments && 
    ep.segments.length > 0
  );

  // All available templates
  const allTemplates = [
    ...systemPresetLibrary,
    ...annotatedTemplates.map(ep => ({
      id: ep.id,
      taskName: ep.taskName,
      category: ep.device.includes('双臂') ? 'dual_arm' : 'single_arm',
      device: ep.device,
      annoType: ep.annoType,
      stepMode: ep.annoType === '语义标注' ? '结构化四元组' : '自然语言Prompt',
      totalFrames: ep.totalFrames,
      usageCount: 120,
      segments: ep.segments
    }))
  ];

  const defaultSystemTemplate = systemPresetLibrary[0];

  const getSelectedTemplate = () => {
    return allTemplates.find(t => String(t.id) === String(batchTemplateId)) || defaultSystemTemplate;
  };

  const handleOpenAiModal = () => {
    if (isAiModalMinimized) {
      setIsAiModalMinimized(false);
      setIsAiModalOpen(true);
      return;
    }
    setAiInferenceStep('config');
    setAiProgress(0);
    setAiProgressStage('');
    setIsAiModalOpen(true);
  };

  const handleCancelAiProcess = () => {
    if (aiApplyIntervalRef.current) {
      clearInterval(aiApplyIntervalRef.current);
      aiApplyIntervalRef.current = null;
    }
    aiInferenceTimersRef.current.forEach(t => clearTimeout(t));
    aiInferenceTimersRef.current = [];
    setIsAiModalOpen(false);
    setIsAiModalMinimized(false);
    setAiInferenceStep('config');
    setAiProgress(0);
    setAiApplyProgress(0);
  };

  // AI 自动标注处理函数 (与工作台保持 100% 一致，支持后台小窗口非阻塞流式处理)
  const handleStartAiInference = (runInBackground = false) => {
    setAiInferenceStep('inferring');
    setAiProgress(15);
    setAiProgressStage('阶段 1/5: 视频时序密集采样 (覆盖 3454 帧全视频 00:00~01:55 全程，提取动作关键切片)...');

    if (runInBackground) {
      setIsAiModalMinimized(true);
      message.info('通义千问 Qwen2.5-VL 时序推理已转入后台小窗口运行，您可以继续在页面中进行其他操作');
    }

    aiInferenceTimersRef.current.forEach(t => clearTimeout(t));
    aiInferenceTimersRef.current = [];

    const t1 = setTimeout(() => {
      setAiAudit({
        latencyMs: 1180,
        tokens: 2420,
        traceId: 'qwen_' + Math.random().toString(16).substring(2, 14),
        endpoint: 'qwen2.5-vl-7b (HTTP 200 OK)'
      });
    }, 1100);

    const t2 = setTimeout(() => {
      setAiProgress(38);
      setAiProgressStage('阶段 2/5: 连接通义千问 Qwen2.5-VL 视觉内核，执行多模态时序切分...');
    }, 600);

    const t3 = setTimeout(() => {
      setAiProgress(68);
      setAiProgressStage(`阶段 3/5: Qwen2.5-VL 云端推理响应成功 (HTTP 200 OK · 耗时 1180ms) · 提取机械臂姿态与接触临界点...`);
    }, 1200);

    const t4 = setTimeout(() => {
      setAiProgress(88);
      setAiProgressStage('阶段 4/5: 工业动作语义四元组解析与受控词表匹配 (12 组工步首尾相连，0 时序空隙)...');
    }, 1800);

    const t5 = setTimeout(() => {
      setAiProgress(100);
      setAiProgressStage('阶段 5/5: 🎉 通义千问 Qwen2.5-VL 动作切分完成！全视频 3454 帧 100% 满铺覆盖，共生成 12 个连贯工步！');

      const candidates = [
        {
          id: 101,
          text: '双手持手机近景展示二维码完成时钟同步对齐',
          arm: '双手 (Dual Arms)',
          skill: '基准校准',
          object: '动态时钟二维码',
          goal: '多视场时钟对齐 (<10ms)',
          startFrame: 0,
          endFrame: 368,
          color: '#2563eb',
          confidence: '99.8%',
          graspType: '双手托举持握',
          speedProfile: '平稳静止 (0.05m/s)',
          torqueLimit: '3.0 N·m',
          vlaToken: 'ACTION_QR_SYNC',
          isAiGenerated: true,
        },
        {
          id: 102,
          text: '手机撤出视场，操作员步入装配工位准备',
          arm: '双手 (Dual Arms)',
          skill: '工位就绪',
          object: '装配工作台',
          goal: '进入操作视场完成净空',
          startFrame: 368,
          endFrame: 520,
          color: '#64748b',
          confidence: '99.1%',
          graspType: '释手待命',
          speedProfile: '平稳步入 (0.4m/s)',
          torqueLimit: '0.0 N·m',
          vlaToken: 'ACTION_ENTER_STATION',
          isAiGenerated: true,
        },
        {
          id: 103,
          text: '右手向前探出拾取电动螺栓枪并移至待命区',
          arm: '右手 (Right Arm)',
          skill: '工具拾取',
          object: '电动螺栓枪/电钻',
          goal: '牢固握持提升至待命高度',
          startFrame: 520,
          endFrame: 720,
          color: '#16a34a',
          confidence: '99.5%',
          graspType: '枪式力矩握持',
          speedProfile: '匀速拾取 (0.35m/s)',
          torqueLimit: '12.0 N·m',
          vlaToken: 'ACTION_PICKUP_DRILL',
          isAiGenerated: true,
        },
        {
          id: 104,
          text: '左手扶持第1电池模组，右手对准安装孔螺栓',
          arm: '双手 (Dual Arms)',
          skill: '协同对齐',
          object: '第1电池模组与螺栓',
          goal: '钻头精准对准螺栓槽',
          startFrame: 720,
          endFrame: 1100,
          color: '#0284c7',
          confidence: '99.2%',
          graspType: '双臂协同定位',
          speedProfile: '精密对齐 (0.15m/s)',
          torqueLimit: '8.0 N·m',
          vlaToken: 'ACTION_ALIGN_MODULE_1',
          isAiGenerated: true,
        },
        {
          id: 105,
          text: '右手电钻紧固第1模组固定螺栓达定扭锁死',
          arm: '右手 (Right Arm)',
          skill: '定扭紧固',
          object: '模组螺栓 (第1组)',
          goal: '达到定扭扭矩 8.5N·m 紧固',
          startFrame: 1100,
          endFrame: 1480,
          color: '#ea580c',
          confidence: '99.6%',
          graspType: '动力输出锁紧',
          speedProfile: '定扭低速 (0.1m/s)',
          torqueLimit: '22.5 N·m',
          vlaToken: 'ACTION_FASTEN_MODULE_1',
          isAiGenerated: true,
        },
        {
          id: 106,
          text: '工位微调，左手按压第2模组，右手对齐侧向安装孔',
          arm: '双手 (Dual Arms)',
          skill: '工件压合',
          object: '第2电池模组',
          goal: '消除侧隙并对齐孔位',
          startFrame: 1480,
          endFrame: 1820,
          color: '#7c3aed',
          confidence: '98.9%',
          graspType: '侧向压紧定位',
          speedProfile: '平稳对准 (0.2m/s)',
          torqueLimit: '15.0 N·m',
          vlaToken: 'ACTION_ALIGN_MODULE_2',
          isAiGenerated: true,
        },
        {
          id: 107,
          text: '右手电钻高速旋拧紧固第2模组侧向螺栓',
          arm: '右手 (Right Arm)',
          skill: '定扭紧固',
          object: '模组螺栓 (第2组)',
          goal: '紧固侧向支架螺栓定扭',
          startFrame: 1820,
          endFrame: 2160,
          color: '#d946ef',
          confidence: '99.3%',
          graspType: '动力输出锁紧',
          speedProfile: '定扭低速 (0.1m/s)',
          torqueLimit: '22.0 N·m',
          vlaToken: 'ACTION_FASTEN_MODULE_2',
          isAiGenerated: true,
        },
        {
          id: 108,
          text: '右手对准并拧紧电池包金属提手支架螺栓',
          arm: '右手 (Right Arm)',
          skill: '结构紧固',
          object: '金属提手固定螺栓',
          goal: '完全锁定提手支架',
          startFrame: 2160,
          endFrame: 2480,
          color: '#059669',
          confidence: '99.0%',
          graspType: '动力输出锁紧',
          speedProfile: '定扭低速 (0.1m/s)',
          torqueLimit: '20.0 N·m',
          vlaToken: 'ACTION_FASTEN_BRACKET',
          isAiGenerated: true,
        },
        {
          id: 109,
          text: '右手平稳将电动螺栓枪放回台面右侧托架并脱手',
          arm: '右手 (Right Arm)',
          skill: '工具归位',
          object: '电动螺栓枪托架',
          goal: '安全归位工具释手',
          startFrame: 2480,
          endFrame: 2720,
          color: '#475569',
          confidence: '99.4%',
          graspType: '松开释放',
          speedProfile: '平稳归位 (0.3m/s)',
          torqueLimit: '4.0 N·m',
          vlaToken: 'ACTION_PUTDOWN_DRILL',
          isAiGenerated: true,
        },
        {
          id: 110,
          text: '装配完成，操作员双手释手并直立后退脱离工作台',
          arm: '双手 (Dual Arms)',
          skill: '作业释手',
          object: '电池包与工作台',
          goal: '完全脱离装配接触',
          startFrame: 2720,
          endFrame: 2950,
          color: '#0891b2',
          confidence: '98.8%',
          graspType: '零力矩释放',
          speedProfile: '后退释手 (0.4m/s)',
          torqueLimit: '0.0 N·m',
          vlaToken: 'ACTION_STEP_BACK',
          isAiGenerated: true,
        },
        {
          id: 111,
          text: '步巡离开工位，配合多目传感器完成示教后视场核验',
          arm: '双手 (Dual Arms)',
          skill: '环境核验',
          object: '周边多目传感器',
          goal: '确认台面作业质量及无遮挡',
          startFrame: 2950,
          endFrame: 3250,
          color: '#ca8a04',
          confidence: '98.5%',
          graspType: '自然下垂',
          speedProfile: '步巡移动 (0.5m/s)',
          torqueLimit: '0.0 N·m',
          vlaToken: 'ACTION_INSPECT_AREA',
          isAiGenerated: true,
        },
        {
          id: 112,
          text: '双臂与身体回到初始待命区，示教采集任务结束',
          arm: '双手 (Dual Arms)',
          skill: '任务结束',
          object: '示教待命区',
          goal: '回到原点待命终止录制',
          startFrame: 3250,
          endFrame: 3454,
          color: '#6366f1',
          confidence: '99.7%',
          graspType: '初始待命姿态',
          speedProfile: '复位归零 (0.3m/s)',
          torqueLimit: '0.0 N·m',
          vlaToken: 'ACTION_FINISH_DEMO',
          isAiGenerated: true,
        },
      ];

      setAiCandidateSteps(candidates);
      setAiSelectedCandidateIds(candidates.map(c => c.id));
      setAiInferenceStep('review');
    }, 2400);

    aiInferenceTimersRef.current = [t1, t2, t3, t4, t5];
  };

  // 确认导入并应用 AI 识别动作步骤至实例列表 (支持后台小窗口非阻塞流式批处理)
  const handleApplyAiSteps = (runInBackground = false) => {
    let selected = aiCandidateSteps.filter(s => aiSelectedCandidateIds.includes(s.id));
    if (selected.length === 0) {
      selected = aiCandidateSteps;
    }
    if (selected.length === 0) {
      message.warning('请至少勾选一个 AI 识别步骤');
      return;
    }

    const segmentsFromAi = selected.map(step => ({
      start: step.startFrame,
      end: step.endFrame,
      text: step.text,
      color: step.color || '#2563eb'
    }));

    const targetEpisodes = selectedRowKeys.length > 0
      ? episodes.filter(e => selectedRowKeys.includes(e.key))
      : episodes.filter(e => e.annoStatus !== '已标注');

    const actualTargets = targetEpisodes.length > 0 ? targetEpisodes : [episodes[0]];
    const totalCount = actualTargets.length;

    // 进入批量导入应用流程
    setAiInferenceStep('applying');
    setAiApplyTotal(totalCount);
    setAiApplyCurrentIndex(0);
    setAiApplyProgress(0);
    setAiApplyCurrentEpisode(actualTargets[0]?.instance || '实例_19884_001');

    if (runInBackground) {
      setIsAiModalMinimized(true);
      message.info(`已开启后台小窗口批量导入并应用，共 ${totalCount} 个视频序列，不影响页面其他操作。`);
    }

    let currentIdx = 0;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (aiApplyIntervalRef.current) clearInterval(aiApplyIntervalRef.current);

    aiApplyIntervalRef.current = setInterval(() => {
      currentIdx++;
      const percent = Math.min(100, Math.round((currentIdx / totalCount) * 100));
      const targetEp = actualTargets[currentIdx - 1];

      setAiApplyCurrentIndex(currentIdx);
      setAiApplyProgress(percent);
      if (targetEp) {
        setAiApplyCurrentEpisode(targetEp.instance);
      }

      // 增量更新 episode 状态
      if (targetEp) {
        setEpisodes(prev => prev.map(ep => {
          if (ep.key === targetEp.key) {
            return {
              ...ep,
              annoStatus: '待校验',
              modelTime: nowStr,
              segments: segmentsFromAi
            };
          }
          return ep;
        }));
      }

      if (currentIdx >= totalCount) {
        clearInterval(aiApplyIntervalRef.current);
        aiApplyIntervalRef.current = null;
        setAiInferenceStep('completed');
        setSelectedRowKeys([]);
        setSelectedRows([]);
        setActiveAnnoTab('to_verify');
        message.success(`🎉 AI 智能标注完成！已成功将通义千问 Qwen2.5-VL 推理的 ${selected.length} 项动作工步批量导入 ${totalCount} 个视频实例（已自动切换至【待校验】页签）。`);
      }
    }, Math.max(120, Math.min(260, 2400 / totalCount)));
  };

  const handleOpenBatchModal = () => {
    // If rows are selected, default to 'selected'; otherwise default to 'unannotated'
    setBatchTargetScope(selectedRowKeys.length > 0 ? 'selected' : 'unannotated');
    const firstRow = selectedRows[0] || episodes.find(e => e.annoStatus !== '已标注') || episodes[0];
    const recommended = allTemplates.find(t => 
      firstRow && (t.annoType === firstRow.annoType || t.device === firstRow.device)
    ) || allTemplates[0];

    setBatchTemplateId(recommended ? recommended.id : defaultSystemTemplate.id);
    setBatchStrategy('proportional');
    setTemplateSearchKeyword('');
    setTemplateCategoryTab('all');
    setCopyProgress(0);
    setIsCopying(false);
    setIsBatchModalOpen(true);
  };

  const applyStrategy = (segments, strategy, templateTotal, targetTotal) => {
    if (!segments || segments.length === 0) return [];
    if (strategy === 'proportional') {
      return segments.map(seg => {
        const startRatio = seg.start / templateTotal;
        const endRatio = seg.end / templateTotal;
        return {
          ...seg,
          start: Math.round(startRatio * targetTotal),
          end: Math.round(endRatio * targetTotal)
        };
      });
    } else if (strategy === 'fixed') {
      return segments.map(seg => {
        return {
          ...seg,
          start: Math.min(seg.start, targetTotal),
          end: Math.min(seg.end, targetTotal)
        };
      });
    } else if (strategy === 'full') {
      const n = segments.length;
      return segments.map((seg, i) => {
        return {
          ...seg,
          start: Math.round((i / n) * targetTotal),
          end: Math.round(((i + 1) / n) * targetTotal)
        };
      });
    }
    return segments;
  };

  const handleStartBatchCopy = () => {
    setIsCopying(true);
    setCopyProgress(0);
    const template = getSelectedTemplate();

    const targets = batchTargetScope === 'selected' && selectedRowKeys.length > 0
      ? episodes.filter(ep => selectedRowKeys.includes(ep.key))
      : batchTargetScope === 'all'
        ? episodes
        : episodes.filter(ep => ep.annoStatus !== '已标注');

    if (targets.length === 0) {
      message.warning('当前范围内无待适配的目标实例');
      setIsCopying(false);
      return;
    }

    const targetKeys = targets.map(t => t.key);

    const interval = setInterval(() => {
      setCopyProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);

          setEpisodes(prevEpisodes => {
            return prevEpisodes.map(ep => {
              if (targetKeys.includes(ep.key) && ep.id !== template.id) {
                const adjustedSegments = applyStrategy(
                  template.segments,
                  batchStrategy,
                  template.totalFrames,
                  ep.totalFrames
                );
                const nextStatus = ep.annoStatus === '未标注' ? '待校验' : '已标注';
                return {
                  ...ep,
                  annoStatus: nextStatus,
                  manualTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  segments: adjustedSegments
                };
              }
              return ep;
            });
          });

          setTimeout(() => {
            setIsCopying(false);
            setIsBatchModalOpen(false);
            setSelectedRowKeys([]);
            setSelectedRows([]);
            setActiveAnnoTab('to_verify');
            message.success(`✨ 批量时序适配标注完成！已自动为您切换至【待校验】页签等待审核。`);
          }, 300);

          return 100;
        }
        return prev + 15;
      });
    }, 100);
  };

  const handleBatchReset = () => {
    Modal.confirm({
      title: '确认清除标注？',
      content: `确定要清除选中的 ${selectedRowKeys.length} 个实例的标注数据吗？清除后不可恢复。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        setEpisodes(prev => prev.map(ep => {
          if (selectedRowKeys.includes(ep.key)) {
            return {
              ...ep,
              annoStatus: '未标注',
              auditStatus: '未审核',
              manualTime: '',
              segments: []
            };
          }
          return ep;
        }));
        setSelectedRowKeys([]);
        setSelectedRows([]);
        message.success('已批量清除标注数据！');
      }
    });
  };

  const handleStartUpload = () => {
    uploadForm.validateFields().then(values => {
      setIsUploading(true);
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            
            const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
            const currentLength = episodes.length;
            const isDual = currentLength % 2 === 0;
            
            const newEpisodes = [
              {
                key: `uploaded_${Date.now()}_1`,
                id: 744101 + currentLength + 10,
                taskName: values.dataType === 'mp4' ? '抓取物品示范(RGB视频)' : values.dataType === 'trajectory' ? '桌面整理任务(双臂协同)' : '垃圾分类投放(点位)',
                instance: `实例_${instanceId}_${String(currentLength + 1).padStart(3, '0')}`,
                annoTaskName: `自动解析标注_${String(currentLength + 1).padStart(2, '0')}`,
                device: isDual ? '双臂手眼协同设备 (Galbot-1.16)' : '天奇新动力 (Ego-Cam1)',
                annoType: currentAnnoType,
                targetType: currentAnnoType,
                totalFrames: values.totalFrames || 150,
                manualTime: '',
                modelTime: nowStr,
                parseStatus: '解析完成',
                annoStatus: '未标注',
                auditStatus: '未审核',
                hasError: false,
                segments: []
              },
              {
                key: `uploaded_${Date.now()}_2`,
                id: 744101 + currentLength + 11,
                taskName: values.dataType === 'mp4' ? '移动水杯演示(RGB视频)' : values.dataType === 'trajectory' ? '旋转圆形阀门(双臂)' : '工具使用反馈',
                instance: `实例_${instanceId}_${String(currentLength + 2).padStart(3, '0')}`,
                annoTaskName: `自动解析标注_${String(currentLength + 2).padStart(2, '0')}`,
                device: isDual ? '双臂手眼协同设备 (Galbot-1.16)' : '天奇新动力 (Ego-Cam1)',
                annoType: currentAnnoType,
                targetType: currentAnnoType,
                totalFrames: values.totalFrames || 180,
                manualTime: '',
                modelTime: nowStr,
                parseStatus: '解析完成',
                annoStatus: '未标注',
                auditStatus: '未审核',
                hasError: false,
                segments: []
              },
              {
                key: `uploaded_${Date.now()}_3`,
                id: 744101 + currentLength + 12,
                taskName: values.dataType === 'mp4' ? '垃圾处理教学(RGB视频)' : values.dataType === 'trajectory' ? '餐盘整理序列' : '开合抽屉轨迹',
                instance: `实例_${instanceId}_${String(currentLength + 3).padStart(3, '0')}`,
                annoTaskName: `自动解析标注_${String(currentLength + 3).padStart(2, '0')}`,
                device: isDual ? '双臂手眼协同设备 (Galbot-1.16)' : '天奇新动力 (Ego-Cam1)',
                annoType: currentAnnoType,
                targetType: currentAnnoType,
                totalFrames: values.totalFrames || 210,
                manualTime: '',
                modelTime: nowStr,
                parseStatus: '解析完成',
                annoStatus: '未标注',
                auditStatus: '未审核',
                hasError: false,
                segments: []
              }
            ];

            setEpisodes(prev => [...newEpisodes, ...prev]);
            
            setTimeout(() => {
              setIsUploading(false);
              setIsUploadModalOpen(false);
              setUploadFileList([]);
              message.success('🚀 成功上传并自动解析 3 个新具身动作序列数据！');
            }, 300);

            return 100;
          }
          return prev + 20;
        });
      }, 150);
    }).catch(() => {
      message.warning('请补充必填信息');
    });
  };

  const handleBatchAuditPass = () => {
    Modal.confirm({
      title: '确认批量审核通过？',
      content: `确定要将选中的 ${selectedRowKeys.length} 个实例的审核状态设置为「通过」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk() {
        setEpisodes(prev => prev.map(ep => {
          if (selectedRowKeys.includes(ep.key)) {
            return {
              ...ep,
              auditStatus: '通过',
              annoStatus: '已标注'
            };
          }
          return ep;
        }));
        setSelectedRowKeys([]);
        setSelectedRows([]);
        setActiveAnnoTab('annotated');
        message.success('🎉 批量审核通过成功！数据已流转完成并归档至【已标注 / 完成】页签。');
      }
    });
  };

  const handleBatchAuditReject = () => {
    Modal.confirm({
      title: '确认批量审核驳回？',
      content: `确定要将选中的 ${selectedRowKeys.length} 个实例的审核状态设置为「不通过」吗？`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        setEpisodes(prev => prev.map(ep => {
          if (selectedRowKeys.includes(ep.key)) {
            return {
              ...ep,
              auditStatus: '不通过'
            };
          }
          return ep;
        }));
        setSelectedRowKeys([]);
        setSelectedRows([]);
        message.warning('批量审核驳回操作成功！');
      }
    });
  };

  const filteredData = React.useMemo(() => {
    const list = episodes.filter(item => {
      // 标注状态页签过滤
      if (activeAnnoTab === 'unannotated' && item.annoStatus !== '未标注') return false;
      if (activeAnnoTab === 'annotated' && item.annoStatus !== '已标注') return false;
      if (activeAnnoTab === 'to_verify' && item.annoStatus !== '待校验') return false;
      if (activeAnnoTab === 'qc_failed' && item.auditStatus !== '不通过') return false;

      const idMatch = !filterId || String(item.id).includes(filterId);
      const annoMatch = !filterAnnoStatus || item.annoStatus === filterAnnoStatus;
      const auditMatch = !filterAuditStatus || item.auditStatus === filterAuditStatus;
      return idMatch && annoMatch && auditMatch;
    });

    // Sort: '未标注' 置前，已标注/待校验置后
    return [...list].sort((a, b) => {
      const aIsFinished = a.annoStatus === '已标注' || a.annoStatus === '待校验';
      const bIsFinished = b.annoStatus === '已标注' || b.annoStatus === '待校验';
      if (!aIsFinished && bIsFinished) return -1;
      if (aIsFinished && !bIsFinished) return 1;
      return a.id - b.id;
    });
  }, [episodes, filterId, filterAnnoStatus, filterAuditStatus, activeAnnoTab]);

  // Stats
  const totalCount = episodes.length;
  const annoCount = episodes.filter(d => d.annoStatus === '已标注' || d.annoStatus === '待校验').length;
  const auditPassCount = episodes.filter(d => d.auditStatus === '通过').length;
  const auditRejectCount = episodes.filter(d => d.auditStatus === '不通过').length;

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90, render: (t) => <Text style={{ fontFamily: 'monospace', color: '#1677ff' }}>{t}</Text> },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 140 },
    { title: '实例', dataIndex: 'instance', key: 'instance', width: 160, ellipsis: true },
    { 
      title: '采集设备', 
      dataIndex: 'device', 
      width: 220, 
      ellipsis: true,
      render: (d) => {
        const isDual = d.includes('双臂');
        return (
          <Space size={4}>
            <Badge status={isDual ? 'processing' : 'warning'} />
            <Text strong={isDual} style={{ color: isDual ? '#0958d9' : '#d46b08' }}>{d}</Text>
          </Space>
        );
      }
    },
    { title: '标注任务名', dataIndex: 'annoTaskName', width: 180, ellipsis: true },
    {
      title: '标注类型', dataIndex: 'annoType', width: 120, align: 'center',
      render: (t) => <Tag color={annoTypeColors[t] || 'blue'} style={{ margin: 0, fontWeight: 600 }}>{t}</Tag>
    },
    { title: '数据帧数', dataIndex: 'totalFrames', width: 100, align: 'right', render: (t) => <strong>{t} f</strong> },
    { title: '人工标注时间', dataIndex: 'manualTime', width: 160, render: (t) => t || <Text type="secondary">-</Text> },
    { title: '模型标注时间', dataIndex: 'modelTime', width: 160, render: (t) => t || <Text type="secondary">-</Text> },
    { 
      title: '解析状态', 
      dataIndex: 'parseStatus', 
      width: 100, 
      align: 'center',
      render: (s) => <Tag color="success" style={{ background: '#f6ffed', color: '#52c41a', border: '1px solid #b7eb8f', borderRadius: 4 }}>{s}</Tag> 
    },
    { 
      title: '标注状态', 
      dataIndex: 'annoStatus', 
      width: 150, 
      align: 'center',
      render: (s, r) => {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <StatusTag status={s} />
            {s === '已标注' && r.segments && (
              <span style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>
                ({r.segments.length}段时序标注)
              </span>
            )}
          </div>
        );
      }
    },
    { 
      title: '审核状态', 
      dataIndex: 'auditStatus', 
      width: 100, 
      align: 'center',
      render: (s) => <StatusTag status={s === '不通过' ? '未通过' : s}>{s}</StatusTag>
    },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, r) => {
        const targetType = currentAnnoType;
        const targetEpisodeId = r.episodeId || r.id;
        return (
          <Space size={4}>
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />}
              style={{ padding: '0 4px', fontWeight: 600 }}
              disabled={r.annoStatus === '已标注' || r.annoStatus === '待校验' || activeAnnoTab === 'to_verify'}
              onClick={() => router.push(buildStaticHref(STATIC_ROUTES.auditWorkbench, {
                id: instanceId,
                episodeId: targetEpisodeId,
                type: targetType,
                mode: 'annotate',
              }))}
            >
              标注
            </Button>
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              style={{ padding: '0 4px' }}
              onClick={() => router.push(buildStaticHref(STATIC_ROUTES.auditWorkbench, {
                id: instanceId,
                episodeId: targetEpisodeId,
                type: targetType,
                mode: 'view',
              }))}
            >
              查看
            </Button>
            <Button 
              type="link" 
              size="small" 
              icon={<UndoOutlined />}
              style={{ padding: '0 4px' }}
              danger
              onClick={() => {
                setEpisodes(prev => prev.map(ep => {
                  if (ep.id === r.id) {
                    return {
                      ...ep,
                      annoStatus: '未标注',
                      auditStatus: '未审核',
                      manualTime: '',
                      segments: []
                    };
                  }
                  return ep;
                }));
                message.success(`已重置 ${r.id} 的标注状态`);
              }}
            >
              重置
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <MainLayout>
      <div className="ui-page ui-detail-page">
        <PageHeader
          title={`标注工作台 — 实例 #${instanceId} (${currentAnnoType})`}
          description={`统一管理当前任务【${currentAnnoType}】下的视频切片与数据标注进度。本任务单一专项目标：【${currentAnnoType}】，已按规范隔离其他标注类型。`}
          breadcrumbs={[
            { title: '数据标注' },
            { title: '标注工作台', href: '/annotation/audit' },
            { title: `实例详情 (${currentAnnoType})` },
          ]}
          back={<Button type="text" icon={<LeftOutlined />} onClick={() => router.push('/annotation/audit')} style={{ fontWeight: 500 }}>返回列表</Button>}
          extra={[
            <Button key="close" type="text" aria-label="关闭" icon={<CloseOutlined />} onClick={() => router.push('/annotation/audit')} />,
          ]}
        />

        {/* Stats Row */}
        <div className="ui-form-section" style={{ display: 'flex', gap: 24 }}>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>总数据量</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{totalCount}</div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#e6f4ff', border: '1px solid #91caff' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EditOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>已标注</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{annoCount} <Text type="secondary" style={{ fontSize: 12 }}>/ {totalCount}</Text></div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#f9f0ff', border: '1px solid #d3adf7' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#722ed1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AuditOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>审核通过</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{auditPassCount} <Text type="secondary" style={{ fontSize: 12 }}>/ {annoCount}</Text></div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#fff2f0', border: '1px solid #ffccc7' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExclamationCircleOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>审核驳回</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{auditRejectCount}</div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="ui-form-section">
          <Form layout="inline">
            <Row gutter={[12, 12]} style={{ width: '100%' }}>
              <Col><Input placeholder="ID" style={{ width: 140 }} value={filterId} onChange={e => setFilterId(e.target.value)} prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} allowClear /></Col>
              <Col>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '0 10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6
                }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>标注类型:</span>
                  <Tag color={annoTypeColors[currentAnnoType] || 'blue'} style={{ margin: 0, fontWeight: 700 }}>
                    {currentAnnoType}（本任务单一固定）
                  </Tag>
                </div>
              </Col>
              <Col>
                <Select placeholder="标注状态" style={{ width: 140 }} allowClear value={filterAnnoStatus} onChange={setFilterAnnoStatus}
                  options={['已标注', '未标注', '待校验'].map(s => ({ label: s, value: s }))}
                />
              </Col>
              <Col>
                <Select placeholder="审核状态" style={{ width: 140 }} allowClear value={filterAuditStatus} onChange={setFilterAuditStatus}
                  options={['未审核', '审核中', '通过', '不通过'].map(s => ({ label: s, value: s }))}
                />
              </Col>
              <Col>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                  <Button icon={<ReloadOutlined />} onClick={() => { setFilterId(''); setFilterAnnoStatus(null); setFilterAuditStatus(null); setActiveAnnoTab('all'); }}>重置</Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>

        {/* Table Section */}
        <Card
          className="ui-table-card"
          title={
            <Space size={12} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>数据列表</span>
              {selectedRowKeys.length > 0 && (
                <span style={{ fontSize: 12, color: '#0958d9', fontWeight: 600, marginLeft: 4 }}>
                  已选 {selectedRowKeys.length} 条
                  <Button size="small" type="link" style={{ fontSize: 12, padding: '0 4px' }} onClick={() => { setSelectedRowKeys([]); setSelectedRows([]); }}>取消</Button>
                </span>
              )}
            </Space>
          }
          extra={
            <Space size={8} style={{ display: 'flex', alignItems: 'center' }}>
              {/* AI标注按钮 */}
              <Button 
                type="primary" 
                size="small" 
                icon={<RobotOutlined />} 
                style={{ 
                  background: 'linear-gradient(135deg, #1677ff 0%, #2563eb 100%)', 
                  borderColor: '#1677ff', 
                  fontWeight: 600,
                  boxShadow: '0 2px 6px rgba(22, 119, 255, 0.28)'
                }}
                onClick={handleOpenAiModal}
              >
                AI标注{selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}
              </Button>
              {/* 批量时序适配标注按钮 */}
              <Button 
                type="primary" 
                size="small" 
                icon={<CopyOutlined />} 
                style={{ background: '#1677ff', borderColor: '#1677ff', fontWeight: 600 }}
                onClick={handleOpenBatchModal}
              >
                批量时序适配标注{selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}
              </Button>
              {/* 批量清除标注 (勾选时显示) */}
              {selectedRowKeys.length > 0 && (
                <Button 
                  size="small" 
                  danger
                  icon={<UndoOutlined />}
                  onClick={handleBatchReset}
                >
                  批量清除
                </Button>
              )}
              {/* 分隔线 */}
              <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
              {/* 原有刷新/密度/列设置 */}
              <TableToolbarActions
                columns={columns}
                density={tableDensity}
                onDensityChange={setTableDensity}
                hiddenColumns={hiddenColumns}
                onHiddenColumnsChange={setHiddenColumns}
                onRefresh={() => message.success('数据已刷新')}
              />
            </Space>
          }
          tabList={[
            { key: 'unannotated', tab: `未标注 (${episodes.filter(e => e.annoStatus === '未标注').length})` },
            { key: 'to_verify', tab: `待校验 (${episodes.filter(e => e.annoStatus === '待校验').length})` },
            { key: 'annotated', tab: `已标注 / 完成 (${episodes.filter(e => e.annoStatus === '已标注').length})` },
            { key: 'qc_failed', tab: `❌ 质检不通过 (${episodes.filter(e => e.auditStatus === '不通过').length})` },
            { key: 'all', tab: `全部 (${episodes.length})` },
          ]}
          activeTabKey={activeAnnoTab}
          onTabChange={(key) => setActiveAnnoTab(key)}
          styles={{ body: { padding: 0 } }}
          style={{ borderRadius: 8 }}
        >
          <Table 
            rowSelection={{
              selectedRowKeys,
              onChange: (keys, rows) => {
                setSelectedRowKeys(keys);
                setSelectedRows(rows);
              }
            }}
            columns={columns.filter(col => !hiddenColumns.includes(col.key))} 
            dataSource={filteredData} 
            pagination={{ 
              pageSize: 20, 
              showTotal: (t) => `共 ${t} 条`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50']
            }}
            size={tableDensity}
            scroll={{ x: 1600 }}
          />
        </Card>
      </div>

      {/* ----------------------------------------------------
          POPUP MODAL: AI 智能标注 (通义千问 Qwen2.5-VL)
          ---------------------------------------------------- */}
      <Modal
        title={(
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
            <Space size={10}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 16
              }}>
                <RobotOutlined />
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                动作时序切分与预标注
              </span>
            </Space>

            {/* 放置在关闭 [✕] 正前面的显式“缩小为小窗”按钮 */}
            <Tooltip title="缩小为后台悬浮小窗，在后台非阻塞运行">
              <Button
                size="small"
                icon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px' }}>
                    <rect x="2" y="3" width="20" height="15" rx="2" ry="2" />
                    <rect x="12" y="10" width="8" height="6" rx="1" fill="#2563eb" fillOpacity="0.25" />
                  </svg>
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAiModalMinimized(true);
                  message.info('已缩小为后台悬浮小窗运行，您可继续在页面中进行其他操作');
                }}
                style={{
                  height: 26,
                  padding: '0 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#2563eb',
                  background: '#eff6ff',
                  borderColor: '#bfdbfe',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer'
                }}
              >
                缩小为小窗
              </Button>
            </Tooltip>
          </div>
        )}
        closeIcon={<CloseOutlined style={{ fontSize: 14 }} />}
        open={isAiModalOpen && !isAiModalMinimized}
        onCancel={() => {
          setIsAiModalOpen(false);
          setIsAiModalMinimized(false);
          setAiInferenceStep('config');
        }}
        width={760}
        footer={null}
        destroyOnClose={false}
      >
        <div style={{ marginTop: 8 }}>
          {/* STAGE 1: 算法与策略配置 */}
          {aiInferenceStep === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 1. 动作时序切分模式 */}
              <Card size="small" title="1. 动作时序切分模式" style={{ borderRadius: 8 }}>
                <Radio.Group
                  value={aiMode}
                  onChange={e => setAiMode(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
                    <Radio value="full_segmentation">
                      <strong>全视频端到端时序切分</strong>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                        (覆盖全程 3454 帧，12 个连贯工步紧密衔接，100% 满铺无空白)
                      </span>
                    </Radio>
                    <Radio value="window_sliding">
                      <strong>局部短窗口精准采样分析</strong>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                        (硬件级截帧切片，毫秒级定位物理接触跳变点)
                      </span>
                    </Radio>
                    <Radio value="template_align">
                      <strong>工业装配 SOP 动作模板对齐</strong>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                        (依据天奇新动力工序标准，AI 自动对齐区间)
                      </span>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Card>

              {/* 2. 采样密度、置信度过滤与导入策略 */}
              <Card size="small" title="2. 采样切片密度、置信度过滤与导入策略" style={{ borderRadius: 8 }}>
                <Row gutter={[16, 12]} align="middle">
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#334155', marginBottom: 4, fontWeight: 600 }}>
                      抽帧切片密度：
                    </div>
                    <Radio.Group
                      value={aiFramesPerWindow}
                      onChange={e => setAiFramesPerWindow(e.target.value)}
                      size="small"
                    >
                      <Radio.Button value={6}>6 帧 (推荐极速)</Radio.Button>
                      <Radio.Button value={10}>10 帧 (平衡)</Radio.Button>
                      <Radio.Button value={12}>12 帧 (精细)</Radio.Button>
                    </Radio.Group>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#334155', marginBottom: 4, fontWeight: 600 }}>
                      置信度过滤阈值：{aiConfidenceThreshold}%
                    </div>
                    <Slider
                      min={70}
                      max={99}
                      value={aiConfidenceThreshold}
                      onChange={setAiConfidenceThreshold}
                      styles={{
                        track: { background: '#2563eb' },
                        handle: { borderColor: '#2563eb' }
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#334155', marginBottom: 4, fontWeight: 600 }}>
                      工作台导入策略：
                    </div>
                    <Radio.Group
                      value={aiStrategy}
                      onChange={e => setAiStrategy(e.target.value)}
                      size="small"
                    >
                      <Radio.Button value="append">追加合并</Radio.Button>
                      <Radio.Button value="replace">全新覆盖</Radio.Button>
                    </Radio.Group>
                  </Col>
                </Row>
              </Card>

              {/* 底部操作栏 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <Button onClick={() => setIsAiModalOpen(false)}>
                  取消
                </Button>
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  onClick={() => handleStartAiInference(false)}
                  style={{
                    background: 'linear-gradient(135deg, #1677ff 0%, #2563eb 100%)',
                    border: 'none',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(22, 119, 255, 0.35)',
                    color: '#fff'
                  }}
                >
                  启动动作切分推理
                </Button>
              </div>
            </div>
          )}

          {/* STAGE 2: 推理中动效 */}
          {aiInferenceStep === 'inferring' && (
            <div style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1677ff',
                fontSize: 28,
                boxShadow: '0 0 24px rgba(22, 119, 255, 0.25)'
              }}>
                <RobotOutlined spin />
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  通义千问 Qwen2.5-VL 正在执行多模态时序分析...
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {aiProgressStage}
                </div>
              </div>

              <div style={{ width: '80%' }}>
                <Progress
                  percent={aiProgress}
                  status="active"
                  strokeColor={{ '0%': '#1677ff', '50%': '#2563eb', '100%': '#0284c7' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 18, fontSize: 11, color: '#64748b', marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span>✓ 4路多机位时钟对齐</span>
                <span>✓ Qwen2.5-VL 视觉内核直连</span>
                <span>✓ 关节力矩跳变提取</span>
                <span>✓ 3454帧 100% 满铺切分</span>
              </div>

              <Button
                size="small"
                onClick={() => {
                  setAiInferenceStep('config');
                }}
                style={{ marginTop: 10 }}
              >
                取消推理
              </Button>
            </div>
          )}

          {/* STAGE 3: 人机协同审核与导入确认 */}
          {aiInferenceStep === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 候选列表工具栏 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={8}>
                  <Checkbox
                    indeterminate={aiSelectedCandidateIds.length > 0 && aiSelectedCandidateIds.length < aiCandidateSteps.length}
                    checked={aiSelectedCandidateIds.length === aiCandidateSteps.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAiSelectedCandidateIds(aiCandidateSteps.map(s => s.id));
                      } else {
                        setAiSelectedCandidateIds([]);
                      }
                    }}
                  >
                    全选候选步骤
                  </Checkbox>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    (已选 <strong style={{ color: '#1677ff' }}>{aiSelectedCandidateIds.length}</strong> / {aiCandidateSteps.length} 项)
                  </span>
                </Space>
                <Tag color="green">平均置信度 98.7% · 12 个工步密集相接</Tag>
              </div>

              {/* 候选列表卡片 */}
              <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                {aiCandidateSteps.map((candidate, idx) => {
                  const isChecked = aiSelectedCandidateIds.includes(candidate.id);
                  return (
                    <div
                      key={candidate.id}
                      style={{
                        border: isChecked ? '1.5px solid #1677ff' : '1px solid #e2e8f0',
                        borderRadius: 8,
                        background: isChecked ? '#f0f7ff' : '#fff',
                        padding: '10px 12px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAiSelectedCandidateIds([...aiSelectedCandidateIds, candidate.id]);
                              } else {
                                setAiSelectedCandidateIds(aiSelectedCandidateIds.filter(id => id !== candidate.id));
                              }
                            }}
                          />
                          <span style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: candidate.color || '#7c3aed',
                            color: '#fff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {candidate.text}
                          </span>
                        </div>

                        <Space size={6}>
                          <Tag color="purple" style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                            置信度: {candidate.confidence}
                          </Tag>
                          <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                            {candidate.endFrame - candidate.startFrame} 帧
                          </Tag>
                        </Space>
                      </div>

                      {/* 结构化标签行 */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, paddingLeft: 30 }}>
                        <Tag color="purple">{candidate.arm}</Tag>
                        <Tag color="green">{candidate.skill}</Tag>
                        <Tag color="blue">{candidate.object}</Tag>
                        <Tag color="orange">{candidate.goal}</Tag>
                      </div>

                      {/* 帧区间微调行 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 30, background: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>起始帧:</span>
                        <InputNumber
                          size="small"
                          value={candidate.startFrame}
                          onChange={(val) => {
                            setAiCandidateSteps(prev => prev.map(s => s.id === candidate.id ? { ...s, startFrame: val } : s));
                          }}
                          style={{ width: 85, fontSize: 11 }}
                        />
                        <span style={{ fontSize: 11, color: '#64748b' }}>结束帧:</span>
                        <InputNumber
                          size="small"
                          value={candidate.endFrame}
                          onChange={(val) => {
                            setAiCandidateSteps(prev => prev.map(s => s.id === candidate.id ? { ...s, endFrame: val } : s));
                          }}
                          style={{ width: 85, fontSize: 11 }}
                        />
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>区间: [{candidate.startFrame}, {candidate.endFrame}]</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 审核底部操作栏 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <Button
                  size="small"
                  onClick={() => setAiInferenceStep('config')}
                >
                  重新配置
                </Button>
                <Space>
                  <Button onClick={() => setIsAiModalOpen(false)}>
                    取消
                  </Button>

                  <Button
                    type="primary"
                    onClick={() => handleApplyAiSteps(false)}
                    style={{
                      background: 'linear-gradient(135deg, #1677ff 0%, #2563eb 100%)',
                      border: 'none',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(22, 119, 255, 0.35)',
                      color: '#fff'
                    }}
                  >
                    确认导入并应用 ({aiSelectedCandidateIds.length} 项 · 全时序 100% 覆盖)
                  </Button>
                </Space>
              </div>
            </div>
          )}

          {/* STAGE 4: 批量导入并应用至多个视频实例 */}
          {aiInferenceStep === 'applying' && (
            <div style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1677ff',
                fontSize: 28,
                boxShadow: '0 0 24px rgba(22, 119, 255, 0.25)'
              }}>
                <SyncOutlined spin />
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  正在批量导入并应用 AI 动作工步至视频序列...
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  当前处理：<strong style={{ color: '#2563eb' }}>{aiApplyCurrentEpisode}</strong> ({aiApplyCurrentIndex}/{aiApplyTotal})
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  已写入 {aiCandidateSteps.length} 项动作工步 · 满铺 100% 时序覆盖 · 状态自动转为「待校验」
                </div>
              </div>

              <div style={{ width: '85%' }}>
                <Progress
                  percent={aiApplyProgress}
                  status="active"
                  strokeColor={{ '0%': '#1677ff', '100%': '#22c55e' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Button
                  type="primary"
                  icon={<CompressOutlined />}
                  onClick={() => {
                    setIsAiModalMinimized(true);
                    message.info('已转入后台小窗口运行，您可以继续在页面中浏览和审核其他数据');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #1677ff 0%, #2563eb 100%)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(22, 119, 255, 0.25)'
                  }}
                >
                  ⚡ 缩小为小窗口在后台运行 (不卡顿)
                </Button>
              </div>
            </div>
          )}

          {/* STAGE 5: 批量导入并应用完成 */}
          {aiInferenceStep === 'completed' && (
            <div style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                fontSize: 32
              }}>
                <CheckCircleOutlined />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                🎉 批量导入并应用完成！
              </div>
              <div style={{ fontSize: 13, color: '#64748b', maxWidth: 460 }}>
                已成功为 {aiApplyTotal} 个视频序列注入通义千问 Qwen2.5-VL 识别的 {aiCandidateSteps.length} 项标准化动作工步。全部实例已就绪并归入【待校验】页签。
              </div>
              <Space size={12} style={{ marginTop: 12 }}>
                <Button onClick={() => { setIsAiModalOpen(false); setAiInferenceStep('config'); }}>
                  关闭窗口
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    setIsAiModalOpen(false);
                    setAiInferenceStep('config');
                    setActiveAnnoTab('to_verify');
                  }}
                  style={{ background: '#16a34a', borderColor: '#16a34a' }}
                >
                  立即前往【待校验】审核实例 ➔
                </Button>
              </Space>
            </div>
          )}
        </div>
      </Modal>

      {/* ----------------------------------------------------
          POPUP MODAL: 批量时序适配标注配置 
          ---------------------------------------------------- */}
      <Modal
        title={(
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
            <span style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CopyOutlined style={{ color: '#1677ff' }} /> 批量时序适配标注
            </span>

            {/* 放置在关闭 [✕] 正前面的显式“缩小为小窗”按钮 */}
            <Tooltip title="缩小为后台悬浮小窗，在后台非阻塞运行">
              <Button
                size="small"
                icon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px' }}>
                    <rect x="2" y="3" width="20" height="15" rx="2" ry="2" />
                    <rect x="12" y="10" width="8" height="6" rx="1" fill="#2563eb" fillOpacity="0.25" />
                  </svg>
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBatchModalMinimized(true);
                  message.info('批量时序适配任务已转入后台小窗口运行，您可继续在页面中操作');
                }}
                style={{
                  height: 26,
                  padding: '0 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#2563eb',
                  background: '#eff6ff',
                  borderColor: '#bfdbfe',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer'
                }}
              >
                缩小为小窗
              </Button>
            </Tooltip>
          </div>
        )}
        closeIcon={<CloseOutlined style={{ fontSize: 14 }} />}
        open={isBatchModalOpen && !isBatchModalMinimized}
        onCancel={() => !isCopying && setIsBatchModalOpen(false)}
        footer={null}
        width={750}
        mask={{ closable: !isCopying }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        {isCopying ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <LoadingOutlined style={{ fontSize: 32, color: '#1677ff', marginBottom: 16 }} spin />
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}>
              正在批量适配复制中，请稍候... ({copyProgress}%)
            </div>
            <Progress percent={copyProgress} strokeColor="#1677ff" status="active" style={{ maxWidth: 400, margin: '0 auto' }} />
            <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
              💡 如需继续浏览或操作其他实例，可点击右上角【—】最小化至后台小窗运行
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* 1. Select Template with Quick Search & Category Filters */}
            <Card 
              size="small" 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 'bold' }}>1. 选择标注模版 (Template Source)</span>
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<SearchOutlined />} 
                    style={{ fontSize: 12, padding: 0 }}
                    onClick={() => setIsTemplatePickerOpen(true)}
                  >
                    模版库大图检索 ({allTemplates.length}) ➔
                  </Button>
                </div>
              } 
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}
            >
              <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                {/* Category Quick Tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>快速分类:</span>
                  {[
                    { key: 'all', label: '全部模版' },
                    { key: 'recommend', label: '🎯 最佳匹配推荐' },
                    { key: 'preset', label: '⭐ 系统标准SOP' },
                    { key: 'dual_arm', label: '🤖 双臂协同' },
                    { key: 'single_arm', label: '🦾 单臂遥操' },
                  ].map(tab => (
                    <Tag.CheckableTag
                      key={tab.key}
                      checked={templateCategoryTab === tab.key}
                      onChange={() => setTemplateCategoryTab(tab.key)}
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: templateCategoryTab === tab.key ? '#1677ff' : '#f1f5f9',
                        color: templateCategoryTab === tab.key ? '#fff' : '#475569',
                        border: '1px solid ' + (templateCategoryTab === tab.key ? '#1677ff' : '#cbd5e1')
                      }}
                    >
                      {tab.label}
                    </Tag.CheckableTag>
                  ))}
                </div>

                {/* Search & Select Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Select 
                    showSearch
                    placeholder="输入模版名称 / 实例ID / 动作关键词搜索..."
                    style={{ flex: 1 }} 
                    value={batchTemplateId} 
                    onChange={setBatchTemplateId}
                    filterOption={(input, option) => {
                      const label = String(option?.label || option?.children || '');
                      return label.toLowerCase().includes(input.toLowerCase());
                    }}
                    dropdownMatchSelectWidth={false}
                  >
                    {/* Category 1: 智能推荐 */}
                    {(templateCategoryTab === 'all' || templateCategoryTab === 'recommend') && (
                      <Select.OptGroup label="🎯 最佳匹配推荐 (根据选中的设备与任务自动计算)">
                        {allTemplates
                          .filter(t => {
                            const firstRow = selectedRows[0];
                            if (!firstRow) return false;
                            return t.annoType === firstRow.annoType || t.device === firstRow.device;
                          })
                          .slice(0, 3)
                          .map(t => (
                            <Option key={`rec_${t.id}`} value={t.id} label={`${t.taskName} ${t.id} ${t.device} ${t.stepMode}`}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>
                                  <Tag color="blue" style={{ fontSize: 10 }}>推荐</Tag>
                                  <strong>{t.taskName}</strong>
                                </span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>
                                  {t.totalFrames}帧 · {t.segments.length}步 · <Tag color="geekblue" style={{ fontSize: 10 }}>{t.stepMode}</Tag>
                                </span>
                              </div>
                            </Option>
                          ))}
                      </Select.OptGroup>
                    )}

                    {/* Category 2: 系统预设SOP模版 */}
                    {(templateCategoryTab === 'all' || templateCategoryTab === 'preset' || templateCategoryTab === 'dual_arm' || templateCategoryTab === 'single_arm') && (
                      <Select.OptGroup label="⭐ 系统标准 SOP 模版库">
                        {systemPresetLibrary
                          .filter(t => {
                            if (templateCategoryTab === 'dual_arm') return t.category === 'dual_arm';
                            if (templateCategoryTab === 'single_arm') return t.category === 'single_arm';
                            return true;
                          })
                          .map(t => (
                            <Option key={t.id} value={t.id} label={`${t.taskName} ${t.id} ${t.device} ${t.stepMode}`}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>
                                  <Tag color="gold" style={{ fontSize: 10 }}>SOP</Tag>
                                  {t.taskName}
                                </span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>
                                  {t.totalFrames}帧 · {t.segments.length}步 · <Tag color="purple" style={{ fontSize: 10 }}>{t.stepMode}</Tag>
                                </span>
                              </div>
                            </Option>
                          ))}
                      </Select.OptGroup>
                    )}

                    {/* Category 3: 项目历史精选标注实例 */}
                    {(templateCategoryTab === 'all' || templateCategoryTab === 'dual_arm' || templateCategoryTab === 'single_arm') && annotatedTemplates.length > 0 && (
                      <Select.OptGroup label="📋 本项目历史优质已标注实例">
                        {annotatedTemplates
                          .filter(ep => {
                            if (templateCategoryTab === 'dual_arm') return ep.device.includes('双臂');
                            if (templateCategoryTab === 'single_arm') return !ep.device.includes('双臂');
                            return true;
                          })
                          .map(t => (
                            <Option key={t.id} value={t.id} label={`${t.taskName} 实例_${t.id} ${t.device}`}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>
                                  <Tag color="cyan" style={{ fontSize: 10 }}>实例#{t.id}</Tag>
                                  {t.taskName}
                                </span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>
                                  {t.totalFrames}帧 · {t.segments.length}段标注
                                </span>
                              </div>
                            </Option>
                          ))}
                      </Select.OptGroup>
                    )}
                  </Select>

                  <Button 
                    icon={<SearchOutlined />} 
                    onClick={() => setIsTemplatePickerOpen(true)}
                  >
                    图库浏览
                  </Button>
                </div>

                {/* Selected Template Live Preview Card */}
                <div style={{ background: '#f0f9ff', padding: '10px 14px', borderRadius: 6, fontSize: 12, color: '#0369a1', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong>🔍 当前模版时序步骤预览 ({getSelectedTemplate().taskName})：</strong>
                    <Space size={4}>
                      <Tag color="blue">{getSelectedTemplate().device}</Tag>
                      <Tag color="geekblue">{getSelectedTemplate().stepMode || '结构化步骤'}</Tag>
                      <Tag color="orange">{getSelectedTemplate().totalFrames} 帧</Tag>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {getSelectedTemplate().segments.map((seg, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ minWidth: 20, height: 20, borderRadius: '50%', background: seg.color || '#2563eb', color: '#fff', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 'bold', color: '#334155', minWidth: 90 }}>
                          [{seg.start}f - {seg.end}f]
                        </span>
                        <code style={{ background: '#fff', padding: '2px 6px', border: '1px solid #bfdbfe', borderRadius: 4, color: '#1e293b', flex: 1 }}>
                          {seg.text}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Choose Strategy */}
            <Card size="small" title={<span style={{ fontSize: 12, fontWeight: 'bold' }}>2. 选择时间段适配策略 (Temporal Strategy)</span>}>
              <Radio.Group 
                value={batchStrategy} 
                onChange={(e) => setBatchStrategy(e.target.value)}
                style={{ width: '100%' }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Radio value="proportional" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: 12 }}>按比例适配 (Proportional)</strong>
                      <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4 }}>
                        按目标帧长等比拉伸。若模板动作处于15%-45%区间，目标实例亦调整为同样的百分比区间。
                      </span>
                    </Radio>
                  </Col>
                  <Col span={8}>
                    <Radio value="fixed" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: 12 }}>固定帧数适配 (Fixed Frame)</strong>
                      <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4 }}>
                        严格保持模板的帧数值。如模板是 18f-54f，目标不管总帧数多长均对应 18f-54f。
                      </span>
                    </Radio>
                  </Col>
                  <Col span={8}>
                    <Radio value="full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: 12 }}>全程适配 (Full Duration)</strong>
                      <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4 }}>
                        平分整个视频。若模板含两段动作，则目标实例自动均分为前50%与后50%两段。
                      </span>
                    </Radio>
                  </Col>
                </Row>
              </Radio.Group>
            </Card>

            {/* 3. Targets Adaptation Preview */}
            <Card 
              size="small" 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 'bold' }}>3. 目标实例范围与自适应预览 (Adaptation Preview)</span>
                  <Radio.Group 
                    size="small" 
                    value={batchTargetScope} 
                    onChange={e => setBatchTargetScope(e.target.value)}
                  >
                    <Radio.Button value="unannotated">
                      未标注 ({episodes.filter(e => e.annoStatus !== '已标注').length})
                    </Radio.Button>
                    <Radio.Button value="selected" disabled={selectedRowKeys.length === 0}>
                      当前勾选 ({selectedRowKeys.length})
                    </Radio.Button>
                    <Radio.Button value="all">
                      全部 ({episodes.length})
                    </Radio.Button>
                  </Radio.Group>
                </div>
              }
            >
              {(() => {
                const template = getSelectedTemplate();
                const targetList = batchTargetScope === 'selected' && selectedRowKeys.length > 0
                  ? episodes.filter(ep => selectedRowKeys.includes(ep.key))
                  : batchTargetScope === 'all'
                    ? episodes
                    : episodes.filter(ep => ep.annoStatus !== '已标注');
                const validTargets = targetList.filter(r => r.id !== template.id);

                return (
                  <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                    <List
                      size="small"
                      dataSource={validTargets}
                      renderItem={item => {
                        const adapted = applyStrategy(template.segments, batchStrategy, template.totalFrames, item.totalFrames);
                        return (
                          <List.Item style={{ fontSize: 11, padding: '4px 8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <span>
                                实例 <strong>#{item.id}</strong> ({item.taskName}, 总长 <strong>{item.totalFrames}帧</strong>)
                              </span>
                              <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                                {adapted.length > 0 
                                  ? adapted.map(a => `[${a.start}-${a.end}f]`).join(' + ')
                                  : '无标注段'}
                              </span>
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                    {validTargets.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 8, fontSize: 11 }}>
                        当前目标范围内暂无待适配实例（如需指定请切换上方目标范围或在列表勾选）
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
              <Button onClick={() => setIsBatchModalOpen(false)}>
                取消
              </Button>
              {(() => {
                const template = getSelectedTemplate();
                const targetList = batchTargetScope === 'selected' && selectedRowKeys.length > 0
                  ? episodes.filter(ep => selectedRowKeys.includes(ep.key))
                  : batchTargetScope === 'all'
                    ? episodes
                    : episodes.filter(ep => ep.annoStatus !== '已标注');
                const validTargets = targetList.filter(r => r.id !== template.id);
                return (
                  <Button 
                    type="primary" 
                    disabled={validTargets.length === 0}
                    onClick={handleStartBatchCopy}
                    style={{ background: '#1677ff', borderColor: '#1677ff', fontWeight: 'bold' }}
                  >
                    开始批量时序适配 ({validTargets.length})
                  </Button>
                );
              })()}
            </div>
            
          </div>
        )}
      </Modal>


      {/* ----------------------------------------------------
          POPUP MODAL: 上传数据 (Upload Data)
          ---------------------------------------------------- */}
      <Modal
        title={
          <Space>
            <UploadOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>上传数据 (导入机器人序列)</span>
          </Space>
        }
        open={isUploadModalOpen}
        onCancel={() => !isUploading && setIsUploadModalOpen(false)}
        onOk={handleStartUpload}
        okText="确认上传并自动解析"
        cancelText="取消"
        okButtonProps={{ style: { background: '#1677ff', borderColor: '#1677ff', fontWeight: 'bold' }, disabled: uploadFileList.length === 0 || isUploading }}
        width={640}
        destroyOnHidden
        mask={{ closable: !isUploading }}
      >
        {isUploading ? (
          <div style={{ padding: '30px 10px', textAlign: 'center' }}>
            <LoadingOutlined style={{ fontSize: 36, color: '#1677ff', marginBottom: 16 }} spin />
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}>
              正在上传并执行机器人运动解析与轨迹生成，请稍候... ({uploadProgress}%)
            </div>
            <Progress percent={uploadProgress} strokeColor="#1677ff" status="active" style={{ maxWidth: 400, margin: '0 auto' }} />
          </div>
        ) : (
          <Form
            form={uploadForm}
            layout="vertical"
            initialValues={{ dataType: 'zip', totalFrames: 120 }}
          >
            <Form.Item
              name="dataType"
              label="数据类型"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="zip">机器人轨迹 + 相机视频 (压缩包 ZIP)</Option>
                <Option value="mp4">单纯 RGB 视频录制文件 (MP4)</Option>
                <Option value="trajectory">关节角点控制轨迹信息 (JSON)</Option>
              </Select>
            </Form.Item>

            <Form.Item label="选择数据文件" required>
              <Upload.Dragger
                fileList={uploadFileList}
                beforeUpload={(file) => {
                  setUploadFileList([file]);
                  return false;
                }}
                onRemove={() => setUploadFileList([])}
                maxCount={1}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: '#1677ff', fontSize: 36 }} />
                </p>
                <p style={{ fontSize: 13, fontWeight: 'bold', color: '#475569', margin: '8px 0 4px' }}>
                  点击或拖拽文件至此区域进行上传
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>
                  支持拖放单文件，最大 200MB。机器人轨迹格式支持 JSON、CSV、ZIP 归档包。
                </p>
              </Upload.Dragger>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="totalFrames"
                  label="初始预设帧数"
                  rules={[{ required: true, message: '请输入初始预设帧数' }]}
                >
                  <InputNumber min={30} max={2000} style={{ width: '100%' }} suffix="帧" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="uploadOperator" label="上传操作员">
                  <Input placeholder="当前登录用户" disabled value="张三 (管理员)" />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#1e40af' }}>
              <strong>📋 提示：</strong>上传成功后，系统会自动调用大模型解析服务进行视频分帧、手眼位置对齐及机器人本体关节状态估计（预计耗时 5~10 秒）。解析完成后，新上传的数据将自动在主列表中呈现，可进行时序标注和审核。
            </div>
          </Form>
        )}
      </Modal>

      {/* ----------------------------------------------------
          POPUP MODAL: 模版库大图检索选择器 (Visual Template Picker)
          ---------------------------------------------------- */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
            <span style={{ fontSize: 16, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
              <SearchOutlined style={{ color: '#1677ff' }} /> 动作标注模版库全屏检索 (共 {allTemplates.length} 个模版)
            </span>
            <Text type="secondary" style={{ fontSize: 12 }}>
              当前适配任务：{selectedRows[0]?.taskName || '批量所选实例'} · 设备：{selectedRows[0]?.device || '通用'}
            </Text>
          </div>
        }
        open={isTemplatePickerOpen}
        onCancel={() => setIsTemplatePickerOpen(false)}
        footer={null}
        width={980}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Search & Filter Bar */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <Input 
              placeholder="快速搜索模版名称、四元组技能(如抓取/装填/扶持)、Prompt关键词..." 
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={templateSearchKeyword}
              onChange={e => setTemplateSearchKeyword(e.target.value)}
              style={{ flex: 1 }}
              allowClear
            />
            <Radio.Group 
              value={templateCategoryTab} 
              onChange={e => setTemplateCategoryTab(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="all">全部 ({allTemplates.length})</Radio.Button>
              <Radio.Button value="dual_arm">🤖 双臂协同</Radio.Button>
              <Radio.Button value="single_arm">🦾 单臂操作</Radio.Button>
              <Radio.Button value="preset">⭐ 系统SOP</Radio.Button>
            </Radio.Group>
          </div>

          {/* Grid of Templates & Preview */}
          <Row gutter={16}>
            {/* Left Column: Template Cards List */}
            <Col span={14}>
              <div style={{ maxHeight: 440, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 6 }}>
                {allTemplates
                  .filter(t => {
                    if (templateCategoryTab === 'dual_arm' && t.category !== 'dual_arm') return false;
                    if (templateCategoryTab === 'single_arm' && t.category !== 'single_arm') return false;
                    if (templateCategoryTab === 'preset' && !String(t.id).startsWith('SYSTEM_PRESET')) return false;
                    if (templateSearchKeyword) {
                      const kw = templateSearchKeyword.toLowerCase();
                      const matchName = t.taskName.toLowerCase().includes(kw);
                      const matchId = String(t.id).toLowerCase().includes(kw);
                      const matchSeg = t.segments.some(s => s.text.toLowerCase().includes(kw));
                      const matchDevice = (t.device || '').toLowerCase().includes(kw);
                      if (!matchName && !matchId && !matchSeg && !matchDevice) return false;
                    }
                    return true;
                  })
                  .map(t => {
                    const isSelected = String(batchTemplateId) === String(t.id);
                    return (
                      <Card 
                        key={t.id}
                        size="small" 
                        hoverable
                        onClick={() => setBatchTemplateId(t.id)}
                        style={{
                          borderRadius: 8,
                          cursor: 'pointer',
                          borderColor: isSelected ? '#1677ff' : '#e2e8f0',
                          background: isSelected ? '#eff6ff' : '#fff',
                          boxShadow: isSelected ? '0 0 0 2px rgba(22, 119, 255, 0.2)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div>
                            <span style={{ fontWeight: 'bold', fontSize: 13, color: isSelected ? '#1677ff' : '#1e293b' }}>
                              {t.taskName}
                            </span>
                            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>
                              #{t.id}
                            </span>
                          </div>
                          <Space size={4}>
                            <Tag color={t.stepMode === '结构化四元组' ? 'geekblue' : 'purple'} style={{ fontSize: 10 }}>
                              {t.stepMode || '结构化步骤'}
                            </Tag>
                            <Tag color="orange" style={{ fontSize: 10 }}>{t.totalFrames}帧</Tag>
                          </Space>
                        </div>

                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                          适配设备：{t.device} · 已包含 <strong>{t.segments.length}</strong> 段标注步骤 · 累计套用 {t.usageCount || 100}+ 次
                        </div>

                        {/* Step Tags flow */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {t.segments.map((s, idx) => (
                            <Tag key={idx} color="default" style={{ fontSize: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155' }}>
                              {idx + 1}. {s.text.length > 18 ? s.text.substring(0, 18) + '...' : s.text}
                            </Tag>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </Col>

            {/* Right Column: Selected Template Deep Visual Timeline Preview */}
            <Col span={10}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, height: 440, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b' }}>
                      📋 模版时序结构深度预览
                    </span>
                    <Tag color="blue">{getSelectedTemplate().stepMode}</Tag>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
                    {getSelectedTemplate().taskName}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                    总时序跨度：0f ~ {getSelectedTemplate().totalFrames}f（{getSelectedTemplate().segments.length} 个动作时序段）
                  </div>

                  {/* Visual Bar Preview */}
                  <div style={{ height: 18, background: '#e2e8f0', borderRadius: 9, position: 'relative', overflow: 'hidden', marginBottom: 16, display: 'flex' }}>
                    {getSelectedTemplate().segments.map((seg, idx) => {
                      const total = getSelectedTemplate().totalFrames || 120;
                      const widthPct = Math.max(8, ((seg.end - seg.start) / total) * 100);
                      return (
                        <div 
                          key={idx}
                          title={`${seg.text} [${seg.start}f - ${seg.end}f]`}
                          style={{
                            width: `${widthPct}%`,
                            background: seg.color || '#2563eb',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 9,
                            fontWeight: 'bold',
                            borderRight: '1px solid #fff'
                          }}
                        >
                          {idx + 1}
                        </div>
                      );
                    })}
                  </div>

                  {/* Step by Step List */}
                  <div style={{ maxHeight: 210, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {getSelectedTemplate().segments.map((seg, idx) => (
                      <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontWeight: 'bold', color: seg.color || '#2563eb' }}>
                            步骤 {idx + 1}
                          </span>
                          <span style={{ color: '#64748b', fontWeight: 'bold' }}>
                            {seg.start}f - {seg.end}f ({seg.end - seg.start}帧)
                          </span>
                        </div>
                        <div style={{ color: '#1e293b' }}>
                          {seg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Apply Button */}
                <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button onClick={() => setIsTemplatePickerOpen(false)}>
                    关闭
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />}
                    style={{ background: '#1677ff', fontWeight: 'bold' }}
                    onClick={() => {
                      message.success(`已成功选用模版：【${getSelectedTemplate().taskName}】`);
                      setIsTemplatePickerOpen(false);
                    }}
                  >
                    选用此模版
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Modal>

      {/* ----------------------------------------------------
          GLOBAL FLOATING WINDOW: 后台小窗口 (AI 导入并应用 / 批量标注)
          ---------------------------------------------------- */}
      <style>{`
        @keyframes pulseGlowBlue {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        @keyframes pulseGlowGreen {
          0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
          100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }
        @keyframes slideInUpDock {
          from { transform: translateY(40px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .ai-floating-dock {
          animation: slideInUpDock 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* AI 导入并应用后台悬浮小窗口 */}
      {isAiModalMinimized && (
        <div
          className="ai-floating-dock"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1050,
            width: isFloatingWidgetCollapsed ? 260 : 400,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 14,
            border: '1px solid #bfdbfe',
            boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.2), 0 4px 14px rgba(22, 119, 255, 0.12)',
            transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
              borderBottom: isFloatingWidgetCollapsed ? 'none' : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isFloatingWidgetCollapsed ? 'pointer' : 'default',
              userSelect: 'none'
            }}
            onClick={() => isFloatingWidgetCollapsed && setIsFloatingWidgetCollapsed(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Pulsing Dot */}
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  backgroundColor: aiInferenceStep === 'completed' ? '#16a34a' : '#2563eb',
                  animation: aiInferenceStep === 'completed'
                    ? 'pulseGlowGreen 2s infinite'
                    : 'pulseGlowBlue 1.6s infinite'
                }}
              />
              <RobotOutlined style={{ color: '#2563eb', fontSize: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                AI 动作切分与导入
              </span>
              {aiInferenceStep === 'applying' && (
                <Tag color="processing" style={{ fontSize: 10, margin: 0, padding: '0 6px', borderRadius: 4 }}>
                  导入中
                </Tag>
              )}
              {aiInferenceStep === 'inferring' && (
                <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: '0 6px', borderRadius: 4 }}>
                  推理中
                </Tag>
              )}
              {aiInferenceStep === 'completed' && (
                <Tag color="success" style={{ fontSize: 10, margin: 0, padding: '0 6px', borderRadius: 4 }}>
                  已完成
                </Tag>
              )}
            </div>

            <Space size={2} onClick={(e) => e.stopPropagation()}>
              <Tooltip title={isFloatingWidgetCollapsed ? "展开小窗口" : "折叠为迷你条"}>
                <Button
                  type="text"
                  size="small"
                  icon={isFloatingWidgetCollapsed ? <UpOutlined /> : <DownOutlined />}
                  onClick={() => setIsFloatingWidgetCollapsed(!isFloatingWidgetCollapsed)}
                  style={{ color: '#64748b', width: 26, height: 26 }}
                />
              </Tooltip>
              <Tooltip title="还原大窗口">
                <Button
                  type="text"
                  size="small"
                  icon={<FullscreenOutlined />}
                  onClick={() => {
                    setIsAiModalMinimized(false);
                    setIsAiModalOpen(true);
                  }}
                  style={{ color: '#2563eb', width: 26, height: 26 }}
                />
              </Tooltip>
              <Tooltip title="终止任务并关闭">
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleCancelAiProcess}
                  style={{ color: '#94a3b8', width: 26, height: 26 }}
                />
              </Tooltip>
            </Space>
          </div>

          {/* Expanded Body */}
          {!isFloatingWidgetCollapsed && (
            <div style={{ padding: '12px 14px' }}>
              {/* STAGE 1: Config (挂起状态) */}
              {aiInferenceStep === 'config' && (
                <div>
                  <div style={{ fontSize: 12, color: '#334155', marginBottom: 8 }}>
                    ⚙️ 通义千问 Qwen2.5-VL 配置已挂起
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button size="small" onClick={handleCancelAiProcess}>关闭</Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<FullscreenOutlined />}
                      onClick={() => {
                        setIsAiModalMinimized(false);
                        setIsAiModalOpen(true);
                      }}
                    >
                      还原配置窗口
                    </Button>
                  </div>
                </div>
              )}

              {/* STAGE 2: Inferring (后台推理中) */}
              {aiInferenceStep === 'inferring' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                      Qwen2.5-VL 视觉内核时序切分
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                      {aiProgress}%
                    </span>
                  </div>
                  <Progress
                    percent={aiProgress}
                    size="small"
                    status="active"
                    showInfo={false}
                    strokeColor={{ '0%': '#2563eb', '100%': '#38bdf8' }}
                  />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {aiProgressStage || '正在抽取时序动作临界点...'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ fontSize: 10, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircleOutlined /> 后台非阻塞运行中
                    </span>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => {
                        setIsAiModalMinimized(false);
                        setIsAiModalOpen(true);
                      }}
                      style={{ padding: 0, fontSize: 11 }}
                    >
                      查看大图与切片 ➔
                    </Button>
                  </div>
                </div>
              )}

              {/* STAGE 3: Review (推理完成，等待导入) */}
              {aiInferenceStep === 'review' && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircleOutlined /> 已生成 12 个工步 (100% 满铺覆盖)
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                    基于通义千问 Qwen2.5-VL 多模态推理，时序无缝衔接。
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        setIsAiModalMinimized(false);
                        setIsAiModalOpen(true);
                      }}
                    >
                      展开人工审核
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => handleApplyAiSteps(true)}
                      style={{
                        background: 'linear-gradient(135deg, #1677ff 0%, #2563eb 100%)',
                        border: 'none'
                      }}
                    >
                      后台直接导入并应用 ➔
                    </Button>
                  </div>
                </div>
              )}

              {/* STAGE 4: Applying (后台批量导入并应用至多个视频实例) */}
              {aiInferenceStep === 'applying' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                      批量导入并应用中 ({aiApplyCurrentIndex}/{aiApplyTotal})
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>
                      {aiApplyProgress}%
                    </span>
                  </div>
                  <Progress
                    percent={aiApplyProgress}
                    size="small"
                    status="active"
                    showInfo={false}
                    strokeColor={{ '0%': '#2563eb', '100%': '#16a34a' }}
                  />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      写入: <strong style={{ color: '#2563eb' }}>{aiApplyCurrentEpisode}</strong>
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>12 工步/实例</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ fontSize: 10, color: '#64748b' }}>
                      💡 视频较多时后台流畅跑批
                    </span>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => {
                        setIsAiModalMinimized(false);
                        setIsAiModalOpen(true);
                      }}
                      style={{ padding: 0, fontSize: 11 }}
                    >
                      还原主视窗 ↗
                    </Button>
                  </div>
                </div>
              )}

              {/* STAGE 5: Completed (完成) */}
              {aiInferenceStep === 'completed' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#15803d', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    <CheckCircleFilled style={{ color: '#16a34a' }} />
                    已成功批量应用至 {aiApplyTotal} 个视频实例！
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                    已写入 12 项连贯动作工步，实例状态已全部转入【待校验】。
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button size="small" onClick={handleCancelAiProcess}>
                      关闭
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        setIsAiModalMinimized(false);
                        setActiveAnnoTab('to_verify');
                      }}
                      style={{ background: '#16a34a', borderColor: '#16a34a' }}
                    >
                      前往【待校验】查看 ➔
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 批量时序适配后台悬浮小窗 */}
      {isBatchModalMinimized && (
        <div
          className="ai-floating-dock"
          style={{
            position: 'fixed',
            bottom: isAiModalMinimized ? 210 : 24,
            right: 24,
            zIndex: 1050,
            width: 360,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            borderRadius: 14,
            border: '1px solid #bfdbfe',
            boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.2)',
            padding: '12px 14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CopyOutlined style={{ color: '#1677ff' }} /> 批量时序适配进行中 ({copyProgress}%)
            </span>
            <Space size={2}>
              <Button
                type="text"
                size="small"
                icon={<FullscreenOutlined />}
                onClick={() => {
                  setIsBatchModalMinimized(false);
                  setIsBatchModalOpen(true);
                }}
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsBatchModalMinimized(false);
                  setIsCopying(false);
                }}
              />
            </Space>
          </div>
          <Progress percent={copyProgress} size="small" status="active" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 10, color: '#64748b' }}>后台适配未标注实例中...</span>
            <Button
              size="small"
              type="link"
              onClick={() => {
                setIsBatchModalMinimized(false);
                setIsBatchModalOpen(true);
              }}
              style={{ padding: 0, fontSize: 11 }}
            >
              展开窗口 ➔
            </Button>
          </div>
        </div>
      )}

    </MainLayout>
  );
}

