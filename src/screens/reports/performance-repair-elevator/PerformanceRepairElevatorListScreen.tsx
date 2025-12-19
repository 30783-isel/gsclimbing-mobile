/**
 * PerformanceRepairElevatorListScreen
 * 
 * Ecrã de lista dos Performance Report Repair Elevator
 * ✅ ATUALIZADO com menu de 3 pontos (editar, histórico, eliminar)
 */

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
    let isMounted = true;

    const init = async () => {
      // ✅ Obter estado da conexão PRIMEIRO
      const state = await NetInfo.fetch();
      const online = state.isConnected ?? false;

      if (isMounted) {
        console.log(`📡 Conexão inicial: ${online ? 'ONLINE' : 'OFFLINE'}`);
        setIsOnline(online);

        // ✅ PASSAR O VALOR DIRETAMENTE
        await loadReports(online);  // ← MUDANÇA AQUI
      }
    };

    init();

    // ✅ Listener para mudanças
    const unsubscribe = NetInfo.addEventListener(state => {
      if (isMounted) {
        const online = state.isConnected ?? false;
        console.log(`📡 Conexão mudou: ${online ? 'ONLINE' : 'OFFLINE'}`);
        setIsOnline(online);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // ✅ Mudar a assinatura da função para aceitar parâmetro
  const loadReports = async (connectionStatus?: boolean) => {
    try {
      setLoading(true);

      const checkOnline = connectionStatus !== undefined ? connectionStatus : isOnline;

      console.log('🔍 Loading reports for turbine:', turbineId);
      console.log(`📡 Connection status: ${checkOnline ? 'ONLINE' : 'OFFLINE'}`);

      // ✅ VERIFICAR SE ESTÁ OFFLINE
      if (!checkOnline) {
        console.log('📵 Offline - não carregar relatórios');
        setReports([]);
        setLoading(false);
        return;
      }

      // ✅ SÓ CHAMA API SE ONLINE
      console.log('🌐 Tentando carregar da API...');
      const data = await performanceRepairElevatorAPI.getByTurbine(turbineId) as any[];
      console.log('📦 Reports received:', data);

      if (!data || !Array.isArray(data)) {
        setReports([]);
      } else {
        const normalizedReports: Report[] = data
          .filter(report => report != null)
          .map(report => ({
            ...report,
            reportId: report.reportId || report.id,
          }));

        console.log('✅ Valid reports:', normalizedReports.length);
        setReports(normalizedReports);
      }
    } catch (error: any) {
      console.error('❌ Error loading reports:', error);

      // ✅ IGNORAR erro de OFFLINE (não mostrar Alert)
      if (error.code === 'OFFLINE' || error.message === 'Sem conexão à Internet') {
        console.log('📵 Pedido bloqueado por estar offline');
        setReports([]);
      } else {
        // Outros erros mostram Alert
        Alert.alert('Erro', error?.message || 'Não foi possível carregar os relatórios');
        setReports([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handler para editar
  const handleEditReport = (report: Report) => {
    router.push({
      pathname: `${basePath}/reports/performance-repair-elevator/edit` as any,
      params: {
        reportId: report.reportId.toString(),
        turbineId: turbineId.toString(),
        projectId: report.projectoId?.toString() || '0',
      },
    });
  };

  // ✅ Handler para eliminar
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
            if (!isOnline) {
              Alert.alert('Modo Offline', 'Não é possível eliminar relatórios quando offline.');
              return;
            }

            try {
              console.log('🗑️ Deleting report:', reportId);
              await performanceRepairElevatorAPI.delete(reportId);
              Alert.alert('Sucesso', 'Relatório eliminado com sucesso');
              await loadReports();
            } catch (error: any) {
              console.error('❌ Error deleting report:', error);
              Alert.alert('Erro', error?.message || 'Não foi possível eliminar o relatório');
            }
          },
        },
      ]
    );
  };



  const handleHistory = (reportId: number) => {
    console.log('📜 Opening history for report:', reportId);
    router.push({
      pathname: `${basePath}/reports/performance-repair-elevator/${reportId}/history` as any,
      params: {
        reportId: reportId.toString(),
        projectName: params.projectName,
        turbineName: params.turbineName,
      },
    });
  };

  // Handler para criar novo
  const handleCreateNew = () => {
    router.push({
      pathname: `${basePath}/reports/performance-repair-elevator/edit` as any,
      params: {
        turbineId: turbineId.toString(),
        turbineName: params.turbineName,
        projectName: params.projectName,
      },
    });
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
            Performance Repair Elevator
          </Text>
          {params.turbineName && (
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {params.turbineName}
            </Text>
          )}
        </View>
        <IconButton
          icon="refresh"
          iconColor={colors.white}
          size={24}
          onPress={() => loadReports()}
        />
      </View>

      {/* Lista de relatórios */}
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconButton icon="file-document-outline" size={64} iconColor={colors.textSecondary} />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            Sem relatórios
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Ainda não existem relatórios para esta turbina.
          </Text>
          <Text variant="bodySmall" style={styles.emptyHint}>
            Clique no botão + para criar o primeiro relatório
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {reports.map((report) => {
            if (!report || !report.reportId) {
              console.warn('⚠️ Skipping invalid report:', report);
              return null;
            }

            return (
              <PerformanceRepairElevatorListItem
                key={report.reportId}
                report={report}
                onPress={() => handleEditReport(report)}
                onDelete={() => handleDelete(report.reportId)}
                onHistory={() => handleHistory(report.reportId)}
              />
            );
          })}
        </ScrollView>
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateNew}
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
    backgroundColor: colors.background,
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
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: spacing.lg,
    color: colors.primary,
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