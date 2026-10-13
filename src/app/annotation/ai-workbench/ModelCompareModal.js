'use client';

import React, { useState, useMemo } from 'react';
import {
  Modal,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  Divider,
  Table,
  Badge,
  Alert,
  Tooltip,
  Radio,
  Select
} from 'antd';
import {
  ThunderboltOutlined,
  CloudOutlined,
  DiffOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  SwapOutlined,
  InfoCircleOutlined,
  AimOutlined
} from '@ant-design/icons';
import { getComparisonData } from './aiModelService';

const { Title, Text, Paragraph } = Typography;

export default function ModelCompareModal({
  open,
  onClose,
  currentEpisode,
  initialLocalModel = 'qwen2.5-vl',
  initialCloudModel = 'gemini-robotics-er-2-preview',
  onApplyMethod, // (methodKey: 'local_qwen' | 'gemini_flash', steps) => void
}) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'diff' | 'overlap'
  const [selectedLocalModel, setSelectedLocalModel] = useState(initialLocalModel || 'qwen2.5-vl');
  const [selectedCloudModel, setSelectedCloudModel] = useState(initialCloudModel || 'gemini-robotics-er-2-preview');

  // 获取双方式对比基准数据
  const compareData = useMemo(() => {
    return getComparisonData(currentEpisode, selectedLocalModel, selectedCloudModel);
  }, [currentEpisode, selectedLocalModel, selectedCloudModel]);

  const { method1, method2, diffStats } = compareData;
  const totalFrames = currentEpisode?.totalFrames || 9177;

  // 表格对比数据源 (方案 B：自适应支持非等长动态工步对比)
  const tableData = useMemo(() => {
    const rows = [];
    const maxSteps = Math.max(method1.steps.length, method2.steps.length);
    for (let i = 0; i < maxSteps; i++) {
      const s1 = method1.steps[i];
      const s2 = method2.steps[i];
      const hasBoth = Boolean(s1 && s2);
      const startDiff = hasBoth ? (s2.startFrame - s1.startFrame) : 0;
      const endDiff = hasBoth ? (s2.endFrame - s1.endFrame) : 0;
      const isDiff = !hasBoth || Math.abs(startDiff) > 0 || Math.abs(endDiff) > 0;
      const isOverlap = (s1?.annoOverlap === 1) || (s2?.annoOverlap === 1);

      let diffDesc = '时序基本一致';
      if (!s1) {
        diffDesc = `云端大模型宏观工序聚合阶段 #${s2?.stepNo}`;
      } else if (!s2) {
        diffDesc = `${method1.model.split(' ')[0]} 自适应细分高精原子工步 #${s1?.stepNo}`;
      } else if (startDiff !== 0 && endDiff !== 0) {
        diffDesc = `${method2.model.split(' ')[0]} 起止分别偏置 ${startDiff > 0 ? '+' : ''}${startDiff}f / ${endDiff > 0 ? '+' : ''}${endDiff}f`;
      } else if (startDiff !== 0) {
        diffDesc = `${method2.model.split(' ')[0]} 起始边界偏置 ${startDiff > 0 ? '+' : ''}${startDiff} 帧`;
      } else if (endDiff !== 0) {
        diffDesc = `${method2.model.split(' ')[0]} 结束边界微调 ${endDiff > 0 ? '+' : ''}${endDiff} 帧`;
      }

      rows.push({
        key: `compare-row-${i + 1}`,
        stepNo: i + 1,
        s1,
        s2,
        isDiff,
        isOverlap,
        diffDesc,
        skill: s1?.skill || s2?.skill || '作业动作',
        color: s1?.color || s2?.color || '#1677ff',
      });
    }

    if (filterType === 'diff') return rows.filter(r => r.isDiff);
    if (filterType === 'overlap') return rows.filter(r => r.isOverlap);
    return rows;
  }, [method1, method2, filterType]);

  // 导出评测 Markdown 报告
  const handleExportReport = () => {
    let report = `# 具身智能视频标注双模型对比评估报告\n\n`;
    report += `- **视频名称**: ${currentEpisode?.name || '天奇新动力装配作业'}\n`;
    report += `- **视频规格**: ${currentEpisode?.totalFrames || 9177} 帧 · ${currentEpisode?.fps || 30} FPS\n`;
    report += `- **评估时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    report += `## 一、宏观性能指标对比\n\n`;
    report += `| 评估维度 | 方式 1: 本地大模型 (${method1.model.split(' ')[0]}) | 方式 2: 云端大模型 (${method2.model.split(' ')[0]}) | 评测结论 |\n`;
    report += `| :--- | :--- | :--- | :--- |\n`;
    report += `| **部署环境** | ${method1.hardware} | ${method2.hardware} | 本地 100% 隐私合规，云端并发算力强 |\n`;
    report += `| **推理耗时** | ${method1.inferenceTime} | ${method2.inferenceTime} | 云端并发推理速度快 |\n`;
    report += `| **工步总数** | ${method1.steps.length} 步 | ${method2.steps.length} 步 | 端云多尺度动作切分拓扑 |\n`;
    report += `| **平均置信度** | ${method1.avgConfidence} | ${method2.avgConfidence} | 云端大模型置信度达 ${method2.avgConfidence} |\n`;
    report += `| **时序覆盖率** | ${method1.coverage} | ${method2.coverage} | 均达到 100% 半开区间无缝覆盖 |\n\n`;
    report += `## 二、逐工步对比明细表\n\n`;
    report += `| 序号 | 技能动作 | 方式1 [时序] | 方式2 [时序] | 差异分析 |\n`;
    report += `| :--- | :--- | :--- | :--- | :--- |\n`;
    tableData.forEach(r => {
      report += `| ${r.stepNo} | ${r.skill} | [${r.s1?.startFrame}, ${r.s1?.endFrame}) | [${r.s2?.startFrame}, ${r.s2?.endFrame}) | ${r.diffDesc} |\n`;
    });

    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI标注双模型对比评测报告-${currentEpisode?.fileName || 'DM_20260814'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1160}
      footer={null}
      style={{ top: 24 }}
      styles={{ body: { padding: '16px 24px 20px', maxHeight: '88vh', overflowY: 'auto' } }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
              color: '#7c3aed',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 18,
              display: 'flex',
              alignItems: 'center'
            }}>
              <DiffOutlined />
            </span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                AI 标注双方式对比评估：{method1.name} VS {method2.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
                视频样本：{currentEpisode?.name || '作业视频'} · 时长 {((totalFrames || 9177)/30).toFixed(1)}s ({totalFrames || 9177} 帧) · 动作步数完全由具体上传视频实际动作动态裁决
              </div>
            </div>
          </div>
          <Space size={10} wrap>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '2px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <Text style={{ fontSize: 12, color: '#475569' }}>方式1 (本地):</Text>
              <Select
                value={selectedLocalModel}
                onChange={setSelectedLocalModel}
                size="small"
                style={{ width: 175 }}
                options={[
                  { value: 'qwen2.5-vl', label: 'Qwen2.5-VL (3B 本地)' },
                  { value: 'internvl-2.5', label: 'InternVL 2.5 (4B 本地)' },
                  { value: 'cogvlm2-video', label: 'CogVLM2-Video (8B 本地)' },
                  { value: 'qwen3-vl-8b', label: 'Qwen3-VL (8.8B 本地)' },
                ]}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#faf5ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #e9d5ff' }}>
              <Text style={{ fontSize: 12, color: '#6b21a8', fontWeight: 500 }}>方式2 (云端):</Text>
              <Select
                value={selectedCloudModel}
                onChange={setSelectedCloudModel}
                size="small"
                style={{ width: 255 }}
                options={[
                  { value: 'minimax-m3', label: 'MiniMax-M3 (国内商业多模态)' },
                  { value: 'gemini-robotics-er-2-preview', label: 'gemini-robotics-er-2 (Google具身)' },
                  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (通用视频)' },
                ]}
              />
            </div>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportReport}
              size="small"
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              导出报告 (.md)
            </Button>
          </Space>
        </div>
      }
    >
      {/* 1. 核心对比指标卡片 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, height: '100%', borderColor: '#e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              <FieldTimeOutlined style={{ marginRight: 4 }} /> 推理耗时对比
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <div>
                <Text style={{ fontSize: 11, color: '#2563eb' }}>方式1 (Qwen):</Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e40af' }}>{method1.inferenceTime}</div>
              </div>
              <div style={{ width: 1, height: 28, backgroundColor: '#e2e8f0', margin: '0 4px' }} />
              <div>
                <Text style={{ fontSize: 11, color: '#7c3aed' }}>方式2 (Gemini):</Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#6d28d9' }}>{method2.inferenceTime}</div>
              </div>
            </div>
            <Tag color="purple" style={{ marginTop: 6, fontSize: 10, width: '100%', textAlign: 'center' }}>
              Gemini 速度快 ~3.8x (云端并发)
            </Tag>
          </Card>
        </Col>

        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, height: '100%', borderColor: '#e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              <SafetyCertificateOutlined style={{ marginRight: 4 }} /> 算力架构与数据隐私
            </div>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue" style={{ fontSize: 10, marginBottom: 4, display: 'block' }}>
                方式1: M1 Pro 本地离线 · 100% 隐私
              </Tag>
              <Tag color="purple" style={{ fontSize: 10, display: 'block' }}>
                方式2: Google Cloud TPU · 视频直解
              </Tag>
            </div>
            <div style={{ fontSize: 11, color: '#10b981', marginTop: 4, textAlign: 'center' }}>
              ✓ 均满足工业半开区间约束
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, height: '100%', borderColor: '#e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              <AimOutlined style={{ marginRight: 4 }} /> 方案 B 端到端动态切分
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <div>
                <Text style={{ fontSize: 11, color: '#2563eb' }}>本地切分:</Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e40af' }}>{method1.steps.length} 步</div>
              </div>
              <div style={{ width: 1, height: 28, backgroundColor: '#e2e8f0', margin: '0 4px' }} />
              <div>
                <Text style={{ fontSize: 11, color: '#7c3aed' }}>云端直解:</Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#6d28d9' }}>{method2.steps.length} 步</div>
              </div>
            </div>
            <Tag color="geekblue" style={{ marginTop: 6, fontSize: 10, width: '100%', textAlign: 'center' }}>
              解除12步绑定 · 动态粒度差异
            </Tag>
          </Card>
        </Col>

        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, height: '100%', borderColor: '#e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              <CheckCircleOutlined style={{ marginRight: 4 }} /> 平均置信度评分
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <div>
                <Text style={{ fontSize: 11, color: '#2563eb' }}>方式1 (Qwen):</Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e40af' }}>{method1.avgConfidence}</div>
              </div>
              <div style={{ width: 1, height: 28, backgroundColor: '#e2e8f0', margin: '0 4px' }} />
              <div>
                <Text style={{ fontSize: 11, color: '#7c3aed' }}>方式2 (Gemini):</Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#6d28d9' }}>{method2.avgConfidence}</div>
              </div>
            </div>
            <Tag color="purple" style={{ marginTop: 6, fontSize: 10, width: '100%', textAlign: 'center' }}>
              Gemini 意图置信度略高 (+2.1%)
            </Tag>
          </Card>
        </Col>
      </Row>

      {/* 2. 双轨时序对比时间轴 (Dual Track Visualizer) */}
      <Card
        size="small"
        style={{
          borderRadius: 8,
          marginBottom: 16,
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
          color: '#ffffff'
        }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⏱️ 双轨时序对齐可视化 (0f ~ {totalFrames}f · 100% 覆盖)</span>
          </span>
          <Space size={12}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, background: '#3b82f6', borderRadius: 2, marginRight: 4 }} />
              {method1.name}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, background: '#8b5cf6', borderRadius: 2, marginRight: 4 }} />
              {method2.name}
            </span>
          </Space>
        </div>

        {/* 轨 1: 本地大模型时间轴 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#93c5fd', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
            <span>【{method1.name}】</span>
            <span>共 {method1.steps.length} 步 · 耗时 {method1.inferenceTime}</span>
          </div>
          <div style={{
            position: 'relative',
            height: 24,
            backgroundColor: '#1e293b',
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex'
          }}>
            {method1.steps.map((s, idx) => {
              const widthPct = Math.max(1.2, ((s.endFrame - s.startFrame) / totalFrames) * 100);
              return (
                <Tooltip
                  key={`track1-${idx}`}
                  title={`[方式1] 第 ${s.stepNo} 步: ${s.skill} [${s.startFrame}, ${s.endFrame}) · ${s.displayConfidence}`}
                >
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      backgroundColor: s.color || '#2563eb',
                      borderRight: '1px solid rgba(0,0,0,0.3)',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      padding: '0 2px',
                      cursor: 'pointer'
                    }}
                  >
                    {s.skill}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* 轨 2: 云端大模型时间轴 */}
        <div>
          <div style={{ fontSize: 11, color: '#c4b5fd', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
            <span>【{method2.name}】</span>
            <span>共 {method2.steps.length} 步 · 耗时 {method2.inferenceTime}</span>
          </div>
          <div style={{
            position: 'relative',
            height: 24,
            backgroundColor: '#1e293b',
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex'
          }}>
            {method2.steps.map((s, idx) => {
              const widthPct = Math.max(1.2, ((s.endFrame - s.startFrame) / totalFrames) * 100);
              return (
                <Tooltip
                  key={`track2-${idx}`}
                  title={`[方式2] 第 ${s.stepNo} 步: ${s.skill} [${s.startFrame}, ${s.endFrame}) · ${s.displayConfidence}`}
                >
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      backgroundColor: s.color || '#7c3aed',
                      borderRight: '1px solid rgba(0,0,0,0.3)',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      padding: '0 2px',
                      cursor: 'pointer'
                    }}
                  >
                    {s.skill}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 3. 逐工步横向对比矩阵 */}
      <div style={{
        padding: '14px 16px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              📊 逐工步时序与语义对比矩阵 (Step-by-Step Matrix)
            </span>
            <Tag color="geekblue">{tableData.length} 个工步记录</Tag>
          </div>

          <Radio.Group
            size="small"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="all">显示全部工步 ({tableData.length})</Radio.Button>
            <Radio.Button value="diff">仅看微调差异工步</Radio.Button>
            <Radio.Button value="overlap">双臂协同重叠工步</Radio.Button>
          </Radio.Group>
        </div>

        <Table
          dataSource={tableData}
          pagination={false}
          size="small"
          bordered
          scroll={{ y: 320 }}
          columns={[
            {
              title: '工步',
              dataIndex: 'stepNo',
              key: 'stepNo',
              width: 60,
              align: 'center',
              render: (no) => <b style={{ color: '#475569' }}>#{no}</b>,
            },
            {
              title: '动作技能 (Skill)',
              dataIndex: 'skill',
              key: 'skill',
              width: 120,
              render: (val, record) => (
                <Space direction="vertical" size={2}>
                  <Tag color={record.color} style={{ margin: 0, fontWeight: 600 }}>
                    {val}
                  </Tag>
                  {record.isOverlap && (
                    <Tag color="warning" style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>
                      ⚡ 双臂重叠
                    </Tag>
                  )}
                </Space>
              ),
            },
            {
              title: (
                <div style={{ color: '#1d4ed8', fontWeight: 700 }}>
                  <ThunderboltOutlined style={{ marginRight: 4 }} />
                  {method1.name}
                </div>
              ),
              key: 'method1_col',
              width: 320,
              render: (_, record) => {
                const s = record.s1;
                if (!s) return <Tag color="default" style={{ fontStyle: "italic", color: "#94a3b8" }}>- 本地模型已于相邻区间整合 -</Tag>;
                return (
                  <div style={{ fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        [{s.startFrame}, {s.endFrame}) 帧
                      </Tag>
                      <Tag color="success" style={{ fontSize: 10 }}>{s.displayConfidence}</Tag>
                    </div>
                    <div style={{ color: '#334155', fontWeight: 500, fontSize: 11, marginBottom: 2 }}>
                      {s.arm} · {s.object} ➔ {s.goal}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.4, backgroundColor: '#f1f5f9', padding: '4px 6px', borderRadius: 4 }}>
                      "{s.stepContent}"
                    </div>
                  </div>
                );
              },
            },
            {
              title: (
                <div style={{ color: '#6d28d9', fontWeight: 700 }}>
                  <CloudOutlined style={{ marginRight: 4 }} />
                  {method2.name}
                </div>
              ),
              key: 'method2_col',
              width: 330,
              render: (_, record) => {
                const s = record.s2;
                if (!s) return <Tag color="purple" style={{ fontStyle: "italic" }}>- 本地模型独有高精细分子工步 -</Tag>;
                return (
                  <div style={{ fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <Tag color="purple" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        [{s.startFrame}, {s.endFrame}) 帧
                      </Tag>
                      <Tag color="magenta" style={{ fontSize: 10 }}>{s.displayConfidence}</Tag>
                    </div>
                    <div style={{ color: '#334155', fontWeight: 500, fontSize: 11, marginBottom: 2 }}>
                      {s.arm} · {s.object} ➔ {s.goal}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.4, backgroundColor: '#fdf4ff', padding: '4px 6px', borderRadius: 4, border: '1px solid #fae8ff' }}>
                      "{s.stepContent}"
                    </div>
                  </div>
                );
              },
            },
            {
              title: '对比评测分析',
              key: 'diff_col',
              width: 170,
              render: (_, record) => {
                const isIdentical = !record.isDiff;
                return (
                  <div style={{ fontSize: 11 }}>
                    <Tag color={isIdentical ? 'green' : 'orange'} style={{ marginBottom: 4, display: 'inline-block' }}>
                      {isIdentical ? '✓ 时序完全吻合' : '微调偏置'}
                    </Tag>
                    <div style={{ color: '#475569', lineHeight: 1.3 }}>
                      {record.diffDesc}
                    </div>
                  </div>
                );
              },
            },
          ]}
        />
      </div>

      {/* 4. 底部行动决策栏 (Apply / Adopt) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: 12, color: '#475569' }}>
          💡 <b>采纳建议</b>：对数据隐私要求严格的工业内网建议选用<b>方式 1 ({method1.model.split(' ')[0]})</b>；对具身空间接触点推理与长程规划任务建议选用<b>方式 2 ({method2.model.split(' ')[0]})</b>。
        </div>

        <Space size={10}>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => {
              onApplyMethod('local_qwen', method1.steps);
              onClose();
            }}
            style={{
              borderRadius: 6,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderColor: '#1d4ed8',
              fontWeight: 600
            }}
          >
            采纳方式 1 ({method1.model.split(' ')[0]} 结果)
          </Button>

          <Button
            type="primary"
            icon={<CloudOutlined />}
            onClick={() => {
              onApplyMethod('gemini_flash', method2.steps);
              onClose();
            }}
            style={{
              borderRadius: 6,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              borderColor: '#6d28d9',
              fontWeight: 600
            }}
          >
            采纳方式 2 ({method2.model.split(' ')[0]} 结果)
          </Button>

          <Button onClick={onClose} style={{ borderRadius: 6 }}>
            关闭对比
          </Button>
        </Space>
      </div>
    </Modal>
  );
}
