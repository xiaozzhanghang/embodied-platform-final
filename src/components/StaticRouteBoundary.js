import { Suspense } from 'react';

export default function StaticRouteBoundary({ children }) {
  return (
    <Suspense fallback={<div className="ui-page">页面参数加载中…</div>}>
      {children}
    </Suspense>
  );
}
