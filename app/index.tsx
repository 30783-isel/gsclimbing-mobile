import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

export default function Index() {
  const { isAuthenticated, isLoading, role } = useAuthStore();

  useEffect(() => {
    console.log('📍 Index.tsx Debug:', { 
      isAuthenticated, 
      isLoading, 
      role,
      willRedirectTo: isAuthenticated && role 
        ? (role === 'ADMIN' ? 'admin' : 'tech')
        : 'login'
    });
  }, [isAuthenticated, isLoading, role]);

  if (isLoading) {
    console.log('⏳ Index: Still loading...');
    return null;
  }

  if (isAuthenticated && role) {
    // Redirecionar baseado no role com logs
    if (role === 'ADMIN') {
      console.log('➡️ Index: Redirecting to ADMIN');
      return <Redirect href="/(tabs)/admin" />;
    } else if (role === 'TECH') {
      console.log('➡️ Index: Redirecting to TECH');
      return <Redirect href="/(tabs)/tech" />;
    }
  }

  console.log('➡️ Index: Redirecting to LOGIN');
  return <Redirect href="/(auth)/login" />;
}