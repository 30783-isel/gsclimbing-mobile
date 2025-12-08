// src/screens/partilhado/project/TurbineDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, IconButton, Chip, Portal, Dialog, Button, Banner } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { projectsAPI } from '@/services/api/projects.api';
import { colors, spacing } from '@/constants/theme';
import { ReportType, REPORT_TYPE_NAMES } from '@/types';
import type { Turbine } from '@/types/turbine.types';
import type { Project } from '@/types/project.types';
import { useAuthStore } from '@/store/authStore';
import NetInfo from '@react-native-community/netinfo';

export default function TurbineDetailsScreen() {
  const { id, turbineId } = useLocalSearchParams<{ id: string; turbineId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { role } = useAuthStore();
  
  // Validar parâmetros
  useEffect(() => {
    console.log('📋 TurbineDetailsScreen montado com parâmetros:', { id, turbineId, role });
    
    if (!id || !turbineId) {
      console.error('❌ Parâmetros inválidos!', { id, turbineId });
      Alert.alert('Erro', 'Parâmetros inválidos', [
        { text: 'Voltar', onPress: () => router.back() }
      ]);
    }
  }, [id, turbineId]);
  
  const [turbine, setTurbine] = useState<Turbine | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const isAdmin = role === 'ADMIN';
  const basePath = isAdmin ? '/(tabs)/admin' : '/(tabs)/tech';

  // Monitorar conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      const nowOnline = state.isConnected ?? false;
      setIsOnline(nowOnline);
      
      console.log(`📡 Estado de conexão: ${nowOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      // Se ficou online, tentar recarregar
      if (!wasOnline && nowOnline && loadError) {
        console.log('🔄 Ficou online - tentando recarregar...');
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

  const loadData = async () => {
    if (!id || !turbineId) {
      console.error('❌ Faltam parâmetros para carregar dados');
      return;
    }

    try {
      console.log('🔄 TurbineDetailsScreen - Iniciando carregamento...', { 
        turbineId, 
        projectId: id,
        isOnline 
      });
      
      setIsLoading(true);
      setLoadError(null);
      
      // Tentar carregar turbina
      console.log(`🔍 Buscando turbina ID: ${turbineId}`);
      const turbineData = await projectsAPI.getTurbineById(turbineId);
      console.log('✅ Turbina carregada:', turbineData?.name || 'sem nome');
      setTurbine(turbineData);
      
      // Tentar carregar projeto
      console.log(`🔍 Buscando projeto ID: ${id}`);
      const projectData = await projectsAPI.getById(Number(id));
      console.log('✅ Projeto carregado:', projectData?.name || 'sem nome');
      setProject(projectData);
      
      console.log('✅ Todos os dados carregados com sucesso!');
      
    } catch (error: any) {
      console.error('❌ ERRO ao carregar dados:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      setLoadError(errorMessage);
      
      // Se estiver offline, mostrar mensagem específica
      if (!isOnline || error.message?.includes('Network') || error.message?.includes('timeout')) {
        console.log('📵 Erro de rede detectado - modo offline');
        Alert.alert(
          'Sem Conexão',
          'Não foi possível carregar os dados da turbina. Verifique sua conexão com a internet.',
          [
            { text: 'Tentar Novamente', onPress: () => loadData() },
            { text: 'Voltar', onPress: () => router.back(), style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(
          'Erro ao Carregar',
          `Não foi possível carregar os dados: ${errorMessage}`,
          [
            { text: 'Tentar Novamente', onPress: () => loadData() },
            { text: 'Voltar', onPress: () => router.back(), style: 'cancel' }
          ]
        );
      }
    } finally {
      setIsLoading(false);
      console.log('🏁 LoadData finalizado');
    }
  };

  const handleBack = () => {
    console.log('⬅️ Voltando...');
    router.back();
  };

  const handleEdit = () => {
    if (!isOnline) {
      Alert.alert(
        'Modo Offline',
        'Não é possível editar turbinas em modo offline.',
        [{ text: 'OK' }]
      );
      return;
    }
    router.push(`${basePath}/project/${id}/turbine/${turbineId}/edit` as any);
  };

  const handleDelete = async () => {
    if (!isOnline) {
      Alert.alert(
        'Modo Offline',
        'Não é possível eliminar turbinas em modo offline.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      await projectsAPI.deleteTurbine(turbineId);
      setDeleteDialogVisible(false);
      router.back();
    } catch (error) {
      console.error('Error deleting turbine:', error);
      Alert.alert('Erro', 'Não foi possível eliminar a turbina');
    }
  };

  const handleCreateReport = (reportType: ReportType) => {
    // Verificar se está online para criar relatórios
    if (!isOnline) {
      Alert.alert(
        'Modo Offline',
        'Não é possível criar novos relatórios em modo offline. Por favor, conecte-se à Internet.',
        [{ text: 'OK' }]
      );
      return;
    }

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
    } else {
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

  // Estado de Loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>
          A carregar turbina...
        </Text>
      </View>
    );
  }

  // Estado de Erro
  if (loadError && !turbine) {
    return (
      <View style={styles.errorContainer}>
        <IconButton icon="alert-circle" size={64} iconColor={colors.error} />
        <Text variant="titleMedium" style={styles.errorTitle}>
          Erro ao Carregar
        </Text>
        <Text variant="bodyMedium" style={styles.errorText}>
          {loadError}
        </Text>
        <Button mode="contained" onPress={() => loadData()} style={{ marginTop: 16 }}>
          Tentar Novamente
        </Button>
        <Button mode="text" onPress={() => router.back()} style={{ marginTop: 8 }}>
          Voltar
        </Button>
      </View>
    );
  }

  // Sem dados da turbina
  if (!turbine) {
    return (
      <View style={styles.errorContainer}>
        <IconButton icon="wind-turbine" size={64} iconColor={colors.textSecondary} />
        <Text variant="titleMedium" style={styles.errorTitle}>
          Turbina não encontrada
        </Text>
        <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }}>
          Voltar
        </Button>
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
            {turbine.number ? `WTG ${turbine.number}` : 'Turbina'}
          </Text>
        </View>
        {isAdmin && (
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
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Banner de Modo Offline */}
        {!isOnline && (
          <Banner
            visible={true}
            icon="wifi-off"
            style={styles.offlineBanner}
          >
            📵 Modo Offline - Funcionalidades limitadas
          </Banner>
        )}

        {/* Info Cards */}
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

        {/* Botão Ver Relatórios Existentes */}
        <Button
          mode="contained"
          icon="file-document-multiple"
          onPress={handleViewReports}
          style={styles.viewReportsButton}
        >
          Ver Relatórios Defect Inspection
        </Button>

        {/* Relatórios Disponíveis */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Criar Novo Relatório
          </Text>

          {reportAvailability.map((report) => (
            <Card
              key={report.type}
              style={[
                styles.reportCard,
                !report.available && styles.reportCardDisabled,
              ]}
            >
              <TouchableOpacity
                onPress={() => handleCreateReport(report.type)}
                disabled={!report.available || !isOnline}
              >
                <Card.Content>
                  <View style={styles.reportCardContent}>
                    <View style={styles.reportCardLeft}>
                      <IconButton
                        icon={report.icon}
                        size={24}
                        iconColor={report.available ? report.color : colors.disabled}
                      />
                      <View style={styles.reportInfo}>
                        <Text
                          variant="bodyLarge"
                          style={[
                            styles.reportName,
                            !report.available && styles.reportNameDisabled,
                          ]}
                        >
                          {report.name}
                        </Text>
                        <Chip
                          compact
                          style={[
                            styles.statusChip,
                            report.available && styles.statusChipAvailable,
                          ]}
                        >
                          {report.available ? 'Disponível' : 'Não Disponível'}
                        </Chip>
                      </View>
                    </View>
                    {report.available && isOnline && (
                      <IconButton
                        icon="chevron-right"
                        size={24}
                        iconColor={colors.textSecondary}
                      />
                    )}
                  </View>
                </Card.Content>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Dialog de Confirmação Delete */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Eliminar Turbina</Dialog.Title>
          <Dialog.Content>
            <Text>
              Tem a certeza que deseja eliminar a turbina "{turbine.name}"?
            </Text>
            <Text style={{ marginTop: 8, color: colors.error }}>
              Esta ação não pode ser desfeita.
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
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text,
    textAlign: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
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
  offlineBanner: {
    marginBottom: spacing.md,
  },
  infoSection: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoCard: {
    flex: 1,
    elevation: 2,
  },
  infoLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  viewReportsButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  reportCard: {
    marginBottom: spacing.sm,
    elevation: 2,
  },
  reportCardDisabled: {
    opacity: 0.6,
  },
  reportCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  reportName: {
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  reportNameDisabled: {
    color: colors.textSecondary,
  },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lightGray,
  },
  statusChipAvailable: {
    backgroundColor: colors.success + '20',
  },
});