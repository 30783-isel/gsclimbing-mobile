// app/(tabs)/tech/index.tsx - LISTA DE PROJETOS DO TÉCNICO COM NAVEGAÇÃO PARA RELATÓRIOS

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { Text, Card, Searchbar, Chip, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { SyncStatus } from '@/components/SyncStatus';
import { colors, spacing } from '@/constants/theme';
import type { Project } from '@/types/project.types';

export default function TechProjectsScreen() {
  const router = useRouter();
  const { user, handleLogout } = useAuth();
  const {
    projects,
    isLoading,
    refreshing,
    loadProjects,
    refreshProjects,
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  // Carregar projetos ao montar componente
  useEffect(() => {
    loadProjects();
  }, []);

  // Filtrar projetos localmente quando muda a query
  useEffect(() => {
    let filtered = projects;

    // Aplicar pesquisa de texto
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.country?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery]);

  const handleProjectPress = (project: Project) => {
    // Navegar para detalhes do projeto / turbinas
    router.push({
      pathname: '/(tabs)/tech/project/[id]',
      params: { id: project.idProject },
    });
  };

  const renderProjectCard = ({ item }: { item: Project }) => (
    <Card style={styles.projectCard} onPress={() => handleProjectPress(item)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text variant="titleMedium" style={styles.projectName}>
              {item.name}
            </Text>
            <View style={styles.locationContainer}>
              <IconButton icon="map-marker" size={16} style={{ margin: 0 }} />
              <Text variant="bodySmall" style={styles.locationText}>
                {item.location}, {item.country}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chipsContainer}>
          <Chip icon="map" compact style={styles.chip}>
            <Text variant="bodySmall" style={styles.chipText}>
              Site: {item.site || 'N/A'}
            </Text>
          </Chip>
          <Chip icon="wind-turbine" compact style={styles.chip}>
            <Text variant="bodySmall" style={styles.chipText}>
              {item.numberTurbines} {parseInt(item.numberTurbines || '0') === 1 ? 'Turbina' : 'Turbinas'}
            </Text>
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="folder-outline" size={64} iconColor={colors.lightGray} />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        Nenhum projeto atribuído
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Não tens projetos atribuídos neste momento.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Header com Sync Status e Botão de Relatórios */}
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Meus Projetos
        </Text>
        <View style={styles.headerRight}>
          <IconButton
            icon="file-document-multiple"
            size={24}
            iconColor={colors.primary}
            onPress={() => router.push('/(tabs)/tech/reports')}
          />
          <SyncStatus />
          <IconButton
            icon="logout"
            size={24}
            iconColor={colors.primary}
            onPress={handleLogout}
          />
        </View>
      </Surface>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Pesquisar projetos..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text variant="headlineSmall" style={styles.statNumber}>
            {projects.length}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Projetos
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text variant="headlineSmall" style={styles.statNumber}>
            {projects.reduce((acc, p) => acc + parseInt(p.numberTurbines || '0'), 0)}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Turbinas
          </Text>
        </View>
      </View>
    </View>
  );

  // ✅ FIX: Usa View em vez de SafeAreaView na web
  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container style={styles.container} edges={Platform.OS === 'web' ? [] : ['top']}>
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
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' && {
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    }),
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: colors.surface,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
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
    ...(Platform.OS === 'web' && {
      elevation: 0,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
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
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: 12,
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
});