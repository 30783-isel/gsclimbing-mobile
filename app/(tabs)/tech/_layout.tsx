import { Stack } from 'expo-router';

export default function TechLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="project/[id]" />
    </Stack>
  );
}