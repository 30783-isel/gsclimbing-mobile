// src/screens/partilhado/project/TurbineDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, IconButton, FAB, Chip, Portal, Dialog, Button, Banner } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { projectsAPI } from '@/services/api/projects.api';
import { useOfflineReports } from '@/hooks/useOfflineReports';
import { colors, spacing } from '@/constants/theme';
import { ReportType, REPORT_TYPE_NAMES } from '@/types';
import type { Turbine } from '@/types/turbine.types';
import type { Project } from '@/types/project.types';
import { useAuthStore } from '@/store/authStore';
import NetInfo from '@react-native-community/netinfo';

export default function TurbineDetailsScreen() {
  const { id, turbineId } = useLocalSearchParams<{ id: string; turbineId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { role } = useAuthStore();
  
  const [turbine, setTurbine] = useState<Turbine | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Hook offline para relatórios
  const {
    reports,
    isOnline: reportsOnline,
    loading: reportsLoading,
    error: reportsError,
    refresh: refreshReports,
  } = useOfflineReports(parseInt(turbineId));

  const isAdmin = role === 'ADMIN';
  const basePath = isAdmin ? '/(tabs)/admin' : '/(tabs)/tech';

  // Monitorar conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadData();
  }, [turbineId, id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const turbineData = await projectsAPI.getTurbineById(turbineId);
      const projectData = await projectsAPI.getById(Number(id));
      setTurbine(turbineData);
      setProject(projectData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`${basePath}/project/${id}/turbine/${turbineId}/edit` as any);
  };

  const handleDelete = async () => {
    try {
      await projectsAPI.deleteTurbine(turbineId);
      setDeleteDialogVisible(false);
      router.back();
    } catch (error) {
      console.error('Error deleting turbine:', error);
    }
  };

  const handleCreateReport = (reportType: ReportType) => {
    // Verificar se está online para criar relatórios
    if (!isOnline) {
      Alert.alert(
        'Modo Offline',
        'Não é possível criar novos relatórios em modo offline. Por favor, conecte-se à Internet.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (reportType === ReportType.DEFECT_INSPECTION) {
      router.push({
        pathname: `${basePath}/reports/defect-inspection` as any,
        params: {
          projectoId: id,
          turbinaId: turbineId,
          projectName: project?.name || 'Projeto',
          turbineName: turbine?.name || 'Turbina',
        },
      });
    } else {
      router.push({
        pathname: `${basePath}/project/${id}/turbine/${turbineId}/report/create` as any,
        params: { type: reportType.toString() },
      });
    }
  };

  const handleViewReports = () => {
    router.push({
      pathname: `${basePath}/reports/defect-inspection/list` as any,
      params: {
        turbineId: turbineId,
        turbineName: turbine?.name || 'Turbina',
        projectName: project?.name || 'Projeto',
      },
    });
  };

  const reportAvailability = turbine ? [
    { 
      type: ReportType.DEFECT_INSPECTION, 
      available: turbine.defectsInspectionReport, 
      name: REPORT_TYPE_NAMES[ReportType.DEFECT_INSPECTION],
      icon: 'alert-circle-outline',
      color: '#F44336',
    },
    { 
      type: ReportType.EXAMINATION_TRANSFORMER, 
      available: turbine.examinationTransformer, 
      name: REPORT_TYPE_NAMES[ReportType.EXAMINATION_TRANSFORMER],
      icon: 'flash',
      color: '#FF9800',
    },
    { 
      type: ReportType.MEASUREMENTS_6KV, 
      available: turbine.measurements6KV, 
      name: REPORT_TYPE_NAMES[ReportType.MEASUREMENTS_6KV],
      icon: 'chart-line',
      color: '#3F51B5',
    },
    { 
      type: ReportType.MEASUREMENTS_690V400V, 
      available: turbine.measurements690V400V, 
      name: REPORT_TYPE_NAMES[ReportType.MEASUREMENTS_690V400V],
      icon: 'sine-wave',
      color: '#2196F3',
    },
    { 
      type: ReportType.MEASUREMENTS_MV_SWITCHGEAR, 
      available: turbine.measurementsMwSwitchgear, 
      name: REPORT_TYPE_NAMES[ReportType.MEASUREMENTS_MV_SWITCHGEAR],
      icon: 'speedometer',
      color: '#9C27B0',
    },
    { 
      type: ReportType.ONBOARD_CRANE, 
      available: turbine.onboardCraneInspectionReport, 
      name: REPORT_TYPE_NAMES[ReportType.ONBOARD_CRANE],
      icon: 'crane',
      color: '#009688',
    },
    { 
      type: ReportType.PERFORMANCE_REPAIR_ELEVATOR, 
      available: turbine.performanceReportRepairElevator, 
      name: REPORT_TYPE_NAMES[ReportType.PERFORMANCE_REPAIR_ELEVATOR],
      icon: 'elevator',
      color: '#4CAF50',
    },
    { 
      type: ReportType.STATUTORY_INSPECTION, 
      available: turbine.statutoryInspectionReport, 
      name: REPORT_TYPE_NAMES[ReportType.STATUTORY_INSPECTION],
      icon: 'file-document-outline',
      color: '#607D8B',
    },
  ] : [];

  if (isLoading || !turbine) {
    return (
      <View style={styles.loadingContainer}>
        <Text>A carregar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={colors.white}
          onPress={handleBack}
        />
        <View style={styles.headerCenter}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            {turbine.name}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {turbine.number ? `WTG ${turbine.number}` : 'Turbina'}
          </Text>
        </View>
        {isAdmin && (
          <View style={styles.headerActions}>
            <IconButton
              icon="pencil"
              size={20}
              iconColor={colors.white}
              onPress={handleEdit}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor={colors.white}
              onPress={() => setDeleteDialogVisible(true)}
            />
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Banner de Modo Offline */}
        {!isOnline && (
          <Banner
            visible={true}
            icon="wifi-off"
            style={styles.offlineBanner}
          >
            📵 Modo Offline - Pode visualizar e editar relatórios já carregados
          </Banner>
        )}

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.infoLabel}>Modelo</Text>
              <Text variant="bodyLarge">{turbine.model || 'N/A'}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.infoLabel}>Potência</Text>
              <Text variant="bodyLarge">{turbine.power || 'N/A'}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.infoLabel}>Ano</Text>
              <Text variant="bodyLarge">{turbine.year || 'N/A'}</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Relatórios Disponíveis */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Relatórios Disponíveis
          </Text>

          {reportAvailability.map((report) => (
            <Card
              key={report.type}
              style={[
                styles.reportCard,
                !report.available && styles.reportCardDisabled,
              ]}
            >
              <Card.Content>
                <View style={styles.reportCardContent}>
                  <View style={styles.reportCardLeft}>
                    <IconButton
                      icon={report.icon}
                      size={24}
                      iconColor={report.available ? report.color : colors.textLight}
                    />
                    <View>
                      <Text
                        variant="bodyLarge"
                        style={[
                          styles.reportName,
                          !report.available && styles.reportNameDisabled,
                        ]}
                      >
                        {report.name}
                      </Text>
                      {report.available && (
                        <Chip
                          mode="flat"
                          style={styles.availableChip}
                          textStyle={styles.availableChipText}
                        >
                          Disponível
                        </Chip>
                      )}
                    </View>
                  </View>

                  {report.available && (
                    <View style={styles.reportActions}>
                      <IconButton
                        icon="eye"
                        size={20}
                        iconColor={colors.primary}
                        onPress={handleViewReports}
                      />
                      {isOnline && (
                        <IconButton
                          icon="plus-circle"
                          size={20}
                          iconColor={colors.primary}
                          onPress={() => handleCreateReport(report.type)}
                        />
                      )}
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Estatísticas de Relatórios */}
        {reports.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Estatísticas
            </Text>
            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={styles.statNumber}>
                      {reports.length}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      {reportsOnline ? 'Relatórios' : 'Relatórios (cache)'}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Delete Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Eliminar Turbina</Dialog.Title>
          <Dialog.Content>
            <Text>Tem a certeza que deseja eliminar esta turbina?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleDelete} textColor={colors.error}>
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.white,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  offlineBanner: {
    backgroundColor: '#FFA726',
    margin: spacing.md,
  },
  infoSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  infoCard: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  reportCard: {
    marginBottom: spacing.sm,
  },
  reportCardDisabled: {
    opacity: 0.5,
  },
  reportCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportName: {
    fontWeight: '500',
  },
  reportNameDisabled: {
    color: colors.textLight,
  },
  availableChip: {
    marginTop: spacing.xs,
    backgroundColor: colors.success + '20',
  },
  availableChipText: {
    color: colors.success,
    fontSize: 11,
  },
  reportActions: {
    flexDirection: 'row',
  },
  statsCard: {
    backgroundColor: colors.primary + '10',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});