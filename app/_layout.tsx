import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/constants/theme';
import '@/i18n/config';
import { reportSyncService } from '@/services/sync/reportSync.service';
import { performanceReportSyncService } from '@/services/sync/performanceReportSync.service';

export default function RootLayout() {
  const { initializeAuth, isAuthenticated, isLoading, role } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
    reportSyncService.initialize();
    performanceReportSyncService.initialize(); 
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirecionar baseado no role
      if (role === 'ADMIN') {
        router.replace('/(tabs)/admin');
      } else {
        router.replace('/(tabs)/tech');
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