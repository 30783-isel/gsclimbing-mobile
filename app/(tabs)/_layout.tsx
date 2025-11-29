import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="admin"
        options={{
          title: t('GSCLIMBING.PROJECTS'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons
              name="view-dashboard"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tech"
        options={{
          title: t('GSCLIMBING.REPORTS'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons
              name="file-document-multiple"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}