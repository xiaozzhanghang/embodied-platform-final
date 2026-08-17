'use client';

import React, { useState } from 'react';
import { Button, Tooltip, Dropdown, Popover, Checkbox, Space, message } from 'antd';
import { 
  ReloadOutlined, 
  ColumnHeightOutlined, 
  SettingOutlined,
  UndoOutlined
} from '@ant-design/icons';

export default function TableToolbarActions({ 
  onRefresh, 
  density = 'middle', 
  onDensityChange,
  columns = [],
  hiddenColumns = [],
  onHiddenColumnsChange
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const densityItems = [
    { key: 'large', label: '默认' },
    { key: 'middle', label: '中等' },
    { key: 'small', label: '紧凑' },
  ];

  const handleDensityClick = ({ key }) => {
    if (onDensityChange) {
      onDensityChange(key);
    }
  };

  const handleColumnToggle = (columnKey, checked) => {
    if (!onHiddenColumnsChange) return;
    if (checked) {
      onHiddenColumnsChange(hiddenColumns.filter(k => k !== columnKey));
    } else {
      onHiddenColumnsChange([...hiddenColumns, columnKey]);
    }
  };

  const handleResetColumns = () => {
    if (onHiddenColumnsChange) {
      onHiddenColumnsChange([]);
    }
  };

  const columnFilterContent = (
    <div style={{ width: 200, maxHeight: 300, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>列展示设置</span>
        <Button type="link" size="small" icon={<UndoOutlined />} onClick={handleResetColumns} style={{ padding: 0, fontSize: 12 }}>
          重置
        </Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {columns
          .filter(col => col.key && col.title && typeof col.title === 'string')
          .map(col => {
            const isVisible = !hiddenColumns.includes(col.key);
            return (
              <Checkbox
                key={col.key}
                checked={isVisible}
                onChange={e => handleColumnToggle(col.key, e.target.checked)}
              >
                {col.title}
              </Checkbox>
            );
          })}
      </div>
    </div>
  );

  return (
    <Space size={8}>
      {/* 1. 刷新 */}
      <Tooltip title="刷新">
        <Button
          type="text"
          icon={<ReloadOutlined style={{ fontSize: 16, color: '#595959' }} />}
          onClick={() => {
            if (onRefresh) {
              onRefresh();
            } else {
              message.success('数据已刷新');
            }
          }}
        />
      </Tooltip>

      {/* 2. 密度 */}
      <Dropdown
        menu={{
          items: densityItems,
          selectedKeys: [density],
          onClick: handleDensityClick,
        }}
        trigger={['click']}
      >
        <Tooltip title="密度">
          <Button
            type="text"
            icon={<ColumnHeightOutlined style={{ fontSize: 16, color: '#595959' }} />}
          />
        </Tooltip>
      </Dropdown>

      {/* 3. 列设置 */}
      <Popover
        content={columnFilterContent}
        trigger="click"
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        placement="bottomRight"
      >
        <Tooltip title="列设置">
          <Button
            type="text"
            icon={<SettingOutlined style={{ fontSize: 16, color: '#595959' }} />}
          />
        </Tooltip>
      </Popover>
    </Space>
  );
}
