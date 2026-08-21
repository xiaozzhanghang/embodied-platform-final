import StaticRouteBoundary from '@/components/StaticRouteBoundary';
import ClientPage from './ClientPage';

export default function Page() {
  return (
    <StaticRouteBoundary>
      <ClientPage />
    </StaticRouteBoundary>
  );
}
