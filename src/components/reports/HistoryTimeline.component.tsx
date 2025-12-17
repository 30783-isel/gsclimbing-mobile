// src/components/reports/HistoryTimeline.component.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { Text, Chip, useTheme, Icon, Card, IconButton } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { HistoryEntry, HistoryAction } from '@/types/history.types';
import { getActionConfig, translateFieldName } from '@/types/history.types';
import { API_CONFIG } from '@/constants/api';

interface HistoryTimelineProps {
  history: HistoryEntry[];
}

// ✅ Helper para extrair ID e hash da foto
const parsePhotoValue = (value: string | null): { id: string; hash: string; url: string } | null => {
  if (!value) return null;
  
  // Formato esperado: "Foto ID: 12345|abcdef123"
  const match = value.match(/Foto ID: (\d+)\|(.+)/);
  
  if (match) {
    const id = match[1];
    const hash = match[2];
    
    // Construir URL para download da foto
    const baseUrl = API_CONFIG.baseUrl.replace('/api/', '');
    const url = `${baseUrl}/api/reports/mobile/files/download/${hash}`;
    
    return { id, hash, url };
  }
  
  return null;
};

/**
 * Componente de Timeline de Histórico
 */
export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ history }) => {
  const theme = useTheme();
  const colors = theme.colors;
  
  // Estado para modal de imagem ampliada
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  /**
   * Formata a data
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

                {/* ✅ FOTOS: Renderização especial */}
                {(entry.fieldName === 'photo_added' || entry.fieldName === 'photo_removed') ? (
                  <View style={styles.photoChange}>
                    {(() => {
                      const isAdded = entry.fieldName === 'photo_added';
                      const photoInfo = parsePhotoValue(isAdded ? entry.newValue : entry.oldValue);
                      
                      // Se não conseguir extrair hash, mostrar fallback (só texto)
                      if (!photoInfo) {
                        return (
                          <View style={[styles.photoBox, isAdded ? styles.photoAdded : styles.photoRemoved]}>
                            <Icon 
                              source={isAdded ? "image-plus" : "image-minus"} 
                              size={24} 
                              color={isAdded ? colors.primary : colors.error} 
                            />
                            <Text variant="bodyMedium" style={[styles.photoText, { 
                              color: isAdded ? colors.primary : colors.error 
                            }]}>
                              {isAdded ? (entry.newValue || 'Foto adicionada') : (entry.oldValue || 'Foto removida')}
                            </Text>
                          </View>
                        );
                      }
                      
                      // ✅ TEM HASH: Mostrar com imagem
                      return (
                        <TouchableOpacity
                          style={[styles.photoBoxWithImage, isAdded ? styles.photoAdded : styles.photoRemoved]}
                          onPress={() => setSelectedPhotoUrl(photoInfo.url)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.photoInfo}>
                            <Icon 
                              source={isAdded ? "image-plus" : "image-minus"} 
                              size={24} 
                              color={isAdded ? colors.primary : colors.error} 
                            />
                            <View style={styles.photoTextContainer}>
                              <Text variant="bodyMedium" style={{ 
                                color: isAdded ? colors.primary : colors.error,
                                fontWeight: '600'
                              }}>
                                {isAdded ? 'Foto adicionada' : 'Foto removida'}
                              </Text>
                              <Text variant="bodySmall" style={styles.photoIdText}>
                                ID: {photoInfo.id}
                              </Text>
                            </View>
                          </View>
                          
                          {/* Thumbnail da foto */}
                          <Image 
                            source={{ uri: photoInfo.url }}
                            style={styles.photoThumbnail}
                            resizeMode="cover"
                          />
                          
                          {/* Ícone de ampliar */}
                          <View style={styles.expandIcon}>
                            <Icon source="magnify-plus" size={16} color="#FFF" />
                          </View>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                ) : (
                  /* Alterações de texto normais */
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
    <>
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

      {/* Modal para ampliar foto */}
      <Modal
        visible={selectedPhotoUrl !== null}
        transparent
        onRequestClose={() => setSelectedPhotoUrl(null)}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedPhotoUrl(null)}
          >
            <IconButton
              icon="close"
              size={24}
              iconColor="#FFF"
              style={styles.closeButton}
              onPress={() => setSelectedPhotoUrl(null)}
            />
            {selectedPhotoUrl && (
              <Image
                source={{ uri: selectedPhotoUrl }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </>
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
  
  // Estilos para fotos (fallback sem imagem)
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
  
  // ✅ Estilos para fotos COM IMAGEM
  photoBoxWithImage: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  photoTextContainer: {
    flex: 1,
  },
  photoIdText: {
    opacity: 0.7,
    marginTop: 2,
  },
  photoThumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: '#F5F5F5',
  },
  expandIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  
  // Estilos para modal de imagem ampliada
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});