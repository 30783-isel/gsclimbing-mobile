/**
 * PerformanceRepairElevatorListScreen
 * ✅ ATUALIZADO PARA USAR O NOVO SISTEMA DE CACHE + HISTÓRICO + OFFLINE
 * 
 * Features:
 * - Usa dataCacheService para cache automático
 * - Mostra relatórios online + offline
 * - Banner com botão "Sincronizar Agora"
 * - FAB para criar novo
 * - Badges de status
 * - Navegação correta (reportId vs tempId)
 * - Menu com opção "Ver Histórico"
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
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
import NetInfo from '@react-native-community/netinfo';
import { colors, spacing } from '@/constants/theme';
import { dataCacheService } from '@/services/storage/dataCache.service';
import { performanceRepairElevatorAPI } from '@/services/api/performanceRepairElevator.api';
import { 
  offlinePerformanceReportsService, 
  OfflinePerformanceReport 
} from '@/services/storage/offlinePerformanceReports.service';
import { performanceReportSyncService } from '@/services/sync/performanceReportSync.service';
import { SyncDebugOverlay } from '@/components/common/SyncDebugOverlay';
import { useAuthStore } from '@/store/authStore';

export default function PerformanceRepairElevatorListScreen() {
  const { turbineId, turbineName, projectName, projectId } = useLocalSearchParams<{
    turbineId: string;
    turbineName: string;
    projectName: string;
    projectId: string;
  }>();
  const router = useRouter();
  const { role: userRole } = useAuthStore();

  const [offlineReports, setOfflineReports] = useState<OfflinePerformanceReport[]>([]);
  const [combinedReports, setCombinedReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Monitorar conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      const nowOnline = state.isConnected ?? false;

      setIsOnline(nowOnline);

      // Recarregar dados quando voltar online
      if (!wasOnline && nowOnline) {
        console.log('🌐 Voltou online - recarregando...');
        loadReports();
      }
    });

    return unsubscribe;
  }, [isOnline]);

  // Carregar dados iniciais
  useEffect(() => {
    loadReports();
  }, [turbineId]);

  // ========================================
  // CARREGAR RELATÓRIOS (ONLINE + OFFLINE)
  // ========================================
  const loadReports = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Carregando relatórios para turbina:', turbineId);

      const parsedTurbineId = parseInt(turbineId);
      let onlineReportsData: any[] = [];
      let offlineReportsData: OfflinePerformanceReport[] = [];
      let fromCache = false;

      // ========================================
      // 1. CARREGAR RELATÓRIOS ONLINE (com cache)
      // ========================================
      if (!isOnline) {
        // OFFLINE: Carregar do cache direto
        console.log('📵 OFFLINE - carregando do cache...');
        onlineReportsData = await dataCacheService.getReportsFromCache(parsedTurbineId);
        fromCache = true;
        console.log(`📦 ${onlineReportsData.length} relatórios do cache`);
        
        // ✅ DEBUG: Verificar estrutura dos dados
        if (onlineReportsData.length > 0) {
          console.log('🔍 Primeiro relatório do cache:', JSON.stringify(onlineReportsData[0], null, 2));
        }
      } else {
        // ONLINE: Tentar API, cache como fallback
        console.log('🌐 ONLINE - tentando API...');
        try {
          const freshData = await performanceRepairElevatorAPI.getByTurbine(parsedTurbineId);
          onlineReportsData = Array.isArray(freshData) ? freshData : [];
          console.log(`✅ ${onlineReportsData.length} relatórios da API`);
          
          // ✅ DEBUG: Verificar estrutura dos dados
          if (onlineReportsData.length > 0) {
            console.log('🔍 Primeiro relatório da API:', JSON.stringify(onlineReportsData[0], null, 2));
          }
          
          // Guardar no cache para uso offline futuro
          await dataCacheService.cacheReportsData(parsedTurbineId, onlineReportsData);
          fromCache = false;
        } catch (apiError) {
          console.error('❌ Erro na API, tentando cache...');
          onlineReportsData = await dataCacheService.getReportsFromCache(parsedTurbineId);
          fromCache = true;
          console.log(`📦 ${onlineReportsData.length} relatórios do cache (fallback)`);
        }
      }

      setLoadedFromCache(fromCache);

      // ========================================
      // 2. CARREGAR RELATÓRIOS OFFLINE LOCAIS
      // ========================================
      const allOfflineReports = await offlinePerformanceReportsService.getAll();
      offlineReportsData = allOfflineReports.filter(
        r => r.turbineId === parsedTurbineId
      );
      console.log(`📵 ${offlineReportsData.length} relatórios offline locais`);

      // ========================================
      // 3. COMBINAR E MARCAR ORIGEM
      // ========================================
      const combined = [
        ...onlineReportsData.map((r, index) => {
          // ✅ VALIDAÇÃO: Garantir que reportId existe
          const reportId = r.reportId || r.id;
          
          if (!reportId) {
            console.warn(`⚠️ Relatório online sem ID no índice ${index}:`, r);
          }
          
          return {
            ...r,
            reportId: reportId, // ✅ Usar reportId ou id como fallback
            isOffline: false,
          };
        }),
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
      combined.sort((a, b) => {
        const dateA = new Date(a.createDate).getTime();
        const dateB = new Date(b.createDate).getTime();
        return dateB - dateA;
      });

      setOfflineReports(offlineReportsData);
      setCombinedReports(combined);

      console.log(`✅ Total: ${combined.length} relatórios (${onlineReportsData.length} online + ${offlineReportsData.length} offline)`);

    } catch (error) {
      console.error('❌ Erro ao carregar relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMenu = (menuId: string) => {
    setMenuVisible(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleBack = () => {
    router.back();
  };

  const handleReportPress = (report: any) => {
    const role = userRole ?? 'tech';
    const basePath = `/(tabs)/${role.toLowerCase()}`;

    if (report.isOffline) {
      // Relatório offline - editar
      if (!report.tempId) {
        console.error('❌ tempId está undefined:', report);
        Alert.alert('Erro', 'Relatório offline inválido');
        return;
      }
      
      router.push({
        pathname: `${basePath}/reports/performance-repair-elevator/edit` as any,
        params: {
          tempId: report.tempId,
          turbineId: turbineId,
          projectId: projectId,
        },
      });
    } else {
      // Relatório online - editar
      if (!report.reportId) {
        console.error('❌ reportId está undefined:', report);
        Alert.alert('Erro', 'Relatório inválido');
        return;
      }
      
      router.push({
        pathname: `${basePath}/reports/performance-repair-elevator/edit` as any,
        params: {
          reportId: report.reportId.toString(),
          turbineId: turbineId,
          projectId: projectId,
        },
      });
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncingAll(true);
      await performanceReportSyncService.syncAll();
      await loadReports();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleDeleteReport = (report: any) => {
    if (report.isOffline) {
      // Eliminar relatório offline
      if (!report.tempId) {
        console.error('❌ tempId está undefined:', report);
        Alert.alert('Erro', 'Relatório offline inválido');
        return;
      }
      
      Alert.alert(
        'Eliminar Relatório Offline',
        'Este relatório ainda não foi sincronizado.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await offlinePerformanceReportsService.delete(report.tempId);
              await loadReports();
            },
          },
        ]
      );
    } else {
      // Eliminar relatório online
      if (!report.reportId) {
        console.error('❌ reportId está undefined:', report);
        Alert.alert('Erro', 'Relatório inválido - ID não encontrado');
        return;
      }
      
      Alert.alert(
        'Eliminar Relatório',
        'Tem a certeza?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              if (!isOnline) {
                Alert.alert('Modo Offline', 'Não é possível eliminar relatórios online quando offline.');
                return;
              }
              try {
                console.log('🗑️ Eliminando relatório:', report.reportId);
                await performanceRepairElevatorAPI.delete(report.reportId);
                await loadReports();
              } catch (error) {
                console.error('❌ Erro ao eliminar:', error);
                Alert.alert('Erro', 'Não foi possível eliminar o relatório');
              }
            },
          },
        ]
      );
    }
  };

  /**
   * Renderizar cada relatório
   */
  const renderReportItem = (item: any) => {
    const menuId = item.isOffline ? `offline-${item.tempId}` : `online-${item.reportId}`;

    // Badge de status para relatórios offline
    let statusBadge = null;
    if (item.isOffline) {
      const statusConfig = {
        editing: { label: '✏️ Editando', color: colors.info },
        pending_sync: { label: '⏳ Aguardando', color: colors.warning },
        syncing: { label: '🔄 Sincronizando', color: colors.primary },
        sync_error: { label: '❌ Erro', color: colors.error },
      };

      const config = statusConfig[item.offlineStatus as keyof typeof statusConfig];
      if (config) {
        statusBadge = (
          <Chip
            compact
            style={[styles.offlineBadge, { backgroundColor: config.color + '20' }]}
            textStyle={{ color: config.color, fontSize: 11 }}
          >
            {config.label}
          </Chip>
        );
      }
    }

    return (
      <Card
        key={menuId}
        style={styles.card}
        onPress={() => handleReportPress(item)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              {statusBadge}
              <Text variant="titleMedium" style={styles.reportTitle}>
                {item.isOffline ? '📵 Relatório Offline' : `Relatório #${item.reportId}`}
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
              
              {/* ✅ NOVA OPÇÃO: Ver Histórico */}
              {!item.isOffline && (
                <>
                  <Menu.Item
                    onPress={() => {
                      toggleMenu(menuId);
                      const role = userRole ?? 'tech';
                      router.push({
                        pathname: `/(tabs)/${role.toLowerCase()}/reports/performance-repair-elevator/${item.reportId}/history` as any,
                        params: {
                          reportId: item.reportId.toString(),
                          reportTitle: `#${item.reportId} - ${item.wtgNumber}`,
                        },
                      });
                    }}
                    leadingIcon="history"
                    title="Ver Histórico"
                  />
                  <Divider />
                </>
              )}
              
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
      </Card>
    );
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
            Relatórios
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {turbineName} - {projectName}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </Surface>

      {/* Banner Offline */}
      {!isOnline && (
        <Banner
          visible={true}
          icon="wifi-off"
          style={styles.offlineBanner}
        >
          📵 Modo Offline - A ver dados em cache
        </Banner>
      )}

      {/* Banner Cache (quando online mas mostra cache) */}
      {loadedFromCache && isOnline && (
        <Banner
          visible={true}
          icon="cached"
          actions={[
            {
              label: 'Atualizar',
              onPress: () => loadReports(),
            },
          ]}
        >
          📦 A ver dados em cache
        </Banner>
      )}

      {/* Banner de Sincronização */}
      {offlineReports.length > 0 && isOnline && (
        <Banner
          visible={true}
          icon="sync"
          actions={[
            {
              label: isSyncingAll ? 'Sincronizando...' : 'Sincronizar Agora',
              onPress: handleSyncAll,
              disabled: isSyncingAll,
            },
          ]}
          style={styles.syncBanner}
        >
          {`${offlineReports.length} relatório(s) offline aguardando sincronização`}
        </Banner>
      )}

      {/* Lista de Relatórios */}
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

      {/* FAB para criar novo relatório */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          const role = userRole ?? 'tech';
          router.push({
            pathname: `/(tabs)/${role.toLowerCase()}/reports/performance-repair-elevator/edit` as any,
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
      
      {/* ✅ SYNC DEBUG OVERLAY */}
      <SyncDebugOverlay />
    </View>
  );
}

// ========================================
// STYLES
// ========================================

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
  syncBanner: {
    backgroundColor: colors.info + '20',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
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