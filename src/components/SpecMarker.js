'use client';

import React from 'react';
import { Badge, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSpec } from './SpecContext';

export default function SpecMarker({
  id,
  title,
  rules = [],
  remark = '',
  number,
  children,
  placement = 'topRight',
  style = {},
}) {
  const { specMode, activeSpec, setActiveSpec } = useSpec();

  if (!specMode) {
    return children || null;
  }

  const isSelected = activeSpec?.id === id;

  const handleClickBadge = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveSpec({ id, title, rules, remark, number });
  };

  const badgeContent = (
    <Tooltip
      title={
        <div style={{ padding: '4px 8px' }}>
          <strong style={{ color: '#faad14' }}>需求 {number ? `#${number}` : ''}: {title}</strong>
          <div style={{ fontSize: 11, marginTop: 4, opacity: 0.9 }}>点击查看交互逻辑与校验逻辑</div>
        </div>
      }
      color="#001529"
      placement="top"
    >
      <span
        onClick={handleClickBadge}
        className={`spec-badge-trigger ${isSelected ? 'selected' : ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: isSelected ? '#52c41a' : '#faad14',
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: isSelected 
            ? '0 0 0 4px rgba(82, 196, 26, 0.3), 0 2px 4px rgba(0,0,0,0.2)' 
            : '0 0 0 4px rgba(250, 173, 20, 0.3), 0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          userSelect: 'none',
          position: children ? 'absolute' : 'relative',
          top: children && placement.includes('top') ? -8 : 'auto',
          bottom: children && placement.includes('bottom') ? -8 : 'auto',
          right: children && placement.includes('Right') ? -8 : 'auto',
          left: children && placement.includes('Left') ? -8 : 'auto',
          zIndex: 1000,
          ...style,
        }}
      >
        {number || <InfoCircleOutlined style={{ fontSize: 10 }} />}
      </span>
    </Tooltip>
  );

  if (!children) {
    return badgeContent;
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: style.width || 'auto' }}>
      {children}
      {badgeContent}
    </div>
  );
}
