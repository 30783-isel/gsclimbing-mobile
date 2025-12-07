// app/(tabs)/tech/reports/turbine/[turbineId].tsx - RELATÓRIOS DE UMA TURBINA

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  Surface,
  FAB,
  Chip,
  Menu,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';
import type { DefectInspectionReportResponse } from '@/types/defectInspectionReport.types';

export default function TechTurbineReportsScreen() {
  const router = useRouter();
  const { turbineId, turbineName, projectId, projectName } = useLocalSearchParams<{
    turbineId: string;
    turbineName: string;
    projectId: string;
    projectName: string;
  }>();

  const [reports, setReports] = useState<DefectInspectionReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    loadReports();
  }, [turbineId]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Carregando relatórios da turbina:', turbineId);

      // Buscar relatórios desta turbina
      const turbineReports = await defectInspectionReportAPI.getByTurbineId(parseInt(turbineId));
      setReports(turbineReports);

      console.log(`✅ ${turbineReports.length} relatórios carregados`);
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleCreateReport = () => {
    // Navegar para criar novo relatório
    router.push({
      pathname: '/(tabs)/tech/reports/defect-inspection/create',
      params: {
        projectId,
        turbineId,
        turbineName,
      },
    });
  };

  const handleReportPress = (reportId: number) => {
    router.push({
      pathname: '/(tabs)/tech/reports/view',
      params: { reportId: reportId.toString() },
    });
  };

  const toggleMenu = (reportId: number) => {
    setMenuVisible((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  const handleDeleteReport = async (reportId: number) => {
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
              await defectInspectionReportAPI.delete(reportId);
              await loadReports();
              Alert.alert('Sucesso', 'Relatório eliminado com sucesso');
            } catch (error) {
              console.error('❌ Erro ao eliminar:', error);
              Alert.alert('Erro', 'Não foi possível eliminar o relatório');
            }
          },
        },
      ]
    );
  };

  const renderReportCard = ({ item }: { item: DefectInspectionReportResponse }) => (
    <Card style={styles.reportCard}>
      <TouchableOpacity onPress={() => handleReportPress(item.reportId)}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <Text variant="titleMedium" style={styles.reportTitle}>
                Relatório #{item.reportId}
              </Text>
              <Text variant="bodySmall" style={styles.typeText}>
                {item.wtgType || 'Tipo não definido'}
              </Text>
            </View>

            <Menu
              visible={menuVisible[item.reportId] || false}
              onDismiss={() => toggleMenu(item.reportId)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => toggleMenu(item.reportId)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  toggleMenu(item.reportId);
                  handleReportPress(item.reportId);
                }}
                title="Ver Detalhes"
                leadingIcon="eye"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  toggleMenu(item.reportId);
                  handleDeleteReport(item.reportId);
                }}
                title="Eliminar"
                leadingIcon="delete"
              />
            </Menu>
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <IconButton icon="map-marker" size={16} style={styles.detailIcon} />
              <Text variant="bodySmall">{item.site || 'Local não definido'}</Text>
            </View>

            <View style={styles.detailRow}>
              <IconButton icon="calendar" size={16} style={styles.detailIcon} />
              <Text variant="bodySmall">
                {item.createDate
                  ? new Date(item.createDate).toLocaleDateString('pt-PT')
                  : 'Data não definida'}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Chip icon="camera" compact>
              {item.numberPictures} {item.numberPictures === 1 ? 'foto' : 'fotos'}
            </Chip>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="file-document-outline" size={64} iconColor={colors.lightGray} />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        Sem relatórios
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Esta turbina ainda não tem relatórios.{'\n'}
        Clica no botão + para criar o primeiro.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <IconButton icon="arrow-left" size={24} iconColor={colors.primary} onPress={handleBack} />
        <View style={styles.headerContent}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            {turbineName}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {projectName}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </Surface>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text variant="headlineSmall" style={styles.statNumber}>
            {reports.length}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Relatórios
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text variant="headlineSmall" style={styles.statNumber}>
            {reports.reduce((acc, r) => acc + r.numberPictures, 0)}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Fotos
          </Text>
        </View>
      </View>

      {reports.length > 0 && (
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Relatórios de Defeitos
        </Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>A carregar relatórios...</Text>
      </View>
    );
  }

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container style={styles.container} edges={Platform.OS === 'web' ? undefined : ['bottom']}>
      <FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.reportId.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={reports.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateReport}
        label="Criar Relatório"
      />
    </Container>
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 1,
  },
  statNumber: {
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  sectionTitle: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 80,
  },
  reportCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    flex: 1,
  },
  reportTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  typeText: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardDetails: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    margin: 0,
    marginRight: -spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});