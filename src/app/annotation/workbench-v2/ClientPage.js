'use client';

import React from 'react';
import { Typography, Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function ClientPage() {
  const router = useRouter();
  return (
    <div style={{ padding: 48, background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="info"
        title={<span style={{ color: '#fff' }}>标注工作台 V2 原型模块</span>}
        subTitle={<span style={{ color: '#94a3b8' }}>支持语义分割标注与时序交互标注，请前往对应功能区体验。</span>}
        extra={[
          <Button type="primary" key="seg" onClick={() => router.push('/annotation/segmentation')}>
            前往视频语义分割标注
          </Button>,
          <Button key="back" onClick={() => router.push('/annotation/long-video-workbench')}>
            前往长视频标注对比
          </Button>,
        ]}
      />
    </div>
  );
}
