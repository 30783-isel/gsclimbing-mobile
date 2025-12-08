// src/screens/reports/defect-inspection/DefectInspectionReportsListScreen.tsx
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
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { colors, spacing } from '@/constants/theme';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';
import type { DefectInspectionReportResponse } from '@/types/defectInspectionReport.types';

const CACHE_KEY_PREFIX = '@cache:reports_turbine_';

export default function DefectInspectionReportsListScreen() {
  const { turbineId, turbineName, projectName } = useLocalSearchParams<{
    turbineId: string;
    turbineName: string;
    projectName: string;
  }>();
  const router = useRouter();

  const [reports, setReports] = useState<DefectInspectionReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});

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
   * ESTRATÉGIA CACHE-FIRST para relatórios
   */
  const loadReports = async () => {
    if (!turbineId) return;

    try {
      setIsLoading(true);
      console.log(`\n📋 Carregando relatórios da turbina ${turbineId}...`);
      console.log(`📡 Estado: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

      let reportsData: DefectInspectionReportResponse[] = [];

      // ========================================
      // SE OFFLINE: CACHE DIRETO
      // ========================================
      if (!isOnline) {
        console.log('📵 OFFLINE - carregando do cache...');
        reportsData = await loadFromCache();
        
        if (reportsData.length > 0) {
          console.log(`✅ ${reportsData.length} relatórios do CACHE`);
          setLoadedFromCache(true);
        } else {
          console.log('⚠️ Nenhum relatório no cache');
        }
      }
      // ========================================
      // SE ONLINE: API + CACHE FALLBACK
      // ========================================
      else {
        console.log('🌐 ONLINE - tentando API...');
        
        try {
          reportsData = await defectInspectionReportAPI.getByTurbineId(parseInt(turbineId));
          console.log(`✅ ${reportsData.length} relatórios da API`);
          
          // Guardar em cache
          await saveToCache(reportsData);
          setLoadedFromCache(false);
          
        } catch (apiError: any) {
          console.error('❌ Erro na API:', apiError.message);
          console.log('🔄 Tentando cache como fallback...');
          
          reportsData = await loadFromCache();
          
          if (reportsData.length > 0) {
            console.log(`✅ ${reportsData.length} relatórios do CACHE (fallback)`);
            setLoadedFromCache(true);
          } else {
            throw new Error('Não foi possível carregar relatórios');
          }
        }
      }

      setReports(reportsData);
      console.log('✅ Relatórios carregados com sucesso\n');
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar relatórios:', error);
      Alert.alert('Erro', error.message || 'Não foi possível carregar os relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Carregar relatórios do cache
   */
  const loadFromCache = async (): Promise<DefectInspectionReportResponse[]> => {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${turbineId}`;
      console.log(`🔑 Cache key: ${cacheKey}`);
      
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(`📦 ${parsed.length} relatórios encontrados no cache`);
        return parsed;
      }
      
      console.log('📦 Cache vazio');
      return [];
    } catch (error) {
      console.error('❌ Erro ao ler cache:', error);
      return [];
    }
  };

  /**
   * Guardar relatórios no cache
   */
  const saveToCache = async (reportsData: DefectInspectionReportResponse[]) => {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${turbineId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(reportsData));
      console.log(`💾 ${reportsData.length} relatórios guardados em cache`);
    } catch (error) {
      console.error('⚠️ Erro ao guardar cache:', error);
    }
  };

  const handleReportPress = (reportId: number) => {
    router.push({
      pathname: '/(tabs)/admin/reports/defect-inspection/edit' as any,
      params: {
        reportId: reportId.toString(),
        turbineName: turbineName || 'Turbina',
        projectName: projectName || 'Projeto',
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  const toggleMenu = (reportId: number) => {
    setMenuVisible((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!isOnline) {
      Alert.alert('Modo Offline', 'Não é possível eliminar relatórios offline.');
      return;
    }

    Alert.alert(
      'Eliminar Relatório',
      'Tem a certeza que deseja eliminar este relatório? Esta ação não pode ser revertida.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await defectInspectionReportAPI.delete(reportId);
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

  const renderReportItem = (item: DefectInspectionReportResponse) => (
    <Card key={item.reportId} style={styles.card}>
      <TouchableOpacity onPress={() => handleReportPress(item.reportId)} activeOpacity={0.7}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Text variant="titleMedium" style={styles.reportTitle}>
                Relatório #{item.reportId}
              </Text>
              <Text variant="bodySmall" style={styles.reportDate}>
                {new Date(item.reportDate || Date.now()).toLocaleDateString('pt-PT')}
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
                leadingIcon="pencil"
                title="Editar"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  toggleMenu(item.reportId);
                  handleDeleteReport(item.reportId);
                }}
                leadingIcon="delete"
                title="Eliminar"
                titleStyle={{ color: colors.error }}
                disabled={!isOnline}
              />
            </Menu>
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
      </TouchableOpacity>
    </Card>
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

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconButton icon="file-document-outline" size={64} iconColor={colors.lightGray} />
          <Text variant="titleMedium" style={styles.emptyTitle}>Sem relatórios</Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {isOnline 
              ? 'Ainda não existem relatórios Defect Inspection para esta turbina.'
              : 'Nenhum relatório disponível offline. Abra-os online primeiro.'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {reports.map((report) => renderReportItem(report))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: spacing.sm },
  headerCenter: { flex: 1, marginLeft: spacing.sm },
  headerTitle: { color: colors.white, fontWeight: 'bold' },
  headerSubtitle: { color: colors.white, opacity: 0.9 },
  offlineBanner: { marginBottom: spacing.md },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md },
  card: { marginBottom: spacing.md, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  headerLeft: { flex: 1 },
  reportTitle: { color: colors.text, fontWeight: 'bold', marginBottom: spacing.xs / 2 },
  reportDate: { color: colors.textSecondary },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { marginRight: spacing.xs, marginTop: spacing.xs / 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
});