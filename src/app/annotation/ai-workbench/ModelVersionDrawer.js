'use client';

import React, { useState } from 'react';
import {
  Drawer, Table, Tag, Button, Typography, Space, Card, Row, Col,
  Statistic, Badge, Input, Tooltip, Alert, Modal, message, Divider
} from 'antd';
import {
  RobotOutlined, CloudServerOutlined, ThunderboltOutlined,
  CheckCircleOutlined, SyncOutlined, ApiOutlined, FireOutlined,
  AppleOutlined, SafetyCertificateOutlined, ReloadOutlined,
  ExperimentOutlined, ArrowRightOutlined
} from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;

export default function ModelVersionDrawer({
  open,
  onClose,
  activeEngine = 'qwen3-vl',
  onSelectEngine
}) {
  const [testEndpoint, setTestEndpoint] = useState('http://127.0.0.1:11434');
  const [testingStatus, setTestingStatus] = useState(null); // { status: 'success' | 'error' | 'loading', latency: 45, msg: '' }
  const [customVllmUrl, setCustomVllmUrl] = useState('http://localhost:8000/v1');

  // 模型版本台账
  const modelRegistry = [
    {
      key: 'qwen3-vl-ollama',
      id: 'qwen3-vl:latest',
      name: 'Qwen3-VL-8B (本地基座)',
      type: 'base',
      framework: 'Ollama / GGUF',
      hardware: 'Apple M1 Pro (Metal GPU)',
      datasetVer: '基础通用预训练',
      accuracy: '84.5%',
      mIoU: '78.2%',
      boundaryError: '±0.85s',
      status: 'active',
      isDefault: true,
      endpoint: 'http://127.0.0.1:11434'
    },
    {
      key: 'qwen25-vl-7b-lora-v1',
      id: 'qwen2.5-vl-7b-bolt-sft',
      name: 'Qwen2.5-VL-7B-LoRA (工业装配专精 v1.0)',
      type: 'lora',
      framework: 'LLaMA-Factory ➔ vLLM',
      hardware: 'GPU 服务器 (RTX 4090 / A10)',
      datasetVer: 'embodied_bolt_v1.0 (50 工业视频)',
      accuracy: '94.2%',
      mIoU: '89.1%',
      boundaryError: '±0.28s',
      status: 'evaluated',
      isDefault: false,
      endpoint: 'http://localhost:8000/v1'
    },
    {
      key: 'qwen25-vl-3b-mlx-exp',
      id: 'qwen2.5-vl-3b-mlx-lora',
      name: 'Qwen2.5-VL-3B-MLX (M1 Pro 轻量实验)',
      type: 'lora',
      framework: 'Apple MLX-VLM ➔ mlx-openai-server',
      hardware: 'Apple M1 Pro (16GB 纯本地)',
      datasetVer: 'embodied_sample_20',
      accuracy: '88.0%',
      mIoU: '83.4%',
      boundaryError: '±0.55s',
      status: 'experimental',
      isDefault: false,
      endpoint: 'http://localhost:8080/v1'
    },
    {
      key: 'gemini-15-pro-teacher',
      id: 'gemini-1.5-pro-vision',
      name: 'Google Gemini 1.5 Pro (云端教师模型)',
      type: 'teacher',
      framework: 'Google Cloud API',
      hardware: 'Google TPU Pod',
      datasetVer: '云端超大参数基座',
      accuracy: '96.5%',
      mIoU: '92.4%',
      boundaryError: '±0.20s',
      status: 'cloud',
      isDefault: false,
      endpoint: 'https://generativelanguage.googleapis.com'
    }
  ];

  // 连通性测试
  const handleTestConnection = async (url) => {
    setTestingStatus({ status: 'loading', latency: null, msg: '正在拨测服务通信握手...' });
    const startTime = performance.now();
    try {
      // 如果是 ollama
      if (url.includes('11434')) {
        const resp = await fetch('http://127.0.0.1:11434/api/tags', { method: 'GET' });
        const latency = Math.round(performance.now() - startTime);
        if (resp.ok) {
          setTestingStatus({ status: 'success', latency, msg: `连接正常！服务在线 (HTTP 200, 耗时 ${latency}ms)` });
        } else {
          setTestingStatus({ status: 'error', latency, msg: `端点响应异常 (HTTP ${resp.status})` });
        }
      } else {
        // vLLM / OpenAI 端点
        const resp = await fetch(`${url}/models`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const latency = Math.round(performance.now() - startTime);
        if (resp.ok) {
          setTestingStatus({ status: 'success', latency, msg: `微调推理服务在线！(HTTP 200, 耗时 ${latency}ms)` });
        } else {
          setTestingStatus({ status: 'error', latency, msg: `服务返回状态 ${resp.status}` });
        }
      }
    } catch (err) {
      const latency = Math.round(performance.now() - startTime);
      setTestingStatus({
        status: 'error',
        latency,
        msg: `服务未启动或网络不可达 (${err.message})。若尚未拉起微调推理服务，请在对应端口启动 vLLM 或 mlx-openai-server。`
      });
    }
  };

  const columns = [
    {
      title: '模型与适配器版本',
      dataIndex: 'name',
      key: 'name',
      render: (text, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            {text}
            {r.isDefault && <Tag color="blue">当前基座</Tag>}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            ID: <code>{r.id}</code>
          </div>
        </div>
      )
    },
    {
      title: '架构类型',
      dataIndex: 'type',
      key: 'type',
      render: (t) => {
        if (t === 'base') return <Tag color="cyan">原生基座</Tag>;
        if (t === 'lora') return <Tag color="orange">LoRA 微调</Tag>;
        return <Tag color="purple">云端教师</Tag>;
      }
    },
    {
      title: '训练与运行栈',
      dataIndex: 'framework',
      key: 'framework',
      render: (f, r) => (
        <div>
          <div style={{ fontSize: 12 }}>{f}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.hardware}</div>
        </div>
      )
    },
    {
      title: '评测指标 (SOP / mIoU)',
      key: 'metrics',
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 12 }}>
            分类准确率: <b>{r.accuracy}</b>
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            帧 mIoU: <b>{r.mIoU}</b> | 误差: <b>{r.boundaryError}</b>
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, r) => (
        <Space size="small">
          <Button
            size="small"
            type={activeEngine === r.id ? 'primary' : 'default'}
            onClick={() => {
              if (onSelectEngine) onSelectEngine(r.id);
              message.success(`已切换推理引擎为: ${r.name}`);
            }}
          >
            {activeEngine === r.id ? '当前生效' : '设为主力'}
          </Button>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => handleTestConnection(r.endpoint)}
          >
            测速
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RobotOutlined style={{ color: '#4f46e5', fontSize: 20 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>模型版本与独立服务接入中心</div>
            <div style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>
              支持在标注工作台无缝热切换「云端教师」/「本地原生基座」/「LoRA 工业微调模型」
            </div>
          </div>
        </div>
      }
      open={open}
      onClose={onClose}
      width={780}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 指标总览 */}
        <Row gutter={12}>
          <Col span={8}>
            <Card size="small" style={{ backgroundColor: '#f8fafc', borderRadius: 6 }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: '#64748b' }}>已注册模型版本</span>}
                value={modelRegistry.length}
                suffix="个"
                valueStyle={{ fontSize: 20, fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderRadius: 6 }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: '#166534' }}>微调版平均 mIoU 提升</span>}
                value="+10.9"
                suffix="%"
                valueStyle={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ backgroundColor: '#faf5ff', borderColor: '#e9d5ff', borderRadius: 6 }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: '#6b21a8' }}>边界帧时间误差</span>}
                value="±0.28"
                suffix="秒"
                valueStyle={{ fontSize: 20, fontWeight: 700, color: '#7e22ce' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 模型版本列表 */}
        <Card
          size="small"
          title={
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              模型版本列表与性能基准 (Model Registry)
            </span>
          }
        >
          <Table
            dataSource={modelRegistry}
            columns={columns}
            pagination={false}
            size="small"
          />
        </Card>

        {/* 独立服务接入与端点拨测 */}
        <Card
          size="small"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ApiOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                独立微调模型服务接入与拨测 (OpenAI / vLLM API)
              </span>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              无论微调模型运行在本地 Mac（通过 <code>mlx-openai-server</code>）还是云端 GPU（通过 <code>vLLM serve</code>），标注平台均通过标准 HTTP API 进行解耦接入，平台不绑定任何训练框架。
            </div>

            <Row gutter={8} align="middle">
              <Col span={18}>
                <Input
                  addonBefore="端点 URL"
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  placeholder="如 http://localhost:8000/v1 或 http://127.0.0.1:11434"
                />
              </Col>
              <Col span={6}>
                <Button
                  block
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => handleTestConnection(testEndpoint)}
                  loading={testingStatus?.status === 'loading'}
                >
                  测试连通性
                </Button>
              </Col>
            </Row>

            {testingStatus && (
              <Alert
                type={testingStatus.status === 'success' ? 'success' : testingStatus.status === 'loading' ? 'info' : 'warning'}
                showIcon
                message={testingStatus.msg}
              />
            )}
          </div>
        </Card>
      </div>
    </Drawer>
  );
}
