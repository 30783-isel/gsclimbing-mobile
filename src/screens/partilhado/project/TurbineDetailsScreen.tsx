// src/screens/partilhado/project/TurbineDetailsScreen.tsx
// NOVA ABORDAGEM: Cache-first quando offline
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, IconButton, Chip, Portal, Dialog, Button, Banner } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { projectsAPI } from '@/services/api/projects.api';
import { dataCacheService } from '@/services/storage/dataCache.service';
import { colors, spacing } from '@/constants/theme';
import { ReportType, REPORT_TYPE_NAMES } from '@/types';
import type { Turbine } from '@/types/turbine.types';
import type { Project } from '@/types/project.types';
import { useAuthStore } from '@/store/authStore';
import NetInfo from '@react-native-community/netinfo';

const CACHE_KEYS = {
  PROJECTS: '@cache:projects',
  TURBINES: '@cache:turbines',
};

export default function TurbineDetailsScreen() {
  const { id, turbineId } = useLocalSearchParams<{ id: string; turbineId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { role } = useAuthStore();
  
  const [turbine, setTurbine] = useState<Turbine | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  const isAdmin = role === 'ADMIN';
  const basePath = isAdmin ? '/(tabs)/admin' : '/(tabs)/tech';

  // Monitorar conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      const nowOnline = state.isConnected ?? false;
      setIsOnline(nowOnline);
      
      console.log(`📡 Conexão: ${nowOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      if (!wasOnline && nowOnline && loadError) {
        console.log('🔄 Ficou online - recarregando...');
        loadData();
      }
    });
    return unsubscribe;
  }, [isOnline, loadError]);

  useEffect(() => {
    if (id && turbineId) {
      loadData();
    }
  }, [turbineId, id]);

  /**
   * NOVA ESTRATÉGIA: 
   * 1. Se OFFLINE -> Tenta CACHE primeiro (não faz request HTTP)
   * 2. Se ONLINE -> Tenta API, se falhar usa CACHE como fallback
   */
  const loadData = async () => {
    if (!id || !turbineId) {
      console.error('❌ Parâmetros inválidos');
      return;
    }

    try {
      console.log('\n🔄 === CARREGANDO TURBINA ===');
      console.log(`📍 Projeto: ${id}, Turbina: ${turbineId}`);
      console.log(`📡 Estado: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      setIsLoading(true);
      setLoadError(null);
      setLoadedFromCache(false);

      let turbineData: Turbine | null = null;
      let projectData: Project | null = null;
      
      // ========================================
      // ESTRATÉGIA 1: SE OFFLINE, CACHE DIRETO
      // ========================================
      if (!isOnline) {
        console.log('📵 OFFLINE detectado - carregando CACHE direto (sem HTTP)...');
        
        const cacheResult = await loadFromCache();
        turbineData = cacheResult.turbine;
        projectData = cacheResult.project;
        
        if (turbineData) {
          console.log('✅ Dados carregados do CACHE (offline)');
          setLoadedFromCache(true);
        } else {
          throw new Error('Turbina não disponível offline. Abra-a online primeiro.');
        }
      } 
      // ========================================
      // ESTRATÉGIA 2: SE ONLINE, API + CACHE FALLBACK
      // ========================================
      else {
        console.log('🌐 ONLINE - tentando API primeiro...');
        
        try {
          // Tentar API
          turbineData = await projectsAPI.getTurbineById(turbineId);
          console.log('✅ Turbina da API:', turbineData?.name);
          
          projectData = await projectsAPI.getById(Number(id));
          console.log('✅ Projeto da API:', projectData?.name);
          
          // Guardar em cache para uso offline futuro
          await saveToCache(turbineData, projectData);
          
        } catch (apiError: any) {
          console.error('❌ Erro na API:', apiError.message);
          console.log('🔄 Tentando CACHE como fallback...');
          
          // Fallback para cache
          const cacheResult = await loadFromCache();
          turbineData = cacheResult.turbine;
          projectData = cacheResult.project;
          
          if (turbineData) {
            console.log('✅ Dados do CACHE (fallback)');
            setLoadedFromCache(true);
          } else {
            throw new Error('Não foi possível carregar a turbina nem da API nem do cache.');
          }
        }
      }
      
      // ========================================
      // ATUALIZAR ESTADO
      // ========================================
      if (!turbineData) {
        throw new Error('Turbina não encontrada');
      }
      
      setTurbine(turbineData);
      setProject(projectData);
      
      console.log(`✅ Sucesso! Fonte: ${loadedFromCache ? 'CACHE' : 'API'}`);
      console.log('=== FIM ===\n');
      
    } catch (error: any) {
      console.error('❌ ERRO FINAL:', error.message);
      
      const errorMessage = error.message || 'Erro desconhecido';
      setLoadError(errorMessage);
      
      Alert.alert(
        'Erro ao Carregar',
        errorMessage,
        [
          { text: 'Tentar Novamente', onPress: () => loadData() },
          { text: 'Voltar', onPress: () => router.back(), style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Carregar dados do cache
   */
  const loadFromCache = async (): Promise<{ turbine: Turbine | null, project: Project | null }> => {
    console.log('📦 Carregando do cache...');
    
    let turbineData: Turbine | null = null;
    let projectData: Project | null = null;
    
    try {
      // Carregar turbinas do cache
      const cacheKey = `${CACHE_KEYS.TURBINES}_${id}`;
      console.log(`🔑 Tentando key: ${cacheKey}`);
      
      const cachedValue = await AsyncStorage.getItem(cacheKey);
      
      if (cachedValue) {
        const cachedTurbines = JSON.parse(cachedValue);
        console.log(`📦 ${cachedTurbines.length} turbinas no cache`);
        
        if (cachedTurbines.length > 0) {
          console.log(`🔍 Procurando turbineId="${turbineId}" (${typeof turbineId})`);
          console.log(`📋 IDs disponíveis:`, cachedTurbines.map((t: any) => 
            `${t.id}(${typeof t.id})/${t.idTurbine}(${typeof t.idTurbine})`
          ));
        }
        
        // Procurar turbina - testar TODAS as combinações possíveis
        turbineData = cachedTurbines.find((t: any) => {
          const matches = [
            t.id === turbineId,
            t.id === String(turbineId),
            t.id === Number(turbineId),
            t.idTurbine === turbineId,
            t.idTurbine === String(turbineId),
            t.idTurbine === Number(turbineId),
            String(t.id) === String(turbineId),
            String(t.idTurbine) === String(turbineId),
          ];
          
          const found = matches.some(m => m);
          if (found) {
            console.log(`✅ MATCH encontrado: t.id=${t.id}, t.idTurbine=${t.idTurbine}`);
          }
          return found;
        }) || null;
        
        if (turbineData) {
          console.log('✅ Turbina encontrada:', turbineData.name);
        } else {
          console.log('⚠️ Turbina NÃO encontrada no cache');
        }
      } else {
        console.log(`⚠️ Cache vazio para key: ${cacheKey}`);
      }
      
      // Carregar projeto do cache
      const projectsValue = await AsyncStorage.getItem(CACHE_KEYS.PROJECTS);
      if (projectsValue) {
        const cachedProjects = JSON.parse(projectsValue);
        projectData = cachedProjects.find((p: any) => 
          p.idProject === Number(id) || 
          String(p.idProject) === String(id)
        ) || null;
        
        if (projectData) {
          console.log('✅ Projeto encontrado:', projectData.name);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao ler cache:', error);
    }
    
    return { turbine: turbineData, project: projectData };
  };

  /**
   * Guardar dados no cache
   */
  const saveToCache = async (turbine: Turbine, project: Project) => {
    console.log('💾 Guardando em cache...');
    
    try {
      // Cache das turbinas
      await dataCacheService.cacheTurbines(Number(id));
      console.log('✅ Turbinas em cache');
      
      // Cache do projeto
      const existingCache = await AsyncStorage.getItem(CACHE_KEYS.PROJECTS);
      let projects = existingCache ? JSON.parse(existingCache) : [];
      
      const projectIndex = projects.findIndex((p: any) => 
        p.idProject === project.idProject || 
        String(p.idProject) === String(project.idProject)
      );
      
      if (projectIndex >= 0) {
        projects[projectIndex] = project;
      } else {
        projects.push(project);
      }
      
      await AsyncStorage.setItem(CACHE_KEYS.PROJECTS, JSON.stringify(projects));
      console.log('✅ Projetos em cache');
      
    } catch (error) {
      console.error('⚠️ Erro ao guardar cache:', error);
    }
  };

  const handleBack = () => router.back();

  const handleEdit = () => {
    if (!isOnline) {
      Alert.alert('Modo Offline', 'Não é possível editar turbinas offline.');
      return;
    }
    router.push(`${basePath}/project/${id}/turbine/${turbineId}/edit` as any);
  };

  const handleDelete = async () => {
    if (!isOnline) {
      Alert.alert('Modo Offline', 'Não é possível eliminar turbinas offline.');
      return;
    }
    
    try {
      await projectsAPI.deleteTurbine(turbineId);
      setDeleteDialogVisible(false);
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível eliminar a turbina');
    }
  };

  const handleCreateReport = (reportType: ReportType) => {
    // PERMITIR criar relatórios offline para Defect Inspection
    if (reportType === ReportType.DEFECT_INSPECTION) {
      router.push({
        pathname: `${basePath}/reports/defect-inspection` as any,
        params: {
          projectoId: id,
          turbinaId: turbineId,
          projectName: project?.name || 'Projeto',
          turbineName: turbine?.name || 'Turbina',
        },
      });
    } else if (reportType === ReportType.PERFORMANCE_REPAIR_ELEVATOR) {
        router.push({
          pathname: `${basePath}/reports/performance-repair-elevator/edit` as any,
          params: {
          projectoId: id,
          turbinaId: turbineId,
          projectName: project?.name || 'Projeto',
          turbineName: turbine?.name || 'Turbina',
          },
        });
    }else {
      // Outros tipos de relatório requerem conexão
      if (!isOnline) {
        Alert.alert('Modo Offline', 'Este tipo de relatório requer conexão à internet.');
        return;
      }
      router.push({
        pathname: `${basePath}/project/${id}/turbine/${turbineId}/report/create` as any,
        params: { type: reportType.toString() },
      });
    }
  };

  const handleViewReports = () => {
    router.push({
      pathname: `${basePath}/reports/defect-inspection/list` as any,
      params: {
        turbineId: turbineId,
        turbineName: turbine?.name || 'Turbina',
        projectName: project?.name || 'Projeto',
      },
    });
  };

  const reportAvailability = turbine ? [
    { type: ReportType.DEFECT_INSPECTION, available: turbine.defectsInspectionReport, 
      name: REPORT_TYPE_NAMES[ReportType.DEFECT_INSPECTION], icon: 'alert-circle-outline', color: '#F44336' },
    { type: ReportType.EXAMINATION_TRANSFORMER, available: turbine.examinationTransformer, 
      name: REPORT_TYPE_NAMES[ReportType.EXAMINATION_TRANSFORMER], icon: 'flash', color: '#FF9800' },
    { type: ReportType.MEASUREMENTS_6KV, available: turbine.measurements6KV, 
      name: REPORT_TYPE_NAMES[ReportType.MEASUREMENTS_6KV], icon: 'chart-line', color: '#3F51B5' },
    { type: ReportType.MEASUREMENTS_690V400V, available: turbine.measurements690V400V, 
      name: REPORT_TYPE_NAMES[ReportType.MEASUREMENTS_690V400V], icon: 'sine-wave', color: '#2196F3' },
    { type: ReportType.MEASUREMENTS_MV_SWITCHGEAR, available: turbine.measurementsMwSwitchgear, 
      name: REPORT_TYPE_NAMES[ReportType.MEASUREMENTS_MV_SWITCHGEAR], icon: 'speedometer', color: '#9C27B0' },
    { type: ReportType.ONBOARD_CRANE, available: turbine.onboardCraneInspectionReport, 
      name: REPORT_TYPE_NAMES[ReportType.ONBOARD_CRANE], icon: 'crane', color: '#009688' },
    { type: ReportType.PERFORMANCE_REPAIR_ELEVATOR, available: turbine.performanceReportRepairElevator, 
      name: REPORT_TYPE_NAMES[ReportType.PERFORMANCE_REPAIR_ELEVATOR], icon: 'elevator', color: '#4CAF50' },
    { type: ReportType.STATUTORY_INSPECTION, available: turbine.statutoryInspectionReport, 
      name: REPORT_TYPE_NAMES[ReportType.STATUTORY_INSPECTION], icon: 'file-document-outline', color: '#607D8B' },
  ] : [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>A carregar turbina...</Text>
      </View>
    );
  }

  if (loadError && !turbine) {
    return (
      <View style={styles.errorContainer}>
        <IconButton icon="alert-circle" size={64} iconColor={colors.error} />
        <Text variant="titleMedium" style={styles.errorTitle}>Erro ao Carregar</Text>
        <Text variant="bodyMedium" style={styles.errorText}>{loadError}</Text>
        <Button mode="contained" onPress={() => loadData()} style={{ marginTop: 16 }}>
          Tentar Novamente
        </Button>
        <Button mode="text" onPress={() => router.back()} style={{ marginTop: 8 }}>
          Voltar
        </Button>
      </View>
    );
  }

  if (!turbine) {
    return (
      <View style={styles.errorContainer}>
        <IconButton icon="wind-turbine" size={64} iconColor={colors.textSecondary} />
        <Text variant="titleMedium" style={styles.errorTitle}>Turbina não encontrada</Text>
        <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }}>Voltar</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} iconColor={colors.white} onPress={handleBack} />
        <View style={styles.headerCenter}>
          <Text variant="titleLarge" style={styles.headerTitle}>{turbine.name}</Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {turbine.number ? `WTG ${turbine.number}` : 'Turbina'}
          </Text>
        </View>
        {isAdmin && (
          <View style={styles.headerActions}>
            <IconButton icon="pencil" size={20} iconColor={colors.white} onPress={handleEdit} />
            <IconButton icon="delete" size={20} iconColor={colors.white} 
              onPress={() => setDeleteDialogVisible(true)} />
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {!isOnline && (
          <Banner visible={true} icon="wifi-off" style={styles.offlineBanner}>
            📵 Modo Offline{loadedFromCache ? ' - Dados do cache' : ''}
          </Banner>
        )}

        <View style={styles.infoSection}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.infoLabel}>Modelo</Text>
              <Text variant="bodyLarge">{turbine.model || 'N/A'}</Text>
            </Card.Content>
          </Card>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.infoLabel}>Potência</Text>
              <Text variant="bodyLarge">{turbine.power || 'N/A'}</Text>
            </Card.Content>
          </Card>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.infoLabel}>Ano</Text>
              <Text variant="bodyLarge">{turbine.year || 'N/A'}</Text>
            </Card.Content>
          </Card>
        </View>

        <Button mode="contained" icon="file-document-multiple" onPress={handleViewReports}
          style={styles.viewReportsButton}>
          Ver Relatórios Defect Inspection
        </Button>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Criar Novo Relatório</Text>
          {reportAvailability.map((report) => (
            <Card key={report.type} 
              style={[styles.reportCard, !report.available && styles.reportCardDisabled]}>
              <TouchableOpacity 
                onPress={() => handleCreateReport(report.type)}
                disabled={!report.available || (!isOnline && report.type !== ReportType.DEFECT_INSPECTION)}>
                <Card.Content>
                  <View style={styles.reportCardContent}>
                    <View style={styles.reportCardLeft}>
                      <IconButton icon={report.icon} size={24}
                        iconColor={report.available ? report.color : colors.disabled} />
                      <View style={styles.reportInfo}>
                        <Text variant="bodyLarge"
                          style={[styles.reportName, !report.available && styles.reportNameDisabled]}>
                          {report.name}
                        </Text>
                        <Chip compact 
                          style={[styles.statusChip, report.available && styles.statusChipAvailable]}>
                          {report.available ? (
                            !isOnline && report.type === ReportType.DEFECT_INSPECTION ? 
                            'Disponível (Offline)' : 'Disponível'
                          ) : 'Não Disponível'}
                        </Chip>
                      </View>
                    </View>
                    {report.available && (
                      <IconButton icon="chevron-right" size={24} iconColor={colors.textSecondary} />
                    )}
                  </View>
                </Card.Content>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Eliminar Turbina</Dialog.Title>
          <Dialog.Content>
            <Text>Tem a certeza que deseja eliminar a turbina "{turbine.name}"?</Text>
            <Text style={{ marginTop: 8, color: colors.error }}>Esta ação não pode ser desfeita.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleDelete} textColor={colors.error}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.xl },
  errorTitle: { marginTop: spacing.md, marginBottom: spacing.sm, color: colors.text, textAlign: 'center' },
  errorText: { color: colors.textSecondary, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  headerCenter: { flex: 1, marginLeft: spacing.sm },
  headerTitle: { color: colors.white, fontWeight: 'bold' },
  headerSubtitle: { color: colors.white, opacity: 0.9 },
  headerActions: { flexDirection: 'row' },
  content: { flex: 1 },
  offlineBanner: { marginBottom: spacing.md },
  infoSection: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  infoCard: { flex: 1, elevation: 2 },
  infoLabel: { color: colors.textSecondary, marginBottom: spacing.xs / 2 },
  viewReportsButton: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  section: { padding: spacing.md },
  sectionTitle: { marginBottom: spacing.md, fontWeight: 'bold' },
  reportCard: { marginBottom: spacing.sm, elevation: 2 },
  reportCardDisabled: { opacity: 0.6 },
  reportCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reportCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  reportInfo: { flex: 1, marginLeft: spacing.sm },
  reportName: { color: colors.text, marginBottom: spacing.xs / 2 },
  reportNameDisabled: { color: colors.textSecondary },
  statusChip: { alignSelf: 'flex-start', backgroundColor: colors.lightGray },
  statusChipAvailable: { backgroundColor: colors.success + '20' },
});