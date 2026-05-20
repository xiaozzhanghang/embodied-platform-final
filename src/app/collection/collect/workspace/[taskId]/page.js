'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Typography, Space, Badge, Switch, Upload, Progress, Card, Statistic, Divider, Input, Tooltip, App, ConfigProvider, theme, Tag } from 'antd';
import { 
  CaretDownOutlined, 
  ExpandOutlined, 
  CompressOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  CloseCircleOutlined, 
  ThunderboltOutlined,
  ApiOutlined, 
  DashboardOutlined, 
  HddOutlined, 
  CheckCircleFilled, 
  WarningFilled, 
  RobotOutlined, 
  MonitorOutlined,
  AudioOutlined,
  SaveOutlined,
  UndoOutlined,
  SettingOutlined,
  CodeOutlined,
  GlobalOutlined,
  SoundOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const { message } = App.useApp();
  const taskId = params?.taskId || '20260414O123';
  
  // 1. Core Config of task (tasks_config.json emulation)
  const [config, setConfig] = useState({
    task_id: taskId,
    description_cn: "Lumos 双手整理筷子与勺子",
    description_en: "Lumos dual-arm cutlery sorting",
    rgb_frame_number: 450, // 450 frames = 15 seconds (at 30fps)
    total_count: 50,
    collected_count: 12,
    if_quality_check: true
  });
  
  const [jsonText, setJsonText] = useState(JSON.stringify(config, null, 2));
  const [isEditingJson, setIsEditingJson] = useState(false);

  // 2. State Machine variables
  // 0: SERVICE_STOPPED (Wait for physical blue power key)
  // 1: PAIRING_REQUIRED (Auto detected 2 devices, close Left gripper for 3s)
  // 2: READY (Pairing success, ready to start. Close Left gripper for 3s to start collection)
  // 3: CALIBRATION (Origin calibration, parallel pose countdown 3s)
  // 4: COLLECTING (Active collection running)
  // 5: COMPLETE (Asking to save/isolate: Left gripper 3s to save, Right gripper 3s to isolate)
  // 6: ASK_CONTINUE (Asking to continue: Left gripper 3s to loop, Right gripper 3s to exit)
  const [activeState, setActiveState] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0); // in deciseconds (100ms)
  const [calibCountdown, setCalibCountdown] = useState(3);
  
  // 3. Gripper simulation variables
  const [leftClosed, setLeftClosed] = useState(false);
  const [rightClosed, setRightClosed] = useState(false);
  const [leftPressProgress, setLeftPressProgress] = useState(0);
  const [rightPressProgress, setRightPressProgress] = useState(0);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Interval references
  const leftPressInterval = useRef(null);
  const rightPressInterval = useRef(null);
  const recInterval = useRef(null);
  const calibInterval = useRef(null);
  
  // Ref for reading values inside listener
  const activeStateRef = useRef(activeState);
  activeStateRef.current = activeState;

  // Voice assistant transcripts & log
  const [voiceLogs, setVoiceLogs] = useState([
    { id: 1, text: "硬件已供电，等待开启服务。请点击物理 [蓝光启动按键] 启动程序。", type: 'system' }
  ]);
  const [speaking, setSpeaking] = useState(false);

  // Completed episodes list
  const [completedEpisodes, setCompletedEpisodes] = useState([
    { id: "EP_001", duration: "15.0s", frames: 450, status: "已保存" },
    { id: "EP_002", duration: "14.8s", frames: 444, status: "已保存" },
    { id: "EP_003", duration: "15.1s", frames: 453, status: "已隔离" }
  ]);

  // View Options for cameras
  const [fullscreenId, setFullscreenId] = useState(null);
  const [ping, setPing] = useState('1ms');

  // TTS helper using Web Speech API
  const speakText = (text) => {
    if (!speechEnabled) return;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.05;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Add voice guidance logs
  const addVoiceLog = (text, type = 'system') => {
    setVoiceLogs(prev => [
      { id: Date.now(), text, type },
      ...prev.slice(0, 19) // Cap at 20 logs
    ]);
    speakText(text);
  };

  // Sound control toggle
  const toggleSpeech = () => {
    if (speechEnabled) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeechEnabled(false);
      message.info("语音播报已静音");
    } else {
      setSpeechEnabled(true);
      message.success("语音播报已启用");
    }
  };

  // 4. Gripper Hold/Release handlers (L = Left gripper, R = Right gripper)
  const startLeftPress = () => {
    setLeftClosed(true);
    setLeftPressProgress(0);
    clearInterval(leftPressInterval.current);
    
    let progress = 0;
    leftPressInterval.current = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        progress = 100;
        setLeftPressProgress(100);
        clearInterval(leftPressInterval.current);
        handleGripperTrigger('LEFT_3S');
      } else {
        setLeftPressProgress(progress);
      }
    }, 300); // 3 seconds total (10 ticks * 300ms)
  };

  const stopLeftPress = () => {
    setLeftClosed(false);
    setLeftPressProgress(0);
    clearInterval(leftPressInterval.current);
  };

  const startRightPress = () => {
    setRightClosed(true);
    setRightPressProgress(0);
    clearInterval(rightPressInterval.current);
    
    let progress = 0;
    rightPressInterval.current = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        progress = 100;
        setRightPressProgress(100);
        clearInterval(rightPressInterval.current);
        handleGripperTrigger('RIGHT_3S');
      } else {
        setRightPressProgress(progress);
      }
    }, 300);
  };

  const stopRightPress = () => {
    setRightClosed(false);
    setRightPressProgress(0);
    clearInterval(rightPressInterval.current);
  };

  // State Machine logic trigger on gripper action
  const handleGripperTrigger = (action) => {
    const currentState = activeStateRef.current;
    
    if (currentState === 0) {
      message.warning("服务尚未开启，请先点击屏幕上方的物理蓝光启动按钮。");
      return;
    }

    if (currentState === 1) {
      if (action === 'LEFT_3S') {
        addVoiceLog("配对成功，系统初始化完毕。当前为就绪状态。闭合左夹爪保持3秒可开启循环采集。");
        setActiveState(2);
      }
    } 
    else if (currentState === 2) {
      if (action === 'LEFT_3S') {
        addVoiceLog("检测到左夹闭合，开始循环采集。请先松开夹爪，重置夹爪原点。");
        setActiveState(3);
        setCalibCountdown(3);
      }
    } 
    else if (currentState === 5) {
      if (action === 'LEFT_3S') {
        // Save
        const durationSec = (elapsed / 10).toFixed(1);
        const totalFrames = elapsed * 3;
        const newEp = {
          id: `EP_${String(completedEpisodes.length + 1).padStart(3, '0')}`,
          duration: `${durationSec}s`,
          frames: totalFrames,
          status: "已保存"
        };
        setCompletedEpisodes(prev => [newEp, ...prev]);
        setConfig(prev => ({ ...prev, collected_count: prev.collected_count + 1 }));
        addVoiceLog("数据已保存。是否继续进行数据采集？闭合左夹爪继续，闭合右夹爪结束。");
        setActiveState(6);
      } else if (action === 'RIGHT_3S') {
        // Isolate
        const durationSec = (elapsed / 10).toFixed(1);
        const totalFrames = elapsed * 3;
        const newEp = {
          id: `EP_${String(completedEpisodes.length + 1).padStart(3, '0')}`,
          duration: `${durationSec}s`,
          frames: totalFrames,
          status: "已隔离"
        };
        setCompletedEpisodes(prev => [newEp, ...prev]);
        addVoiceLog("数据已隔离。是否继续进行数据采集？闭合左夹爪继续，闭合右夹爪结束。");
        setActiveState(6);
      }
    }
    else if (currentState === 6) {
      if (action === 'LEFT_3S') {
        addVoiceLog("检测到左夹闭合，开始新一轮采集。请先松开夹爪，重置夹爪原点。");
        setActiveState(3);
        setCalibCountdown(3);
      } else if (action === 'RIGHT_3S') {
        addVoiceLog("检测到右夹闭合，退出循环采集。系统已回到就绪状态。");
        setActiveState(2);
      }
    }
  };

  // Blue Button trigger (Starts service)
  const clickBlueButton = () => {
    if (activeState === 0) {
      addVoiceLog("服务启动成功，检测到两台设备。请闭合左侧设备并按住3秒进行配对。");
      setActiveState(1);
    } else {
      addVoiceLog("已重置服务。请闭合左侧设备并按住3秒以重新配对。");
      setActiveState(1);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'KeyL') {
        e.preventDefault();
        if (!leftClosed) startLeftPress();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        if (!rightClosed) startRightPress();
      } else if (e.code === 'Space') {
        e.preventDefault();
        // Space acts as Pause/Resume only in COLLECTING state
        if (activeStateRef.current === 4) {
          setIsRecording(prev => {
            const next = !prev;
            if (next) addVoiceLog("继续采集");
            else addVoiceLog("采集暂停");
            return next;
          });
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'KeyL') {
        stopLeftPress();
      } else if (e.code === 'KeyR') {
        stopRightPress();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [leftClosed, rightClosed]);

  // Timer simulation loop
  useEffect(() => {
    // Ping latency updates
    const pingInterval = setInterval(() => {
      setPing(`${Math.floor(Math.random() * 2) + 1}ms`);
    }, 4000);

    return () => clearInterval(pingInterval);
  }, []);

  // Calibration countdown timer
  useEffect(() => {
    if (activeState === 3) {
      setCalibCountdown(3);
      clearInterval(calibInterval.current);
      calibInterval.current = setInterval(() => {
        setCalibCountdown(c => {
          if (c <= 1) {
            clearInterval(calibInterval.current);
            // Complete Calibration, Start recording
            setActiveState(4);
            setElapsed(0);
            setIsRecording(true);
            addVoiceLog("初始位置重置完成。3，2，1，数据采集开始。");
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      clearInterval(calibInterval.current);
    }
  }, [activeState]);

  // Active recording timer
  useEffect(() => {
    if (activeState === 4 && isRecording) {
      clearInterval(recInterval.current);
      recInterval.current = setInterval(() => {
        setElapsed(e => {
          const next = e + 1;
          const targetTicks = Math.floor(config.rgb_frame_number / 3); // frame number / 30fps * 10 ticks/s = frames / 3
          
          // Voice reminders at 50% and 80%
          if (next === Math.floor(targetTicks * 0.5)) {
            addVoiceLog("采集进度已达50%，请保持动作平稳。");
          } else if (next === Math.floor(targetTicks * 0.8)) {
            addVoiceLog("采集进度已达80%，请注意末端避障与轨迹质量。");
          }
          
          if (next >= targetTicks) {
            setIsRecording(false);
            setActiveState(5);
            addVoiceLog("本次数据采集已完成，请等待。");
            return targetTicks;
          }
          return next;
        });
      }, 100);
    } else {
      clearInterval(recInterval.current);
    }
  }, [activeState, isRecording, config.rgb_frame_number]);

  // Audio wave element generator
  const WaveAnimation = ({ active }) => (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 28 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
        <div 
          key={i} 
          style={{
            width: 3,
            height: active ? '100%' : '20%',
            background: '#faad14',
            borderRadius: 1.5,
            animation: active ? `waveAnim ${0.3 + i * 0.08}s infinite ease-in-out alternate` : 'none',
            transition: 'all 0.3s'
          }}
        />
      ))}
    </div>
  );

  const toggleFullscreen = (id) => {
    setFullscreenId(prev => prev === id ? null : id);
  };

  const PanelHeader = ({ id, title }) => (
    <div style={{ height: 32, background: '#141414', borderBottom: '1px solid #303030', display: 'flex', alignItems: 'center', padding: '0 12px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', color: '#e8e8e8', fontSize: 12, fontWeight: 600 }}>
        <div style={{ width: 3, height: 12, background: '#faad14', marginRight: 8 }}></div>
        {title}
      </div>
      {fullscreenId === id ? 
        <CompressOutlined onClick={() => toggleFullscreen(id)} style={{ color: '#8c8c8c', cursor: 'pointer' }} /> :
        <ExpandOutlined onClick={() => toggleFullscreen(id)} style={{ color: '#8c8c8c', cursor: 'pointer' }} />
      }
    </div>
  );

  // Save changes from JSON editor panel
  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setConfig(parsed);
      setIsEditingJson(false);
      message.success("本地 tasks_config.json 配置写入成功！");
    } catch(e) {
      message.error("JSON 格式错误，请检查！");
    }
  };

  // Convert frame count to seconds helper
  const framesToSeconds = (frames) => (frames / 30).toFixed(1);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#faad14',
          borderRadius: 6,
          colorBgContainer: '#141924',
          colorBorder: '#2d3345'
        },
      }}
    >
      <div style={{ 
        height: '100vh', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        background: '#0a0d16', 
        color: '#f8fafc',
        fontFamily: 'Inter, -apple-system, sans-serif'
      }}>
        
        {/* State drift styling */}
        <style jsx global>{`
          @keyframes waveAnim {
            0% { height: 15%; }
            100% { height: 100%; }
          }
          @keyframes borderPulseGreen {
            0% { border-color: rgba(82, 196, 26, 0.2); }
            50% { border-color: rgba(82, 196, 26, 0.6); }
            100% { border-color: rgba(82, 196, 26, 0.2); }
          }
          @keyframes borderPulseAmber {
            0% { border-color: rgba(250, 173, 20, 0.2); }
            50% { border-color: rgba(250, 173, 20, 0.6); }
            100% { border-color: rgba(250, 173, 20, 0.2); }
          }
          .pulse-green-border {
            animation: borderPulseGreen 3s infinite ease-in-out;
          }
          .pulse-amber-border {
            animation: borderPulseAmber 3s infinite ease-in-out;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.02);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
          }
        `}</style>

        {/* Top Header Diagnostics */}
        <div style={{ 
          height: 48, 
          borderBottom: '1px solid #1f2431', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 20px', 
          fontSize: 12, 
          color: '#8c9ba5', 
          background: '#0d111d' 
        }}>
          <Space size="large" separator={<span style={{ color: '#252b3a' }}>|</span>}>
            <Space size="small">
              <ThunderboltOutlined style={{ color: '#faad14' }} />
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>Lumos FastUMI Go</span>
              <Tag color="warning" style={{ fontSize: 10, margin: 0 }}>OFFLINE CLIENT</Tag>
            </Space>

            <Space size="small">
              <GlobalOutlined style={{ color: '#faad14' }} />
              <span>静态IP: <b style={{ color: '#f8fafc' }}>192.168.54.53</b></span>
            </Space>

            <Space size="small">
              <ApiOutlined style={{ color: '#52c41a' }} />
              <span>背包主机: <b style={{ color: '#f8fafc' }}>192.168.54.110</b></span>
              <Badge status="success" style={{ marginLeft: 4 }} />
            </Space>

            <Space size="small">
              <SoundOutlined style={{ color: '#13c2c2' }} />
              <span>耳机监听: <b style={{ color: '#f8fafc' }}>已连接</b></span>
            </Space>

            <Space size="small">
              <MonitorOutlined style={{ color: '#722ed1' }} />
              <span>HDMI骗器: <b style={{ color: '#f8fafc' }}>ACTIVE</b></span>
            </Space>

            <Space size="small">
              <HddOutlined style={{ color: '#fa8c16' }} />
              <span>边缘存储: <b style={{ color: '#f8fafc' }}>105GB可用</b></span>
            </Space>
          </Space>

          <Space size="middle">
            <span style={{ fontSize: 11, color: '#687785' }}>按键模拟: L (左夹爪) | R (右夹爪) | Space (采集暂停)</span>
            <Button 
              size="small" 
              icon={<SoundOutlined />} 
              type={speechEnabled ? "primary" : "default"}
              onClick={toggleSpeech}
            >
              语音: {speechEnabled ? "ON" : "OFF"}
            </Button>
            <Button 
              size="small" 
              type="primary" 
              danger 
              ghost 
              icon={<CloseCircleOutlined />} 
              onClick={() => router.push('/collection/collect')}
            >
              退出工作台
            </Button>
          </Space>
        </div>

        {/* Main Interface Layout */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          
          {/* Section 1: Video Feeds (Left Column) */}
          <div style={{ 
            flex: 1.8, 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 16, 
            gap: 12, 
            minWidth: 0,
            overflowY: 'auto' 
          }} className="custom-scrollbar">
            
            <div style={{ 
              display: fullscreenId ? 'block' : 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gridTemplateRows: '1fr 1fr', 
              gap: 12,
              height: '100%',
              minHeight: 520
            }}>
              
              {/* Camera 1: Left wrist */}
              {(!fullscreenId || fullscreenId === 'left_wrist') && (
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #1f2431', background: '#0e121e', borderRadius: 8, overflow: 'hidden' }}>
                  <PanelHeader id="left_wrist" title="左手-腕部视角 [WRIST_CAM_L]" />
                  <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080a10' }}>
                    <div style={{ 
                      width: '100%', height: '100%', 
                      backgroundImage: 'radial-gradient(circle, transparent 20%, #000 130%), url("https://images.unsplash.com/photo-1546776310-eef45dd6d63c?q=80&w=640&auto=format&fit=crop")',
                      backgroundSize: 'cover', backgroundPosition: 'center', opacity: activeState >= 2 ? 0.8 : 0.2
                    }} />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <Badge status={activeState >= 2 ? "processing" : "default"} text="640x360 | 30 FPS" style={{ color: '#fff' }} />
                    </div>
                    {activeState < 2 && <span style={{ position: 'absolute', color: '#526075', fontSize: 12 }}>设备尚未配对联通</span>}
                  </div>
                </div>
              )}

              {/* Camera 2: Right wrist */}
              {(!fullscreenId || fullscreenId === 'right_wrist') && (
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #1f2431', background: '#0e121e', borderRadius: 8, overflow: 'hidden' }}>
                  <PanelHeader id="right_wrist" title="右手-腕部视角 [WRIST_CAM_R]" />
                  <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080a10' }}>
                    <div style={{ 
                      width: '100%', height: '100%', 
                      backgroundImage: 'radial-gradient(circle, transparent 20%, #000 130%), url("https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=640&auto=format&fit=crop")',
                      backgroundSize: 'cover', backgroundPosition: 'center', opacity: activeState >= 2 ? 0.8 : 0.2
                    }} />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <Badge status={activeState >= 2 ? "processing" : "default"} text="640x360 | 30 FPS" style={{ color: '#fff' }} />
                    </div>
                    {activeState < 2 && <span style={{ position: 'absolute', color: '#526075', fontSize: 12 }}>设备尚未配对联通</span>}
                  </div>
                </div>
              )}

              {/* Camera 3: Head view */}
              {(!fullscreenId || fullscreenId === 'head_eye') && (
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #1f2431', background: '#0e121e', borderRadius: 8, overflow: 'hidden' }}>
                  <PanelHeader id="head_eye" title="头部左目视角 [HEAD_LEFT_EYE]" />
                  <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080a10' }}>
                    <div style={{ 
                      width: '100%', height: '100%', 
                      backgroundImage: 'radial-gradient(circle, transparent 20%, #000 130%), url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640&auto=format&fit=crop")',
                      backgroundSize: 'cover', backgroundPosition: 'center', opacity: activeState >= 2 ? 0.85 : 0.2
                    }} />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <Badge status={activeState >= 2 ? "processing" : "default"} text="640x480 | 30 FPS" style={{ color: '#fff' }} />
                    </div>
                    {activeState < 2 && <span style={{ position: 'absolute', color: '#526075', fontSize: 12 }}>设备尚未配对联通</span>}
                  </div>
                </div>
              )}

              {/* Joint coordinates twin */}
              {(!fullscreenId || fullscreenId === 'digital_twin') && (
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #1f2431', background: '#0e121e', borderRadius: 8, overflow: 'hidden' }}>
                  <PanelHeader id="digital_twin" title="三维关节真值实时孪生 [joints_telemetry.json]" />
                  <div style={{ flex: 1, position: 'relative', background: '#080b11', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Simulated 3D points mesh grid */}
                    <div style={{ 
                      position: 'absolute', inset: 0, 
                      backgroundImage: 'linear-gradient(rgba(250, 173, 20, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 173, 20, 0.05) 1px, transparent 1px)', 
                      backgroundSize: '30px 30px', 
                      transform: 'perspective(200px) rotateX(45deg) scale(1.5)', 
                      transformOrigin: 'center 80%' 
                    }} />
                    
                    {/* Animated Joint Line */}
                    <svg width="200" height="200" style={{ zIndex: 2, transform: 'scale(1.2)' }}>
                      <circle cx="100" cy="170" r="6" fill="#bfbfbf" />
                      <line x1="100" y1="170" x2="80" y2="110" stroke="#faad14" strokeWidth="4" />
                      <circle cx="80" cy="110" r="5" fill="#faad14" />
                      <line x1="80" y1="110" x2="130" y2="70" stroke="#faad14" strokeWidth="4" />
                      <circle cx="130" cy="70" r="5" fill="#faad14" />
                      
                      {/* Left wrist end effector */}
                      <line x1="130" y1="70" x2="120" y2="40" stroke="#52c41a" strokeWidth="3" />
                      <circle cx="120" cy="40" r="4" fill="#52c41a" />
                      
                      {/* Right wrist end effector */}
                      <line x1="130" y1="70" x2="150" y2="40" stroke="#13c2c2" strokeWidth="3" />
                      <circle cx="150" cy="40" r="4" fill="#13c2c2" />
                    </svg>

                    <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                      JOINT_0: 12.4° / JOINT_1: -45.1° / JOINT_2: 90.0°
                    </div>

                    <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
                      <Tag color="cyan" style={{ margin: 0, fontSize: 10 }}>IMMEDIATE EVALUATION ON</Tag>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Section 2: Audio log & Device simulators (Middle Column) */}
          <div style={{ 
            flex: 1.5, 
            borderLeft: '1px solid #1f2431', 
            borderRight: '1px solid #1f2431', 
            background: '#0c0f1a', 
            padding: '16px 20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16,
            minWidth: 320
          }}>
            
            {/* Audio Wave & Logs */}
            <div style={{ 
              background: '#0d1220', 
              border: '1px solid #1f2431', 
              borderRadius: 8, 
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }} className="pulse-green-border">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <AudioOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                  <span style={{ fontSize: 13, fontWeight: 'bold', color: '#f8fafc' }}>Lumos 语音导引助理</span>
                </Space>
                <WaveAnimation active={speaking} />
              </div>

              {/* Big active speech subtitle */}
              <div style={{ 
                minHeight: 64, 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: 6, 
                padding: '10px 14px', 
                border: '1px solid rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Text style={{ color: '#fff', fontSize: 13, lineHeight: 1.5 }}>
                  🔊 <b>语音广播:</b> {voiceLogs[0]?.text}
                </Text>
              </div>

              {/* Logs checklist */}
              <div style={{ borderTop: '1px solid #1f2431', paddingTop: 10 }}>
                <span style={{ fontSize: 11, color: '#526075', fontWeight: 600, display: 'block', marginBottom: 8 }}>广播历史日志 (近5条)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 100, overflowY: 'auto' }} className="custom-scrollbar">
                  {voiceLogs.map((log) => (
                    <div key={log.id} style={{ fontSize: 11, color: log.type === 'system' ? '#8c9ba5' : '#faad14' }}>
                      <span style={{ color: '#526075' }}>[{new Date(log.id).toLocaleTimeString()}]</span> {log.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hardware Controls & Gripper simulator */}
            <div style={{ 
              background: '#0d1220', 
              border: '1px solid #1f2431', 
              borderRadius: 8, 
              padding: 16, 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16,
              minHeight: 340 
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 'bold', color: '#f8fafc' }}>离线物理终端设备模拟</span>
                <Badge status={activeState > 0 ? "processing" : "default"} text={activeState > 0 ? "服务在线" : "未启动"} />
              </div>

              {/* Physical button simulator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>数采背包物理启动键 (蓝光按键)</div>
                  <div style={{ fontSize: 10, color: '#526075', marginTop: 2 }}>单击启动/重启程序服务</div>
                </div>
                <Button 
                  shape="circle" 
                  style={{
                    width: 38,
                    height: 38,
                    background: activeState > 0 ? '#1890ff' : '#2f3442',
                    border: 'none',
                    boxShadow: activeState > 0 ? '0 0 12px #1890ff' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onClick={clickBlueButton}
                >
                  <ThunderboltOutlined style={{ color: '#fff', fontSize: 16 }} />
                </Button>
              </div>

              {/* State Flow indicator badge */}
              <div style={{ background: 'rgba(250, 173, 20, 0.05)', border: '1px solid rgba(250, 173, 20, 0.15)', borderRadius: 6, padding: '12px 14px' }}>
                <span style={{ fontSize: 11, color: '#faad14', fontWeight: 600 }}>当前流程状态指引:</span>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#fff', marginTop: 4 }}>
                  {activeState === 0 && "🔌 请按启动按钮开启服务"}
                  {activeState === 1 && "🤝 请按住左夹爪 3s 进行配对"}
                  {activeState === 2 && "🟢 就绪，按住左夹爪 3s 开启循环采集"}
                  {activeState === 3 && `⏳ 原点重置中 (平行放置)... ${calibCountdown}s`}
                  {activeState === 4 && "🔴 数据采集中 (可按住 Space 暂停)"}
                  {activeState === 5 && "💾 采集完成。左夹爪 3s 保存，右夹爪 3s 隔离"}
                  {activeState === 6 && "🔄 是否继续采集？左夹爪继续，右夹爪结束"}
                </div>
              </div>

              {/* Gripper Controller simulator grids */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
                
                {/* Left gripper */}
                <Card 
                  size="small" 
                  title={<span style={{ fontSize: 11, color: '#f8fafc' }}>左夹爪 (标定/启动/保存)</span>}
                  style={{ 
                    border: '1px solid #1f2431', 
                    background: leftClosed ? 'rgba(82, 196, 26, 0.06)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  styles={{ body: { padding: '10px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: '#526075' }}>手势形态:</span>
                      <Tag color={leftClosed ? "success" : "default"} style={{ margin: 0, fontSize: 9 }}>
                        {leftClosed ? "闭合" : "松开"}
                      </Tag>
                    </div>
                    <Progress percent={leftPressProgress} size="small" strokeColor="#52c41a" status="active" />
                    <div style={{ fontSize: 9, color: '#687785', textAlign: 'center', marginTop: 4 }}>已长按 {((leftPressProgress * 3) / 100).toFixed(1)} 秒</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                    <Button 
                      size="small" 
                      type={leftClosed ? "primary" : "default"} 
                      danger={leftClosed}
                      onMouseDown={startLeftPress}
                      onMouseUp={stopLeftPress}
                      style={{ flex: 1, fontSize: 11 }}
                    >
                      长按模拟 (Key L)
                    </Button>
                  </div>
                </Card>

                {/* Right gripper */}
                <Card 
                  size="small" 
                  title={<span style={{ fontSize: 11, color: '#f8fafc' }}>右夹爪 (隔离/退出)</span>}
                  style={{ 
                    border: '1px solid #1f2431', 
                    background: rightClosed ? 'rgba(255, 77, 79, 0.06)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  styles={{ body: { padding: '10px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: '#526075' }}>手势形态:</span>
                      <Tag color={rightClosed ? "error" : "default"} style={{ margin: 0, fontSize: 9 }}>
                        {rightClosed ? "闭合" : "松开"}
                      </Tag>
                    </div>
                    <Progress percent={rightPressProgress} size="small" strokeColor="#ff4d4f" status="active" />
                    <div style={{ fontSize: 9, color: '#687785', textAlign: 'center', marginTop: 4 }}>已长按 {((rightPressProgress * 3) / 100).toFixed(1)} 秒</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                    <Button 
                      size="small" 
                      type={rightClosed ? "primary" : "default"}
                      danger={rightClosed}
                      onMouseDown={startRightPress}
                      onMouseUp={stopRightPress}
                      style={{ flex: 1, fontSize: 11 }}
                    >
                      长按模拟 (Key R)
                    </Button>
                  </div>
                </Card>

              </div>
            </div>
          </div>

          {/* Section 3: Configurations & Episodes (Right Column) */}
          <div style={{ 
            flex: 1.2, 
            background: '#0a0d16', 
            padding: 16, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16, 
            minWidth: 280,
            overflowY: 'auto' 
          }} className="custom-scrollbar">
            
            {/* JSON Configuration Panel (tasks_config.json) */}
            <Card 
              size="small"
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}><SettingOutlined /> 本地任务配置 tasks_config.json</span>
                  <Button 
                    size="small" 
                    type="link" 
                    icon={isEditingJson ? <SaveOutlined /> : <CodeOutlined />}
                    onClick={() => {
                      if (isEditingJson) {
                        handleSaveJson();
                      } else {
                        setJsonText(JSON.stringify(config, null, 2));
                        setIsEditingJson(true);
                      }
                    }}
                  >
                    {isEditingJson ? "保存" : "编辑"}
                  </Button>
                </div>
              }
              style={{ background: '#0e121e', border: '1px solid #1f2431' }}
            >
              {isEditingJson ? (
                <div>
                  <Input.TextArea 
                    value={jsonText}
                    onChange={e => setJsonText(e.target.value)}
                    rows={8}
                    style={{ 
                      fontFamily: 'monospace', 
                      fontSize: 11, 
                      background: '#040711', 
                      color: '#faad14', 
                      border: '1px solid #2d3345' 
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <Button size="small" onClick={() => setIsEditingJson(false)}>取消</Button>
                    <Button size="small" type="primary" onClick={handleSaveJson}>保存配置</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#526075' }}>任务ID (task_id):</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{config.task_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#526075' }}>中文描述:</span>
                    <span style={{ fontWeight: 600 }}>{config.description_cn}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#526075' }}>单段限制 (帧数):</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{config.rgb_frame_number} 帧 ({framesToSeconds(config.rgb_frame_number)}s)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#526075' }}>目标段数 (total_count):</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{config.total_count}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#526075' }}>即时质检评估 (if_quality_check):</span>
                    <span style={{ fontWeight: 600, color: config.if_quality_check ? '#52c41a' : '#ff4d4f' }}>
                      {config.if_quality_check ? "已开启" : "已关闭"}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Collected episodes panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 180 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>
                  当前批次已采记录 ({completedEpisodes.length} / {config.total_count})
                </span>
                <span style={{ fontSize: 11, color: '#faad14' }}>
                  成功率: {((completedEpisodes.filter(e => e.status === '已保存').length / Math.max(1, completedEpisodes.length)) * 100).toFixed(0)}%
                </span>
              </div>

              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 8,
                background: '#0d111d',
                borderRadius: 6,
                padding: 10,
                border: '1px solid #1f2431'
              }} className="custom-scrollbar">
                
                {completedEpisodes.length === 0 ? (
                  <div style={{ color: '#526075', fontSize: 12, textAlign: 'center', marginTop: 40 }}>暂无已采段落数据</div>
                ) : (
                  completedEpisodes.map((ep, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        background: '#141924', 
                        border: '1px solid #2d3345', 
                        borderRadius: 4, 
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 'bold', color: '#faad14', fontFamily: 'monospace' }}>{ep.id}</span>
                        <Tag color={ep.status === '已保存' ? 'success' : 'error'} style={{ margin: 0, fontSize: 10 }}>
                          {ep.status}
                        </Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8c9ba5' }}>
                        <span>时长: {ep.duration}</span>
                        <span>总帧数: {ep.frames}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* Bottom Status & Recording Timeline */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          borderTop: '1px solid #1f2431', 
          background: '#0d111d',
          padding: '8px 20px 12px 20px'
        }}>
          {/* Progress bar timeline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ flex: 1, height: 6, background: '#141924', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: activeState === 4 ? '#ff4d4f' : '#faad14', 
                  width: `${Math.min(100, (elapsed / (config.rgb_frame_number / 3)) * 100)}%`, 
                  transition: 'width 0.1s linear'
                }} 
              />
            </div>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8c9ba5', minWidth: 60, textAlign: 'right' }}>
              {((elapsed / (config.rgb_frame_number / 3)) * 100).toFixed(0)}%
            </span>
          </div>

          {/* Time statistic controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#8c9ba5' }}>
              <span>单段采集耗时: <b style={{ color: '#fff', fontSize: 14, fontFamily: 'monospace' }}>{(elapsed / 10).toFixed(1)}s</b> / {framesToSeconds(config.rgb_frame_number)}s</span>
              <span>采集数据帧率: <b style={{ color: '#fff', fontSize: 14, fontFamily: 'monospace' }}>30 FPS</b></span>
              <span>当前帧计数: <b style={{ color: '#fff', fontSize: 14, fontFamily: 'monospace' }}>{elapsed * 3}帧</b> / {config.rgb_frame_number}帧</span>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {activeState === 4 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f', animation: 'blink 1s infinite' }} />
                  <span style={{ fontSize: 12, color: '#ff4d4f', fontWeight: 'bold' }}>REC 录制中</span>
                </div>
              )}
              {activeState === 3 && (
                <span style={{ fontSize: 12, color: '#faad14', fontWeight: 'bold' }}>原点重置倒计时 {calibCountdown}s</span>
              )}
              {activeState === 2 && (
                <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 'bold' }}>READY (就绪等待)</span>
              )}
              {activeState === 5 && (
                <span style={{ fontSize: 12, color: '#13c2c2', fontWeight: 'bold' }}>待保存/隔离</span>
              )}
              {activeState === 6 && (
                <span style={{ fontSize: 12, color: '#faad14', fontWeight: 'bold' }}>继续下一轮?</span>
              )}
              {activeState === 0 && (
                <span style={{ fontSize: 12, color: '#526075' }}>服务尚未启动</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
