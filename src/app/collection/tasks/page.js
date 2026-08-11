'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography } from 'antd';
import MainLayout from '@/components/MainLayout';
import { PageHeader } from '@/components/ui';

export default function TasksRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/collection/collection-tasks');
  }, [router]);

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="采集任务"
          description="正在进入统一的采集任务列表。"
          breadcrumbs={[{ title: '首页' }, { title: '数据采集' }, { title: '采集任务' }]}
        />
        <Typography.Text type="secondary">正在加载采集任务……</Typography.Text>
      </div>
    </MainLayout>
  );
}
