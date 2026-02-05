'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function useAdminAuth() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');

        if (!token) {
          router.push('/login');
          return;
        }

        if (!userStr) {
          router.push('/');
          return;
        }

        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
          alert('관리자 권한이 필요합니다.');
          router.push('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  return { isChecking, isAdmin };
}
