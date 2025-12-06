// app/_layout.tsx
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from '@/constants/theme';

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="reports/defect-inspection/create"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </PaperProvider>
  );
}