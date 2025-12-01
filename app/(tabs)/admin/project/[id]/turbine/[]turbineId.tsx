import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, FAB, Portal, Dialog, Button, Chip } from 'react-native-paper';
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
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    loadTurbine();
  }, [turbineId]);

  const loadTurbine = async () => {
    try {
      setIsLoading(true);
      const data = await projectsAPI.getTurbineById(turbineId);
      setTurbine(data);
    } catch (error) {
      console.error('Error loading turbine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/(tabs)/admin/project/${id}/turbine/${turbineId}/edit`);
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
    router.push({
      pathname: `/(tabs)/admin/project/${id}/turbine/${turbineId}/report/create`,
      params: { type: reportType },
    });
  };

  // Map dos relatórios disponíveis
  const reportAvailability = turbine ? [
    { type: ReportType.DEFECT_INSPECTION, available: turbine.defectsInspectionReport, name: 'Defect Inspection' },
    { type: ReportType.EXAMINATION_TRANSFORMER, available: turbine.examinationTransformer, name: 'Examination Transformer' },
    { type: ReportType.MEASUREMENTS_6KV, available: turbine.measurements6KV, name: 'Measurements 6KV' },
    { type: ReportType.MEASUREMENTS_690V400V, available: turbine.measurements690V400V, name: 'Measurements 690V/400V' },
    { type: ReportType.MEASUREMENTS_MV_SWITCHGEAR, available: turbine.measurementsMwSwitchgear, name: 'Measurements MV Switchgear' },
    { type: ReportType.ONBOARD_CRANE, available: turbine.onboardCraneInspectionReport, name: 'Onboard Crane' },
    { type: ReportType.PERFORMANCE_REPAIR_ELEVATOR, available: turbine.performanceReportRepairElevator, name: 'Performance Repair Elevator' },
    { type: ReportType.STATUTORY_INSPECTION, available: turbine.statutoryInspectionReport, name: 'Statutory Inspection' },
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
                <Text style={styles.detailLabel}>Número WTG:</Text>
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
                <Text style={styles.detailLabel}>Ano de Construção:</Text>
                <Text style={styles.detailValue}>{turbine.year}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Reports Section */}
        <View style={styles.reportsSection}>
          <Text variant="titleMedium" style={styles.sectionTitleWithMargin}>
            Tipos de Relatórios
          </Text>

          {reportAvailability.map((report) => (
            <TouchableOpacity
              key={report.type}
              onPress={() => report.available && handleCreateReport(report.type)}
              activeOpacity={0.7}
              disabled={!report.available}
            >
              <Card
                style={[
                  styles.reportCard,
                  !report.available && styles.reportCardDisabled,
                ]}
              >
                <Card.Content>
                  <View style={styles.reportCardContent}>
                    <View style={styles.reportInfo}>
                      <Text
                        variant="titleSmall"
                        style={[
                          styles.reportName,
                          !report.available && styles.reportNameDisabled,
                        ]}
                      >
                        {report.name}
                      </Text>
                      <Chip
                        icon={report.available ? 'check-circle' : 'close-circle'}
                        style={[
                          styles.statusChip,
                          report.available ? styles.statusChipAvailable : styles.statusChipUnavailable,
                        ]}
                        textStyle={styles.statusChipText}
                      >
                        {report.available ? 'Disponível' : 'Indisponível'}
                      </Chip>
                    </View>
                    {report.available && (
                      <IconButton
                        icon="chevron-right"
                        size={24}
                        iconColor={colors.primary}
                      />
                    )}
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Estatísticas
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {reportAvailability.filter((r) => r.available).length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Disponíveis
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {reportAvailability.filter((r) => !r.available).length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Indisponíveis
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB - Quick Actions */}
      <FAB
        icon="file-document-plus"
        label="Novo Relatório"
        style={styles.fab}
        onPress={() => {}}
        color="#fff"
      />

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Eliminar Turbina</Dialog.Title>
          <Dialog.Content>
            <Text>Tem a certeza que deseja eliminar a turbina "{turbine.name}"?</Text>
            <Text style={{ marginTop: 8, color: colors.error }}>
              Esta ação não pode ser desfeita.
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 40,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing.xs / 2,
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
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.text,
  },
  sectionTitleWithMargin: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    color: colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  reportsSection: {
    marginTop: spacing.md,
  },
  reportCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  reportCardDisabled: {
    opacity: 0.5,
  },
  reportCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  reportNameDisabled: {
    color: colors.textSecondary,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusChipAvailable: {
    backgroundColor: colors.success + '20',
  },
  statusChipUnavailable: {
    backgroundColor: colors.error + '20',
  },
  statusChipText: {
    fontSize: 11,
  },
  statsCard: {
    margin: spacing.md,
    marginTop: spacing.lg,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
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
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});