'use client';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { useState } from 'react';

export default function FilterPanel({ children, actions, collapsible = false, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className="ui-filter-panel">
      {collapsible ? (
        <div className="ui-toolbar">
          <span>筛选条件</span>
          <Button
            icon={expanded ? <UpOutlined /> : <DownOutlined />}
            type="link"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? '收起' : '展开'}
          </Button>
        </div>
      ) : null}
      {expanded ? children : null}
      {actions ? <Space>{actions}</Space> : null}
    </section>
  );
}
