import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, IconButton } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import { performanceRepairElevatorAPI } from '@/services/api/performanceRepairElevator.api';
import { HistoryTimeline } from '@/components/reports/HistoryTimeline.component';
import type { HistoryEntry } from '@/types/history.types';

/**
 * Ecrã de histórico de alterações do Performance Repair Elevator Report
 */
export default function PerformanceRepairElevatorHistoryScreen() {
  const params = useLocalSearchParams<{
    reportId: string;
    projectName: string;
    turbineName: string;
  }>();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reportId = parseInt(params.reportId);

  useEffect(() => {
    loadHistory();
  }, [reportId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      console.log('📜 Loading history for report:', reportId);

      const historyData = await performanceRepairElevatorAPI.getHistory(reportId);
      
      // Ordenar por data (mais recente primeiro)
      const sortedHistory = historyData.sort(
        (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
      );

      setHistory(sortedHistory);
      console.log(`✅ Loaded ${sortedHistory.length} history entries`);
    } catch (error: any) {
      console.error('❌ Error loading history:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>A carregar histórico...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.white}
          size={24}
          onPress={() => router.back()}
        />
        <View style={styles.headerCenter}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Histórico de Alterações
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            Performance Report #{reportId}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Contador */}
        {history.length > 0 && (
          <View style={styles.counterContainer}>
            <Text variant="bodyMedium" style={styles.counterText}>
              {history.length} {history.length === 1 ? 'alteração' : 'alterações'} registadas
            </Text>
          </View>
        )}

        {/* Timeline de histórico */}
        <HistoryTimeline history={history} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  counterContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  counterText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});