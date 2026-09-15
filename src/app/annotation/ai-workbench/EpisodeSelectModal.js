'use client';

import React from 'react';
import { Modal, Card, Tag, Button, Space, Typography, Row, Col, Divider, Alert } from 'antd';
import {
  VideoCameraOutlined, CheckCircleOutlined, UploadOutlined,
  PlayCircleOutlined, ArrowRightOutlined, FolderOpenOutlined,
  ThunderboltOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { AVAILABLE_EPISODES } from './mockData';

const { Title, Text, Paragraph } = Typography;

export default function EpisodeSelectModal({
  open,
  onClose,
  currentEpisode,
  onSelectEpisode,
  onUploadLocalVideo,
  fileInputRef,
}) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
          <span style={{
            background: '#eff6ff',
            color: '#2563eb',
            padding: '6px 10px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            fontSize: 16
          }}>
            <FolderOpenOutlined />
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              打开视频与数据样本选择 (AI 自动标注全流程验证)
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
              选择平台内置的多视角遥操作真实录像或载入本地 MP4 视频，体验端到端 AI 动作切分与审核闭环
            </div>
          </div>
        </div>
      }
      style={{ top: 40 }}
      styles={{ body: { padding: '16px 20px 24px' } }}
    >
      {/* 隐藏的本地视频上传文件选择器 */}
      <input
        type="file"
        ref={fileInputRef}
        accept="video/mp4,video/webm"
        style={{ display: 'none' }}
        onChange={onUploadLocalVideo}
      />

      <Alert
        type="info"
        showIcon
        message={
          <span style={{ fontSize: 13 }}>
            💡 <b>验证提示：</b>切换或载入新视频后，系统将重置为初始待标注状态（时间轴归零、清除旧候选），您可以点击向导中的 <b>「① 启动 AI 推理流程」</b> 完整体验 AI 原生视觉理解的逐帧分窗扫描与动作区间生成！
          </span>
        }
        style={{ marginBottom: 18, borderRadius: 8 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 内置真实视频 1 & 2 */}
        {AVAILABLE_EPISODES.map((ep, idx) => {
          const isSelected = currentEpisode?.episodeId === ep.episodeId;
          const isRight = ep.episodeId === 'EP-SESSION-028';
          return (
            <Card
              key={ep.episodeId}
              hoverable
              style={{
                borderRadius: 10,
                border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: isSelected ? '#f8faff' : '#ffffff',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)'
              }}
              styles={{ body: { padding: 16 } }}
              onClick={() => onSelectEpisode(ep)}
            >
              <Row gutter={16} align="middle">
                {/* 缩略图 / 视频预览 */}
                <Col xs={24} sm={7}>
                  <div style={{
                    width: '100%',
                    height: 120,
                    backgroundColor: '#0f172a',
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {ep.videoSrc ? (
                      <video
                        src={ep.videoSrc}
                        muted
                        playsInline
                        preload="metadata"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <VideoCameraOutlined style={{ fontSize: 32, color: '#475569' }} />
                    )}
                    <div style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      color: '#38bdf8',
                      fontFamily: 'monospace'
                    }}>
                      {isRight ? 'EGO_CAM_RIGHT' : 'EGO_CAM_LEFT'}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 6,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      color: '#ffffff'
                    }}>
                      {(ep.totalFrames / ep.fps).toFixed(1)}s · {ep.fps}fps
                    </div>
                  </div>
                </Col>

                {/* 视频详情 */}
                <Col xs={24} sm={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                      {ep.name}
                    </span>
                    {isSelected && (
                      <Tag color="success" icon={<CheckCircleOutlined />}>当前载入</Tag>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <Tag color="blue">{ep.episodeId}</Tag>
                    <Tag color="geekblue">{ep.fileName}</Tag>
                    <Tag color="purple">{ep.fps} FPS · {ep.totalFrames} 帧</Tag>
                    <Tag color="cyan">1280x1280 真实录制</Tag>
                  </div>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: '18px' }}
                  >
                    {ep.desc}
                  </Paragraph>
                </Col>

                {/* 操作按钮 */}
                <Col xs={24} sm={5} style={{ textAlign: 'right' }}>
                  {isSelected ? (
                    <Button
                      type="primary"
                      disabled
                      icon={<CheckCircleOutlined />}
                      style={{ borderRadius: 6, width: '100%' }}
                    >
                      正在使用中
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<ArrowRightOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEpisode(ep);
                      }}
                      style={{ background: '#2563eb', borderRadius: 6, width: '100%' }}
                    >
                      载入并标注
                    </Button>
                  )}
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, textAlign: 'center' }}>
                    {isRight ? '推荐优先验证（包含积木抓取）' : '双臂遥操作协同机位'}
                  </div>
                </Col>
              </Row>
            </Card>
          );
        })}

        {/* 选项 3：打开本地自定义视频 */}
        <Card
          hoverable
          style={{
            borderRadius: 10,
            border: '2px dashed #93c5fd',
            backgroundColor: '#f0f7ff',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          styles={{ body: { padding: 16 } }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Row gutter={16} align="middle">
            <Col xs={24} sm={7}>
              <div style={{
                width: '100%',
                height: 100,
                border: '1px dashed #60a5fa',
                borderRadius: 8,
                backgroundColor: '#e0f2fe',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                <UploadOutlined style={{ fontSize: 28, color: '#0284c7' }} />
                <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>
                  点击选取本地 MP4 文件
                </span>
              </div>
            </Col>

            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0369a1' }}>
                  💻 打开电脑本地的自定义 MP4 视频
                </span>
                <Tag color="cyan">支持本地文件</Tag>
              </div>
              <Paragraph style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: '18px' }}>
                选择您 Mac 本地的任意机械臂或操作录屏 MP4 文件。前端将使用 HTML5 Blob 零拷贝流式载入时间轴，并能无缝执行 AI 动作切分、时序滑动分窗分析与候选导入仲裁全流程！
              </Paragraph>
            </Col>

            <Col xs={24} sm={5} style={{ textAlign: 'right' }}>
              <Button
                type="dashed"
                icon={<FolderOpenOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{
                  width: '100%',
                  borderColor: '#0284c7',
                  color: '#0284c7',
                  borderRadius: 6,
                  fontWeight: 600
                }}
              >
                浏览本地文件
              </Button>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, textAlign: 'center' }}>
                无需上传后端 · 即刻载入
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      <Divider style={{ margin: '16px 0 12px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          📌 无论选择内置样本还是本地视频，均支持半开区间 <code>[start, end)</code> 契约、时序冲突仲裁与版本历史撤销。
        </span>
        <Button onClick={onClose} style={{ borderRadius: 6 }}>
          关闭
        </Button>
      </div>
    </Modal>
  );
}
