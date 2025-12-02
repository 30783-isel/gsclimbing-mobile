import React, { useEffect, useState } from 'react';
import { projectsAPI } from '@/services/api/projects.api';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, IconButton, FAB, Chip, Portal, Dialog, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProjects } from '@/hooks/useProjects';
import { useTurbines } from '@/hooks/useTurbines';
import { TurbineFormSheet } from '@/components/TurbineFormSheet';
import { colors, spacing } from '@/constants/theme';
import type { Turbine } from '@/types/turbine.types';

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const {
    selectedProject,
    turbines,
    isLoading,
    loadProjectById,
    deleteProject,
  } = useProjects();

  const {
    loadTurbines,
  } = useTurbines();

  const [activeTab, setActiveTab] = useState<'turbines' | 'reports' | 'historic'>('turbines');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [turbineSheetVisible, setTurbineSheetVisible] = useState(false);
  const [turbineSheetMode, setTurbineSheetMode] = useState<'create' | 'edit'>('create');
  const [selectedTurbine, setSelectedTurbine] = useState<Turbine | null>(null);

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
    router.push(`/(tabs)/admin/project/${id}/edit`);
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
    router.push(`/(tabs)/admin/project/${id}/turbine/${turbine.id}`);
  };

  const handleEditTurbine = (turbine: Turbine, event: any) => {
    event?.stopPropagation();
    setTurbineSheetMode('edit');
    setSelectedTurbine(turbine);
    setTurbineSheetVisible(true);
  };

  const handleTurbineFormSubmit = async (data: any) => {
    if (turbineSheetMode === 'create') {
      // Criar nova turbina
      if (selectedProject) {
        await projectsAPI.addTurbine(selectedProject.name);
      }
    } else {
      // Atualizar turbina existente
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key].toString());
      });
      await projectsAPI.updateTurbine(formData);
    }
    await loadTurbines(id);
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
        <View style={styles.headerActions}>
          <IconButton
            icon="pencil"
            size={24}
            iconColor={colors.white}
            onPress={handleEdit}
          />
          <IconButton
            icon="delete"
            size={24}
            iconColor={colors.white}
            onPress={() => setDeleteDialogVisible(true)}
          />
        </View>
      </View>

      {/* Info Cards */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Project Details */}
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

        {/* Tabs */}
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

        {/* Tab Content - Turbines */}
        {activeTab === 'turbines' && (
          <View style={styles.tabContent}>
            {turbines.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  Nenhuma turbina registada
                </Text>
                <Text variant="bodySmall" style={styles.emptySubtext}>
                  Adicione a primeira turbina
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
                    <Card.Content>
                      <View style={styles.turbineHeader}>
                        <View style={styles.turbineInfo}>
                          <Text variant="titleMedium" style={styles.turbineName}>
                            {turbine.name}
                          </Text>
                          {turbine.number && (
                            <Text variant="bodySmall" style={styles.turbineNumber}>
                              WTG-{turbine.number}
                            </Text>
                          )}
                        </View>
                        <View style={styles.turbineActions}>
                          <IconButton
                            icon="pencil"
                            size={20}
                            iconColor={colors.primary}
                            onPress={(e) => handleEditTurbine(turbine, e)}
                          />
                          <IconButton
                            icon="chevron-right"
                            size={24}
                            iconColor={colors.primary}
                          />
                        </View>
                      </View>

                      <View style={styles.turbineChips}>
                        {turbine.type && (
                          <Chip icon="cog" style={styles.chip}>
                            {turbine.type}
                          </Chip>
                        )}
                        {turbine.year && (
                          <Chip icon="calendar" style={styles.chip}>
                            {turbine.year}
                          </Chip>
                        )}
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Tab Content - Reports */}
        {activeTab === 'reports' && (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                📊 Relatórios em breve
              </Text>
            </View>
          </View>
        )}

        {/* Tab Content - Historic */}
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

      {/* FAB - Add Turbine */}
      {activeTab === 'turbines' && (
        <FAB
          icon="plus"
          label="Adicionar Turbina"
          style={styles.fab}
          onPress={handleAddTurbine}
          color="#fff"
        />
      )}

      {/* Turbine Form Sheet */}
      <TurbineFormSheet
        visible={turbineSheetVisible}
        onDismiss={() => setTurbineSheetVisible(false)}
        onSubmit={handleTurbineFormSubmit}
        turbine={selectedTurbine}
        mode={turbineSheetMode}
        projectId={id}
      />

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Eliminar Projeto</Dialog.Title>
          <Dialog.Content>
            <Text>
              Tem a certeza que deseja eliminar o projeto "{selectedProject.name}"?
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
    elevation: 2,
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
    marginTop: spacing.xs,
  },
  detailsCard: {
    margin: spacing.md,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  tabContent: {
    padding: spacing.md,
  },
  turbineCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  turbineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turbineInfo: {
    flex: 1,
  },
  turbineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turbineName: {
    fontWeight: 'bold',
    color: colors.text,
  },
  turbineNumber: {
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  turbineChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    color: colors.textLight,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});