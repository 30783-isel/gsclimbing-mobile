import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { ProjectFormSheet } from '@/components/ProjectFormSheet';
import { FiltersSheet } from '@/components/FiltersSheet';
import { colors, spacing } from '@/constants/theme';
import type { Project, ProjectFilters } from '@/types/project.types';

export default function AdminProjectsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, handleLogout } = useAuth();
  const {
    projects,
    isLoading,
    refreshing,
    loadProjects,
    refreshProjects,
    setSelectedProject,
    createProject,
    editProject,
    filterProjects,
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
  const [selectedForEdit, setSelectedForEdit] = useState<Project | null>(null);
  const [filtersSheetVisible, setFiltersSheetVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ProjectFilters>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Carregar projetos ao montar componente
  useEffect(() => {
    loadProjects();
  }, []);

  // Filtrar projetos localmente quando muda a query ou filtros
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

  // Verificar se há filtros ativos
  useEffect(() => {
    const hasFilters = Object.values(activeFilters).some(
      (value) => value && value.trim() !== ''
    );
    setHasActiveFilters(hasFilters);
  }, [activeFilters]);

  const handleProjectPress = (project: Project) => {
    setSelectedProject(project);
    router.push(`/(tabs)/admin/project/${project.idProject}`);
  };

  const handleCreateProject = () => {
    setSheetMode('create');
    setSelectedForEdit(null);
    setSheetVisible(true);
  };

  const handleEditProject = (project: Project, event: any) => {
    event?.stopPropagation();
    setSheetMode('edit');
    setSelectedForEdit(project);
    setSheetVisible(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (sheetMode === 'create') {
      await createProject(data);
    } else if (selectedForEdit) {
      await editProject(selectedForEdit.idProject, data);
    }
    await loadProjects();
  };

  const handleApplyFilters = async (filters: ProjectFilters) => {
    setActiveFilters(filters);
    await filterProjects(filters);
  };

  const handleClearFilters = async () => {
    setActiveFilters({});
    await loadProjects();
  };

  const renderProjectCard = ({ item }: { item: Project }) => (
    <TouchableOpacity
      onPress={() => handleProjectPress(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.projectCard}>
        <Card.Content>
          {/* Header do Card */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text variant="titleLarge" style={styles.projectName}>
                {item.name}
              </Text>
              <View style={styles.locationContainer}>
                <Text variant="bodyMedium" style={styles.locationText}>
                  📍 {item.location}, {item.country}
                </Text>
              </View>
            </View>
            <IconButton
              icon="chevron-right"
              size={24}
              iconColor={colors.primary}
            />
            <IconButton
              icon="pencil"
              size={20}
              iconColor={colors.primary}
              onPress={(e) => handleEditProject(item, e)}
            />
          </View>

          {/* Info Chips */}
          <View style={styles.chipsContainer}>
            <Chip
              icon="wind-turbine"
              style={styles.chip}
              textStyle={styles.chipText}
            >
              {item.numberTurbines} {t('GSCLIMBING.TURBINES')}
            </Chip>
            
            {item.site && (
              <Chip
                icon="map-marker"
                style={styles.chip}
                textStyle={styles.chipText}
              >
                {item.site}
              </Chip>
            )}
          </View>

          {/* Metadados */}
          <View style={styles.metadataContainer}>
            {item.type && (
              <Text variant="bodySmall" style={styles.metadata}>
                Tipo: {item.type}
              </Text>
            )}
            {item.number && (
              <Text variant="bodySmall" style={styles.metadata}>
                Nº: {item.number}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        📂 Nenhum projeto encontrado
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {searchQuery
          ? 'Tente uma pesquisa diferente'
          : 'Adicione o primeiro projeto'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text variant="headlineMedium" style={styles.title}>
            {t('GSCLIMBING.PROJECTS')}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Olá, {user?.username}! 👋
          </Text>
        </View>
        <IconButton
          icon="logout"
          size={24}
          iconColor={colors.primary}
          onPress={handleLogout}
        />
      </View>

      {/* Searchbar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('GSCLIMBING.SEARCH')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={colors.primary}
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

      {/* Active Filters Chips */}
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
            refreshing={refreshing}
            onRefresh={refreshProjects}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Adicionar Projeto */}
      <FAB
        icon="plus"
        label={t('GSCLIMBING.ADD')}
        style={styles.fab}
        onPress={handleCreateProject}
        color="#fff"
      />

      {/* Bottom Sheet Form */}
      <ProjectFormSheet
        visible={sheetVisible}
        onDismiss={() => setSheetVisible(false)}
        onSubmit={handleFormSubmit}
        project={selectedForEdit}
        mode={sheetMode}
      />

      {/* Filters Sheet */}
      <FiltersSheet
        visible={filtersSheetVisible}
        onDismiss={() => setFiltersSheetVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
        resultCount={filteredProjects.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchbar: {
    flex: 1,
    elevation: 0,
    backgroundColor: colors.background,
  },
  filterButton: {
    margin: 0,
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    backgroundColor: colors.primary + '20',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
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
    backgroundColor: colors.primary,
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