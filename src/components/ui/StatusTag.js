'use client';

import { Tag } from 'antd';
import { resolveStatusSemantic } from '@/lib/statusSemantics.mjs';

const mergeClassNames = (...classNames) => classNames.filter(Boolean).join(' ');

export default function StatusTag({ status, children, className, rootClassName, ...tagProps }) {
  return (
    <Tag
      {...tagProps}
      color={resolveStatusSemantic(status)}
      className={mergeClassNames('ui-status-tag', className)}
      rootClassName={mergeClassNames('ui-status-tag', rootClassName)}
    >
      {children ?? status}
    </Tag>
  );
}
