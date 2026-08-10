'use client';

import { Tag } from 'antd';

const STATUS_COLORS = {
  '进行中': 'processing',
  '处理中': 'processing',
  '已完成': 'success',
  '通过': 'success',
  '待处理': 'warning',
  '待审核': 'warning',
  '待质检': 'warning',
  '失败': 'error',
  '驳回': 'error',
  '未开始': 'default',
  '停用': 'default',
  '已取消': 'default',
};

export default function StatusTag({ status, children }) {
  return <Tag color={STATUS_COLORS[status] || 'default'}>{children || status}</Tag>;
}
