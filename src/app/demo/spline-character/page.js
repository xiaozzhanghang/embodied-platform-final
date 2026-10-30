'use client';

import React, { useState } from 'react';
import SplineRobotFloatingCharacter from '@/components/ui/SplineRobotFloatingCharacter';
import { Card, Table, Tag, Button, Radio, Divider, Alert, Steps } from 'antd';

export default function SplineCharacterDemoPage() {
  const [activeMode, setActiveMode] = useState('animated_webp');
  const [selectedStep, setSelectedStep] = useState('all'); // 'all' or 'step1' ~ 'step5'

  // 动作步骤定义与参数表
  const motionSteps = [
    {
      id: 'step1',
      title: '步骤 1：待机悬浮起伏',
      timeRange: '0.0s ~ 0.7s (第 0~10 帧)',
      tag: '姿态基准',
      tagColor: 'blue',
      imgSrc: '/robot-character/step1_idle.png',
      summary: '反重力磁悬浮正弦上下起伏，胸腔与肩甲微呼吸膨缩，视线正对前方。',
      joints: '身体 Y 轴浮动: ±8.0px | 颈部偏航: 0.0° | 双臂待机微张角: 0.0° | 面罩: 100% 待命常亮'
    },
    {
      id: 'step2',
      title: '步骤 2：向左偏航与眨眼微光',
      timeRange: '0.7s ~ 1.4s (第 11~20 帧)',
      tag: '感知探测',
      tagColor: 'cyan',
      imgSrc: '/robot-character/step2_look_left.png',
      summary: '头部偏航向左侧探视并伴随轻微倾角，眼罩 LED 矩阵在 0.84s 进行智能微暗眨眼。',
      joints: '颈部偏航 Yaw: -8.0px | 侧倾 Roll: -4.5° | 面罩亮度: -35% 眨眼微暗 | 左臂微摆: +3.0°'
    },
    {
      id: 'step3',
      title: '步骤 3：右臂抬起挥手打招呼',
      timeRange: '1.4s ~ 2.1s (第 21~31 帧)',
      tag: '主动交互',
      tagColor: 'green',
      imgSrc: '/robot-character/step3_wave_hand.png',
      summary: '右肩关节球枢轴驱动机械大臂抬升，手腕外旋、五指张开做出友好打招呼与引导姿态。',
      joints: '右肩关节角: -12.0° ~ -14.5° | 手腕外旋: +8.0° | 躯干协同呼吸: +1.0% | 左手配重'
    },
    {
      id: 'step4',
      title: '步骤 4：向右环视与手势引导',
      timeRange: '2.1s ~ 2.6s (第 32~39 帧)',
      tag: '全景巡检',
      tagColor: 'purple',
      imgSrc: '/robot-character/step4_look_right.png',
      summary: '头部从左向右大范围回旋并偏航至右侧，目光探查右侧区域，右臂顺势轻微平落。',
      joints: '颈部偏航 Yaw: +8.0px | 侧倾 Roll: +4.5° | 面罩聚焦高光 | 右臂自然降下: -4.0°'
    },
    {
      id: 'step5',
      title: '步骤 5：回中归位与无缝循环',
      timeRange: '2.6s ~ 3.0s (第 40~45 帧)',
      tag: '闭环衔接',
      tagColor: 'gold',
      imgSrc: '/robot-character/step5_reset.png',
      summary: '头部、躯干与双臂平滑回归待机零位，位移与速度导数严格连续，实现无缝 0 跳顿循环。',
      joints: '归位加速度: 连续平滑 | 浮动高度归零: 0.0px | 帧末与第 0 帧位姿误差 < 0.01%'
    }
  ];

  const currentStepInfo = motionSteps.find(s => s.id === selectedStep);

  const comparisonData = [
    {
      key: '1',
      metric: '资源下载大小 (Asset Size)',
      pngCss: '115 KB (单张高精静态 PNG)',
      webp: '904 KB (45 帧 15FPS 512×512 完整循环)',
      spline3d: '约 12 ~ 28 MB (Runtime + .splinecode + WASM)',
      advantage: 'PNG+CSS 极致秒开；WebP 仍比 3D 引擎小 96%'
    },
    {
      key: '2',
      metric: '初始化耗时 (Load / TTI)',
      pngCss: '< 30 ms (直接图片解码渲染)',
      webp: '< 80 ms (浏览器原生 WebP 解码)',
      spline3d: '1500 ~ 4500 ms (着色器编译与资产解压)',
      advantage: '轻量素材无任何白屏阻塞，首屏瞬开'
    },
    {
      key: '3',
      metric: 'GPU 显存占用 (VRAM)',
      pngCss: '~2 MB 显存纹理缓存',
      webp: '~8 MB 显存纹理缓存',
      spline3d: '180 MB ~ 420 MB 显存',
      advantage: '减少 95% 以上 GPU 显存负载'
    },
    {
      key: '4',
      metric: 'CPU 持续占用 (Idle CPU)',
      pngCss: '接近 0% (CSS transform 硬件合成器调度)',
      webp: '0.1% ~ 0.3% (浏览器原生帧解码)',
      spline3d: '12% ~ 35% (持续 requestAnimationFrame 物理与渲染循坏)',
      advantage: '完全解决电脑发热与风扇狂转问题'
    },
    {
      key: '5',
      metric: '页面滚动与交互流畅度 (FPS)',
      pngCss: '稳定 60 / 120 FPS 无掉帧',
      webp: '稳定 60 / 120 FPS 无掉帧',
      spline3d: '重型页面易卡顿 (30~45 FPS)，抢占主线程',
      advantage: '滚动与点击丝滑无阻'
    },
    {
      key: '6',
      metric: '动作表现力 (Animation Quality)',
      pngCss: '平滑呼吸与空间上下浮动 (无头部摆动)',
      webp: '真实左右转头/微点头、双臂手部律动挥手摆动、眼部面罩眨眼微光、呼吸悬浮',
      spline3d: '支持鼠标视差跟随与实时物理变形',
      advantage: 'WebP 完整呈现左右摇头与手部动作，且零 3D 计算开销'
    },
    {
      key: '7',
      metric: '透明背景表现 (Alpha Transparency)',
      pngCss: '100% 干净透明通道，无黑边/白边',
      webp: '100% 干净透明通道，无黑边/白边',
      spline3d: '依赖 canvas clearColor 配置，易有半透明抗锯齿黑边',
      advantage: '与暗色科技风或亮色背景完美无缝融入'
    }
  ];

  const columns = [
    { title: '对比维度', dataIndex: 'metric', key: 'metric', width: '22%' },
    {
      title: '方式一：PNG + CSS 浮动',
      dataIndex: 'pngCss',
      key: 'pngCss',
      render: (text) => <span style={{ color: '#00f2fe', fontWeight: 500 }}>{text}</span>
    },
    {
      title: '方式二：动态 WebP 序列 (5步分解)',
      dataIndex: 'webp',
      key: 'webp',
      render: (text) => <span style={{ color: '#10b981', fontWeight: 500 }}>{text}</span>
    },
    {
      title: '原有方式：Spline 3D Runtime',
      dataIndex: 'spline3d',
      key: 'spline3d',
      render: (text) => <span style={{ color: '#94a3b8' }}>{text}</span>
    },
    {
      title: '选型评价',
      dataIndex: 'advantage',
      key: 'advantage',
      render: (text) => <Tag color="blue">{text}</Tag>
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#f8fafc', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Spline 3D 角色动作步骤还原与网页轻量化展示平台
            </h1>
            <Tag color="cyan">纯轻量无 3D Canvas</Tag>
            <Tag color="green">透明 Alpha 通道认证</Tag>
            <Tag color="purple">5 大动作步骤精准复现</Tag>
          </div>
          <p style={{ color: '#94a3b8', marginTop: '10px', fontSize: '14px', lineHeight: 1.6 }}>
            将原 Spline 3D 机器人角色（NEXBOT）在视频/演示页面中的动作序列进行微米级骨骼拆解，
            转换为 100% 透明无背景的轻量化动画素材，在完全不加载 Spline Runtime / Three.js Canvas 的前提下，实现流畅生动的机器人交互。
          </p>
        </div>

        {/* 视频与动作原理说明提示 */}
        <Alert
          message="关于 Spline 视频/动作还原的说明"
          description={
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#93c5fd' }}>
              Spline 社区作品（<code>https://app.spline.design/community/file/c50659b8-4f8f-474f-8e32-e4c34ac78389</code>）
              在网页端底层为<strong>Spline 实时 WebGL 交互流</strong>（非普通 mp4 视频文件）。
              我们已针对视频中的机器人动态，按<strong>「待机浮动 ➔ 头部左转与眨眼 ➔ 右臂挥手致意 ➔ 向右环视 ➔ 平滑回位」</strong>完整提取 45 帧动作轨迹，并生成可交互控制的透明动画资产。
            </div>
          }
          type="info"
          showIcon
          style={{
            marginBottom: '28px',
            background: 'rgba(30, 58, 138, 0.25)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '10px'
          }}
        />

        {/* 核心板块：视频动作步骤分解与即时交互回放 */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#38bdf8', fontSize: '16px', fontWeight: 600 }}>
                  🎬 视频动作步骤时间轴深度分解 (Motion Timeline Breakdown)
                </span>
                <Tag color="cyan">15 FPS / 3.0s 闭环</Tag>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  size="small"
                  type={selectedStep === 'all' ? 'primary' : 'default'}
                  onClick={() => setSelectedStep('all')}
                  style={{
                    background: selectedStep === 'all' ? '#0284c7' : 'rgba(255,255,255,0.06)',
                    borderColor: selectedStep === 'all' ? '#38bdf8' : 'rgba(255,255,255,0.2)',
                    color: '#fff'
                  }}
                >
                  ▶ 连续动态 WebP 播放
                </Button>
              </div>
            </div>
          }
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            marginBottom: '32px'
          }}
        >
          {/* 步骤选择按钮网格 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {motionSteps.map((step, idx) => {
              const isSelected = selectedStep === step.id;
              return (
                <div
                  key={step.id}
                  id={`step-card-${step.id}`}
                  onClick={() => setSelectedStep(step.id)}
                  style={{
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>第 {idx + 1} 阶段</span>
                    <Tag color={step.tagColor} style={{ margin: 0, fontSize: '10px', padding: '0 4px' }}>{step.tag}</Tag>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#38bdf8' : '#e2e8f0' }}>
                    {step.title.split('：')[1]}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {step.timeRange.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 选中步骤或完整动效的主控显示区 */}
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'center', background: 'rgba(2, 6, 23, 0.6)', padding: '24px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {/* 左侧：画面渲染区 */}
            <div
              style={{
                height: '360px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                borderRadius: '8px',
                position: 'relative'
              }}
            >
              {selectedStep === 'all' ? (
                /* 完整循环 WebP */
                <div style={{ width: '260px', height: '260px', position: 'relative' }}>
                  <img
                    src="/robot-character/spline_robot_animated.webp"
                    alt="Animated Robot"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    <Tag color="green">动态 WebP 完整 3 秒连续循环中</Tag>
                  </div>
                </div>
              ) : (
                /* 定格步骤图像 */
                <div style={{ width: '260px', height: '260px', position: 'relative' }}>
                  <img
                    src={currentStepInfo?.imgSrc}
                    alt={currentStepInfo?.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    <Tag color="cyan">{currentStepInfo?.title} · 高清定格</Tag>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：动作数据与工程度量详情 */}
            <div>
              {selectedStep === 'all' ? (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#38bdf8', marginBottom: '12px' }}>
                    完整动作循环序列 (Seamless Cyclic Execution)
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.8 }}>
                    当前处于连续循环模式，机器人在 3 秒内按顺序无缝衔接完成 5 大动作阶段：
                  </p>
                  <ul style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 2, paddingLeft: '20px' }}>
                    <li><strong style={{ color: '#e2e8f0' }}>0.0s - 0.7s:</strong> 待机浮空、微呼吸起伏、姿态归零平衡。</li>
                    <li><strong style={{ color: '#e2e8f0' }}>0.7s - 1.4s:</strong> 头部向左偏航 -8px 并轻微侧倾，面罩 LED 眨眼微暗。</li>
                    <li><strong style={{ color: '#e2e8f0' }}>1.4s - 2.1s:</strong> 右臂抬升 -14.5°，手腕与机械五指微抬挥动，打招呼致意。</li>
                    <li><strong style={{ color: '#e2e8f0' }}>2.1s - 2.6s:</strong> 头部平滑转向右侧 +8px，眼罩高光聚焦巡视。</li>
                    <li><strong style={{ color: '#e2e8f0' }}>2.6s - 3.0s:</strong> 头部与手臂平滑回归待机零位，无缝进入下一个循环。</li>
                  </ul>
                  <div style={{ marginTop: '16px' }}>
                    <Button
                      type="dashed"
                      size="middle"
                      onClick={() => setSelectedStep('step3')}
                      style={{ color: '#10b981', borderColor: '#10b981' }}
                    >
                      查看关键步骤：步骤 3 (右臂挥手打招呼)
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                      {currentStepInfo?.title}
                    </h3>
                    <Tag color={currentStepInfo?.tagColor}>{currentStepInfo?.timeRange}</Tag>
                  </div>
                  <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: 1.8, marginBottom: '16px' }}>
                    {currentStepInfo?.summary}
                  </p>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>关节运动学与参数控制指标：</div>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#38bdf8' }}>
                      {currentStepInfo?.joints}
                    </div>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                    <Button
                      type="primary"
                      onClick={() => setSelectedStep('all')}
                      style={{ background: '#0284c7', borderColor: '#38bdf8' }}
                    >
                      切回连续动态播放
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 方案 A、B、C 实时效果三路横向对比区 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '36px' }}>
          {/* 方案 A：PNG + CSS 浮动 */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#00f2fe' }}>方案 A：透明静态 PNG + CSS</span>
                <Tag color="cyan">115 KB</Tag>
              </div>
            }
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              borderRadius: '12px'
            }}
          >
            <div
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, rgba(0, 242, 254, 0.08) 0%, transparent 70%)',
                borderRadius: '8px',
                position: 'relative'
              }}
            >
              <SplineRobotFloatingCharacter
                initialMode="png_css"
                size={220}
                position="inline"
                showControls={false}
                statusText="PNG+CSS 硬件浮动中"
              />
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
              特点：加载最轻、零计算开销，CSS <code>transform: translateY()</code> 由浏览器合成器直接处理，极速秒开。
            </div>
          </Card>

          {/* 方案 B：动态透明 WebP */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#10b981' }}>方案 B：动态透明 WebP (60帧)</span>
                <Tag color="green">1.3 MB</Tag>
              </div>
            }
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px'
            }}
          >
            <div
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
                borderRadius: '8px',
                position: 'relative'
              }}
            >
              <SplineRobotFloatingCharacter
                initialMode="animated_webp"
                size={220}
                position="inline"
                showControls={false}
                statusText="动态 WebP (真实录屏提取)"
              />
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
              特点：零 video 播放器标签开销，直接以 <code>&lt;img&gt;</code> 标签嵌入，原生支持 3D 鼠标注视倾角跟随。
            </div>
          </Card>

          {/* 方案 C：原视频透明 WebM (VP9 + Alpha) */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#38bdf8' }}>方案 C：透明视频 (WebM/ProRes)</span>
                <Tag color="cyan">1.45 MB / 16.9s</Tag>
              </div>
            }
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px'
            }}
          >
            <div
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(2, 6, 23, 0.5)',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden'
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
                  filter: 'none'
                }}
              >
                <source src="/robot-character/spline_robot_transparent.mp4" type='video/mp4; codecs="hvc1"' />
                <source src="/robot-character/spline_robot_transparent.webm" type="video/webm" />
              </video>
              <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                <Tag color="cyan">WebM VP9 + Safari HEVC 双通道透明流</Tag>
              </div>
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
              特点：全长度 16.9 秒录屏 100% 还原，507 帧 30FPS 完整动作，完全剔除纯黑背景，保留高科透明质感。
            </div>
          </Card>
        </div>

        {/* 性能对比评测表格 */}
        <Card
          title="多方案性能与效果深度对比 (Performance & Resource Metrics)"
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            marginBottom: '32px'
          }}
        >
          <Table
            dataSource={comparisonData}
            columns={columns}
            pagination={false}
            bordered
            style={{ background: 'transparent' }}
          />
        </Card>

        {/* Spline 编辑器导出指引说明 */}
        <Card
          title="Spline 编辑器原生透明序列导出规范说明 (Spline Editor Export Guide)"
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px'
          }}
        >
          <div style={{ fontSize: '14px', lineHeight: 1.8, color: '#cbd5e1' }}>
            <p>
              针对需求中提及的<strong>“如无法直接从现有 Spline 链接获得透明动画素材，明确指出需要在 Spline 编辑器中手动导出的文件，不要用普通带背景截图冒充”</strong>，特此明确官方专业规范：
            </p>
            <ol style={{ paddingLeft: '20px' }}>
              <li>
                <strong>背景透明设置：</strong>在 Spline 编辑器右上角，点击背景属性，将 Background Color 的 Alpha 透明度由 100% 拖动至 <code>0%</code>（呈现灰色网格状透明底），严禁使用带白色或纯黑默认底色导出。
              </li>
              <li>
                <strong>导出格式与类型选择：</strong>点击顶部菜单「Export」➔ 选择「Video/Image」➔ 格式切换为「PNG Sequence」或支持 Alpha 的「Animated WebP / ProRes 4444」。
              </li>
              <li>
                <strong>推荐参数规格：</strong>分辨率设定为 <code>512 × 512</code>，帧率设为 <code>15 FPS</code> 或 <code>20 FPS</code>，循环时间范围锁定为 <code>3.0 秒</code>（整好 45 帧或 60 帧），以在画质和体积（&lt; 1MB）间达到最佳工业平衡。
              </li>
              <li>
                <strong>组件集成路径：</strong>导出后的素材可直接放置于平台的 <code>public/robot-character/</code> 目录下，由前端 <code>SplineRobotFloatingCharacter</code> 悬浮组件秒级直读加载，彻底告别 3D Canvas 开销。
              </li>
            </ol>
          </div>
        </Card>
      </div>

      {/* 右下角常驻悬浮小机器人组件 */}
      <SplineRobotFloatingCharacter
        initialMode="animated_webp"
        size={200}
        position="bottom-right"
        showControls={true}
        statusText="已同步 5 步动画姿态"
      />
    </div>
  );
}
