import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/constants/theme';

export default function AdminScreen() {
  const { t } = useTranslation();
  const { user, handleLogout } = useAuth();

  // Dados de exemplo - depois virão da API
  const projects = [
    { id: '1', name: 'Projeto A', turbines: 10, location: 'Portugal' },
    { id: '2', name: 'Projeto B', turbines: 15, location: 'Espanha' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.welcomeText}>
          Bem-vindo, {user?.username}!
        </Text>
        <Button mode="outlined" onPress={handleLogout} textColor={colors.primary}>
          {t('GSCLIMBING.LOGOUT')}
        </Button>
      </View>

      {/* Lista de projetos */}
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">{item.name}</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {item.location}
              </Text>
              <Text variant="bodySmall" style={styles.info}>
                {item.turbines} turbinas
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button>Ver Detalhes</Button>
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>Nenhum projeto encontrado</Text>
          </View>
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {}}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  welcomeText: {
    color: colors.text,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  info: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});