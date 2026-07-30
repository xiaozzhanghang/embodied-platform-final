'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TasksRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/collection/collection-tasks');
  }, [router]);

  return null;
}
