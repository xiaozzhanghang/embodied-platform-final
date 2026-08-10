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
        <Space align="start" size="small">
          {backControl}
          <div>
            <Typography.Title level={3}>{title}</Typography.Title>
            {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
          </div>
        </Space>
      </div>
      {extra ? <Space>{extra}</Space> : null}
    </header>
  );
}
