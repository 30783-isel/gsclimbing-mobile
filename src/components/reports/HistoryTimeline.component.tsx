// src/components/reports/HistoryTimeline.component.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import type { HistoryEntry } from '@/types/history.types';
import { getActionConfig, translateFieldName } from '@/types/history.types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryTimelineProps {
  entry: HistoryEntry;
  isLast: boolean;
}

/**
 * Componente individual da timeline de histórico
 * Mostra uma entrada de histórico com ícone, ação e diff
 */
export const HistoryTimelineItem: React.FC<HistoryTimelineProps> = ({ entry, isLast }) => {
  const config = getActionConfig(entry.action);

  // Formatar data relativa (ex: "há 2 horas")
  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(entry.changedAt), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return new Date(entry.changedAt).toLocaleString('pt-PT');
    }
  }, [entry.changedAt]);

  // Determinar se é uma alteração de campo (mostra diff)
  const isFieldUpdate = entry.action === 'UPDATE' && entry.fieldName;

  return (
    <View style={styles.timelineItem}>
      {/* Linha vertical da timeline */}
      {!isLast && <View style={styles.timelineLine} />}

      {/* Ícone da ação */}
      <View style={[styles.timelineIcon, { backgroundColor: config.color }]}>
        <IconButton
          icon={config.icon}
          size={20}
          iconColor={colors.white}
          style={styles.icon}
        />
      </View>

      {/* Card com detalhes */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          {/* Header: Ação + Tempo */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text variant="titleSmall" style={{ color: config.color }}>
                {config.label}
              </Text>
              <Chip icon="account" compact style={styles.userChip}>
                {entry.changedBy}
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.timeText}>
              {timeAgo}
            </Text>
          </View>

          {/* Descrição (se houver) */}
          {entry.description && (
            <Text variant="bodyMedium" style={styles.description}>
              {entry.description}
            </Text>
          )}

          {/* Diff (se for UPDATE de campo) */}
          {isFieldUpdate && (
            <View style={styles.diffContainer}>
              <Text variant="labelSmall" style={styles.fieldLabel}>
                {translateFieldName(entry.fieldName!)}:
              </Text>

              {/* Valor antigo */}
              <View style={styles.diffRow}>
                <IconButton
                  icon="minus-circle"
                  size={16}
                  iconColor={colors.error}
                />
                <View style={styles.valueBox}>
                  <Text variant="bodySmall" style={styles.oldValueText}>
                    {entry.oldValue || '(vazio)'}
                  </Text>
                </View>
              </View>

              {/* Seta indicando mudança */}
              <View style={styles.arrowContainer}>
                <IconButton icon="arrow-down" size={16} iconColor={colors.textSecondary} />
              </View>

              {/* Valor novo */}
              <View style={styles.diffRow}>
                <IconButton
                  icon="plus-circle"
                  size={16}
                  iconColor={colors.success}
                />
                <View style={[styles.valueBox, { backgroundColor: colors.success + '10' }]}>
                  <Text variant="bodySmall" style={styles.newValueText}>
                    {entry.newValue || '(vazio)'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 18,
    top: 50,
    bottom: -spacing.md,
    width: 2,
    backgroundColor: colors.lightGray,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    elevation: 2,
  },
  icon: {
    margin: 0,
  },
  card: {
    flex: 1,
    marginTop: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  userChip: {
    alignSelf: 'flex-start',
  },
  timeText: {
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  description: {
    color: colors.text,
    marginTop: spacing.xs,
  },
  diffContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  fieldLabel: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  valueBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  oldValueText: {
    color: colors.error,
    textDecorationLine: 'line-through',
  },
  newValueText: {
    color: colors.success,
    fontWeight: '500',
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: -spacing.xs,
  },
});
