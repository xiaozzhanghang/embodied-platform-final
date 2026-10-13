'use client';

import React, { useState, useMemo } from 'react';
import {
  Modal, Button, Typography, Tag, Table, Radio, Space,
  Alert, Divider, Tooltip, Badge, Card
} from 'antd';
import {
  CheckCircleOutlined, ExclamationCircleOutlined,
  SwapOutlined, DiffOutlined, PlusCircleOutlined,
  SafetyCertificateOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { validateCandidateForImport } from './aiModelService';

const { Text, Title } = Typography;

export default function ImportPreviewModal({
  open,
  onClose,
  existingSteps,
  candidatesToImport,
  baseRevisionId,
  totalFrames = 1829,
  onConfirmImport,
}) {
  // 对每条发生冲突的候选，用户可以选择裁决策略:
  // 'replace': 覆盖冲突的现有步骤 (使用 AI 候选)
  // 'keep': 保留现有步骤 (丢弃/跳过此 AI 候选)
  // 'parallel': 并存追加 (作为并行动作)
  const [conflictResolutions, setConflictResolutions] = useState({});

  // 严格合规校验与冲突检测算法: 先通过 validateCandidateForImport 过滤非法与重复项，再检测重叠
  const analysis = useMemo(() => {
    if (!candidatesToImport || candidatesToImport.length === 0) {
      return { conflicts: [], nonConflicts: [], blocked: [], duplicates: [], summary: { total: 0, add: 0, conflict: 0, blocked: 0, duplicate: 0 } };
    }

    const conflicts = [];
    const nonConflicts = [];
    const blocked = [];
    const duplicates = [];

    candidatesToImport.forEach(cand => {
      const valRes = validateCandidateForImport(cand, existingSteps, totalFrames);
      if (!valRes.ok) {
        if (valRes.isDuplicate) {
          duplicates.push({ candidate: cand, reason: valRes.reason });
        } else {
          blocked.push({ candidate: cand, reason: valRes.reason });
        }
        return;
      }

      // 寻找重叠的现有步骤: 两个区间 [A_start, A_end) 和 [B_start, B_end) 重叠条件为 A_start < B_end && B_start < A_end
      const overlappingExisting = existingSteps.filter(step => 
        cand.startFrame < step.endFrame && step.startFrame < cand.endFrame
      );

      if (overlappingExisting.length > 0) {
        conflicts.push({
          candidate: cand,
          conflictedWith: overlappingExisting,
          overlapFrames: Math.max(0, Math.min(cand.endFrame, overlappingExisting[0].endFrame) - Math.max(cand.startFrame, overlappingExisting[0].startFrame)),
        });
      } else {
        nonConflicts.push(cand);
      }
    });

    return {
      conflicts,
      nonConflicts,
      blocked,
      duplicates,
      summary: {
        total: candidatesToImport.length,
        add: nonConflicts.length,
        conflict: conflicts.length,
        blocked: blocked.length,
        duplicate: duplicates.length,
      }
    };
  }, [candidatesToImport, existingSteps, totalFrames]);

  // 初始化或切换策略
  const handleSetResolution = (candId, resolution) => {
    setConflictResolutions(prev => ({
      ...prev,
      [candId]: resolution,
    }));
  };

  const handleConfirm = () => {
    // 构造最终导入决策 (严禁包含被拦截的非法项)
    const importDecisions = {
      baseRevisionId,
      importBatchId: `batch-${Date.now().toString().slice(-6)}`,
      nonConflicts: analysis.nonConflicts,
      conflicts: analysis.conflicts.map(c => ({
        candidate: c.candidate,
        conflictedWith: c.conflictedWith,
        resolution: conflictResolutions[c.candidate.candidateId] || 'replace', // 默认替换
      })),
      blockedCount: analysis.blocked.length,
      duplicateCount: analysis.duplicates.length,
      blocked: analysis.blocked,
      duplicates: analysis.duplicates,
    };
    onConfirmImport(importDecisions);
  };

  // 冲突表格数据
  const conflictColumns = [
    {
      title: '候选片段 (待导入)',
      key: 'candidate',
      width: '38%',
      render: (_, record) => (
        <div style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
          <Space orientation="vertical" size={2} style={{ width: '100%' }}>
            <div style={{ display: 'flex', orientation: 'row', orientationGap: 8, alignItems: 'center' }}>
              <Tag color="blue">{record.candidate.candidateId}</Tag>
              <Text strong style={{ fontSize: 13 }}>{record.candidate.skill}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              区间: <code style={{ color: '#2563eb' }}>[{record.candidate.startFrame}, {record.candidate.endFrame})</code> (长 {record.candidate.endFrame - record.candidate.startFrame} 帧)
            </Text>
            <div style={{ fontSize: 12, color: '#475569' }}>
              {record.candidate.arm} · {record.candidate.object} · {record.candidate.goal}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              置信度: <Tag color={record.candidate.confidence ? 'green' : 'default'}>{record.candidate.displayConfidence}</Tag>
            </div>
          </Space>
        </div>
      )
    },
    {
      title: '冲突的现有步骤',
      key: 'existing',
      width: '34%',
      render: (_, record) => (
        <div>
          {record.conflictedWith.map(step => (
            <div key={step.stepId} style={{ background: '#fffbeb', padding: '8px 12px', borderRadius: 6, border: '1px solid #fde68a', marginBottom: 4 }}>
              <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag color="gold">{step.stepId}</Tag>
                  <Text strong style={{ fontSize: 13 }}>{step.skill}</Text>
                  <Tag color={step.source === 'manual' ? 'purple' : 'cyan'} style={{ orientationGap: 0, padding: '0 4px', fontSize: 10 }}>
                    {step.source === 'manual' ? '人工标定' : '历史AI'}
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  区间: <code style={{ color: '#d97706' }}>[{step.startFrame}, {step.endFrame})</code>
                </Text>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  {step.arm} · {step.object}
                </div>
                <Text type="danger" style={{ fontSize: 11 }}>
                  重叠时序: {record.overlapFrames} 帧
                </Text>
              </Space>
            </div>
          ))}
        </div>
      )
    },
    {
      title: '冲突裁决方案',
      key: 'resolution',
      width: '28%',
      render: (_, record) => {
        const currentRes = conflictResolutions[record.candidate.candidateId] || 'replace';
        return (
          <Radio.Group
            value={currentRes}
            onChange={e => handleSetResolution(record.candidate.candidateId, e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <Radio value="replace">
              <Space orientation="vertical" size={0}>
                <Text strong style={{ fontSize: 12, color: '#1677ff' }}>替换覆盖现有步骤</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>现有步骤移入归档，写入新候选</Text>
              </Space>
            </Radio>
            <Radio value="keep">
              <Space orientation="vertical" size={0}>
                <Text strong style={{ fontSize: 12, color: '#d97706' }}>保留现有 (跳过候选)</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>丢弃该候选，不改变当前步骤</Text>
              </Space>
            </Radio>
            <Radio value="parallel">
              <Space orientation="vertical" size={0}>
                <Text strong style={{ fontSize: 12, color: '#722ed1' }}>并存追加 (重叠动作)</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>保留双方，允许多通道重叠</Text>
              </Space>
            </Radio>
          </Radio.Group>
        );
      }
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <DiffOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>AI 候选导入预览与冲突裁决</span>
          <Tag color="geekblue" icon={<SafetyCertificateOutlined />}>
            基于基准修订 {baseRevisionId}
          </Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={940}
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button
          key="confirm"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleConfirm}
          disabled={analysis.summary.add + analysis.summary.conflict === 0}
          style={{ background: (analysis.summary.add + analysis.summary.conflict > 0) ? '#1677ff' : undefined }}
        >
          确认事务导入 (生成新修订)
        </Button>
      ]}
    >
      <div style={{ marginTop: 8 }}>
        {/* 顶部统计条 */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <div>
            <Text strong style={{ fontSize: 14 }}>导入概览：</Text>
            <Text style={{ fontSize: 13, color: '#475569' }}>
              共审核选中 <Text strong style={{ color: '#1677ff' }}>{analysis.summary.total}</Text> 条候选，其中
              <Text strong style={{ color: '#52c41a' }}> {analysis.summary.add} </Text>条无冲突区间，
              <Text strong style={{ color: analysis.summary.conflict > 0 ? '#fa8c16' : '#52c41a' }}>
                {analysis.summary.conflict}
              </Text> 条与现有时间轴重叠冲突；
              {analysis.summary.duplicate > 0 && (
                <Text style={{ color: '#d97706' }}> 已自动跳过重复 {analysis.summary.duplicate} 条；</Text>
              )}
              {analysis.summary.blocked > 0 && (
                <Text strong style={{ color: '#dc2626' }}> 已拦截不合规 {analysis.summary.blocked} 条。</Text>
              )}
            </Text>
          </div>
          <Space>
            {analysis.summary.blocked > 0 ? (
              <Tag color="error">发现不合规项已被拦截</Tag>
            ) : (
              <Tag color="blue">区间契约校验通过</Tag>
            )}
            <Tag color="cyan">动作字典匹配通过</Tag>
          </Space>
        </div>

        {/* 不合规候选拦截提示 */}
        {analysis.blocked.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Alert
              type="error"
              showIcon
              message={`已安全拦截 ${analysis.blocked.length} 项不合规候选（严禁写入正式标注）`}
              description={
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {analysis.blocked.map((b, idx) => (
                    <div key={b.candidate.candidateId || idx} style={{ fontSize: 12, color: '#991b1b' }}>
                      ❌ <b>{b.candidate.candidateId || `候选 #${idx + 1}`}</b> ({b.candidate.skill || '未知动作'}): {b.reason}
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        )}

        {/* 重复候选跳过提示 */}
        {analysis.duplicates.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Alert
              type="warning"
              showIcon
              message={`已自动过滤 ${analysis.duplicates.length} 项重复候选（避免重复导入）`}
              description={
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {analysis.duplicates.map((d, idx) => (
                    <div key={d.candidate.candidateId || idx} style={{ fontSize: 12, color: '#92400e' }}>
                      ⚠️ <b>{d.candidate.candidateId || `候选 #${idx + 1}`}</b> ({d.candidate.skill}): {d.reason}
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        )}

        {/* 冲突项裁决区域 */}
        {analysis.conflicts.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Space>
                <Badge count={analysis.conflicts.length} style={{ backgroundColor: '#fa8c16' }} />
                <Text strong style={{ fontSize: 14, color: '#1e293b' }}>时间轴重叠冲突项 (需人工裁决)</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                系统严格遵循不可变历史设计，所有被覆盖的旧步骤将被存档并在修订树中可追溯
              </Text>
            </div>
            <Table
              dataSource={analysis.conflicts}
              columns={conflictColumns}
              rowKey={record => record.candidate.candidateId}
              pagination={false}
              size="small"
              bordered
            />
          </div>
        ) : (
          <Alert
            message="时序无任何重叠冲突"
            description="所选候选片段均落在当前时间轴空白区间或连续衔接，将作为新增步骤直接插入。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 无冲突正常追加列表 */}
        {analysis.nonConflicts.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <Space>
                <Badge count={analysis.nonConflicts.length} style={{ backgroundColor: '#52c41a' }} />
                <Text strong style={{ fontSize: 14, color: '#1e293b' }}>正常追加项 (无时序冲突)</Text>
              </Space>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {analysis.nonConflicts.map(cand => (
                <div
                  key={cand.candidateId}
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text strong style={{ color: '#166534' }}>{cand.skill}</Text>
                    <code style={{ color: '#15803d' }}>[{cand.startFrame}, {cand.endFrame})</code>
                  </div>
                  <div style={{ color: '#4b5563' }}>
                    {cand.arm} · {cand.object}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Tag color="green" style={{ margin: 0, fontSize: 10 }}>直接写入</Tag>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      {cand.displayConfidence}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 导入事务提示 */}
        <div style={{
          marginTop: 16,
          padding: '10px 14px',
          background: '#f1f5f9',
          borderRadius: 6,
          fontSize: 12,
          color: '#64748b'
        }}>
          💡 <b>事务说明：</b> 确认后将基于 <code>{baseRevisionId}</code> 原子生成下一个修订号，并附带本次独立的 <code>importBatchId</code>。后续任何时候均可在历史抽屉中对该批次执行「一键批次撤销」。
        </div>
      </div>
    </Modal>
  );
}
