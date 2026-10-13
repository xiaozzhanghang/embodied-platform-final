'use client';

import React from 'react';
import { Modal, Progress, Steps, Typography, Space, Tag, Button, Alert, Card } from 'antd';
import {
  ThunderboltOutlined, CheckCircleOutlined, SyncOutlined,
  CloseCircleOutlined, ArrowRightOutlined, RobotOutlined,
  FieldTimeOutlined, VideoCameraOutlined, CheckOutlined,
  CloudOutlined
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
  windowProgressText,
  jobElapsedTime,
  currentEpisode,
  currentFps,
  generatedCount,
  modelMeta,
  annotationMethod = 'local_qwen',
  activeEngineKey,
  onViewResults,
  onCancelJob,
  onSwitchToQwen25,
}) {
  const isRunning = aiJobStatus === 'running' || aiJobStatus === 'queued';
  const isSucceeded = aiJobStatus === 'succeeded';
  const isFailed = aiJobStatus === 'failed';
  const isCancelled = aiJobStatus === 'cancelled' || aiJobStatus === 'cancel_requested';
  // 三引擎精准识别：优先使用 activeEngineKey，否则退回 annotationMethod 兼容
  const engineKey = activeEngineKey || (annotationMethod === 'local_qwen' ? 'local_qwen' : 'gemini_er2');
  const isMiniMax = engineKey === 'minimax_m3';
  const isGeminiER2 = engineKey === 'gemini_er2';
  const isCloud = isMiniMax || isGeminiER2;
  const isGemini = isCloud; // 保持兼容：isGemini = 任何云端引擎
  // 引擎显示名与主题色
  const engineLabel = isMiniMax ? 'MiniMax-M3' : (isGeminiER2 ? 'Gemini 具身 ER-2' : '本地 Qwen-VL');
  const engineColor = isMiniMax ? '#ea580c' : (isGeminiER2 ? '#7c3aed' : '#2563eb');
  const engineBgColor = isMiniMax ? '#fff7ed' : (isGeminiER2 ? '#f5f3ff' : '#eff6ff');
  const engineTagColor = isMiniMax ? 'orange' : (isGeminiER2 ? 'purple' : 'blue');

  // 计算百分比进度
  const calculatePercent = () => {
    if (isSucceeded) return 100;
    if (isFailed) return Math.min(65, Math.max(10, Math.round(((currentPhaseIndex + 1) / PIPELINE_PHASES.length) * 100)));
    if (aiJobStatus === 'queued') return 5;
    if (totalWindows > 1) {
      // 多窗口模式：基于已完成窗口进度平滑前进 (15% ~ 95%)
      const winProgress = Math.max(0, Math.min(1, processedWindows / totalWindows));
      return Math.min(95, Math.round(15 + winProgress * 78));
    }
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
            background: isFailed ? '#fef2f2' : (isSucceeded ? '#f0fdf4' : engineBgColor),
            color: isFailed ? '#ef4444' : (isSucceeded ? '#16a34a' : engineColor),
            padding: '6px 10px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            fontSize: 16
          }}>
            {isFailed ? <CloseCircleOutlined /> : (isSucceeded ? <CheckCircleOutlined /> : (isMiniMax ? <ThunderboltOutlined /> : (isGeminiER2 ? <CloudOutlined /> : <RobotOutlined />)))}
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {isFailed
                ? '❌ 大模型动作切分推理未成功 (已阻断假数据兜底)'
                : (isSucceeded
                    ? (isMiniMax ? `🎉 方式 2: MiniMax-M3 商业大模型标注已完成` : (isGeminiER2 ? '🎉 方式 3: Google 具身大模型标注已完成' : '🎉 方式 1: 本地大模型动作切分已完成'))
                    : (isMiniMax ? '⚡ 方式 2: MiniMax-M3 商业大模型 (国内直连) 多模态标注中' : (isGeminiER2 ? '☁️ 方式 3: Google 具身大模型 (gemini-robotics-er-2) 标注中' : '⚡ 方式 1: 本地大模型动作切分流水线执行中')))}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
              {isFailed
                ? '系统已停止向标注工作台注入虚构模板，保留真实错误状态以供排查'
                : (isMiniMax ? '基于 MiniMax-M3 国内商业端点 (api.minimax.chat) 深度时序推理，产生真实用量与 Token 消耗' : (isGeminiER2 ? '基于 Google 具身大模型 gemini-robotics-er-2 原生多模态直解，TPU v5e 云端加速' : '基于本地视觉大模型端侧部署 (Apple M1 Pro GPU 加速)，100% 工业数据离线合规'))}
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
            <Tag color="purple">{currentFps || 30} FPS · {currentEpisode?.totalFrames || 1829} 帧</Tag>
            <Tag color="cyan">参考相机: {currentEpisode?.referenceCameraId || '主手机位'}</Tag>
            <Tag color={engineTagColor} icon={isMiniMax ? <ThunderboltOutlined /> : (isGeminiER2 ? <CloudOutlined /> : <RobotOutlined />)}>
              {isMiniMax
                ? '方式 2: MiniMax-M3 (国内商业端点 api.minimax.chat · 深度时序推理)'
                : (isGeminiER2 ? '方式 3: gemini-robotics-er-2 (Google 具身 · TPU v5e 加速)'
                : `方式 1: ${modelMeta?.model || 'Qwen2.5-VL'} (本地部署 · M1 Pro Metal加速)`)}
            </Tag>
          </Space>
          <Space size={6}>
            <FieldTimeOutlined style={{ color: '#64748b' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>已耗时: <b style={{ color: '#0f172a' }}>{jobElapsedTime}s</b></Text>
          </Space>
        </div>

        <div style={{ marginTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: isSucceeded ? '#16a34a' : engineColor }}>
              {isSucceeded
                ? (totalWindows > 1 ? `🎉 多窗口分段推理完成，${totalWindows} 个窗口全片动作切分就绪` : '短窗口真实推理完成，候选动作工步就绪')
                : (windowProgressText || `正在执行：${PIPELINE_PHASES[currentPhaseIndex]?.name || '任务准备中...'} (阶段 ${currentPhaseIndex + 1}/6)`)}
            </span>
            <span style={{ fontWeight: 700, color: isSucceeded ? '#16a34a' : '#2563eb' }}>{percent}%</span>
          </div>
          <Progress
            percent={percent}
            status={isSucceeded ? 'success' : isCancelled ? 'exception' : 'active'}
            strokeColor={isSucceeded ? '#22c55e' : { '0%': '#3b82f6', '100%': '#7c3aed' }}
            showInfo={false}
          />
          {windowProgressText && isRunning && (
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <SyncOutlined spin style={{ color: engineColor }} />
              <span>{windowProgressText}</span>
            </div>
          )}
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
            const isSkippedFutureStage = totalWindows > 1
              ? phase.key === 'boundary_refine'
              : (phase.key === 'window_merge' || phase.key === 'boundary_refine');

            let status = 'wait';
            let statusTag = null;

            if (isSkippedFutureStage) {
              status = 'wait';
              statusTag = <Tag color="default" style={{ fontSize: 10, padding: '0 4px' }}>待后续阶段启用</Tag>;
            } else if (phase.key === 'window_merge' && totalWindows > 1) {
              if (isDone) {
                status = 'finish';
                statusTag = <Tag color="success" style={{ fontSize: 10, padding: '0 4px' }}>✓ 已缝合 ({totalWindows} 窗)</Tag>;
              } else if (currentPhaseIndex >= 2) {
                status = 'process';
                statusTag = <Tag color="processing" icon={<SyncOutlined spin />}>多窗口平滑对齐中...</Tag>;
              }
            } else if (isDone) {
              status = 'finish';
              statusTag = <Tag color="success" style={{ fontSize: 10, padding: '0 4px' }}>✓ 完成</Tag>;
            } else if (isCurrent) {
              status = 'process';
              if (idx === 2) {
                statusTag = (
                  <Tag color="processing" icon={<SyncOutlined spin />}>
                    {totalWindows > 1
                      ? `正在执行多窗口分段推理 (窗口 ${processedWindows || 1}/${totalWindows})...`
                      : '正在执行短窗口原生 VLM 推理...'}
                  </Tag>
                );
              }
            }

            const phaseTitle = (phase.key === 'window_merge' && totalWindows > 1)
              ? '跨窗时序平滑拼接与动作去重'
              : phase.name;
            const phaseDesc = (phase.key === 'window_merge' && totalWindows > 1)
              ? `对全片 ${totalWindows} 个时序窗口输出的候选工步执行坐标统一、边界贴合与全局连续编号`
              : phase.desc;

            return {
              title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontWeight: isCurrent || isDone ? 700 : 500,
                    color: isSkippedFutureStage ? '#94a3b8' : (isDone ? '#0f172a' : isCurrent ? '#2563eb' : '#64748b')
                  }}>
                    {phaseTitle}
                  </span>
                  {statusTag}
                </div>
              ),
              description: (
                <div style={{ fontSize: 12, color: isSkippedFutureStage ? '#94a3b8' : '#64748b', marginTop: 2 }}>
                  {phaseDesc}
                </div>
              ),
              status,
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
                    🎉 {isMiniMax ? 'MiniMax-M3 商业大模型标注完成' : (isGeminiER2 ? 'Google 具身 ER-2 标注完成' : `本地大模型 (${modelMeta?.model || 'Qwen-VL'}) 动作推理完成`)}！已提取 {generatedCount || 0} 个候选动作工步
                  </span>
                  <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>
                    {isMiniMax
                      ? `已基于 MiniMax-M3 国内商业端点深度时序推理，提取动作四元组与时序半开区间。Token 消耗: ${modelMeta?.evalCount || '统计中'}`
                      : (isGeminiER2 ? '已基于 Google 具身大模型 gemini-robotics-er-2 原生多模态直解，提取动作四元组与时序半开区间。'
                      : `已基于本地 ${modelMeta?.model || 'Qwen-VL'} 视觉大模型多模态时序推理，在分析窗口 [${modelMeta?.windowStartSec ?? 0}s, ${modelMeta?.windowEndSec ?? 8}s] 内识别出真实动作候选，未修改现有正式工步。`)}
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={onViewResults}
                  style={{ background: isMiniMax ? '#ea580c' : (isGeminiER2 ? '#7c3aed' : '#16a34a'), borderColor: isMiniMax ? '#c2410c' : (isGeminiER2 ? '#6d28d9' : '#16a34a'), fontWeight: 600 }}
                >
                  采纳或复核候选工步
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  🧠 {isMiniMax ? '云端商业大模型 (MiniMax-M3)' : (isGeminiER2 ? '云端具身大模型 (Google ER-2)' : `本地视觉大模型 (${modelMeta?.actualModelId || modelMeta?.modelDisplayName || modelMeta?.model || '未知模型'})`)} 真实推理审计信息：
                </span>
                <Space size={4} wrap>
                  {modelMeta.runId && (
                    <Tag style={{ fontSize: 11, margin: 0, fontFamily: 'monospace' }}>
                      Run: {modelMeta.runId}
                    </Tag>
                  )}
                  {modelMeta.doneReason && (
                    <Tag color={modelMeta.doneReason === 'stop' ? 'green' : 'orange'} style={{ fontSize: 11, margin: 0 }}>
                      结束原因: {modelMeta.doneReason}
                    </Tag>
                  )}
                  {modelMeta.evalCount !== undefined && (
                    <Tag color="cyan" style={{ fontSize: 11, margin: 0 }}>
                      Token 数: {modelMeta.evalCount}
                    </Tag>
                  )}
                  <Tag color="geekblue" style={{ fontSize: 11, margin: 0 }}>
                    总耗时: {modelMeta.totalElapsedMs ? (modelMeta.totalElapsedMs / 1000).toFixed(1) + 's' : (modelMeta.elapsedMs ? (modelMeta.elapsedMs / 1000).toFixed(1) + 's' : '未记录')}
                  </Tag>
                  {modelMeta.samplingElapsedMs !== undefined && (
                    <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                      抽帧: {(modelMeta.samplingElapsedMs / 1000).toFixed(1)}s
                    </Tag>
                  )}
                  {modelMeta.inferenceElapsedMs !== undefined && (
                    <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>
                      请求: {(modelMeta.inferenceElapsedMs / 1000).toFixed(1)}s
                    </Tag>
                  )}
                  {modelMeta.modelInternalElapsedMs !== undefined && modelMeta.modelInternalElapsedMs !== null && (
                    <Tag color="gold" style={{ fontSize: 11, margin: 0 }}>
                      服务内部: {(modelMeta.modelInternalElapsedMs / 1000).toFixed(1)}s
                    </Tag>
                  )}
                </Space>
              </div>
              <div style={{
                color: '#475569',
                lineHeight: 1.5,
                background: '#ffffff',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #f1f5f9',
                maxHeight: 120,
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: 11
              }}>
                {modelMeta.rawResponse}
              </div>
            </div>
          )}
        </>
      )}

      {isFailed && (
        <div style={{ marginTop: 12 }}>
          <Alert
            type="error"
            showIcon
            message={
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  推理未成功: {modelMeta?.error || '模型服务异常或输出未包含合规动作工步'}
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: '#b91c1c' }}>
                  {modelMeta?.errorType && <span style={{ fontWeight: 600 }}>错误类型: 【{modelMeta.errorType}】。</span>}
                  系统已停止向标注工作台注入虚构模板，现有标注完全保留，未生成假数据。
                </div>
              </div>
            }
            style={{ borderRadius: 8, marginBottom: 12 }}
          />

          {modelMeta?.rawResponse && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 8,
              fontSize: 12,
              color: '#881337',
              marginBottom: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700 }}>📄 模型原始输出片段 (Raw Response):</span>
                {modelMeta.doneReason && (
                  <Tag color="orange" style={{ margin: 0 }}>
                    中断标识: {modelMeta.doneReason}
                  </Tag>
                )}
              </div>
              <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 140,
                overflowY: 'auto',
                fontSize: 11,
                background: '#ffffff',
                padding: 8,
                borderRadius: 4,
                border: '1px solid #ffe4e6'
              }}>
                {modelMeta.rawResponse}
              </pre>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {onSwitchToQwen25 && (
              <Button 
                type="primary" 
                icon={<ThunderboltOutlined />}
                style={{ background: '#2563eb', fontWeight: 600 }}
                onClick={() => {
                  onSwitchToQwen25();
                }}
              >
                ⚡ 一键切换为 Qwen2.5-VL 极速重试
              </Button>
            )}
            <Button onClick={onClose}>关闭窗口</Button>
          </div>
        </div>
      )}

      {isRunning && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            <SyncOutlined spin style={{ color: engineColor, marginRight: 6 }} />
            {windowProgressText || 'AI 正在提取高维动作时序特征并对齐夹爪触点状态...'}
          </span>
          <Button danger size="small" onClick={onCancelJob}>
            终止分析
          </Button>
        </div>
      )}
    </Modal>
  );
}
