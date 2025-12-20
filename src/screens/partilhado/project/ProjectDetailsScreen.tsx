import React, { useEffect, useState } from 'react';
import { projectsAPI } from '@/services/api/projects.api';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, FAB, Portal, Dialog, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProjects } from '@/hooks/useProjects';
import { useTurbines } from '@/hooks/useTurbines';
import { TurbineFormSheet } from '@/components/TurbineFormSheet';
import { colors, spacing } from '@/constants/theme';
import type { Turbine } from '@/types/turbine.types';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/authStore';

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { role } = useAuthStore();
  
  const {
    selectedProject,
    turbines,
    isLoading,
    loadProjectById,
    deleteProject,
  } = useProjects();

  const {
    loadTurbines,
    deleteTurbine,
  } = useTurbines();

  const [activeTab, setActiveTab] = useState<'turbines' | 'reports' | 'historic'>('turbines');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteTurbineDialogVisible, setDeleteTurbineDialogVisible] = useState(false);
  const [turbineToDelete, setTurbineToDelete] = useState<Turbine | null>(null);
  const [turbineSheetVisible, setTurbineSheetVisible] = useState(false);
  const [turbineSheetMode, setTurbineSheetMode] = useState<'create' | 'edit'>('create');
  const [selectedTurbine, setSelectedTurbine] = useState<Turbine | null>(null);

  // Verifica se é ADMIN
  const isAdmin = role === 'ADMIN';
  
  // Define basePath conforme o role
  const basePath = isAdmin ? '/(tabs)/admin' : '/(tabs)/tech';

  useEffect(() => {
    if (id) {
      loadProjectById(parseInt(id));
      loadTurbines(id);
    }
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`${basePath}/project/${id}/edit` as any);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      try {
        await deleteProject(selectedProject.name, selectedProject.idProject);
        setDeleteDialogVisible(false);
        router.back();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleAddTurbine = () => {
    setTurbineSheetMode('create');
    setSelectedTurbine(null);
    setTurbineSheetVisible(true);
  };

  const handleTurbinePress = (turbine: Turbine) => {
    router.push(`${basePath}/project/${id}/turbine/${turbine.id}` as any);
  };

  const handleEditTurbine = (turbine: Turbine, event: any) => {
    event?.stopPropagation();
    setTurbineSheetMode('edit');
    setSelectedTurbine(turbine);
    setTurbineSheetVisible(true);
  };

  const handleDeleteTurbinePress = (turbine: Turbine, event: any) => {
    event?.stopPropagation();
    setTurbineToDelete(turbine);
    setDeleteTurbineDialogVisible(true);
  };

  const handleDeleteTurbineConfirm = async () => {
    if (!turbineToDelete) return;
    try {
      await deleteTurbine(turbineToDelete.id);
      await loadTurbines(id);
      setDeleteTurbineDialogVisible(false);
      setTurbineToDelete(null);
    } catch (error) {
      console.error('Erro ao eliminar turbina:', error);
    }
  };

  const handleTurbineFormSubmit = async (data: any) => {
    try {
      if (turbineSheetMode === 'create') {
        Toast.show({
          type: 'success',
          text1: 'Sucesso',
          text2: 'Turbina criada com sucesso',
        });
      } else {
        if (!selectedTurbine) {
          throw new Error('Nenhuma turbina selecionada para edição');
        }
        
        const formData = new FormData();
        formData.append('turbineId', selectedTurbine.id);
        formData.append('turbineName', data.name ?? selectedTurbine.name ?? '');
        formData.append(
          'defectsInspectionReport',
          (data.defectsInspectionReport ?? selectedTurbine.defectsInspectionReport ?? false) ? 'true' : 'false'
        );
        formData.append(
          'examinationTransformer',
          (data.examinationTransformer ?? selectedTurbine.examinationTransformer ?? false) ? 'true' : 'false'
        );
        formData.append(
          'measurements690V400V',
          (data.measurements690V400V ?? selectedTurbine.measurements690V400V ?? false) ? 'true' : 'false'
        );
        formData.append(
          'performanceReportRepairElevator',
          (data.performanceReportRepairElevator ?? selectedTurbine.performanceReportRepairElevator ?? false) ? 'true' : 'false'
        );
        formData.append(
          'statutoryInspectionReport',
          (data.statutoryInspectionReport ?? selectedTurbine.statutoryInspectionReport ?? false) ? 'true' : 'false'
        );
        formData.append(
          'onboardCraneInspectionReport',
          (data.onboardCraneInspectionReport ?? selectedTurbine.onboardCraneInspectionReport ?? false) ? 'true' : 'false'
        );
        formData.append(
          'measurements6KV',
          (data.measurements6KV ?? selectedTurbine.measurements6KV ?? false) ? 'true' : 'false'
        );
        formData.append(
          'measurementsMwSwitchgear',
          (data.measurementsMwSwitchgear ?? selectedTurbine.measurementsMwSwitchgear ?? false) ? 'true' : 'false'
        );

        await projectsAPI.updateTurbine(formData);
        Toast.show({
          type: 'success',
          text1: 'Sucesso',
          text2: 'Turbina atualizada com sucesso',
        });
      }
      
      await loadTurbines(id);
      setTurbineSheetVisible(false);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.message || 'Ocorreu um erro',
      });
    }
  };

  if (isLoading || !selectedProject) {
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
            {selectedProject.name}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {selectedProject.location}, {selectedProject.country}
          </Text>
        </View>
        {/* Botões de ação só para ADMIN */}
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
        {/* Info Cards */}
        <View style={styles.infoCards}>
          <Card style={styles.infoCard}>
            <Card.Content style={styles.infoCardContent}>
              <Text variant="headlineSmall" style={styles.infoNumber}>
                {selectedProject.numberTurbines}
              </Text>
              <Text variant="bodySmall" style={styles.infoLabel}>
                {t('GSCLIMBING.TURBINES')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.infoCard}>
            <Card.Content style={styles.infoCardContent}>
              <Text variant="headlineSmall" style={styles.infoNumber}>
                {turbines.length}
              </Text>
              <Text variant="bodySmall" style={styles.infoLabel}>
                Registadas
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Informações do Projeto
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>País:</Text>
              <Text style={styles.detailValue}>{selectedProject.country}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Localização:</Text>
              <Text style={styles.detailValue}>{selectedProject.location}</Text>
            </View>

            {selectedProject.site && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Site:</Text>
                <Text style={styles.detailValue}>{selectedProject.site}</Text>
              </View>
            )}

            {selectedProject.type && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo:</Text>
                <Text style={styles.detailValue}>{selectedProject.type}</Text>
              </View>
            )}

            {selectedProject.number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Número:</Text>
                <Text style={styles.detailValue}>{selectedProject.number}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'turbines' && styles.tabActive]}
            onPress={() => setActiveTab('turbines')}
          >
            <Text
              style={[styles.tabText, activeTab === 'turbines' && styles.tabTextActive]}
            >
              {t('GSCLIMBING.TURBINES')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
            onPress={() => setActiveTab('reports')}
          >
            <Text
              style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}
            >
              {t('GSCLIMBING.REPORTS')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'historic' && styles.tabActive]}
            onPress={() => setActiveTab('historic')}
          >
            <Text
              style={[styles.tabText, activeTab === 'historic' && styles.tabTextActive]}
            >
              {t('GSCLIMBING.HISTORIC')}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'turbines' && (
          <View style={styles.tabContent}>
            {turbines.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  Nenhuma turbina registada
                </Text>
              </View>
            ) : (
              turbines.map((turbine) => (
                <TouchableOpacity
                  key={turbine.id}
                  onPress={() => handleTurbinePress(turbine)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.turbineCard}>
                    <Card.Content style={styles.turbineCardContent}>
                      <View style={styles.turbineInfo}>
                        <Text variant="titleMedium">{turbine.name}</Text>
                        <Text variant="bodySmall" style={styles.turbineStatus}>
                          Ativa
                        </Text>
                      </View>
                      <View style={styles.turbineActions}>
                        <IconButton
                          icon="chevron-right"
                          size={24}
                        />
                        {/* Botões de edição e delete só para ADMIN */}
                        {isAdmin && (
                          <>
                            <IconButton
                              icon="pencil"
                              size={20}
                              onPress={(e) => handleEditTurbine(turbine, e)}
                            />
                            <IconButton
                              icon="delete"
                              size={20}
                              iconColor={colors.error}
                              onPress={(e) => handleDeleteTurbinePress(turbine, e)}
                            />
                          </>
                        )}
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'reports' && (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                📊 Relatórios em breve
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'historic' && (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                📜 Histórico em breve
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FAB só para ADMIN */}
      {activeTab === 'turbines' && isAdmin && (
        <FAB
          icon="plus"
          label="Adicionar Turbina"
          style={styles.fab}
          onPress={handleAddTurbine}
          color="#fff"
        />
      )}

      {/* Sheets só para ADMIN */}
      {isAdmin && (
        <TurbineFormSheet
          visible={turbineSheetVisible}
          onDismiss={() => setTurbineSheetVisible(false)}
          onSubmit={handleTurbineFormSubmit}
          turbine={selectedTurbine}
          mode={turbineSheetMode}
          projectId={id}
        />
      )}

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Eliminar Projeto</Dialog.Title>
          <Dialog.Content>
            <Text>
              Tem a certeza que deseja eliminar o projeto "{selectedProject?.name}"?
            </Text>
            <Text style={{ marginTop: 8, color: colors.error }}>
              Esta ação não pode ser desfeita.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleDeleteConfirm} textColor={colors.error}>
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={deleteTurbineDialogVisible} onDismiss={() => setDeleteTurbineDialogVisible(false)}>
          <Dialog.Title>Eliminar Turbina</Dialog.Title>
          <Dialog.Content>
            <Text>
              Tem a certeza que deseja eliminar a turbina "{turbineToDelete?.name}"?
            </Text>
            <Text style={{ marginTop: 8, color: colors.error }}>
              Esta ação não pode ser desfeita.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTurbineDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleDeleteTurbineConfirm} textColor={colors.error}>
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
  infoCards: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  infoCard: {
    flex: 1,
  },
  infoCardContent: {
    alignItems: 'center',
  },
  infoNumber: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  infoLabel: {
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  detailsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textSecondary,
  },
  detailValue: {
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  tabContent: {
    padding: spacing.md,
  },
  turbineCard: {
    marginBottom: spacing.sm,
  },
  turbineCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turbineInfo: {
    flex: 1,
  },
  turbineStatus: {
    color: colors.success,
    marginTop: spacing.xs / 2,
  },
  turbineActions: {
    flexDirection: 'row',
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
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