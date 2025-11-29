import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/constants/theme';

export default function TechScreen() {
  const { t } = useTranslation();
  const { user, handleLogout } = useAuth();

  // Dados de exemplo
  const myReports = [
    { 
      id: '1', 
      project: 'Projeto A', 
      turbine: 'WTG-01', 
      type: 'Defect Inspection',
      date: '2024-11-20',
      status: 'pending'
    },
    { 
      id: '2', 
      project: 'Projeto B', 
      turbine: 'WTG-05', 
      type: 'Statutory Inspection',
      date: '2024-11-21',
      status: 'completed'
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.title}>
            {t('GSCLIMBING.REPORTS')}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Olá, {user?.username}!
          </Text>
        </View>
        <Button 
          mode="outlined" 
          onPress={handleLogout}
          textColor={colors.primary}
        >
          {t('GSCLIMBING.LOGOUT')}
        </Button>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.statNumber}>5</Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Pendentes
            </Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.statNumber}>12</Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Concluídos
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Reports */}
      <ScrollView style={styles.scrollView}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Meus Relatórios
        </Text>
        
        {myReports.map((report) => (
          <Card key={report.id} style={styles.reportCard}>
            <Card.Content>
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text variant="titleMedium">{report.project}</Text>
                  <Text variant="bodyMedium" style={styles.reportTurbine}>
                    {report.turbine}
                  </Text>
                  <Text variant="bodySmall" style={styles.reportType}>
                    {report.type}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  report.status === 'completed' 
                    ? styles.statusCompleted 
                    : styles.statusPending
                ]}>
                  <Text style={styles.statusText}>
                    {report.status === 'completed' ? 'Concluído' : 'Pendente'}
                  </Text>
                </View>
              </View>
              <Text variant="bodySmall" style={styles.reportDate}>
                📅 {report.date}
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button>Ver</Button>
              {report.status === 'pending' && (
                <Button mode="contained">Continuar</Button>
              )}
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>

      <FAB
        icon="plus"
        label="Novo"
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
  title: {
    color: colors.text,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    elevation: 2,
    backgroundColor: colors.primary,
  },
  statNumber: {
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    color: colors.text,
  },
  reportCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reportInfo: {
    flex: 1,
  },
  reportTurbine: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reportType: {
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  reportDate: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: colors.success,
  },
  statusPending: {
    backgroundColor: colors.warning,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});