// src/components/history/HistoryTimeline.component.tsx

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Chip, useTheme, Icon, Card } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { HistoryEntry, HistoryAction } from '@/types/history.types';
import { getActionConfig, translateFieldName } from '@/types/history.types';

interface HistoryTimelineProps {
  history: HistoryEntry[];
}

/**
 * Componente de Timeline de Histórico com suporte visual para fotos
 */
export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ history }) => {
  const theme = useTheme();
  const colors = theme.colors;

  /**
   * Formata a data de forma relativa
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM 'às' HH:mm", { locale: pt });
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Renderiza uma entrada de histórico
   */
  const renderHistoryEntry = (entry: HistoryEntry, index: number) => {
    const config = getActionConfig(entry.action as HistoryAction);
    const isLast = index === history.length - 1;

    return (
      <View key={entry.id} style={styles.entryContainer}>
        {/* Linha vertical da timeline */}
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />}

        {/* Ícone da ação */}
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Icon source={config.icon} size={20} color="#FFFFFF" />
        </View>

        {/* Card com detalhes */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            {/* Cabeçalho: Ação + Data */}
            <View style={styles.header}>
              <Text variant="titleMedium" style={[styles.actionLabel, { color: config.color }]}>
                {config.label}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                {formatDate(entry.changedAt)}
              </Text>
            </View>

            {/* Utilizador */}
            <Chip
              mode="outlined"
              compact
              style={styles.userChip}
              textStyle={styles.userChipText}
              icon="account"
            >
              {entry.changedBy}
            </Chip>

            {/* Descrição (se houver) */}
            {entry.description && (
              <Text variant="bodyMedium" style={styles.description}>
                {entry.description}
              </Text>
            )}

            {/* Detalhes da alteração de campo */}
            {entry.fieldName && (
              <View style={styles.fieldChangeContainer}>
                <Text variant="labelMedium" style={styles.fieldLabel}>
                  📝 {translateFieldName(entry.fieldName)}
                </Text>

                {/* Caso especial: Fotos */}
                {(entry.fieldName === 'photo_added' || entry.fieldName === 'photo_removed') ? (
                  <View style={styles.photoChange}>
                    {entry.fieldName === 'photo_added' && (
                      <View style={[styles.photoBox, styles.photoAdded]}>
                        <Icon source="image-plus" size={24} color={colors.primary} />
                        <Text variant="bodyMedium" style={[styles.photoText, { color: colors.primary }]}>
                          {entry.newValue || 'Foto adicionada'}
                        </Text>
                      </View>
                    )}
                    {entry.fieldName === 'photo_removed' && (
                      <View style={[styles.photoBox, styles.photoRemoved]}>
                        <Icon source="image-minus" size={24} color={colors.error} />
                        <Text variant="bodyMedium" style={[styles.photoText, { color: colors.error }]}>
                          {entry.oldValue || 'Foto removida'}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  /* Caso normal: Alteração de campo de texto */
                  <View style={styles.valueChangeContainer}>
                    {entry.oldValue && (
                      <View style={[styles.valueBox, styles.oldValue]}>
                        <Text variant="bodySmall" style={styles.valueLabel}>
                          Anterior:
                        </Text>
                        <Text variant="bodyMedium" style={[styles.value, styles.oldValueText]}>
                          {entry.oldValue}
                        </Text>
                      </View>
                    )}

                    {entry.oldValue && entry.newValue && (
                      <Icon source="arrow-right" size={20} color={colors.onSurfaceVariant} />
                    )}

                    {entry.newValue && (
                      <View style={[styles.valueBox, styles.newValue]}>
                        <Text variant="bodySmall" style={styles.valueLabel}>
                          Novo:
                        </Text>
                        <Text variant="bodyMedium" style={[styles.value, styles.newValueText]}>
                          {entry.newValue}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon source="history" size={48} color={colors.onSurfaceDisabled} />
          <Text variant="bodyLarge" style={{ color: colors.onSurfaceDisabled, marginTop: 16 }}>
            Sem histórico de alterações
          </Text>
        </View>
      ) : (
        history.map((entry, index) => renderHistoryEntry(entry, index))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  entryContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: -24,
    width: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  card: {
    flex: 1,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontWeight: '600',
  },
  date: {
    opacity: 0.6,
  },
  userChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    height: 28,
  },
  userChipText: {
    fontSize: 12,
  },
  description: {
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  fieldChangeContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  fieldLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  
  // ✅ ESTILOS PARA FOTOS
  photoChange: {
    marginTop: 4,
  },
  photoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    gap: 8,
  },
  photoAdded: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  photoRemoved: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  photoText: {
    flex: 1,
    fontWeight: '500',
  },
  
  // Estilos para alterações de texto
  valueChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  valueBox: {
    flex: 1,
    minWidth: 120,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  oldValue: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  newValue: {
    backgroundColor: '#E8F5E9',
    borderColor: '#66BB6A',
  },
  valueLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontWeight: '500',
  },
  oldValueText: {
    color: '#C62828',
    textDecorationLine: 'line-through',
  },
  newValueText: {
    color: '#2E7D32',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
});