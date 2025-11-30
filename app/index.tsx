import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { isAuthenticated, isLoading, role } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    // Redirecionar baseado no role
    if (role === 'ADMIN') {
      return <Redirect href="/(tabs)/admin" />;
    } else {
      return <Redirect href="/(tabs)/tech" />;
    }
  }

  return <Redirect href="/(auth)/login" />;
}