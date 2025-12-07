import { Stack } from 'expo-router';

export default function TechReportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="turbine/[turbineId]" />
      <Stack.Screen name="defect-inspection/create" />
      <Stack.Screen name="view" />
    </Stack>
  );
}