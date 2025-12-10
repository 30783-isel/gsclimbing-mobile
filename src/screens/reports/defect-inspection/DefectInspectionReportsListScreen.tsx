/**
 * DefectInspectionReportsListScreen
 * ✅ ATUALIZADO PARA USAR O NOVO SISTEMA DE CACHE
 * 
 * Features:
 * - Usa dataCacheService para cache automático
 * - Mostra relatórios online + offline
 * - Banner com botão "Sincronizar Agora"
 * - FAB para criar novo
 * - Badges de status
 * - Navegação correta (reportId vs tempId)
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
import NetInfo from '@react-native-community/netinfo';
import { colors, spacing } from '@/constants/theme';
import { dataCacheService } from '@/services/storage/dataCache.service';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';
import { offlineReportsService, OfflineReport } from '@/services/storage/offlineReports.service';
import { reportSyncService } from '@/services/sync/reportSync.service';
import { ReportType } from '@/types/report.types';
import type { DefectInspectionReportResponse } from '@/types/defectInspectionReport.types';

export default function DefectInspectionReportsListScreen() {
  const { turbineId, turbineName, projectName, projectId } = useLocalSearchParams<{
    turbineId: string;
    turbineName: string;
    projectName: string;
    projectId: string;
  }>();
  const router = useRouter();

  const [onlineReports, setOnlineReports] = useState<DefectInspectionReportResponse[]>([]);
  const [offlineReports, setOfflineReports] = useState<OfflineReport[]>([]);
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

      // Recarregar quando ficar online
      if (!wasOnline && nowOnline) {
        console.log('🔄 Ficou online - recarregando...');
        loadReports();
      }
    });
    return unsubscribe;
  }, [isOnline]);

  useEffect(() => {
    if (turbineId) {
      loadReports();
    }
  }, [turbineId]);

  /**
   * ✅ NOVA IMPLEMENTAÇÃO: Carregar relatórios usando cache inteligente
   */
  const loadReports = async () => {
    if (!turbineId) return;

    try {
      setIsLoading(true);
      console.log(`\n📋 Carregando relatórios da turbina ${turbineId}...`);
      console.log(`📡 Estado: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

      let onlineReportsData: DefectInspectionReportResponse[] = [];
      let offlineReportsData: OfflineReport[] = [];

      // ========================================
      // 1. CARREGAR RELATÓRIOS ONLINE (COM CACHE)
      // ========================================
      if (!isOnline) {
        // OFFLINE: Carregar do cache direto
        console.log('📵 OFFLINE - carregando do cache...');
        onlineReportsData = await dataCacheService.getReportsFromCache(Number(turbineId));
        setLoadedFromCache(true);
        console.log(`📦 ${onlineReportsData.length} relatórios do cache`);
      } else {
        // ONLINE: Tentar API, cache como fallback
        console.log('🌐 ONLINE - tentando API...');
        try {
          onlineReportsData = await defectInspectionReportAPI.getByTurbineId(parseInt(turbineId));
          console.log(`✅ ${onlineReportsData.length} relatórios da API`);
          
          // Guardar no cache para uso offline futuro
          await dataCacheService.cacheReportsData(Number(turbineId), onlineReportsData);
          setLoadedFromCache(false);
        } catch (apiError) {
          console.error('❌ Erro na API, tentando cache...');
          onlineReportsData = await dataCacheService.getReportsFromCache(Number(turbineId));
          setLoadedFromCache(true);
          console.log(`📦 ${onlineReportsData.length} relatórios do cache (fallback)`);
        }
      }

      // ========================================
      // 2. CARREGAR RELATÓRIOS OFFLINE LOCAIS
      // ========================================
      const allOfflineReports = await offlineReportsService.getAll();
      offlineReportsData = allOfflineReports.filter(
        r => r.turbineId === parseInt(turbineId) && 
             r.reportType === ReportType.DEFECT_INSPECTION
      );
      console.log(`📵 ${offlineReportsData.length} relatórios offline locais`);

      // ========================================
      // 3. COMBINAR E MARCAR ORIGEM
      // ========================================
      const combined = [
        ...onlineReportsData.map(r => ({ ...r, isOffline: false })),
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

      setOnlineReports(onlineReportsData);
      setOfflineReports(offlineReportsData);
      setCombinedReports(combined);
      
      console.log(`✅ Total: ${combined.length} relatórios (${onlineReportsData.length} online + ${offlineReportsData.length} offline)\n`);

    } catch (error: any) {
      console.error('❌ Erro ao carregar relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ✅ Sincronizar todos os relatórios offline
   */
  const handleSyncAll = async () => {
    if (!isOnline) {
      Alert.alert('Sem Conexão', 'Não é possível sincronizar sem conexão à internet.');
      return;
    }

    setIsSyncingAll(true);

    try {
      console.log('\n🔄 Iniciando sincronização manual de todos os relatórios...');
      
      // 1. Obter todos os relatórios offline desta turbina que ainda não foram sincronizados
      // Nota: relatórios sincronizados são eliminados, não precisamos filtrar por 'synced'
      const offlineForThisTurbine = offlineReports;
      
      console.log(`📋 Encontrados ${offlineForThisTurbine.length} relatórios offline`);

      if (offlineForThisTurbine.length === 0) {
        Alert.alert('Info', 'Não há relatórios offline para sincronizar.');
        return;
      }
      
      // 2. Marcar cada um para sincronização
      for (const report of offlineForThisTurbine) {
        if (report.status !== 'pending_sync') {
          await offlineReportsService.markForSync(report.tempId);
        }
      }
      
      // 3. Forçar sincronização imediata
      console.log('🚀 Iniciando sincronização...');
      const summary = await reportSyncService.syncAll();
      
      console.log('📊 Resultado da sincronização:', summary);
      
      // 4. Recarregar lista
      await loadReports();
      
      // 5. Mostrar resultado
      if (summary.failed === 0) {
        Alert.alert(
          '✅ Sincronização Completa',
          `${summary.succeeded} relatório(s) sincronizado(s) com sucesso!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '⚠️ Sincronização Parcial',
          `✅ Sucesso: ${summary.succeeded}\n❌ Erros: ${summary.failed}\n\nVerifique os logs para detalhes.`,
          [{ text: 'OK' }]
        );
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar:', error);
      Alert.alert('Erro', error.message || 'Erro ao sincronizar relatórios');
    } finally {
      setIsSyncingAll(false);
    }
  };

  /**
   * ✅ Navegar para edição (online ou offline)
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
    if (report.isOffline) {
      // Eliminar relatório offline local
      Alert.alert(
        'Eliminar Relatório Offline',
        'Tem a certeza? Este relatório ainda não foi sincronizado.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await offlineReportsService.delete(report.tempId);
              await loadReports();
            },
          },
        ]
      );
    } else {
      // Eliminar relatório online
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
                await defectInspectionReportAPI.delete(report.reportId);
                await loadReports();
              } catch (error) {
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