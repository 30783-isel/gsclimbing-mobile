import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, IconButton, Banner } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useOfflineProjects } from '@/hooks/useOfflineProjects.hook';
import { ProjectFormSheet } from '@/components/ProjectFormSheet';
import { FiltersSheet } from '@/components/FiltersSheet';
import { SyncStatus } from '@/components/SyncStatus';
import { OfflineSyncIndicator } from '@/components/OfflineSyncIndicator.component';
import { colors, spacing } from '@/constants/theme';
import type { Project, ProjectFilters } from '@/types/project.types';

interface ProjectsScreenProps {
  userRole: 'ADMIN' | 'TECH';
}

export default function ProjectsScreen({ userRole }: ProjectsScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, handleLogout } = useAuth();
  
  // ========== HOOKS OFFLINE ==========
  // Hook offline - tem prioridade sobre dados online
  const { 
    projects: offlineProjects, 
    isOnline, 
    loading: offlineLoading, 
    refresh: offlineRefresh 
  } = useOfflineProjects();
  
  // Hook online - usado como fallback
  const {
    projects: onlineProjects,
    isLoading,
    refreshing,
    loadProjects,
    refreshProjects,
    setSelectedProject,
    createProject,
    editProject,
    filterProjects,
  } = useProjects();
  
  // ========== LÓGICA DE DADOS ==========
  // Usar dados offline se disponíveis, caso contrário usar online
  const projects = offlineProjects.length > 0 ? offlineProjects : onlineProjects;
  const loading = offlineLoading || isLoading;

  // ========== ESTADOS ==========
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
  const [selectedForEdit, setSelectedForEdit] = useState<Project | null>(null);
  const [filtersSheetVisible, setFiltersSheetVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ProjectFilters>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Verifica se é ADMIN
  const isAdmin = userRole === 'ADMIN';

  // ========== EFFECTS ==========
  // Carregar projetos ao montar
  useEffect(() => {
    if (isOnline) {
      loadProjects(); // Tenta carregar online
    }
  }, [isOnline]);

  // Filtrar projetos localmente
  useEffect(() => {
    let filtered = projects;

    // Aplicar pesquisa de texto
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  // Verificar filtros ativos
  useEffect(() => {
    const hasFilters = Object.values(activeFilters).some(
      (value) => value && value.trim() !== ''
    );
    setHasActiveFilters(hasFilters);
  }, [activeFilters]);

  // ========== HANDLERS ==========
  const handleProjectPress = (project: Project) => {
    setSelectedProject(project);
    const basePath = isAdmin ? '/(tabs)/admin/project' : '/(tabs)/tech/project';
    router.push(`${basePath}/${project.idProject}`);
  };

  const handleAddProject = () => {
    setSheetMode('create');
    setSelectedForEdit(null);
    setSheetVisible(true);
  };

  const handleEditProject = (project: Project, e: any) => {
    e.stopPropagation();
    setSheetMode('edit');
    setSelectedForEdit(project);
    setSheetVisible(true);
  };

  const handleSaveProject = async (data: any) => {
    if (sheetMode === 'create') {
      await createProject(data);
    } else if (selectedForEdit) {
      await editProject(selectedForEdit.idProject, data);
    }
    setSheetVisible(false);
    
    // Refresh com prioridade para offline
    if (isOnline) {
      await offlineRefresh();
    }
  };

  const handleApplyFilters = async (filters: ProjectFilters) => {
    setActiveFilters(filters);
    setFiltersSheetVisible(false);
    
    if (isOnline) {
      await filterProjects(filters);
    } else {
      // Filtrar localmente quando offline
      let filtered = projects;
      if (filters.name) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(filters.name!.toLowerCase())
        );
      }
      if (filters.country) {
        filtered = filtered.filter(p => 
          p.country.toLowerCase().includes(filters.country!.toLowerCase())
        );
      }
      if (filters.location) {
        filtered = filtered.filter(p => 
          p.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      setFilteredProjects(filtered);
    }
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setFilteredProjects(projects);
  };

  const handleRefresh = async () => {
    if (isOnline) {
      await offlineRefresh(); // Prioridade offline
      await refreshProjects(); // Depois online
    }
  };

  // ========== RENDER FUNCTIONS ==========
  const renderProjectCard = ({ item }: { item: Project }) => (
    <TouchableOpacity onPress={() => handleProjectPress(item)}>
      <Card style={styles.projectCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text variant="titleMedium" style={styles.projectName}>
                {item.name}
              </Text>
              <View style={styles.locationContainer}>
                <Text variant="bodyMedium" style={styles.locationText}>
                  📍 {item.location}, {item.country}
                </Text>
              </View>
            </View>
            
            {isAdmin && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={(e) => handleEditProject(item, e)}
              />
            )}
          </View>

          <View style={styles.chipsContainer}>
            <Chip style={styles.chip} textStyle={styles.chipText}>
              {item.site}
            </Chip>
            <Chip style={styles.chip} textStyle={styles.chipText}>
              {item.numberTurbines} turbinas
            </Chip>
          </View>

          <View style={styles.metadataContainer}>
            <Text variant="bodySmall" style={styles.metadata}>
              {item.type}
            </Text>
            <Text variant="bodySmall" style={styles.metadata}>
              • {item.rated}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleLarge" style={styles.emptyTitle}>
        {searchQuery ? '🔍 Nenhum projeto encontrado' : '📋 Sem projetos'}
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {searchQuery
          ? 'Tenta pesquisar com outros termos'
          : isAdmin
          ? 'Adiciona o teu primeiro projeto'
          : 'Ainda não tens projetos atribuídos'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* ========== INDICADOR OFFLINE ========== */}
      <OfflineSyncIndicator onSyncPress={offlineRefresh} compact />
      
      {/* ========== BANNER OFFLINE ========== */}
      {!isOnline && (
        <Banner
          visible={!isOnline}
          icon="wifi-off"
          style={styles.offlineBanner}
        >
          📵 Modo Offline - A mostrar dados guardados localmente
        </Banner>
      )}

      {/* Sync Status */}
      <SyncStatus />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('GSCLIMBING.SEARCH')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <IconButton
          icon={hasActiveFilters ? 'filter' : 'filter-outline'}
          size={24}
          iconColor={hasActiveFilters ? colors.primary : colors.textSecondary}
          style={[
            styles.filterButton,
            hasActiveFilters && styles.filterButtonActive,
          ]}
          onPress={() => setFiltersSheetVisible(true)}
        />
      </View>

      {/* Active Filters */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          {Object.entries(activeFilters).map(([key, value]) =>
            value ? (
              <Chip
                key={key}
                onClose={handleClearFilters}
                style={styles.filterChip}
                textStyle={styles.filterChipText}
              >
                {value}
              </Chip>
            ) : null
          )}
          <Chip
            icon="close-circle"
            onPress={handleClearFilters}
            style={styles.clearFiltersChip}
            textStyle={styles.clearFiltersText}
          >
            Limpar
          </Chip>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text variant="headlineSmall" style={styles.statNumber}>
            {projects.length}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            {t('GSCLIMBING.PROJECTS')}
          </Text>
        </View>
        
        <View style={styles.statBox}>
          <Text variant="headlineSmall" style={styles.statNumber}>
            {projects.reduce((acc, p) => acc + parseInt(p.numberTurbines || '0'), 0)}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            {t('GSCLIMBING.TURBINES')}
          </Text>
        </View>
      </View>
    </View>
  );

  // ========== RENDER PRINCIPAL ==========
  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProjects}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.idProject}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Só para ADMIN e ONLINE */}
      {isAdmin && isOnline && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddProject}
          label={t('GSCLIMBING.ADD')}
        />
      )}

      {/* Project Form Sheet */}
      <ProjectFormSheet
        visible={sheetVisible}
        mode={sheetMode}
        project={selectedForEdit}
        onDismiss={() => setSheetVisible(false)}
        onSave={handleSaveProject}
        onSubmit={handleSaveProject}
      />

      {/* Filters Sheet */}
      <FiltersSheet
        visible={filtersSheetVisible}    
        onDismiss={() => setFiltersSheetVisible(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  headerContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  offlineBanner: {
    backgroundColor: '#FFA726',
    marginBottom: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    elevation: 2,
  },
  filterButton: {
    margin: 0,
  },
  filterButtonActive: {
    backgroundColor: colors.primary + '20',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.primary + '20',
  },
  filterChipText: {
    color: colors.primary,
    fontSize: 12,
  },
  clearFiltersChip: {
    backgroundColor: colors.error + '20',
  },
  clearFiltersText: {
    color: colors.error,
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    color: colors.white,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.white,
    marginTop: spacing.xs,
  },
  projectCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  projectName: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: colors.textSecondary,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: 12,
  },
  metadataContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metadata: {
    color: colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyTitle: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textLight,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});