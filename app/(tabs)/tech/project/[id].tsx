// app/(tabs)/tech/project/[id].tsx - DETALHES DO PROJETO E LISTA DE TURBINAS

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, IconButton, Surface, Searchbar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { projectsAPI } from '@/services/api/projects.api';
import { turbineAPI } from '@/services/api/turbine.api';
import type { Project } from '@/types/project.types';
import type { Turbine } from '@/types/turbine.types';

export default function TechProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [turbines, setTurbines] = useState<Turbine[]>([]);
  const [filteredTurbines, setFilteredTurbines] = useState<Turbine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  useEffect(() => {
    let filtered = turbines;

    if (searchQuery.trim()) {
      filtered = filtered.filter((t) =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTurbines(filtered);
  }, [turbines, searchQuery]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      console.log('📦 Carregando projeto:', id);

      const projectData = await projectsAPI.getById(parseInt(id));
      setProject(projectData);

      const turbinesData = await turbineAPI.getByProject(parseInt(id));
      setTurbines(turbinesData);

      console.log(`✅ ${turbinesData.length} turbinas carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar projeto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjectData();
    setRefreshing(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleTurbinePress = (turbine: Turbine) => {
    // Navegar para criar relatório desta turbina
    router.push({
      pathname: '/(tabs)/tech/reports/defect-inspection/create',
      params: {
        projectId: id,
        turbineId: turbine.id.toString(),
        turbineName: turbine.name,
      },
    });
  };

  const renderTurbineCard = ({ item }: { item: Turbine }) => (
    <Card style={styles.turbineCard} onPress={() => handleTurbinePress(item)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.turbineInfo}>
            <Text variant="titleMedium" style={styles.turbineName}>
              {item.name}
            </Text>
            {item.model && (
              <Text variant="bodySmall" style={styles.turbineModel}>
                {item.model}
              </Text>
            )}
          </View>
          <IconButton icon="chevron-right" size={24} />
        </View>

        {item.power && (
          <Chip icon="lightning-bolt" compact style={styles.chip}>
            {item.power} kW
          </Chip>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="wind-turbine" size={64} iconColor={colors.lightGray} />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        Sem turbinas
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Este projeto ainda não tem turbinas registadas.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <IconButton icon="arrow-left" size={24} iconColor={colors.primary} onPress={handleBack} />
        <View style={styles.headerContent}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            {project?.name || 'Projeto'}
          </Text>
          {project?.location && (
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {project.location}
            </Text>
          )}
        </View>
        <View style={{ width: 48 }} />
      </Surface>

      {/* Info Cards */}
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <IconButton icon="wind-turbine" size={20} />
          <Text variant="bodySmall" style={styles.infoLabel}>
            Turbinas
          </Text>
          <Text variant="titleMedium" style={styles.infoValue}>
            {turbines.length}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Pesquisar turbinas..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Selecione uma turbina para criar relatório
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>A carregar projeto...</Text>
      </View>
    );
  }

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container style={styles.container} edges={Platform.OS === 'web' ? undefined : ['bottom']}>
      <FlatList
        data={filteredTurbines}
        renderItem={renderTurbineCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredTurbines.length === 0 ? styles.emptyListContent : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />
    </Container>
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
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 1,
  },
  infoLabel: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoValue: {
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  searchBar: {
    backgroundColor: colors.surface,
    elevation: 0,
  },
  sectionTitle: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    fontWeight: '600',
  },
  turbineCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  turbineInfo: {
    flex: 1,
  },
  turbineName: {
    fontWeight: '600',
  },
  turbineModel: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
