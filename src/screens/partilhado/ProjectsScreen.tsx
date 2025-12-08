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
  
  // ... resto do código do componente continua igual
  
  return (
    <View style={styles.container}>
      {/* UI do componente */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});