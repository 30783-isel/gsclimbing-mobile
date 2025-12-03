import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, Portal, Dialog, Button, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { projectsAPI } from '@/services/api/projects.api';
import { colors, spacing } from '@/constants/theme';
import type { Turbine } from '@/types/turbine.types';
import { REPORT_TYPE_NAMES, ReportType } from '@/types/report.types';

export default function TurbineDetailsScreen() {
  const { id, turbineId } = useLocalSearchParams<{ id: string; turbineId: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [turbine, setTurbine] = useState<Turbine | null>(null);
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

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
    router.push(`/(tabs)/admin/project/${id}/turbine/${turbineId}/edit` as any);
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
    // Navegar para o relatório apropriado baseado no tipo
    if (reportType === ReportType.DEFECT_INSPECTION) {
      router.push({
        pathname: '/(tabs)/admin/reports/defect-inspection' as any,
        params: {
          projectoId: id,
          turbinaId: turbineId,
          projectName: project?.name || 'Projeto',
          turbineName: turbine?.name || 'Turbina',
        },
      });
    } else {
      // Para outros tipos, usar rota genérica (implementar depois)
      router.push({
        pathname: `/(tabs)/admin/project/${id}/turbine/${turbineId}/report/create` as any,
        params: { type: reportType.toString() },
      });
    }
  };

  // Map dos relatórios disponíveis
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
            {turbine.number ? `WTG-${turbine.number}` : 'Turbina'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="pencil"
            size={24}
            iconColor={colors.white}
            onPress={handleEdit}
          />
          <IconButton
            icon="delete"
            size={24}
            iconColor={colors.white}
            onPress={() => setDeleteDialogVisible(true)}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Turbine Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Informações da Turbina
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nome:</Text>
              <Text style={styles.detailValue}>{turbine.name}</Text>
            </View>

            {turbine.site && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Site:</Text>
                <Text style={styles.detailValue}>{turbine.site}</Text>
              </View>
            )}

            {turbine.number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Número:</Text>
                <Text style={styles.detailValue}>{turbine.number}</Text>
              </View>
            )}

            {turbine.type && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo:</Text>
                <Text style={styles.detailValue}>{turbine.type}</Text>
              </View>
            )}

            {turbine.year && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ano:</Text>
                <Text style={styles.detailValue}>{turbine.year}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Reports Section */}
        <Text variant="titleMedium" style={styles.reportsTitle}>
          Tipos de Relatórios
        </Text>

        <View style={styles.reportsList}>
          {reportAvailability.map((report) => (
            <TouchableOpacity
              key={report.type}
              onPress={() => handleCreateReport(report.type)}
              disabled={!report.available}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.reportCard,
                  !report.available && styles.reportCardDisabled,
                ]}
              >
                <Card.Content style={styles.reportCardContent}>
                  <View
                    style={[
                      styles.reportIcon,
                      { backgroundColor: report.available ? report.color : colors.disabled },
                    ]}
                  >
                    <IconButton
                      icon={report.icon}
                      size={28}
                      iconColor="#fff"
                    />
                  </View>

                  <View style={styles.reportInfo}>
                    <Text
                      variant="titleSmall"
                      style={[
                        styles.reportName,
                        !report.available && styles.reportNameDisabled,
                      ]}
                      numberOfLines={2}
                    >
                      {report.name}
                    </Text>
                    {!report.available && (
                      <Chip
                        icon="close-circle"
                        style={styles.unavailableChip}
                        textStyle={styles.unavailableChipText}
                      >
                        Não disponível
                      </Chip>
                    )}
                  </View>

                  {report.available && (
                    <IconButton
                      icon="chevron-right"
                      size={24}
                      iconColor={colors.textSecondary}
                    />
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Delete Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Eliminar Turbina</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Tem a certeza que deseja eliminar esta turbina? Esta ação não pode ser desfeita.
            </Text>
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
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    elevation: 4,
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
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    color: colors.primary,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailValue: {
    color: colors.text,
  },
  reportsTitle: {
    color: colors.primary,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  reportsList: {
    gap: spacing.sm,
  },
  reportCard: {
    marginBottom: spacing.sm,
    elevation: 2,
  },
  reportCardDisabled: {
    opacity: 0.5,
  },
  reportCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  reportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  reportNameDisabled: {
    color: colors.textSecondary,
  },
  unavailableChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.errorLight,
    height: 24,
  },
  unavailableChipText: {
    fontSize: 11,
    color: colors.error,
  },
});
