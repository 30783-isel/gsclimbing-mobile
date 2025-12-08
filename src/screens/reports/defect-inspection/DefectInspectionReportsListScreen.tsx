/**
 * DefectInspectionReportsListScreen
 * ✅ ADAPTADO PARA MOSTRAR RELATÓRIOS ONLINE E OFFLINE
 * 
 * Principais mudanças:
 * 1. Carrega relatórios offline do offlineReportsService
 * 2. Combina relatórios online + offline
 * 3. Mostra badges de status offline
 * 4. FAB para criar novo relatório
 * 5. Navegação correta (reportId vs tempId)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Text,
  IconButton,
  Card,
  Chip,
  Surface,
  Menu,
  Divider,
  Banner,
  FAB,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { colors, spacing } from '@/constants/theme';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';
import { offlineReportsService, OfflineReport } from '@/services/storage/offlineReports.service';
import { ReportType } from '@/types/report.types';
import type { DefectInspectionReportResponse } from '@/types/defectInspectionReport.types';

const CACHE_KEY_PREFIX = '@cache:reports_turbine_';

export default function DefectInspectionReportsListScreen() {
  const { turbineId, turbineName, projectName, projectId } = useLocalSearchParams<{
    turbineId: string;
    turbineName: string;
    projectName: string;
    projectId: string;
  }>();
  const router = useRouter();

  const [reports, setReports] = useState<DefectInspectionReportResponse[]>([]);
  const [offlineReports, setOfflineReports] = useState<OfflineReport[]>([]);
  const [combinedReports, setCombinedReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});

  // Monitorar conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (turbineId) {
      loadReports();
    }
  }, [turbineId]);

  /**
   * ✅ ADAPTADO: Carregar relatórios ONLINE E OFFLINE
   */
  const loadReports = async () => {
    if (!turbineId) return;

    try {
      setIsLoading(true);
      console.log(`\n📋 Carregando relatórios da turbina ${turbineId}...`);

      let onlineReports: DefectInspectionReportResponse[] = [];
      let offlineReportsData: OfflineReport[] = [];

      // 1. Carregar relatórios online
      if (isOnline) {
        try {
          onlineReports = await defectInspectionReportAPI.getByTurbineId(parseInt(turbineId));
          console.log(`✅ ${onlineReports.length} relatórios online`);
          await saveToCache(onlineReports);
          setLoadedFromCache(false);
        } catch (apiError) {
          console.error('❌ Erro na API, tentando cache...');
          onlineReports = await loadFromCache();
          setLoadedFromCache(true);
        }
      } else {
        console.log('📵 Offline - carregando do cache...');
        onlineReports = await loadFromCache();
        setLoadedFromCache(true);
      }

      // 2. Carregar relatórios offline
      const allOfflineReports = await offlineReportsService.getAll();
      offlineReportsData = allOfflineReports.filter(
        r => r.turbineId === parseInt(turbineId) && 
             r.reportType === ReportType.DEFECT_INSPECTION
      );
      console.log(`📵 ${offlineReportsData.length} relatórios offline`);

      // 3. Combinar e marcar origem
      const combined = [
        ...onlineReports.map(r => ({ ...r, isOffline: false })),
        ...offlineReportsData.map(r => ({
          reportId: 0,
          tempId: r.tempId,
          site: r.data.site || '',
          wtgNumber: r.data.wtgNumber || '',
          wtgType: r.data.wtgType || '',
          yearConstruction: r.data.yearConstruction || '',
          createDate: r.createdAt,
          numberPictures: r.photos.length,
          isOffline: true,
          offlineStatus: r.status,
          offlineError: r.syncError,
        })),
      ];

      // 4. Ordenar por data (mais recentes primeiro)
      combined.sort((a, b) => 
        new Date(b.createDate).getTime() - new Date(a.createDate).getTime()
      );

      setReports(onlineReports);
      setOfflineReports(offlineReportsData);
      setCombinedReports(combined);
      
      console.log(`✅ Total: ${combined.length} relatórios (${onlineReports.length} online + ${offlineReportsData.length} offline)\n`);

    } catch (error: any) {
      console.error('❌ Erro ao carregar relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromCache = async (): Promise<DefectInspectionReportResponse[]> => {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${turbineId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(`📦 ${parsed.length} relatórios do cache`);
        return parsed;
      }
      return [];
    } catch (error) {
      console.error('❌ Erro ao ler cache:', error);
      return [];
    }
  };

  const saveToCache = async (reportsData: DefectInspectionReportResponse[]) => {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${turbineId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(reportsData));
      console.log(`💾 ${reportsData.length} relatórios guardados em cache`);
    } catch (error) {
      console.error('⚠️ Erro ao guardar cache:', error);
    }
  };

  /**
   * ✅ ADAPTADO: Navegar para edição (online ou offline)
   */
  const handleReportPress = (report: any) => {
    if (report.isOffline) {
      // Navegar para edição offline
      router.push({
        pathname: '/(tabs)/admin/reports/defect-inspection/edit' as any,
        params: {
          tempId: report.tempId,
        },
      });
    } else {
      // Navegar para edição online
      router.push({
        pathname: '/(tabs)/admin/reports/defect-inspection/edit' as any,
        params: {
          reportId: report.reportId.toString(),
          turbineName: turbineName || 'Turbina',
          projectName: projectName || 'Projeto',
        },
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const toggleMenu = (id: string) => {
    setMenuVisible((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteReport = async (report: any) => {
    if (!isOnline) {
      Alert.alert('Modo Offline', 'Não é possível eliminar relatórios offline.');
      return;
    }

    if (report.isOffline) {
      // Eliminar relatório offline local
      Alert.alert(
        'Eliminar Relatório Offline',
        'Tem a certeza?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await offlineReportsService.delete(report.tempId);
              Alert.alert('Sucesso', 'Relatório offline eliminado');
              loadReports();
            },
          },
        ]
      );
      return;
    }

    // Eliminar relatório online
    Alert.alert(
      'Eliminar Relatório',
      'Tem a certeza? Esta ação não pode ser revertida.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await defectInspectionReportAPI.delete(report.reportId);
              Alert.alert('Sucesso', 'Relatório eliminado com sucesso');
              loadReports();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível eliminar o relatório');
            }
          },
        },
      ]
    );
  };

  /**
   * ✅ ADAPTADO: Renderizar card com badge offline
   */
  const renderReportItem = (item: any) => {
    const menuId = item.isOffline ? item.tempId : item.reportId.toString();
    
    return (
      <Card key={menuId} style={styles.card}>
        <TouchableOpacity onPress={() => handleReportPress(item)} activeOpacity={0.7}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                {/* Badge offline */}
                {item.isOffline && (
                  <Chip
                    icon="cloud-off"
                    style={[styles.offlineBadge, { 
                      backgroundColor: getOfflineStatusColor(item.offlineStatus) 
                    }]}
                    textStyle={{ color: colors.white, fontSize: 11 }}
                    compact
                  >
                    {getOfflineStatusText(item.offlineStatus)}
                  </Chip>
                )}
                
                <Text variant="titleMedium" style={styles.reportTitle}>
                  {item.isOffline ? '📵 Offline' : `Relatório #${item.reportId}`}
                </Text>
                <Text variant="bodySmall" style={styles.reportDate}>
                  {new Date(item.createDate).toLocaleDateString('pt-PT')}
                </Text>
              </View>

              <Menu
                visible={menuVisible[menuId] || false}
                onDismiss={() => toggleMenu(menuId)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => toggleMenu(menuId)}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    toggleMenu(menuId);
                    handleReportPress(item);
                  }}
                  leadingIcon="pencil"
                  title="Editar"
                />
                <Divider />
                <Menu.Item
                  onPress={() => {
                    toggleMenu(menuId);
                    handleDeleteReport(item);
                  }}
                  leadingIcon="delete"
                  title="Eliminar"
                  titleStyle={{ color: colors.error }}
                />
              </Menu>
            </View>

            {/* Mostrar erro se houver */}
            {item.isOffline && item.offlineError && (
              <Text variant="bodySmall" style={styles.errorText}>
                ⚠️ {item.offlineError}
              </Text>
            )}

            <View style={styles.chipContainer}>
              <Chip icon="map-marker" compact style={styles.chip}>
                {item.site || 'Sem site'}
              </Chip>
              <Chip icon="wind-turbine" compact style={styles.chip}>
                {item.wtgNumber || 'N/A'}
              </Chip>
              <Chip icon="cog" compact style={styles.chip}>
                {item.wtgType || 'N/A'}
              </Chip>
              <Chip icon="camera" compact style={styles.chip}>
                {item.numberPictures} {item.numberPictures === 1 ? 'foto' : 'fotos'}
              </Chip>
            </View>
          </Card.Content>
        </TouchableOpacity>
      </Card>
    );
  };

  // Funções auxiliares para badges
  const getOfflineStatusColor = (status: string) => {
    switch (status) {
      case 'editing': return colors.info;
      case 'pending_sync': return colors.warning;
      case 'syncing': return colors.primary;
      case 'sync_error': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getOfflineStatusText = (status: string) => {
    switch (status) {
      case 'editing': return '✏️ Em edição';
      case 'pending_sync': return '⏳ Pendente';
      case 'syncing': return '🔄 A sincronizar';
      case 'sync_error': return '❌ Erro';
      default: return '📵 Offline';
    }
  };

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
      <Surface style={styles.header} elevation={2}>
        <IconButton icon="arrow-left" size={24} iconColor={colors.white} onPress={handleBack} />
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

      {!isOnline && loadedFromCache && (
        <Banner visible={true} icon="wifi-off" style={styles.offlineBanner}>
          📵 Modo Offline - Mostrando relatórios do cache
        </Banner>
      )}

      {combinedReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconButton icon="file-document-outline" size={64} iconColor={colors.lightGray} />
          <Text variant="titleMedium" style={styles.emptyTitle}>Sem relatórios</Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {isOnline 
              ? 'Ainda não existem relatórios para esta turbina.'
              : 'Nenhum relatório disponível offline.'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {combinedReports.map(renderReportItem)}
        </ScrollView>
      )}

      {/* ✅ FAB para criar novo relatório */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          router.push({
            pathname: '/(tabs)/admin/reports/defect-inspection/edit' as any,
            params: {
              reportId: '0',
              turbineId: turbineId,
              projectId: projectId,
              turbineName: turbineName,
              projectName: projectName,
            },
          });
        }}
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
    alignItems: 'center',
    justifyContent: 'center',
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
  offlineBanner: {
    backgroundColor: colors.warning + '20',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  card: {
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  offlineBadge: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  reportTitle: {
    fontWeight: 'bold',
  },
  reportDate: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  errorText: {
    color: colors.error,
    marginVertical: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});