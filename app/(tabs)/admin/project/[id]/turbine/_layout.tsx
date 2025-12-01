import { Stack } from 'expo-router';

export default function TurbineLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[turbineId]" />
    </Stack>
  );
}