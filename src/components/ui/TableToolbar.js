'use client';

import { Space, Typography } from 'antd';

export default function TableToolbar({ title, count, selectedCount, actions }) {
  const summary = selectedCount
    ? `已选择 ${selectedCount} 项`
    : typeof count === 'number' ? `共 ${count} 项` : null;

  return (
    <div className="ui-toolbar">
      <Space size="small">
        {title ? <Typography.Text strong>{title}</Typography.Text> : null}
        {summary ? <Typography.Text type="secondary">{summary}</Typography.Text> : null}
      </Space>
      {actions ? <Space>{actions}</Space> : null}
    </div>
  );
}
