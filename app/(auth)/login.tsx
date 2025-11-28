import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { handleLogin } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: t('GSCLIMBING.ERROR'),
        text2: t('GSCLIMBING.FILL_ALL_FIELDS'),
      });
      return;
    }

    setLoading(true);
    try {
      await handleLogin({ username, password });
      Toast.show({
        type: 'success',
        text1: t('GSCLIMBING.SUCCESS'),
        text2: t('GSCLIMBING.LOGIN_SUCCESS'),
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('GSCLIMBING.ERROR'),
        text2: t('GSCLIMBING.INVALID_CREDENTIALS'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>GS</Text>
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            GSClimbing
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t('GSCLIMBING.LOGIN_SUBTITLE')}
          </Text>
        </View>

        {/* Form */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label={t('GSCLIMBING.USERNAME')}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              label={t('GSCLIMBING.PASSWORD')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              mode="outlined"
              style={styles.input}
              disabled={loading}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Button
              mode="contained"
              onPress={onSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              {t('GSCLIMBING.LOGIN')}
            </Button>

            <Button
              mode="text"
              onPress={() => {}}
              style={styles.forgotButton}
            >
              {t('GSCLIMBING.FORGOTPASSWORD')}
            </Button>
          </Card.Content>
        </Card>

        <Text variant="bodySmall" style={styles.version}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  title: {
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  forgotButton: {
    marginTop: spacing.sm,
  },
  version: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
});