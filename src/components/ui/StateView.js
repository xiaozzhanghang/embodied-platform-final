'use client';

import { Button, Empty, Result, Spin, Typography } from 'antd';

const DEFAULTS = {
  loading: { title: '加载中', description: '正在加载数据，请稍候。' },
  empty: { title: '暂无数据', description: '暂时没有可展示的数据。' },
  'no-result': { title: '未找到结果', description: '请调整筛选条件后重试。' },
  forbidden: { title: '无访问权限', description: '请联系管理员开通所需权限。' },
  error: { title: '加载失败', description: '数据加载失败，请稍后重试。' },
};

export default function StateView({ type, title, description, onRetry }) {
  const defaults = DEFAULTS[type] || DEFAULTS.empty;
  const content = {
    title: title || defaults.title,
    description: description || defaults.description,
  };

  if (type === 'loading') {
    return <div className="ui-state-view"><Spin description={content.description || content.title} size="large" /></div>;
  }

  if (type === 'empty' || type === 'no-result') {
    return (
      <div className="ui-state-view">
        <Empty description={<><Typography.Text strong>{content.title}</Typography.Text><br />{content.description}</>} />
      </div>
    );
  }

  return (
    <div className="ui-state-view">
      <Result
        status={type === 'forbidden' ? '403' : 'error'}
        title={content.title}
        subTitle={content.description}
        extra={type === 'error' && onRetry ? <Button type="primary" onClick={onRetry}>重试</Button> : null}
      />
    </div>
  );
}
