import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { handleLogin } = useAuth();

  const onLogin = async () => {
    if (!username || !password) {
      setError('Por favor preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await handleLogin({ username, password });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text variant="headlineMedium" style={styles.title}>
          GSClimbing Mobile
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Wind Turbine Inspections
        </Text>

        <TextInput
          label="Username"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setError('');
          }}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          disabled={loading}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          mode="outlined"
          secureTextEntry
          style={styles.input}
          disabled={loading}
        />

        {error ? (
          <Text variant="bodySmall" style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={onLogin}
          loading={loading}
          disabled={loading || !username || !password}
          style={styles.button}
        >
          Login
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
    color: colors.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
  input: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error || '#f44336',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});