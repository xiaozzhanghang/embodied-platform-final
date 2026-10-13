'use client';

import React, { useState } from 'react';
import {
  Drawer, Typography, Timeline, Tag, Button, Space,
  Modal, Alert, Descriptions, Table, Badge, Card
} from 'antd';
import {
  HistoryOutlined, UndoOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, CodeOutlined, SwapOutlined,
  BranchesOutlined, UserOutlined, RobotOutlined
} from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;

export default function RevisionHistoryDrawer({
  open,
  onClose,
  revisions,
  currentRevisionId,
  currentSteps,
  importBatches,
  onUndoBatch,
  onRollbackToRevision,
}) {
  const [inspectRevision, setInspectRevision] = useState(null);
  const [undoTargetBatch, setUndoTargetBatch] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  // 检查撤销安全冲突: 查看属于该 batch 的 step 是否被后续人工修改过
  const handleRequestUndo = (batch) => {
    const affectedSteps = currentSteps.filter(s => s.importBatchId === batch.batchId);
    const modifiedAfter = affectedSteps.filter(s => s.source === 'ai_modified');

    setUndoTargetBatch({
      batch,
      affectedCount: affectedSteps.length,
      modifiedCount: modifiedAfter.length,
      isConflict: modifiedAfter.length > 0,
      steps: affectedSteps,
    });
  };

  const handleConfirmUndo = () => {
    if (undoTargetBatch) {
      onUndoBatch(undoTargetBatch.batch.batchId);
      setUndoTargetBatch(null);
    }
  };

  return (
    <>
      <Drawer
        title={
          <Space>
            <HistoryOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>版本修订树与导入批次管理</span>
            <Tag color="blue">当前版本: {currentRevisionId}</Tag>
          </Space>
        }
        placement="right"
        size={580}
        open={open}
        onClose={onClose}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 导入批次管理卡片 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Title level={5} style={{ margin: 0, fontSize: 14 }}>
                <RobotOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                AI 预标注导入批次 (支持事务回退)
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                共 {importBatches.length} 个导入批次
              </Text>
            </div>

            {importBatches.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px dashed #cbd5e1',
                color: '#94a3b8',
                fontSize: 13
              }}>
                暂无通过 AI 导入的步骤批次。从左侧任务面板接受候选并「导入」后即可在此查看和管理。
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {importBatches.map(batch => {
                  const aliveSteps = currentSteps.filter(s => s.importBatchId === batch.batchId);
                  const isFullyReverted = aliveSteps.length === 0;

                  return (
                    <Card
                      key={batch.batchId}
                      size="small"
                      style={{
                        borderColor: isFullyReverted ? '#e2e8f0' : '#bfdbfe',
                        background: isFullyReverted ? '#f8fafc' : '#ffffff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <Space size={6} wrap>
                            <Tag color={isFullyReverted ? 'default' : 'blue'}>{batch.batchId}</Tag>
                            <Tag color="purple">{batch.model || 'Qwen3-VL'}</Tag>
                            {isFullyReverted && <Tag color="error">已回退/清除</Tag>}
                          </Space>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                            导入时间: {batch.timestamp} · 操作人: {batch.operator}
                          </div>
                          <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
                            导入详情: 写入 <b>{batch.importedCount}</b> 个动作片段 (当前存续: {aliveSteps.length})
                          </div>
                        </div>

                        {!isFullyReverted && (
                          <Button
                            size="small"
                            danger
                            icon={<UndoOutlined />}
                            onClick={() => handleRequestUndo(batch)}
                          >
                            撤销此批次
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* 版本修订树 (Immutable Revision Tree) */}
          <div>
            <Title level={5} style={{ margin: '0 0 14px 0', fontSize: 14 }}>
              <BranchesOutlined style={{ marginRight: 6, color: '#722ed1' }} />
              修订历史时间线 (不可变变更日志)
            </Title>

            <Timeline
              mode="left"
              items={revisions.map((rev, idx) => {
                const isCurrent = rev.revisionId === currentRevisionId;
                let color = 'blue';
                let icon = <CheckCircleOutlined />;
                if (rev.type === 'rollback') {
                  color = 'red';
                  icon = <UndoOutlined />;
                } else if (rev.type === 'ai_import') {
                  color = 'cyan';
                  icon = <RobotOutlined />;
                } else if (rev.type === 'init') {
                  color = 'gray';
                }

                return {
                  color: isCurrent ? 'green' : color,
                  dot: isCurrent ? <Badge status="processing" /> : icon,
                  children: (
                    <div style={{
                      padding: '8px 12px',
                      background: isCurrent ? '#f0fdf4' : '#f8fafc',
                      border: isCurrent ? '1px solid #86efac' : '1px solid #e2e8f0',
                      borderRadius: 6,
                      marginBottom: 8
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Text strong style={{ fontSize: 13, color: isCurrent ? '#15803d' : '#1e293b' }}>
                            {rev.revisionId}
                          </Text>
                          {isCurrent && <Tag color="success">当前 HEAD</Tag>}
                          <Tag color={rev.type === 'ai_import' ? 'geekblue' : 'default'} style={{ fontSize: 11 }}>
                            {rev.type === 'ai_import' ? 'AI 批次导入' : rev.type === 'rollback' ? '批次撤销' : '人工保存'}
                          </Tag>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 11 }}>{rev.timestamp}</Text>
                      </div>

                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                        {rev.summary}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          步骤数: {rev.stepCount} · 操作人: {rev.operator}
                        </Text>
                        <Button
                          type="link"
                          size="small"
                          style={{ padding: 0, fontSize: 12 }}
                          onClick={() => setInspectRevision(rev)}
                        >
                          查看快照
                        </Button>
                      </div>
                    </div>
                  )
                };
              })}
            />
          </div>
        </div>
      </Drawer>

      {/* 撤销批次二次确认 Modal (含冲突检测) */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: undoTargetBatch?.isConflict ? '#fa8c16' : '#ff4d4f' }} />
            <span>确认撤销导入批次 {undoTargetBatch?.batch.batchId}？</span>
          </Space>
        }
        open={!!undoTargetBatch}
        onCancel={() => setUndoTargetBatch(null)}
        footer={[
          <Button key="back" onClick={() => setUndoTargetBatch(null)}>放弃撤销</Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            icon={<UndoOutlined />}
            onClick={handleConfirmUndo}
          >
            确认执行回退
          </Button>
        ]}
      >
        {undoTargetBatch && (
          <div>
            {undoTargetBatch.isConflict ? (
              <Alert
                message="检测到后续人工改动冲突"
                description={`该批次包含 ${undoTargetBatch.affectedCount} 个存续步骤，其中 ${undoTargetBatch.modifiedCount} 个步骤已被标注员后续手动微调（如微调起止帧、修改技能动作等）。若撤销，这些已微调的步骤也将被移除。`}
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
              />
            ) : (
              <Alert
                message="安全撤销提示"
                description={`该批次包含的 ${undoTargetBatch.affectedCount} 个步骤尚未被后续人工修改。执行撤销将无损清理这些步骤，并生成回退修订记录。`}
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
              />
            )}

            <div style={{ fontSize: 13, color: '#334155' }}>
              即将被回退移除的步骤列表：
            </div>
            <ul style={{ maxHeight: 160, overflowY: 'auto', paddingLeft: 20, margin: '8px 0', fontSize: 12 }}>
              {undoTargetBatch.steps.map(step => (
                <li key={step.stepId} style={{ marginBottom: 4 }}>
                  <Text strong>{step.stepId}</Text>：{step.skill} <code>[{step.startFrame}, {step.endFrame})</code>
                  {step.source === 'ai_modified' && (
                    <Tag color="orange" style={{ marginLeft: 6 }}>已人工微调</Tag>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* 快照详情 Modal */}
      <Modal
        title={`修订快照详情：${inspectRevision?.revisionId}`}
        open={!!inspectRevision}
        onCancel={() => setInspectRevision(null)}
        footer={[
          <Button key="close" onClick={() => setInspectRevision(null)}>关闭</Button>
        ]}
        width={600}
      >
        {inspectRevision && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="修订 ID">{inspectRevision.revisionId}</Descriptions.Item>
              <Descriptions.Item label="父修订 ID">{inspectRevision.parentRevisionId || '无 (Root)'}</Descriptions.Item>
              <Descriptions.Item label="时间戳">{inspectRevision.timestamp}</Descriptions.Item>
              <Descriptions.Item label="操作者">{inspectRevision.operator}</Descriptions.Item>
              <Descriptions.Item label="变更类型">
                <Tag>{inspectRevision.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="有效步骤数">{inspectRevision.stepCount}</Descriptions.Item>
              <Descriptions.Item label="变更摘要" span={2}>{inspectRevision.summary}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </>
  );
}
