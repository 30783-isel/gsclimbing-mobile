// src/screens/reports/defect-inspection/DefectInspectionReportHistoryScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Surface, Text, IconButton, ActivityIndicator, Banner } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { HistoryTimelineItem } from '@/components/reports/HistoryTimeline.component';
import { reportHistoryAPI } from '@/services/api/reportHistory.api';
import type { HistoryEntry } from '@/types/history.types';
import Toast from 'react-native-toast-message';

/**
 * Ecrã de Histórico do Relatório
 * Mostra timeline completa de todas as alterações
 */
export default function DefectInspectionReportHistoryScreen() {
  const router = useRouter();
  const { reportId, reportTitle } = useLocalSearchParams<{
    reportId: string;
    reportTitle?: string;
  }>();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar histórico do servidor
   */
  const loadHistory = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await reportHistoryAPI.getHistory(Number(reportId));
      setHistory(data);

      console.log(`✅ Loaded ${data.length} history entries`);
    } catch (err: any) {
      console.error('Error loading history:', err);
      setError(err.message || 'Erro ao carregar histórico');
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar o histórico',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [reportId]);

  /**
   * Renderizar item da timeline
   */
  const renderHistoryItem = ({ item, index }: { item: HistoryEntry; index: number }) => (
    <HistoryTimelineItem entry={item} isLast={index === history.length - 1} />
  );

  /**
   * Renderizar header vazio (espaçamento)
   */
  const renderHeader = () => {
    if (history.length === 0) return null;
    
    return (
      <View style={styles.listHeader}>
        <Text variant="bodyMedium" style={styles.headerText}>
          {history.length} {history.length === 1 ? 'alteração' : 'alterações'} registadas
        </Text>
      </View>
    );
  };

  /**
   * Renderizar estado vazio
   */
  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <IconButton icon="history" size={64} iconColor={colors.lightGray} />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          Sem histórico
        </Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Este relatório ainda não tem alterações registadas.
        </Text>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <Surface style={styles.header} elevation={2}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.white}
            onPress={() => router.back()}
          />
          <View style={styles.headerCenter}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Histórico
            </Text>
            {reportTitle && (
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                {reportTitle}
              </Text>
            )}
          </View>
          <View style={{ width: 48 }} />
        </Surface>

        {/* Loading */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>A carregar histórico...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={colors.white}
          onPress={() => router.back()}
        />
        <View style={styles.headerCenter}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Histórico
          </Text>
          {reportTitle && (
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {reportTitle}
            </Text>
          )}
        </View>
        <IconButton
          icon="refresh"
          size={24}
          iconColor={colors.white}
          onPress={() => loadHistory(true)}
        />
      </Surface>

      {/* Banner de erro */}
      {error && (
        <Banner
          visible={true}
          icon="alert-circle"
          actions={[
            {
              label: 'Tentar novamente',
              onPress: () => loadHistory(),
            },
          ]}
        >
          {error}
        </Banner>
      )}

      {/* Lista de histórico */}
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadHistory(true)}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.white,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
  },
  listHeader: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  headerText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
