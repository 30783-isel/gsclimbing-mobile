import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/theme';

export default function HelloWorldScreen() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.container}>
      <IconButton
        icon="logout"
        size={24}
        iconColor={colors.primary}
        onPress={handleLogout}
        style={styles.logoutButton}
      />
      
      <Text variant="headlineLarge" style={styles.title}>
        Hello World! 👋
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Admin Dashboard
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoutButton: {
    position: 'absolute',
    top: 40,
    right: 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    opacity: 0.7,
  },
});