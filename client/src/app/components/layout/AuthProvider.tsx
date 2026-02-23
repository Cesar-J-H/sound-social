'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { login, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Token exists, fetch the current user
    api.get('/auth/me')
      .then(({ data }) => {
        login(data, token);
      })
      .catch(() => {
        // Token is invalid or expired
        logout();
      });
  }, []);

  return <>{children}</>;
}