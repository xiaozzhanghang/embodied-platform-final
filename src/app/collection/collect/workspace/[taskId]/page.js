'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Typography, Space, Badge, message, Tabs, Dropdown, Switch, Upload } from 'antd';
import { CaretDownOutlined, ExpandOutlined, CompressOutlined, PauseCircleOutlined, PlayCircleOutlined, CloseCircleOutlined, StepBackwardOutlined, StepForwardOutlined, FastBackwardOutlined, FastForwardOutlined, PlusOutlined, DeleteOutlined, SyncOutlined, VideoCameraOutlined, InfoCircleOutlined, ApiOutlined, DashboardOutlined, HddOutlined, CheckCircleFilled, WarningFilled, RobotOutlined, MonitorOutlined } from '@ant-design/icons';

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.taskId || '12837';
  
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [stepRecords, setStepRecords] = useState({});
  const [completedEpisodes, setCompletedEpisodes] = useState([]);
  const elapsedRef = React.useRef(0);

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
  }, []);

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
  }, [isRecording, activeStep, steps.length]);

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
          <Button size="small" type="primary" danger ghost icon={<CloseCircleOutlined />} onClick={() => router.push('/collection/collect')}>退出工作台</Button>
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
                  <img src="/assets/images/left_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="left hand cam" />
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
                  <img src="/assets/images/main_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="main head cam" />
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
                  <img src="/assets/images/right_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="right hand cam" />
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
             {isRecording && <div style={{ position: 'absolute', right: 16, top: 2, fontSize: 10, color: '#ff4d4f', fontWeight: 'bold', animation: 'blink 1s infinite' }}>REC BUFFERING...</div>}
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
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
