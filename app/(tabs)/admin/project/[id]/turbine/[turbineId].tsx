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

  // ✅ NOVA FUNÇÃO: Ver relatórios existentes
  const handleViewReports = () => {
    router.push({
      pathname: '/(tabs)/admin/reports/defect-inspection/list' as any,
      params: {
        turbineId: turbineId,
        turbineName: turbine?.name || 'Turbina',
        projectName: project?.name || 'Projeto',
      },
    });
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
            {turbine.number ? `#${turbine.number}` : project?.name}
          </Text>
        </View>
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
      </View>

      <ScrollView style={styles.content}>
        {/* Turbine Info Card */}
        <Card style={styles.infoCard}>
          <Card.Title title="Informações da Turbina" />
          <Card.Content>
            {turbine.site && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.infoLabel}>Site:</Text>
                <Text variant="bodyMedium" style={styles.infoValue}>{turbine.site}</Text>
              </View>
            )}
            {turbine.type && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.infoLabel}>Tipo:</Text>
                <Text variant="bodyMedium" style={styles.infoValue}>{turbine.type}</Text>
              </View>
            )}
            {turbine.year && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.infoLabel}>Ano:</Text>
                <Text variant="bodyMedium" style={styles.infoValue}>{turbine.year}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* ✅ NOVO BOTÃO: Ver Relatórios Existentes */}
        <Button
          mode="contained"
          icon="file-document-multiple"
          onPress={handleViewReports}
          style={styles.viewReportsButton}
          buttonColor={colors.secondary}
          textColor={colors.primary}
        >
          Ver Relatórios Existentes
        </Button>

        {/* Available Reports */}
        <Card style={styles.reportsCard}>
          <Card.Title title="Relatórios Disponíveis" />
          <Card.Content>
            {reportAvailability.filter(r => r.available).length === 0 ? (
              <Text variant="bodyMedium" style={styles.noReports}>
                Nenhum tipo de relatório disponível para esta turbina
              </Text>
            ) : (
              reportAvailability
                .filter(report => report.available)
                .map((report) => (
                  <TouchableOpacity
                    key={report.type}
                    onPress={() => handleCreateReport(report.type)}
                    style={styles.reportItem}
                  >
                    <View style={styles.reportItemContent}>
                      <View style={[styles.reportIcon, { backgroundColor: report.color }]}>
                        <IconButton
                          icon={report.icon}
                          iconColor={colors.white}
                          size={24}
                        />
                      </View>
                      <View style={styles.reportText}>
                        <Text variant="titleMedium" style={styles.reportName}>
                          {report.name}
                        </Text>
                        <Chip
                          mode="outlined"
                          compact
                          style={styles.statusChip}
                        >
                          Disponível
                        </Chip>
                      </View>
                      <IconButton
                        icon="chevron-right"
                        size={24}
                        iconColor={colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>
                ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Delete Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Eliminar Turbina</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Tem a certeza que deseja eliminar a turbina "{turbine.name}"?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancelar
            </Button>
            <Button
              onPress={handleDelete}
              textColor={colors.error}
            >
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
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
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    margin: spacing.md,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  infoValue: {
    color: colors.text,
  },
  // ✅ NOVO ESTILO: Botão de Ver Relatórios
  viewReportsButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  reportsCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 2,
  },
  noReports: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
  },
  reportItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  reportName: {
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs / 2,
  },
});