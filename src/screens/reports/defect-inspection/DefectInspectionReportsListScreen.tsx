import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  ActivityIndicator,
  Chip,
  Surface,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { defectInspectionReportAPI } from '@/reports/defectInspectionReport/defectInspectionReport.api';
import type { DefectInspectionReportResponse } from '@/reports/defectInspectionReport/defectInspectionReport.types';
import Toast from 'react-native-toast-message';

export default function DefectInspectionReportsListScreen() {
  const router = useRouter();
  const { turbineId, turbineName, projectName } = useLocalSearchParams<{
    turbineId: string;
    turbineName: string;
    projectName: string;
  }>();

  const [reports, setReports] = useState<DefectInspectionReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, [turbineId]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Carregando relatórios da turbina:', turbineId);

      const data = await defectInspectionReportAPI.getByTurbineId(
        Number(turbineId)
      );

      setReports(data);
      console.log(`✅ ${data.length} relatórios carregados`);
    } catch (error: any) {
      console.error('❌ Erro ao carregar relatórios:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.response?.data?.message || 'Erro ao carregar relatórios',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditReport = (reportId: number) => {
    router.push({
      pathname: '/(tabs)/admin/reports/defect-inspection/edit' as any,
      params: { reportId: reportId.toString() },
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReports();
    setIsRefreshing(false);
  };

  const handleReportPress = (reportId: number) => {
    router.push({
      pathname: '/(tabs)/admin/reports/defect-inspection/view' as any,
      params: {
        reportId: reportId.toString(),
        turbineName,
        projectName,
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderReportItem = ({
    item,
  }: {
    item: DefectInspectionReportResponse;
  }) => (
    <TouchableOpacity onPress={() => handleReportPress(item.reportId)}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Text variant="titleMedium" style={styles.reportTitle}>
                {item.site} - {item.wtgNumber}
              </Text>
              <Text variant="bodySmall" style={styles.reportDate}>
                {formatDate(item.createDate)}
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              size={24}
              iconColor={colors.primary}
            />
          </View>

          <View style={styles.chipContainer}>
            <Chip icon="turbine" compact style={styles.chip}>
              {item.wtgType}
            </Chip>
            <Chip icon="calendar" compact style={styles.chip}>
              {item.yearConstruction}
            </Chip>
            <Chip icon="image-multiple" compact style={styles.chip}>
              {item.numberPictures} {item.numberPictures === 1 ? 'foto' : 'fotos'}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading) {
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
      <Surface style={styles.header} elevation={2}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={colors.white}
          onPress={handleBack}
        />
        <View style={styles.headerCenter}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Defect Inspection Reports
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {turbineName} - {projectName}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </Surface>

      {/* Lista de relatórios */}
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconButton
            icon="file-document-outline"
            size={64}
            iconColor={colors.lightGray}
          />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            Sem relatórios
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Ainda não existem relatórios Defect Inspection para esta turbina.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.reportId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}
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
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
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
    opacity: 0.9,
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
  listContent: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  reportTitle: {
    fontWeight: 'bold',
    color: colors.text,
  },
  reportDate: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    marginRight: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    color: colors.text,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
