/**
 * PerformanceRepairElevatorListItem
 * 
 * Componente para mostrar um item de Performance Report na lista
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, IconButton } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import type { Report } from '@/types/report.types';

interface PerformanceRepairElevatorListItemProps {
  report: Report;
  onPress: () => void;
  onDelete?: () => void;
  onHistory?: () => void;
}

export default function PerformanceRepairElevatorListItem({
  report,
  onPress,
  onDelete,
  onHistory,
}: PerformanceRepairElevatorListItemProps) {
  // ✅ VALIDAÇÃO: Se report não existe, não renderizar nada
  if (!report) {
    console.error('PerformanceRepairElevatorListItem: report is undefined');
    return null;
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Status do relatório
  const getStatusChip = () => {
    if (report?.locked === 'Y') {
      return (
        <Chip
          icon="lock"
          mode="flat"
          style={styles.chipLocked}
          textStyle={styles.chipText}
        >
          Bloqueado
        </Chip>
      );
    }

    if (report?.permission2Edit === 'N') {
      return (
        <Chip
          icon="lock-open-variant"
          mode="flat"
          style={styles.chipReadOnly}
          textStyle={styles.chipText}
        >
          Só Leitura
        </Chip>
      );
    }

    return (
      <Chip
        icon="pencil"
        mode="flat"
        style={styles.chipEditable}
        textStyle={styles.chipText}
      >
        Editável
      </Chip>
    );
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="titleMedium" style={styles.title}>
              {report?.site || 'Sem site'}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              WTG: {report?.wtgNumber || 'N/A'}
            </Text>
          </View>
          <View style={styles.headerRight}>{getStatusChip()}</View>
        </View>

        {/* Detalhes */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Criado:
            </Text>
            <Text variant="bodySmall" style={styles.detailValue}>
              {formatDate(report?.createDate || '')}
            </Text>
          </View>

          {report?.modifiedDate && report?.modifiedDate !== report?.createDate && (
            <View style={styles.detailRow}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Modificado:
              </Text>
              <Text variant="bodySmall" style={styles.detailValue}>
                {formatDate(report?.modifiedDate)}
              </Text>
            </View>
          )}

          {report?.isOffline && (
            <View style={styles.detailRow}>
              <Chip
                icon="wifi-off"
                mode="flat"
                style={styles.chipOffline}
                textStyle={styles.chipTextSmall}
              >
                Offline
              </Chip>
            </View>
          )}
        </View>

        {/* Ações */}
        <View style={styles.actions}>
          {onHistory && (
            <IconButton
              icon="history"
              size={20}
              onPress={onHistory}
              style={styles.actionButton}
            />
          )}
          {onDelete && report?.permission2Edit === 'Y' && (
            <IconButton
              icon="delete"
              size={20}
              onPress={onDelete}
              iconColor={colors.error}
              style={styles.actionButton}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  details: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    margin: 0,
  },
  chipEditable: {
    backgroundColor: colors.success + '20',
  },
  chipLocked: {
    backgroundColor: colors.error + '20',
  },
  chipReadOnly: {
    backgroundColor: colors.warning + '20',
  },
  chipOffline: {
    backgroundColor: colors.info + '20',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSmall: {
    fontSize: 11,
  },
});