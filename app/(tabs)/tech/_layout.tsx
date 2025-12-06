import { Stack } from 'expo-router';

export default function TechLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
    <Stack.Screen
      name="reports/defect-inspection/create"
      options={{
        presentation: 'modal',
        headerShown: false,
      }}
    />
    </Stack>
  );
}