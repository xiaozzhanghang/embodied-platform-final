'use client';

import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { QueryFilter } from '@ant-design/pro-components';

// 列表页筛选区的统一密度：大屏一行 4 项，中屏 3 项，小屏 2 项。
const FILTER_SPAN = { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 };

export default function QueryFilterBar({ children, submitter, ...queryFilterProps }) {
  return (
    <QueryFilter
      labelWidth={88}
      span={FILTER_SPAN}
      searchGutter={16}
      searchText="查询"
      resetText="重置"
      showHiddenNum
      {...queryFilterProps}
      submitter={{
        submitButtonProps: { icon: <SearchOutlined /> },
        resetButtonProps: { icon: <ReloadOutlined /> },
        ...(submitter || {}),
      }}
    >
      {children}
    </QueryFilter>
  );
}
