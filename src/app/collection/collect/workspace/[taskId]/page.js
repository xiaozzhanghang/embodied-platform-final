'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Button, 
  Typography, 
  Space, 
  Badge, 
  Switch, 
  Upload, 
  Progress, 
  Card, 
  Statistic, 
  Divider, 
  Input, 
  Tooltip, 
  App, 
  ConfigProvider, 
  theme, 
  Tag,
  Tabs,
  Dropdown
} from 'antd';
import { 
  CaretDownOutlined, 
  ExpandOutlined, 
  CompressOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  CloseCircleOutlined, 
  PlusOutlined, 
  SyncOutlined, 
  VideoCameraOutlined, 
  InfoCircleOutlined, 
  ApiOutlined, 
  DashboardOutlined, 
  HddOutlined, 
  CheckCircleFilled, 
  WarningFilled, 
  RobotOutlined, 
  MonitorOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  EditOutlined,
  SaveOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// ==================== HUMANOID WORKSPACE (ORIGINAL) ====================
function HumanoidWorkspace({ taskId, router, params }) {
  const { message } = App.useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [stepRecords, setStepRecords] = useState({});
  const [completedEpisodes, setCompletedEpisodes] = useState([]);
  const elapsedRef = useRef(0);

  const steps = [
    { title: '右手拿起桌面上的筷子' },
    { title: '右手将筷子放置在厨具盒中' },
    { title: '左手拿起桌面上的餐叉' },
    { title: '左手将餐叉放置在厨具盒中' },
    { title: '右手拿起桌面上的勺子' },
    { title: '右手将勺子放置在厨具盒中' },
  ];

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    message.success({ content: '✅ 设备网关检查通过，所有设备均已就绪，可开始采集！', duration: 3, style: { marginTop: '10vh' } });
  }, [message]);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => setElapsed(e => e + 1), 100);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRecording(prev => !prev);
      } else if (e.code === 'KeyZ') {
        e.preventDefault();
        setStepRecords(prev => {
           if (!isRecording) { message.warning('请先按 Space 开始全局录制'); return prev; }
           message.success(`已记录步骤 ${activeStep + 1} 起点`);
           return { ...prev, [activeStep]: { ...prev[activeStep], start: elapsedRef.current * 3 } };
        });
      } else if (e.code === 'KeyX') {
        e.preventDefault();
        setStepRecords(prev => {
           if (!prev[activeStep]?.start) { message.warning('请先记录起点'); return prev; }
           message.success(`步骤 ${activeStep + 1} 完成`);
           if (activeStep < steps.length - 1) setActiveStep(s => s + 1);
           return { ...prev, [activeStep]: { ...prev[activeStep], end: elapsedRef.current * 3 } };
        });
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (elapsedRef.current === 0) {
           message.warning('当前无数据录制，无法保存');
           return;
        }
        setCompletedEpisodes(prev => [...prev, {
            id: `EP_${String(prev.length + 1).padStart(3, '0')}`,
            time: (elapsedRef.current / 10).toFixed(1),
            frames: elapsedRef.current * 3,
            status: '已上传云端'
        }]);
        message.success(`当前 Episode (${(elapsedRef.current / 10).toFixed(1)}s) 动作序列已打包，成功保存至云端！`);
        setIsRecording(false);
        setElapsed(0);
        setActiveStep(0);
        setStepRecords({});
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, activeStep, steps.length, message]);

  const viewOptions = [
    { key: 'head_left', label: '头部左目视角' },
    { key: 'head_right', label: '头部右目视角' },
    { key: 'hand_left', label: '左手-腕部视角' },
    { key: 'hand_right', label: '右手-腕部视角' },
  ];

  const [fullscreenId, setFullscreenId] = useState(null);
  const toggleFullscreen = (id) => {
    setFullscreenId(prev => prev === id ? null : id);
  };

  const PanelHeader = ({ id, title }) => (
    <div style={{ height: 28, background: '#f5f5f5', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', padding: '0 8px', justifyContent: 'space-between' }}>
      <Dropdown menu={{ items: viewOptions }} trigger={['click']}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#333', fontSize: 12, fontWeight: 500 }}>
          <div style={{ width: 3, height: 12, background: '#1890ff', marginRight: 6 }}></div>
          {title} <CaretDownOutlined style={{ marginLeft: 4, fontSize: 10, color: '#8c8c8c' }} />
        </div>
      </Dropdown>
      {fullscreenId === id ? 
        <CompressOutlined onClick={() => toggleFullscreen(id)} style={{ color: '#8c8c8c', cursor: 'pointer' }} /> :
        <ExpandOutlined onClick={() => toggleFullscreen(id)} style={{ color: '#8c8c8c', cursor: 'pointer' }} />
      }
    </div>
  );

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ height: 36, borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', fontSize: 12, color: '#595959', background: '#fafafa' }}>
        <Space size="large" separator={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <Space size="small">
            <ApiOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 500 }}>主从臂设备:</span>
            <Badge status="success" text="已连接" />
          </Space>
          
          <Space size="small">
            <MonitorOutlined style={{ color: '#722ed1' }} />
            <span style={{ fontWeight: 500 }}>VR设备:</span>
            <Badge status="success" text="在线" />
          </Space>

          <Space size="small">
            <RobotOutlined style={{ color: '#eb2f96' }} />
            <span style={{ fontWeight: 500 }}>机器人本体:</span>
            <Badge status="success" text="通信正常" />
          </Space>

          <Space size="small">
            <HddOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#faad14' }}>存储: 128GB (12%)</span>
          </Space>
          
          <Space size="small">
            <span>录制: {isRecording ? <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>🔴 录制中</span> : <span style={{ color: '#52c41a' }}>Ready</span>}</span>
          </Space>
        </Space>
        
        <Space size="middle" style={{ color: '#8c8c8c' }}>
          <span><kbd style={{ padding: '0 4px', border: '1px solid #d9d9d9', borderRadius: 2 }}>Space</kbd> 录制/暂停</span>
          <span><kbd style={{ padding: '0 4px', border: '1px solid #d9d9d9', borderRadius: 2 }}>R</kbd> 作废当前</span>
          <span><kbd style={{ padding: '0 4px', border: '1px solid #d9d9d9', borderRadius: 2 }}>Enter</kbd> 提交并下一段</span>
          <Button size="small" type="primary" danger ghost icon={<CloseCircleOutlined />} onClick={() => window.close()}>退出工作台</Button>
        </Space>
      </div>

      {/* Main Grid Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        minHeight: 0,
        boxShadow: isRecording ? 'inset 0 0 0 4px #ff4d4f' : 'none',
        transition: 'box-shadow 0.3s ease-in-out',
        position: 'relative'
      }}>
        {isRecording && <div style={{ position: 'absolute', top: 16, right: 310, zIndex: 10, background: '#ff4d4f', color: '#fff', padding: '4px 12px', borderRadius: 4, fontWeight: 'bold', fontSize: 12, animation: 'blink 1s infinite' }}>● REC</div>}
        
        {/* Video Grid Wrapper */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: '#fff', padding: '16px', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
          
          {/* Full height/width grid */}
          <div style={{ 
            width: '100%', 
            height: '100%',
            display: fullscreenId ? 'block' : 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gridTemplateRows: '1fr 1fr', 
            gap: '8px' 
          }}>

            {/* Top Left Video */}
            {(!fullscreenId || fullscreenId === 'cam1') && (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e8e8e8', backgroundColor: '#fff', minHeight: 0 }}>
                <PanelHeader id="cam1" title="左手-腕部视角" />
                <div style={{ flex: 1, background: '#e6e8eb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <img src="/assets/images/left_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="left hand cam" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=400"; }} />
                  <div style={{ position: 'absolute', right: 16, bottom: 16, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 8px', fontSize: 10, borderRadius: 4, textAlign: 'right' }}>
                    <div>Fps: 30</div>
                    <div>Resolution: 640*360</div>
                    <div>Live Stream</div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Right Video */}
            {(!fullscreenId || fullscreenId === 'cam3') && (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e8e8e8', backgroundColor: '#fff', minHeight: 0 }}>
                <PanelHeader id="cam3" title="头部左目视角" />
                <div style={{ flex: 1, background: '#e6e8eb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <img src="/assets/images/main_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="main head cam" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&q=80&w=400"; }} />
                  <div style={{ position: 'absolute', right: 16, bottom: 16, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 8px', fontSize: 10, borderRadius: 4, textAlign: 'right' }}>
                    <div>Fps: 30</div>
                    <div>Resolution: 640*480</div>
                    <div>Live Stream</div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Left Video */}
            {(!fullscreenId || fullscreenId === 'cam2') && (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e8e8e8', backgroundColor: '#fff', minHeight: 0 }}>
                <PanelHeader id="cam2" title="右手-腕部视角" />
                <div style={{ flex: 1, background: '#e6e8eb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <img src="/assets/images/right_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="right hand cam" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=400"; }} />
                  <div style={{ position: 'absolute', right: 16, bottom: 16, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 8px', fontSize: 10, borderRadius: 4, textAlign: 'right' }}>
                    <div>Fps: 30</div>
                    <div>Resolution: 640*360</div>
                    <div>Live Stream</div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Right 3D Area */}
            {(!fullscreenId || fullscreenId === 'cam4') && (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e8e8e8', backgroundColor: '#fff', minHeight: 0 }}>
                <PanelHeader id="cam4" title="joints_digital_twin.json" />
                <div style={{ flex: 1, background: '#1f1f1f', position: 'relative', overflow: 'hidden' }}>
                  {/* 3D Mockup Background Grid */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px', transform: 'perspective(500px) rotateX(60deg) scale(2)', transformOrigin: 'center 100%' }}></div>
                  <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 120, background: '#fff', borderRadius: 4, boxShadow: '0 0 20px rgba(255,255,255,0.5)' }}></div>
                  <div style={{ position: 'absolute', top: 8, left: 8, color: '#fff', fontSize: 12 }}>120 FPS (Real-time Twin)</div>
                  <div style={{ position: 'absolute', top: 8, left: 160, width: 80, height: 12, background: '#1677ff' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - 1 part */}
        <div style={{ flex: 1, minWidth: 300, maxWidth: 400, display: 'flex', flexDirection: 'column', background: '#fafafa', borderLeft: '1px solid #e8e8e8', minHeight: 0 }}>
           
           {/* 3D View and Upload Section (Fixed at top) */}
           <div style={{ padding: '16px 16px 0 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                 <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: 14, color: '#333' }}>
                    <div style={{ width: 4, height: 14, background: '#1677ff', marginRight: 8, borderRadius: 2 }}></div>
                    三维视图
                 </div>
                 <Switch defaultChecked />
              </div>
              <div style={{ marginBottom: 16 }}>
                 <Upload.Dragger name="files" action="/upload.do" multiple>
                    <p className="ant-upload-drag-icon">
                       <PlusOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                    </p>
                    <p className="ant-upload-text" style={{ fontSize: 14 }}>点击或拖拽上传</p>
                 </Upload.Dragger>
              </div>
           </div>

           <Tabs 
              defaultActiveKey="1" 
              centered 
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              items={[
                {
                   key: '1',
                   label: <span><InfoCircleOutlined /> 任务详情</span>,
                   children: (
                      <div style={{ overflowY: 'auto', padding: '0 16px 16px 16px', height: '100%' }}>
                         {/* Current Job Section */}
                         <div style={{ border: '1px solid #e8e8e8', borderRadius: 16, padding: 20, background: '#fff' }}>
                            <div style={{ fontSize: 10, color: '#8c8c8c', fontWeight: 'bold', marginBottom: 4 }}>CURRENT JOB</div>
                            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#141414', marginBottom: 24 }}>餐具整理_job</div>
                            
                            <div style={{ fontSize: 10, color: '#8c8c8c', fontWeight: 'bold', marginBottom: 16 }}>WORKFLOW STEPS</div>
                            
                            {steps.map((step, idx) => (
                               <div key={idx} style={{ padding: '8px 0', marginBottom: 4 }}>
                                 <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 500, color: '#333' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f0f0f0', color: '#8c8c8c', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 12, fontSize: 12, flexShrink: 0 }}>
                                      {idx + 1}
                                    </div>
                                    <div>{step.title}</div>
                                 </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   )
                },
                {
                   key: '2',
                   label: `已采记录 (${completedEpisodes.length}/50)`,
                   children: (
                      <div style={{ overflowY: 'auto', padding: '0 12px', height: '100%' }}>
                         {completedEpisodes.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#bfbfbf', marginTop: 40 }}>暂无已完成的采集记录</div>
                         ) : (
                            completedEpisodes.map((ep, i) => (
                               <div key={i} style={{ border: '1px solid #e8e8e8', background: '#fff', padding: 12, borderRadius: 4, marginBottom: 8 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                     <span style={{ fontWeight: 'bold', color: '#1677ff' }}>{ep.id}</span>
                                     <span style={{ fontSize: 12, color: '#52c41a' }}><Badge status="success" /> {ep.status}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#595959' }}>
                                     <span>时长: {ep.time}s</span>
                                     <span>总帧数: {ep.frames}</span>
                                  </div>
                               </div>
                            ))
                         )}
                      </div>
                   )
                }
              ]}
           />
        </div>
      </div>

      {/* Timeline & Controls Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #e8e8e8', background: '#fff' }}>
         {/* Timeline Bar Mock */}
         <div style={{ height: 24, padding: '4px 16px', background: '#fff', position: 'relative' }}>
             <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                {isRecording && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, elapsed / 2)}%`, background: '#ff4d4f', transition: 'width 0.1s linear' }}></div>}
             </div>
             {isRecording && <div style={{ position: 'absolute', right: 16, top: 2, fontSize: 10, color: '#ff4d4f', fontWeight: 'bold', animation: 'blink-text 1s infinite' }}>REC BUFFERING...</div>}
         </div>

         {/* Controls */}
         <div style={{ height: 50, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
            <div style={{ width: 200, fontSize: 12, color: '#595959' }}>
               Time: <span style={{ fontFamily: 'monospace' }}>{(elapsed / 10).toFixed(3)}</span> &nbsp; Frame: <span style={{ fontFamily: 'monospace' }}>{elapsed * 3}</span>
            </div>
            
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'center' }}>
               {!isRecording ? (
                 <Button type="primary" danger shape="round" icon={<PlayCircleOutlined />} size="large" onClick={() => setIsRecording(true)} style={{ width: 160, fontWeight: 'bold' }}>开始录制 (Space)</Button>
               ) : (
                 <Button shape="round" icon={<PauseCircleOutlined />} size="large" onClick={() => setIsRecording(false)} style={{ width: 160, fontWeight: 'bold', background: '#f5f5f5' }}>停止采集 (Space)</Button>
               )}
            </div>
            
            <div style={{ width: 350, display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
               <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a', fontWeight: 500 }}>保存本段数据</Button>
               <Button danger type="text" style={{ fontWeight: 500 }}>作废重录</Button>
               <div style={{ borderLeft: '1px solid #e8e8e8', height: 20, margin: '0 4px' }}></div>
               <span style={{ fontSize: 12, color: '#595959' }}>录制帧率: 30fps</span>
            </div>
         </div>
      </div>
      <style jsx global>{`
        @keyframes blink-text {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ==================== LUMOS WORKSPACE (HIGH-FIDELITY DARK MODE) ====================
const defaultLumosTasksConfig = {
  task_id: "CT-20250301001",
  task_name: "Lumos 双手整理筷子与勺子",
  rgb_frame_number: 450,
  depth_frame_number: 225,
  save_path: "/home/lumos/FastUMI_Data_Collection-Data_Collection_evaluation/data_collector_opt/Data/",
  if_quality_check: true,
  camera_sync_alignment: true,
  total_count: 50,
  audio_volume: 8,
  min_distance_barrier_m: 0.15
};

const defaultCompletedEpisodes = [
  { id: 'EP_001', time: '15.0', frames: 450, status: '已保存' },
  { id: 'EP_002', time: '14.8', frames: 444, status: '已保存' },
  { id: 'EP_003', time: '15.1', frames: 453, status: '已隔离' },
];

function LumosWorkspace({ taskId, router, params }) {
  const { message } = App.useApp();
  
  // Lumos State Machine States:
  // 'SERVICE_STOPPED' (initial - requires clicking blue power key to start background scripts)
  // 'SELF_CHECKING' (checking and pairing 3s)
  // 'READY' (paired and waiting for left gripper calibration command)
  // 'CALIBRATION' (waiting 3s aligned origin reset)
  // 'COLLECTING' (recording - auto runs frame progress)
  // 'COMPLETE' (episode ends, waiting for save (L) or isolate (R) command)
  // 'EPISODE_SAVED' (episode saved successfully, voice played, counts incremented)
  // 'EPISODE_ISOLATED' (episode isolated successfully, logged)
  // 'EPISODE_FINISHED_ASK' (finished single collection sequence, left gripper to continue, right to exit)
  const [lumosState, setLumosState] = useState('SERVICE_STOPPED');
  const [voiceLogs, setVoiceLogs] = useState([
    { time: '8:00:00 AM', text: '硬件已供电，等待开启服务。请点击物理［蓝光启动按钮］启动程序。' }
  ]);
  const [isMuted, setIsMuted] = useState(false);
  const [tasksConfig, setTasksConfig] = useState(defaultLumosTasksConfig);
  const [configEditorOpen, setConfigEditorOpen] = useState(false);
  const [configJsonStr, setConfigJsonStr] = useState(JSON.stringify(defaultLumosTasksConfig, null, 2));
  
  // Simulated Gripper States (Value 0 to 100 representing hold progress)
  const [leftGripperHold, setLeftGripperHold] = useState(0);
  const [rightGripperHold, setRightGripperHold] = useState(0);
  const [leftHoldActive, setLeftHoldActive] = useState(false);
  const [rightHoldActive, setRightHoldActive] = useState(false);

  // Recording variables
  const [recordedCount, setRecordedCount] = useState(3);
  const [completedEpisodes, setCompletedEpisodes] = useState(defaultCompletedEpisodes);
  const [collectionFrameCount, setCollectionFrameCount] = useState(0);
  const [collectionTime, setCollectionTime] = useState(0.0);
  const [calibrationCountdown, setCalibrationCountdown] = useState(3);

  // Voice synthesis helpers
  const speakText = (text) => {
    // Write text to visual voice logs
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setVoiceLogs(prev => [{ time: timeStr, text }, ...prev.slice(0, 19)]);

    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Stop ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard simulator listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'l' || e.key === 'L') {
        setLeftHoldActive(true);
      }
      if (e.key === 'r' || e.key === 'R') {
        setRightHoldActive(true);
      }
      
      // Space for Pause/Resume if in COLLECTING state
      if (e.code === 'Space') {
        e.preventDefault();
        if (lumosState === 'COLLECTING') {
          speakText('采集暂停。如需恢复请继续操作。');
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'l' || e.key === 'L') {
        setLeftHoldActive(false);
        setLeftGripperHold(0);
      }
      if (e.key === 'r' || e.key === 'R') {
        setRightHoldActive(false);
        setRightGripperHold(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [lumosState, isMuted]);

  // Handle Gripper Hold accumulators (Interval ticks)
  useEffect(() => {
    let holdInterval;
    if (leftHoldActive || rightHoldActive) {
      holdInterval = setInterval(() => {
        if (leftHoldActive && leftGripperHold < 100) {
          setLeftGripperHold(prev => {
            const next = prev + 10;
            if (next >= 100) {
              triggerStateL();
              return 0; // Reset after trigger
            }
            return next;
          });
        }
        if (rightHoldActive && rightGripperHold < 100) {
          setRightGripperHold(prev => {
            const next = prev + 10;
            if (next >= 100) {
              triggerStateR();
              return 0; // Reset after trigger
            }
            return next;
          });
        }
      }, 150); // 1.5 seconds to full trigger
    }
    return () => clearInterval(holdInterval);
  }, [leftHoldActive, rightHoldActive, leftGripperHold, rightGripperHold, lumosState]);

  // State flow logic for Left Gripper (L Trigger)
  const triggerStateL = () => {
    if (lumosState === 'SERVICE_STOPPED') {
      message.warning('请先点击物理按钮启动数采主机服务！');
      return;
    }
    
    if (lumosState === 'SELF_CHECKING') {
      speakText('设备自检配对中，请继续抓握左侧夹爪，直至指示灯变为常绿。');
      return;
    }

    if (lumosState === 'READY') {
      // Go to Calibration
      setLumosState('CALIBRATION');
      setCalibrationCountdown(3);
      speakText('开始进入平行原点重置。请将左右手夹爪水平平行放置。3，2，1，开始！');
    }

    if (lumosState === 'COMPLETE') {
      // L triggers Save action
      const duration = (tasksConfig.rgb_frame_number / 30).toFixed(1);
      const newEp = {
        id: `EP_${String(completedEpisodes.length + 1).padStart(3, '0')}`,
        time: duration,
        frames: tasksConfig.rgb_frame_number,
        status: '已保存'
      };
      setCompletedEpisodes(prev => [newEp, ...prev]);
      setRecordedCount(prev => prev + 1);
      setLumosState('EPISODE_FINISHED_ASK');
      speakText(`当前第 ${completedEpisodes.length + 1} 录制段落保存成功。请确认，左爪闭合继续采集下一段，右爪闭合退出工作台。`);
    }

    if (lumosState === 'EPISODE_FINISHED_ASK') {
      // Go back to ready
      setLumosState('READY');
      speakText('已准备就绪，请闭合左手夹爪启动平行原点校准。');
    }
  };

  // State flow logic for Right Gripper (R Trigger)
  const triggerStateR = () => {
    if (lumosState === 'COMPLETE') {
      // R triggers Isolate/Discard action
      const duration = (tasksConfig.rgb_frame_number / 30).toFixed(1);
      const newEp = {
        id: `EP_${String(completedEpisodes.length + 1).padStart(3, '0')}`,
        time: duration,
        frames: tasksConfig.rgb_frame_number,
        status: '已隔离'
      };
      setCompletedEpisodes(prev => [newEp, ...prev]);
      setLumosState('EPISODE_FINISHED_ASK');
      speakText(`警告，当前录制段落已标记为隔离垃圾数据，不会作为清洗语料。左爪继续采集，右爪退出。`);
    }

    if (lumosState === 'EPISODE_FINISHED_ASK') {
      speakText('退出工作台。');
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  };

  // Handle countdown animation and recording frame loop
  useEffect(() => {
    let countdownTimer;
    if (lumosState === 'CALIBRATION') {
      countdownTimer = setInterval(() => {
        setCalibrationCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            setLumosState('COLLECTING');
            setCollectionFrameCount(0);
            setCollectionTime(0.0);
            speakText('录制开启。系统正在收集关节轨迹，请正常移动双侧执行器。');
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownTimer);
  }, [lumosState]);

  // Frame ticking logic during collecting
  useEffect(() => {
    let collectTimer;
    if (lumosState === 'COLLECTING') {
      collectTimer = setInterval(() => {
        setCollectionFrameCount(prev => {
          const next = prev + 5; // increment frames
          const totalTarget = tasksConfig.rgb_frame_number;
          
          // Speeches at 50% and 80%
          if (next === Math.floor(totalTarget * 0.5)) {
            speakText('采集进度已达百分之五十，请稳定控力，抓取器保持视距内。');
          }
          if (next === Math.floor(totalTarget * 0.8)) {
            speakText('已达百分之八十。准备平稳释出，准备进入存弃分发状态。');
          }
          
          if (next >= totalTarget) {
            clearInterval(collectTimer);
            setLumosState('COMPLETE');
            speakText('录制终点到达。音频反馈：长按左侧夹爪 3 秒打包保存该段动作数据，长按右侧夹爪 3 秒隔离废弃。');
            return totalTarget;
          }
          return next;
        });
        setCollectionTime(t => parseFloat((t + 0.166).toFixed(2)));
      }, 166); // Roughly 30 fps speedup
    }
    return () => clearInterval(collectTimer);
  }, [lumosState, tasksConfig.rgb_frame_number]);

  // Manual trigger for service start
  const handlePhysicalStart = () => {
    setLumosState('SELF_CHECKING');
    speakText('正在检查连接。正在握手夹爪端口以及相机流。请稍候。');
    
    setTimeout(() => {
      setLumosState('READY');
      speakText('自检及双臂绑定成功！耳机指示正常，HDMI已就绪。长按左夹爪 3 秒进行原点重置。');
    }, 3000);
  };

  // Configuration JSON Save
  const handleSaveConfig = () => {
    try {
      const parsed = JSON.parse(configJsonStr);
      setTasksConfig(parsed);
      setConfigEditorOpen(false);
      message.success('本地数采配置文件 tasks_config.json 保存成功，已动态重载参数！');
      speakText('配置文件已修改，单段数据采集帧数及限制已动态调校。');
    } catch(e) {
      message.error('JSON 格式有误，请检查语法！');
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      background: '#040711', 
      color: '#f8fafc',
      fontFamily: 'SFMono-Regular, Consolas, Courier New, monospace',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      
      {/* 1. TOP HEADER - DIAGNOSTICS */}
      <div style={{ 
        height: 48, 
        borderBottom: '1px solid rgba(255,255,255,0.08)', 
        background: 'rgba(9, 13, 31, 0.95)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 16px',
        fontSize: 12
      }}>
        <Space size="large">
          <Space size="small">
            <ThunderboltOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#f8fafc', fontWeight: 600 }}>Lumos FastUMI Go</span>
            <Tag color="warning" style={{ fontSize: 10, margin: 0 }}>OFFLINE CLIENT</Tag>
          </Space>

          <Space size="small" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span>静态IP:</span>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>192.168.54.53</span>
          </Space>
          
          <Space size="small" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span>背包主机:</span>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>192.168.54.110</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          </Space>

          <Space size="small" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span>耳机监听:</span>
            <span style={{ color: '#10b981' }}>已连接</span>
          </Space>

          <Space size="small" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span>HDMI模拟器:</span>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>ACTIVE</span>
          </Space>

          <Space size="small" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span>边缘存储:</span>
            <span style={{ color: '#eab308' }}>105GB可用</span>
          </Space>
          
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>按住模拟: L (左夹爪) | R (右夹爪) | Space (采集暂停)</span>
        </Space>

        <Space size="middle">
          <Button 
            size="small" 
            type={isMuted ? "default" : "primary"} 
            danger={!isMuted}
            icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
            onClick={() => {
              setIsMuted(!isMuted);
              message.info(isMuted ? '语音助理开启' : '语音助理已静音');
            }}
          >
            语音: {isMuted ? 'OFF' : 'ON'}
          </Button>
          <Button size="small" type="primary" danger ghost icon={<CloseCircleOutlined />} onClick={() => router.push('/collection/collect')}>退出工作台</Button>
        </Space>
      </div>

      {/* 2. MAIN LAYOUT: VIDEOS + SIDEBAR */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* Left: 4-Grid Camera View */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12, padding: 16, background: '#070a16', overflow: 'hidden' }}>
          
          {/* Top Left: Left Wrist Camera */}
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0e1224', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 'bold', color: '#faad14' }}>
              | 左手-腕部视角 [WRIST_CAM_L]
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src="/assets/images/left_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: lumosState === 'SERVICE_STOPPED' ? 0.2 : 0.95 }} alt="left arm" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=400"; }} />
              {lumosState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>设备尚未配对联通</span>}
            </div>
            <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              ● 640x360 | 30 FPS
            </div>
          </div>

          {/* Top Right: Right Wrist Camera */}
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0e1224', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 'bold', color: '#faad14' }}>
              | 右手-腕部视角 [WRIST_CAM_R]
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src="/assets/images/right_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: lumosState === 'SERVICE_STOPPED' ? 0.2 : 0.95 }} alt="right arm" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=400"; }} />
              {lumosState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>设备尚未配对联通</span>}
            </div>
            <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              ● 640x360 | 30 FPS
            </div>
          </div>

          {/* Bottom Left: Head Left Camera */}
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0e1224', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 'bold', color: '#faad14' }}>
              | 头部左目视角 [HEAD_LEFT_EYE]
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src="/assets/images/main_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: lumosState === 'SERVICE_STOPPED' ? 0.2 : 0.95 }} alt="head camera" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&q=80&w=400"; }} />
              {lumosState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>设备尚未配对联通</span>}
            </div>
            <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              ● 640x480 | 30 FPS
            </div>
          </div>

          {/* Bottom Right: Real-time Joint Twin schematic */}
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0e1224', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 'bold', color: '#faad14' }}>
              | 三维关节真值实时孪生 [joints_telemetry.json]
            </div>
            <div style={{ flex: 1, background: '#060913', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Draw a stylized humanoid twin arm schematic */}
              <svg width="220" height="220" viewBox="0 0 100 100" style={{ zIndex: 1, opacity: lumosState === 'SERVICE_STOPPED' ? 0.2 : 1 }}>
                <line x1="50" y1="90" x2="50" y2="40" stroke="#475569" strokeWidth="2" />
                
                {/* Simulated twin kinematic arm movements */}
                <line x1="50" y1="40" x2="30" y2="25" stroke="#f59e0b" strokeWidth="3" />
                <line x1="30" y1="25" x2="20" y2="15" stroke="#10b981" strokeWidth="3" />
                
                <line x1="50" y1="40" x2="70" y2="25" stroke="#3b82f6" strokeWidth="3" />
                <line x1="70" y1="25" x2="80" y2="15" stroke="#06b6d4" strokeWidth="3" />

                <circle cx="50" cy="40" r="4" fill="#3b82f6" />
                <circle cx="30" cy="25" r="3" fill="#f59e0b" />
                <circle cx="70" cy="25" r="3" fill="#3b82f6" />
                <circle cx="20" cy="15" r="3.5" fill="#10b981" />
                <circle cx="80" cy="15" r="3.5" fill="#06b6d4" />
                <circle cx="50" cy="90" r="3" fill="#475569" />
              </svg>
              {lumosState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>设备尚未配对联通</span>}
              <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
                <Tag color="cyan" style={{ fontSize: 9, margin: 0, fontFamily: 'monospace' }}>IMMEDIATE EVALUATION ON</Tag>
              </div>
              <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                JOINT_0: 12.4° / JOINT_1: -45.1° / JOINT_2: 98.8°
              </div>
            </div>
          </div>

        </div>

        {/* Center: Main Controller Simulation & Voice Log */}
        <div style={{ width: 440, borderLeft: '1px solid rgba(255,255,255,0.08)', background: '#090d1f', display: 'flex', flexDirection: 'column', padding: 20, gap: 20 }}>
          
          {/* Audio Synthesizer sound waves logs */}
          <Card 
            title={
              <div style={{ fontSize: 13, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                Lumos 语音导引助理
              </div>
            }
            size="small"
            style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
            styles={{ body: { padding: 12 } }}
            extra={
              <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 16 }}>
                <span style={{ display: 'inline-block', width: 2, height: 8, background: '#10b981', animation: 'eq-wave 0.8s infinite alternate' }}></span>
                <span style={{ display: 'inline-block', width: 2, height: 14, background: '#10b981', animation: 'eq-wave 1.1s infinite alternate 0.2s' }}></span>
                <span style={{ display: 'inline-block', width: 2, height: 6, background: '#10b981', animation: 'eq-wave 0.7s infinite alternate 0.1s' }}></span>
                <span style={{ display: 'inline-block', width: 2, height: 12, background: '#10b981', animation: 'eq-wave 0.9s infinite alternate 0.3s' }}></span>
              </div>
            }
          >
            <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, padding: '10px 12px', minHeight: 70, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14 }}>🔊</span>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 2 }}>语音广播:</div>
                  <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.5 }}>
                    {voiceLogs[0]?.text || '待机中...'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>广播历史日志 (近5条)</div>
            <div style={{ height: 90, overflowY: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {voiceLogs.slice(1, 6).map((log, idx) => (
                <div key={idx} style={{ marginBottom: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>[{log.time}]</span> {log.text}
                </div>
              ))}
            </div>
          </Card>

          {/* Physical Device Controller Simulator */}
          <Card
            title={<span style={{ fontSize: 13, color: '#f8fafc' }}>离线物理终端设备模拟</span>}
            size="small"
            style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
            styles={{ body: { padding: 16 } }}
            extra={<Badge status={lumosState === 'SERVICE_STOPPED' ? 'default' : 'success'} text={<span style={{ color: '#fff', fontSize: 11 }}>{lumosState === 'SERVICE_STOPPED' ? '未启动' : '已就绪'}</span>} />}
          >
            <div style={{ background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#f8fafc', fontWeight: 'bold' }}>数采背包物理启动键 (蓝光按键)</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>单击启动/关闭系统后台服务</div>
              </div>
              <Button 
                type="primary"
                shape="circle"
                style={{ 
                  width: 40, height: 40, background: '#1e3a8a', border: '2px solid #3b82f6', 
                  boxShadow: lumosState === 'SERVICE_STOPPED' ? 'none' : '0 0 15px #3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onClick={handlePhysicalStart}
              >
                ⚡
              </Button>
            </div>

            <div style={{ background: 'rgba(255, 173, 20, 0.05)', border: '1px solid rgba(255, 173, 20, 0.15)', padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#faad14', fontWeight: 'bold' }}>当前流程状态指示:</div>
              <div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🔌</span>
                <span>
                  {lumosState === 'SERVICE_STOPPED' && '请按物理启动按钮开启服务'}
                  {lumosState === 'SELF_CHECKING' && '请继续长按 L 键（左侧夹爪） 3 秒完成绑定自检...'}
                  {lumosState === 'READY' && '已就绪。长按 L 键（左侧夹爪）3秒启动原点校准...'}
                  {lumosState === 'CALIBRATION' && `平行对齐中... 倒计时 ${calibrationCountdown} 秒`}
                  {lumosState === 'COLLECTING' && `轨迹循环录制中... (${collectionFrameCount} 帧)`}
                  {lumosState === 'COMPLETE' && '单段数据采集完成。请分配：左爪3秒打包保存，右爪3秒隔离丢弃'}
                  {lumosState === 'EPISODE_FINISHED_ASK' && '采集段落完成分发。左爪3s继续下一段，右爪3s退出程序'}
                </span>
              </div>
            </div>

            {/* Grippers triggers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', padding: 12, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 'bold', color: '#10b981' }}>左夹爪 (标定/启动/保存)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '8px 0' }}>
                  <span>手势状态:</span>
                  <span>{leftHoldActive ? '闭合' : '松开'}</span>
                </div>
                <Progress percent={leftGripperHold} size="small" status="active" showInfo={false} strokeColor="#10b981" />
                <Button 
                  size="small" type="dashed" style={{ marginTop: 8, fontSize: 10, width: '100%', borderColor: '#10b981', color: '#10b981', background: 'transparent' }}
                  onMouseDown={() => setLeftHoldActive(true)}
                  onMouseUp={() => { setLeftHoldActive(false); setLeftGripperHold(0); }}
                >
                  长按模拟 (Key L)
                </Button>
              </div>

              <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', padding: 12, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 'bold', color: '#ef4444' }}>右夹爪 (隔离/退出)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '8px 0' }}>
                  <span>手势状态:</span>
                  <span>{rightHoldActive ? '闭合' : '松开'}</span>
                </div>
                <Progress percent={rightGripperHold} size="small" status="active" showInfo={false} strokeColor="#ef4444" />
                <Button 
                  size="small" type="dashed" style={{ marginTop: 8, fontSize: 10, width: '100%', borderColor: '#ef4444', color: '#ef4444', background: 'transparent' }}
                  onMouseDown={() => setRightHoldActive(true)}
                  onMouseUp={() => { setRightHoldActive(false); setRightGripperHold(0); }}
                >
                  长按模拟 (Key R)
                </Button>
              </div>
            </div>

          </Card>

        </div>

        {/* Right Sidebar: Configs json + Completed lists */}
        <div style={{ width: 380, borderLeft: '1px solid rgba(255,255,255,0.08)', background: '#090d1f', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header config selector */}
          <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚙️ 本地任务配置 tasks_config.json
            </span>
            <Button size="small" type="link" icon={<EditOutlined />} onClick={() => setConfigEditorOpen(true)}>编辑</Button>
          </div>

          <div style={{ padding: 16, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Visual configuration details */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>任务ID (task_id):</span>
                <span style={{ color: '#fff' }}>{taskId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>中文描述:</span>
                <span style={{ color: '#fff' }}>Lumos 双手整理筷子与勺子</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>单段限制 (帧数):</span>
                <span style={{ color: '#faad14', fontWeight: 'bold' }}>{tasksConfig.rgb_frame_number} 帧 ({(tasksConfig.rgb_frame_number / 30).toFixed(1)}s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>目标段数 (total_count):</span>
                <span style={{ color: '#fff' }}>{tasksConfig.total_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>即时质检评估 (if_quality_check):</span>
                <span style={{ color: tasksConfig.if_quality_check ? '#10b981' : '#ef4444' }}>{tasksConfig.if_quality_check ? '已开启' : '已关闭'}</span>
              </div>
            </div>

            {/* List of episodes */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#f8fafc', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>当前批次已采记录 ({recordedCount} / {tasksConfig.total_count})</span>
                <span style={{ color: '#10b981', fontSize: 10 }}>成功率: {Math.floor((completedEpisodes.filter(e => e.status === '已保存').length / Math.max(1, completedEpisodes.length)) * 100)}%</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 280, overflowY: 'auto' }}>
                {completedEpisodes.map((ep, idx) => (
                  <div key={idx} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6' }}>{ep.id}</span>
                      <Tag color={ep.status === '已保存' ? 'success' : 'error'} style={{ fontSize: 9, margin: 0 }}>{ep.status}</Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                      <span>时长: {ep.time}s</span>
                      <span>总帧数: {ep.frames}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. FOOTER TIMELINE & REALTIME STATE */}
      <div style={{ height: 60, borderTop: '1px solid rgba(255,255,255,0.08)', background: '#090d1f', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          单段采集耗时: <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{collectionTime}s</span> / 15.0s &nbsp;|&nbsp;
          采集数据帧率: <span style={{ color: '#fff', fontWeight: 'bold' }}>30 FPS</span> &nbsp;|&nbsp;
          当前帧计数: <span style={{ color: '#faad14', fontWeight: 'bold', fontSize: 13 }}>{collectionFrameCount}帧</span> / 450帧
        </div>

        {/* Live progress slider */}
        <div style={{ width: '40%', padding: '0 16px' }}>
          <Progress 
            percent={Math.floor((collectionFrameCount / tasksConfig.rgb_frame_number) * 100)} 
            strokeColor={{
              '0%': '#10b981',
              '100%': '#3b82f6',
            }}
            trailColor="rgba(255,255,255,0.05)"
            status={lumosState === 'COLLECTING' ? 'active' : 'normal'}
            showInfo={false}
          />
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {lumosState === 'SERVICE_STOPPED' && '服务尚未启动'}
          {lumosState === 'SELF_CHECKING' && '设备自检通信中...'}
          {lumosState === 'READY' && <span style={{ color: '#10b981' }}>● 系统空闲就绪</span>}
          {lumosState === 'CALIBRATION' && <span style={{ color: '#faad14' }}>● 正在重置关节零位...</span>}
          {lumosState === 'COLLECTING' && <span style={{ color: '#ef4444', animation: 'blink-dot 1s infinite' }}>● 正在采集轨迹数据...</span>}
          {lumosState === 'COMPLETE' && <span style={{ color: '#faad14' }}>● 数据暂存，等待分发</span>}
          {lumosState === 'EPISODE_FINISHED_ASK' && <span style={{ color: '#3b82f6' }}>● 采集完毕，等待下一环指令</span>}
        </div>
      </div>

      {/* JSON CONFIG DRAWER / MODAL */}
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, 
          display: configEditorOpen ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <Card 
            title="编辑本地 tasks_config.json 配置文件" 
            style={{ width: 600, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
            extra={
              <Space>
                <Button size="small" onClick={() => setConfigEditorOpen(false)}>取消</Button>
                <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSaveConfig}>保存修改</Button>
              </Space>
            }
          >
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              系统已检测到宿主机配置文件路径: `/home/lumos/FastUMI_Data_Collection-Data_Collection_evaluation/config/tasks_config.json`
            </div>
            <Input.TextArea 
              rows={12} 
              value={configJsonStr} 
              onChange={(e) => setConfigJsonStr(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 12, background: '#020617', color: '#10b981', border: '1px solid rgba(255,255,255,0.08)' }} 
            />
          </Card>
        </div>
      </ConfigProvider>

      <style jsx>{`
        @keyframes eq-wave {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.3); }
        }
        @keyframes blink-dot {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ==================== WORKSPACE ENTRY SWITCHER ====================
export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();

  const taskId = params?.taskId || 'CT-20250301001';
  const isLumos = taskId === 'CT-20260414001' || taskId?.includes('2026') || taskId?.includes('Lumos');

  return (
    <App>
      {isLumos ? (
        <LumosWorkspace taskId={taskId} router={router} params={params} />
      ) : (
        <HumanoidWorkspace taskId={taskId} router={router} params={params} />
      )}
    </App>
  );
}
