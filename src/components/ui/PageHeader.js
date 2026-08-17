'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Space, Typography } from 'antd';

export default function PageHeader({ title, description, breadcrumbs, back, extra }) {
  const backControl = typeof back === 'function'
    ? <Button aria-label="返回" icon={<ArrowLeftOutlined />} type="text" onClick={back} />
    : back;

  return (
    <header className="ui-page-header">
      <div>
        {breadcrumbs ? <Breadcrumb items={breadcrumbs} /> : null}
        <Space align="center" size="small" style={{ marginTop: breadcrumbs ? 4 : 0 }}>
          {backControl}
          <Typography.Title level={3} style={{ margin: 0 }}>{title}</Typography.Title>
        </Space>
      </div>
      {extra ? <Space>{extra}</Space> : null}
    </header>
  );
}
