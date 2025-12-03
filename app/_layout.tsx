import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/constants/theme';
import '@/i18n/config';

export default function RootLayout() {
  const { initializeAuth, isAuthenticated, isLoading, role } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const currentPath = segments.join('/');

    console.log('Navigation Debug:', {
      isAuthenticated,
      role,
      segments,
      currentPath,
      inAuthGroup,
      inTabsGroup
    });

    if (!isAuthenticated && !inAuthGroup) {
      // Não autenticado: ir para login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Autenticado mas ainda em auth: redirecionar para a tab correta
      if (role === 'ADMIN') {
        router.replace('/(tabs)/admin');
      } else if (role === 'TECH') {
        router.replace('/(tabs)/tech');
      }
    } else if (isAuthenticated && role) {
      // Verificar se está na tab errada e corrigir
      const shouldBeInAdmin = role === 'ADMIN';
      const shouldBeInTech = role === 'TECH';
      const isInTech = currentPath.includes('tech') || currentPath.includes('(tabs)/tech');
      const isInAdmin = currentPath.includes('admin') || currentPath.includes('(tabs)/admin');

      if (shouldBeInAdmin && (isInTech || (!isInAdmin && inTabsGroup))) {
        console.log('🔄 Redirecting ADMIN user from tech to admin');
        router.replace('/(tabs)/admin');
      } else if (shouldBeInTech && (isInAdmin || (!isInTech && inTabsGroup))) {
        console.log('🔄 Redirecting TECH user from admin to tech');
        router.replace('/(tabs)/tech');
      } else if (!inAuthGroup && !inTabsGroup) {
        // Não está em nenhum grupo: ir para a tab correta
        if (shouldBeInAdmin) {
          router.replace('/(tabs)/admin');
        } else {
          router.replace('/(tabs)/tech');
        }
      }
    }
  }, [isAuthenticated, isLoading, segments, role]);

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="light" />
        <Slot />
        <Toast />
      </PaperProvider>
    </SafeAreaProvider>
  );
}