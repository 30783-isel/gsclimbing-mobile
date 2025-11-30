import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { role } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="admin"
        options={{
          title: t('GSCLIMBING.PROJECTS'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="folder-multiple"
              size={size}
              color={color}
            />
          ),
          href: role === 'ADMIN' ? '/(tabs)/admin' : null,
        }}
      />

      <Tabs.Screen
        name="tech"
        options={{
          title: t('GSCLIMBING.REPORTS'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="file-document-multiple"
              size={size}
              color={color}
            />
          ),
          href: role === 'TECH' ? '/(tabs)/tech' : null,
        }}
      />
    </Tabs>
  );
}