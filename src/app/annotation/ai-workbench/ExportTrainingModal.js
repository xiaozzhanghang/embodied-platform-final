'use client';

import React, { useState, useMemo } from 'react';
import {
  Modal, Tabs, Segmented, Radio, Switch, Button, Tag, Space, Alert,
  Typography, Tooltip, Row, Col, Statistic, Card, message, InputNumber
} from 'antd';
import {
  DownloadOutlined, CopyOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, FileTextOutlined, CodeOutlined,
  CloudDownloadOutlined, SaveOutlined, EyeOutlined, DatabaseOutlined,
  AppleOutlined, FireOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import {
  validateAnnotationSteps,
  generateLlamaFactoryDatasetInfo,
  generateLlamaFactoryShareGpt,
  generateMlxVlmDataset,
  generateTaskInfoArchive,
  saveTaskInfoToStorage
} from './dataExportService';

const { Text, Title, Paragraph } = Typography;

export default function ExportTrainingModal({
  open,
  onClose,
  currentEpisode = {},
  steps = [],
  candidates = [],
  revisions = [],
  rawAiMeta = {}
}) {
  const [formatType, setFormatType] = useState('llama_factory'); // 'llama_factory' | 'mlx_vlm' | 'taskinfo'
  const [dataSource, setDataSource] = useState('ground_truth'); // 'ground_truth' | 'raw_ai'
  const [useRelativeTime, setUseRelativeTime] = useState(true);
  const [windowStartSec, setWindowStartSec] = useState(0);
  const [fps, setFps] = useState(30);

  // 根据数据源选择步骤
  const targetSteps = useMemo(() => {
    if (dataSource === 'ground_truth') {
      return steps;
    }
    // 转换为同等数据结构
    return candidates.map((c, idx) => ({
      stepId: c.candidateId || `cand-${idx + 1}`,
      stepNo: c.stepNo || (idx + 1),
      skill: c.skill || c.actionSkill,
      object: c.object || c.actionTarget,
      arm: c.arm,
      goal: c.goal || c.expectedGoal,
      startFrame: c.startFrame,
      endFrame: c.endFrame,
      confidence: c.confidence,
      source: c.source || 'ai_raw',
      notes: c.description
    }));
  }, [dataSource, steps, candidates]);

  // 时序合法性校验
  const validation = useMemo(() => {
    return validateAnnotationSteps(targetSteps, currentEpisode.totalFrames || 3457);
  }, [targetSteps, currentEpisode.totalFrames]);

  // 生成相应格式的数据文本
  const exportData = useMemo(() => {
    const opts = {
      relativeTime: useRelativeTime,
      windowStartSec: windowStartSec,
      fps: fps,
      videoPath: `videos/${currentEpisode.id || 'malihao_180_1'}.mp4`
    };

    if (formatType === 'llama_factory') {
      const sftData = generateLlamaFactoryShareGpt(targetSteps, currentEpisode, opts);
      const datasetInfo = generateLlamaFactoryDatasetInfo(`embodied_${currentEpisode.id || 'task'}_sft`);
      return {
        filename: `embodied_${currentEpisode.id || 'task'}_sharegpt.json`,
        mimeType: 'application/json',
        content: JSON.stringify(sftData, null, 2),
        secondaryFilename: 'dataset_info.json',
        secondaryContent: JSON.stringify(datasetInfo, null, 2)
      };
    } else if (formatType === 'mlx_vlm') {
      const jsonlData = generateMlxVlmDataset(targetSteps, currentEpisode, opts);
      return {
        filename: `mlx_${currentEpisode.id || 'task'}_dataset.jsonl`,
        mimeType: 'application/x-ndjson',
        content: jsonlData
      };
    } else {
      const taskinfo = generateTaskInfoArchive(targetSteps, currentEpisode, revisions, rawAiMeta);
      return {
        filename: `taskinfo_${currentEpisode.id || 'task'}.json`,
        mimeType: 'application/json',
        content: JSON.stringify(taskinfo, null, 2)
      };
    }
  }, [formatType, targetSteps, currentEpisode, useRelativeTime, windowStartSec, fps, revisions, rawAiMeta]);

  // 复制内容
  const handleCopyContent = (textToCopy) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      message.success('已复制到剪贴板！');
    }
  };

  // 触发文件下载
  const handleDownloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(`已开始下载文件: ${filename}`);
  };

  // 持久化保存
  const handleSaveToLocalStorage = () => {
    const taskinfo = generateTaskInfoArchive(targetSteps, currentEpisode, revisions, rawAiMeta);
    const ok = saveTaskInfoToStorage(currentEpisode.id || 'malihao_180_1', taskinfo);
    if (ok) {
      message.success('已持久化归档至平台本地数据仓库 (TaskInfo)');
    } else {
      message.error('保存失败，请检查浏览器存储权限');
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DatabaseOutlined style={{ color: '#1677ff', fontSize: 20 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>训练数据导出中心 (Dataset Exporter)</div>
            <div style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>
              将人工校正审核后的高质量具身动作时序标签，转换为开源 VLM 微调框架标准格式
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button
          key="save"
          icon={<SaveOutlined />}
          onClick={handleSaveToLocalStorage}
          style={{ borderColor: '#52c41a', color: '#389e0d' }}
        >
          保存至本地仓 (持久化)
        </Button>,
        <Button
          key="copy"
          icon={<CopyOutlined />}
          onClick={() => handleCopyContent(exportData.content)}
        >
          复制代码
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => handleDownloadFile(exportData.filename, exportData.content, exportData.mimeType)}
          style={{ background: 'linear-gradient(135deg, #1677ff 0%, #4f46e5 100%)' }}
        >
          导出主数据集文件
        </Button>
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
        {/* 顶部配置条 */}
        <Card size="small" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
          <Row gutter={[16, 12]} align="middle">
            <Col span={10}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>微调训练目标格式:</div>
              <Segmented
                block
                value={formatType}
                onChange={setFormatType}
                options={[
                  {
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FireOutlined style={{ color: '#ea580c' }} /> LLaMA-Factory
                      </span>
                    ),
                    value: 'llama_factory'
                  },
                  {
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AppleOutlined style={{ color: '#000000' }} /> MLX-VLM
                      </span>
                    ),
                    value: 'mlx_vlm'
                  },
                  {
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileTextOutlined style={{ color: '#1677ff' }} /> TaskInfo 归档
                      </span>
                    ),
                    value: 'taskinfo'
                  }
                ]}
              />
            </Col>

            <Col span={7}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>数据源选择:</div>
              <Radio.Group
                size="small"
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="ground_truth">
                  <span style={{ color: '#16a34a' }}>●</span> 审核修正真值 ({steps.length})
                </Radio.Button>
                <Radio.Button value="raw_ai">
                  <span style={{ color: '#ea580c' }}>●</span> AI 原始候选 ({candidates.length})
                </Radio.Button>
              </Radio.Group>
            </Col>

            <Col span={7}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>时序基准:</div>
              <Space orientation="horizontal" size="small">
                <Switch
                  size="small"
                  checked={useRelativeTime}
                  onChange={setUseRelativeTime}
                />
                <span style={{ fontSize: 12 }}>
                  {useRelativeTime ? '切片相对时间 (0.0s起)' : '全局绝对时间'}
                </span>
              </Space>
              {useRelativeTime && (
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>窗口偏置(s):</span>
                  <InputNumber
                    size="small"
                    min={0}
                    max={300}
                    step={1}
                    value={windowStartSec}
                    onChange={(v) => setWindowStartSec(v || 0)}
                    style={{ width: 60 }}
                  />
                </div>
              )}
            </Col>
          </Row>
        </Card>

        {/* 样本质量审计条 */}
        <Row gutter={12}>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: 6 }}>
              <Statistic
                title={<span style={{ fontSize: 11, color: '#64748b' }}>有效工步数</span>}
                value={validation.stepCount}
                suffix="步"
                valueStyle={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: 6 }}>
              <Statistic
                title={<span style={{ fontSize: 11, color: '#64748b' }}>动作总覆盖时长</span>}
                value={validation.totalDurationSec}
                suffix="秒"
                valueStyle={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: 6 }}>
              <Statistic
                title={<span style={{ fontSize: 11, color: '#64748b' }}>时间轴覆盖率</span>}
                value={validation.coverageRatio}
                suffix="%"
                valueStyle={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: 6 }}>
              <Statistic
                title={<span style={{ fontSize: 11, color: '#64748b' }}>时序校验状态</span>}
                value={validation.isValid ? '通过' : '有告警'}
                valueStyle={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: validation.isValid ? '#52c41a' : '#fa8c16'
                }}
                prefix={validation.isValid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 告警列表 */}
        {validation.issues.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message="数据时序校验提示"
            description={
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                {validation.issues.map((iss, idx) => (
                  <li key={idx}>{iss}</li>
                ))}
              </ul>
            }
          />
        )}

        {/* 格式说明与代码预览 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Space size="small">
              <CodeOutlined style={{ color: '#4f46e5' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                生成文件预览: <code>{exportData.filename}</code>
              </span>
              <Tag color="blue">{exportData.mimeType}</Tag>
            </Space>
            {exportData.secondaryFilename && (
              <Button
                size="small"
                type="link"
                icon={<DownloadOutlined />}
                onClick={() =>
                  handleDownloadFile(
                    exportData.secondaryFilename,
                    exportData.secondaryContent,
                    'application/json'
                  )
                }
              >
                下载配套 <code>{exportData.secondaryFilename}</code>
              </Button>
            )}
          </div>

          <div
            style={{
              maxHeight: 280,
              overflowY: 'auto',
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              padding: '12px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              lineHeight: 1.5
            }}
          >
            <pre style={{ margin: 0 }}>{exportData.content}</pre>
          </div>
        </div>
      </div>
    </Modal>
  );
}
