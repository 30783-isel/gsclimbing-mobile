import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { REPORT_TYPE_NAMES, ReportType } from '@/types/report.types';

interface ReportTypeSelectorProps {
  projectoId: number;
  turbinaId: number;
  projectName: string;
  turbineName: string;
  availableReports: {
    defectsInspectionReport: boolean;
    examinationTransformer: boolean;
    measurements6KV: boolean;
    measurements690V400V: boolean;
    measurementsMwSwitchgear: boolean;
    onboardCraneInspectionReport: boolean;
    performanceReportRepairElevator: boolean;
    statutoryInspectionReport: boolean;
  };
}

interface ReportTypeItem {
  type: ReportType;
  name: string;
  icon: string;
  color: string;
  available: boolean;
  route: string;
}

export const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  projectoId,
  turbinaId,
  projectName,
  turbineName,
  availableReports,
}) => {
  const router = useRouter();

  const reportTypes: ReportTypeItem[] = [
    {
      type: ReportType.DEFECT_INSPECTION,
      name: REPORT_TYPE_NAMES[ReportType.DEFECT_INSPECTION],
      icon: 'alert-circle-outline',
      color: '#F44336',
      available: availableReports.defectsInspectionReport,
      route: '/(tabs)/admin/reports/defect-inspection',
    },
    {
      type: ReportType.EXAMINATION_TRANSFORMER,
      name: REPORT_TYPE_NAMES[ReportType.EXAMINATION_TRANSFORMER],
      icon: 'flash',
      color: '#FF9800',
      available: availableReports.examinationTransformer,
      route: '/(tabs)/admin/reports/examination-transformer',
    },
    {
      type: ReportType.MEASUREMENTS_MV_SWITCHGEAR,
      name: REPORT_TYPE_NAMES[ReportType.MEASUREMENTS_MV_SWITCHGEAR],
      icon: 'speedometer',
      color: '#9C27B0',
      available: availableReports.measurementsMwSwitchgear,
      route: '/(tabs)/admin/reports/measurements-mv-switchgear',
    },
    {
      type: ReportType.MEASUREMENTS_6KV,
      name: REPORT_TYPE_NAMES[ReportType.MEASUREMENTS_6KV],
      icon: 'chart-line',
      color: '#3F51B5',
      available: availableReports.measurements6KV,
      route: '/(tabs)/admin/reports/measurements-6kv',
    },
    {
      type: ReportType.MEASUREMENTS_690V400V,
      name: REPORT_TYPE_NAMES[ReportType.MEASUREMENTS_690V400V],
      icon: 'sine-wave',
      color: '#2196F3',
      available: availableReports.measurements690V400V,
      route: '/(tabs)/admin/reports/measurements-690v400v',
    },
    {
      type: ReportType.ONBOARD_CRANE,
      name: REPORT_TYPE_NAMES[ReportType.ONBOARD_CRANE],
      icon: 'crane',
      color: '#009688',
      available: availableReports.onboardCraneInspectionReport,
      route: '/(tabs)/admin/reports/onboard-crane',
    },
    {
      type: ReportType.PERFORMANCE_REPAIR_ELEVATOR,
      name: REPORT_TYPE_NAMES[ReportType.PERFORMANCE_REPAIR_ELEVATOR],
      icon: 'elevator',
      color: '#4CAF50',
      available: availableReports.performanceReportRepairElevator,
      route: '/(tabs)/admin/reports/performance-repair-elevator',
    },
    {
      type: ReportType.STATUTORY_INSPECTION,
      name: REPORT_TYPE_NAMES[ReportType.STATUTORY_INSPECTION],
      icon: 'file-document-outline',
      color: '#607D8B',
      available: availableReports.statutoryInspectionReport,
      route: '/(tabs)/admin/reports/statutory-inspection',
    },
  ];

  const handleSelectReport = (item: ReportTypeItem) => {
    if (!item.available) {
      return;
    }

    // Navegar para a rota do relatório
    router.push({
      pathname: item.route as any,
      params: {
        projectoId: projectoId.toString(),
        turbinaId: turbinaId.toString(),
        projectName,
        turbineName,
      },
    });
  };

  const renderReportType = ({ item }: { item: ReportTypeItem }) => (
    <TouchableOpacity
      onPress={() => handleSelectReport(item)}
      disabled={!item.available}
      style={styles.itemContainer}
    >
      <Card
        style={[
          styles.card,
          !item.available && styles.cardDisabled,
        ]}
      >
        <Card.Content style={styles.cardContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.available ? item.color : colors.disabled },
            ]}
          >
            <Icon source={item.icon} size={32} color="#fff" />
          </View>

          <View style={styles.textContainer}>
            <Text
              variant="titleMedium"
              style={[
                styles.title,
                !item.available && styles.titleDisabled,
              ]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            {!item.available && (
              <Text variant="bodySmall" style={styles.unavailableText}>
                Não disponível
              </Text>
            )}
          </View>

          {item.available && (
            <Icon source="chevron-right" size={24} color={colors.textSecondary} />
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.header}>
        Selecione o Tipo de Relatório
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {projectName} • {turbineName}
      </Text>

      <FlatList
        data={reportTypes}
        renderItem={renderReportType}
        keyExtractor={(item) => item.type.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  itemContainer: {
    marginBottom: spacing.sm,
  },
  card: {
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  titleDisabled: {
    color: colors.textSecondary,
  },
  unavailableText: {
    color: colors.error,
    marginTop: spacing.xs,
  },
});
