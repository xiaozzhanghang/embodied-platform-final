'use client';

import React from 'react';
import { Modal, Progress, Steps, Typography, Space, Tag, Button, Alert, Card } from 'antd';
import {
  ThunderboltOutlined, CheckCircleOutlined, SyncOutlined,
  CloseCircleOutlined, ArrowRightOutlined, RobotOutlined,
  FieldTimeOutlined, VideoCameraOutlined, CheckOutlined
} from '@ant-design/icons';
import { PIPELINE_PHASES } from './mockData';

const { Title, Text, Paragraph } = Typography;

export default function PipelineProgressModal({
  open,
  onClose,
  aiJobStatus,
  currentPhaseIndex,
  processedWindows,
  totalWindows,
  jobElapsedTime,
  currentEpisode,
  currentFps,
  generatedCount,
  modelMeta,
  onViewResults,
  onCancelJob,
}) {
  const isRunning = aiJobStatus === 'running' || aiJobStatus === 'queued';
  const isSucceeded = aiJobStatus === 'succeeded';
  const isCancelled = aiJobStatus === 'cancelled' || aiJobStatus === 'cancel_requested';

  // 计算百分比进度: 6 个阶段，每个阶段约 16.6%
  const calculatePercent = () => {
    if (isSucceeded) return 100;
    if (aiJobStatus === 'queued') return 5;
    if (currentPhaseIndex === 2) {
      // 在 VLM 推理阶段，根据分窗计算细分百分比 (33% ~ 66%)
      const winProgress = (processedWindows / (totalWindows || 5));
      return Math.min(65, Math.round(33 + winProgress * 32));
    }
    const base = Math.round(((currentPhaseIndex + 1) / PIPELINE_PHASES.length) * 100);
    return Math.min(95, Math.max(10, base));
  };

  const percent = calculatePercent();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={780}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
          <span style={{
            background: isSucceeded ? '#f0fdf4' : '#eff6ff',
            color: isSucceeded ? '#16a34a' : '#2563eb',
            padding: '6px 10px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            fontSize: 16
          }}>
            {isSucceeded ? <CheckCircleOutlined /> : <ThunderboltOutlined />}
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {isSucceeded ? '🎉 AI 动作切分与时序推理已完成' : '⚡ AI 自动标注任务流水线执行中'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
              基于 VLM 视觉语言模型原生时序理解与多模态机械臂状态特征提取
            </div>
          </div>
        </div>
      }
      style={{ top: 50 }}
      styles={{ body: { padding: '16px 20px 24px' } }}
    >
      {/* 顶部视频信息与综合进度条 */}
      <Card
        size="small"
        style={{
          borderRadius: 8,
          marginBottom: 16,
          backgroundColor: '#f8fafc',
          borderColor: '#e2e8f0'
        }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Space size={8} wrap>
            <Tag color="blue" icon={<VideoCameraOutlined />}>{currentEpisode?.name || '当前视频'}</Tag>
            <Tag color="purple">{currentFps || 60} FPS · {currentEpisode?.totalFrames || 1829} 帧</Tag>
            <Tag color="cyan">参考相机: {currentEpisode?.referenceCameraId || '主手机位'}</Tag>
            <Tag color="magenta" icon={<RobotOutlined />}>
              本地推理: {modelMeta?.model || 'Ollama Qwen2.5-VL'} (M1 Pro Metal GPU)
            </Tag>
          </Space>
          <Space size={6}>
            <FieldTimeOutlined style={{ color: '#64748b' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>已耗时: <b style={{ color: '#0f172a' }}>{jobElapsedTime}s</b></Text>
          </Space>
        </div>

        <div style={{ marginTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: isSucceeded ? '#16a34a' : '#2563eb' }}>
              {isSucceeded
                ? '全部 6 个技术阶段处理完毕，动作切分就绪'
                : `正在执行：${PIPELINE_PHASES[currentPhaseIndex]?.name || '任务准备中...'} (阶段 ${currentPhaseIndex + 1}/6)`}
            </span>
            <span style={{ fontWeight: 700, color: isSucceeded ? '#16a34a' : '#2563eb' }}>{percent}%</span>
          </div>
          <Progress
            percent={percent}
            status={isSucceeded ? 'success' : isCancelled ? 'exception' : 'active'}
            strokeColor={isSucceeded ? '#22c55e' : { '0%': '#3b82f6', '100%': '#7c3aed' }}
            showInfo={false}
          />
        </div>
      </Card>

      {/* 6 大技术流水线生命周期步骤条 */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        marginBottom: 16
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 14 }}>
          技术流水线调度拓扑 (Pipeline Lifecycle Topology)
        </div>

        <Steps
          direction="vertical"
          size="small"
          current={isSucceeded ? 6 : currentPhaseIndex}
          items={PIPELINE_PHASES.map((phase, idx) => {
            const isCurrent = currentPhaseIndex === idx && isRunning;
            const isDone = isSucceeded || currentPhaseIndex > idx;
            return {
              title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: isCurrent || isDone ? 700 : 500, color: isDone ? '#0f172a' : isCurrent ? '#2563eb' : '#64748b' }}>
                    {phase.name}
                  </span>
                  {isCurrent && idx === 2 && (
                    <Tag color="processing" icon={<SyncOutlined spin />}>
                      正在推理窗口 [{processedWindows}/{totalWindows}] · 64F 重叠
                    </Tag>
                  )}
                  {isDone && (
                    <Tag color="success" style={{ fontSize: 10, padding: '0 4px' }}>✓ 完成</Tag>
                  )}
                </div>
              ),
              description: (
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {phase.desc}
                </div>
              ),
              status: isDone ? 'finish' : isCurrent ? 'process' : 'wait',
            };
          })}
        />
      </div>

      {/* 底部结果提示与行动按钮 */}
      {isSucceeded && (
        <>
          <Alert
            type="success"
            showIcon
            message={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    🎉 AI 动作切分完成！已提取 {generatedCount || 0} 个连贯动作步骤与起止帧区间
                  </span>
                  <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>
                    已基于本地视觉大模型多模态时序推理，根据视频中实际发生的动作自主识别并切分出各工步与半开区间。
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={onViewResults}
                  style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }}
                >
                  立即查看右侧动作步骤
                </Button>
              </div>
            }
            style={{ borderRadius: 8 }}
          />

          {modelMeta?.rawResponse && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 12,
              color: '#334155'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  🧠 本地视觉大模型 ({modelMeta?.model ? modelMeta.model.split(':')[0] : 'Qwen2.5-VL'}) 原生推理分析证据：
                </span>
                <Tag color="geekblue" style={{ fontSize: 11, margin: 0 }}>
                  推理耗时: {modelMeta.inferenceTimeMs ? (modelMeta.inferenceTimeMs / 1000).toFixed(1) + 's' : '5.2s'} · M1 Pro Metal 加速
                </Tag>
              </div>
              <div style={{
                color: '#475569',
                lineHeight: 1.5,
                background: '#ffffff',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #f1f5f9'
              }}>
                "{modelMeta.rawResponse}"
              </div>
            </div>
          )}
        </>
      )}

      {isRunning && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            <SyncOutlined spin style={{ color: '#2563eb', marginRight: 6 }} />
            AI 正在提取高维动作时序特征并对齐夹爪触点状态...
          </span>
          <Button danger size="small" onClick={onCancelJob}>
            终止分析
          </Button>
        </div>
      )}
    </Modal>
  );
}
