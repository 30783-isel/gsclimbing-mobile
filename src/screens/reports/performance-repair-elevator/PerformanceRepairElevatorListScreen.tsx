// src/screens/reports/performance-repair-elevator/PerformanceRepairElevatorListScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  IconButton,
  FAB,
  ActivityIndicator,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

import { colors, spacing } from '@/constants/theme';
import { performanceRepairElevatorAPI } from '@/services/api/performanceRepairElevator.api';
import PerformanceRepairElevatorListItem from '@/components/reports/performance-repair-elevator/PerformanceRepairElevatorListItem';
import type { Report } from '@/types/report.types';
import { useAuthStore } from '@/store/authStore';

export default function PerformanceRepairElevatorListScreen() {
  const router = useRouter();
  const { role } = useAuthStore();
  const params = useLocalSearchParams<{
    turbineId: string;
    turbineName?: string;
    projectName?: string;
  }>();

  const turbineId = parseInt(params.turbineId, 10);
  const basePath = role === 'ADMIN' ? '/(tabs)/admin' : '/(tabs)/tech';

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    checkConnection();
    loadReports();
  }, []);

  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    setIsOnline(state.isConnected ?? false);
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await performanceRepairElevatorAPI.getByTurbine(turbineId);
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: number) => {
    Alert.alert(
      'Eliminar Relatório',
      'Tem a certeza que deseja eliminar este relatório?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await performanceRepairElevatorAPI.delete(reportId);
              await loadReports();
              Alert.alert('Sucesso', 'Relatório eliminado com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível eliminar o relatório');
            }
          },
        },
      ]
    );
  };

  const handleHistory = (reportId: number) => {
    Alert.alert('Histórico', `Ver histórico do relatório ${reportId}`);
    // TODO: Implementar ecrã de histórico
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>A carregar relatórios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.white}
          size={24}
          onPress={() => router.back()}
        />
        <View style={styles.headerCenter}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Performance Reports
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {params.projectName} • {params.turbineName}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      {/* Lista */}
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconButton icon="elevator" size={64} iconColor={colors.textSecondary} />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            Sem relatórios
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Ainda não existem relatórios para esta turbina.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {reports.map((report) => (
            <PerformanceRepairElevatorListItem
              key={report.reportId}
              report={report}
              onPress={() =>
                router.push({
                  pathname: `${basePath}/reports/performance-repair-elevator/edit` as any,
                  params: {
                    reportId: report.reportId.toString(),
                    turbineId: turbineId.toString(),
                    projectName: params.projectName,
                    turbineName: params.turbineName,
                  },
                })
              }
              onDelete={() => handleDelete(report.reportId)}
              onHistory={() => handleHistory(report.reportId)}
            />
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() =>
          router.push({
            pathname: `${basePath}/reports/performance-repair-elevator/edit` as any,
            params: {
              reportId: '0',
              turbineId: turbineId.toString(),
              projectName: params.projectName,
              turbineName: params.turbineName,
            },
          })
        }
        label="Novo Relatório"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.white,
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});