import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, Modal } from 'react-native';
import { Text, IconButton, Portal, FAB } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import type { ReportPhoto } from '@/types/report.types';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - spacing.md * 4) / 3;

interface PhotoGalleryProps {
  photos: ReportPhoto[];
  onAddPhoto: () => void;
  onDeletePhoto: (photoId: string) => void;
  readonly?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onAddPhoto,
  onDeletePhoto,
  readonly = false,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<ReportPhoto | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handlePhotoPress = (photo: ReportPhoto) => {
    setSelectedPhoto(photo);
    setPreviewVisible(true);
  };

  const handleDeletePhoto = () => {
    if (selectedPhoto) {
      onDeletePhoto(selectedPhoto.id);
      setPreviewVisible(false);
      setSelectedPhoto(null);
    }
  };

  // ✅ Garantir que photos é sempre um array válido
  const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id && p.uri) : [];

  console.log('📸 PhotoGallery render:', {
    photosReceived: photos,
    safePhotosLength: safePhotos.length,
    isArray: Array.isArray(photos)
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          Fotos ({safePhotos.length})
        </Text>
      </View>

      {/* ✅ USAR ScrollView em vez de FlatList para maior estabilidade */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {safePhotos.length === 0 ? (
          // Empty state
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              📷 Nenhuma foto adicionada
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Toque no botão + para adicionar fotos
            </Text>
          </View>
        ) : (
          // Grid de fotos
          <View style={styles.grid}>
            {safePhotos.map((item, index) => {
              // Validação extra por item
              if (!item || !item.uri) {
                console.warn('⚠️ Photo item inválido:', item);
                return null;
              }

              return (
                <TouchableOpacity
                  key={item.id || `photo-${index}`}
                  style={styles.photoContainer}
                  onPress={() => handlePhotoPress(item)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  
                  {/* Upload Status */}
                  {item.isOffline && !item.isUploaded && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>📤</Text>
                    </View>
                  )}
                  {item.isUploaded && (
                    <View style={[styles.statusBadge, styles.uploadedBadge]}>
                      <Text style={styles.statusText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {!readonly && (
        <FAB
          icon="camera"
          style={styles.fab}
          onPress={onAddPhoto}
          color="#fff"
          label="Foto"
        />
      )}

      {/* Photo Preview Modal */}
      <Portal>
        <Modal
          visible={previewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <IconButton
                icon="close"
                size={28}
                iconColor={colors.white}
                onPress={() => setPreviewVisible(false)}
              />
              <Text variant="titleMedium" style={styles.modalTitle}>
                Foto
              </Text>
              {!readonly && (
                <IconButton
                  icon="delete"
                  size={28}
                  iconColor={colors.error}
                  onPress={handleDeletePhoto}
                />
              )}
            </View>

            {selectedPhoto && selectedPhoto.uri && (
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}

            {selectedPhoto && (
              <View style={styles.photoInfo}>
                <Text style={styles.photoInfoText}>
                  {new Date(selectedPhoto.timestamp).toLocaleString('pt-PT')}
                </Text>
                {selectedPhoto.isUploaded && (
                  <Text style={styles.uploadedText}>✓ Enviada</Text>
                )}
                {selectedPhoto.isOffline && !selectedPhoto.isUploaded && (
                  <Text style={styles.offlineText}>📤 Pendente</Text>
                )}
              </View>
            )}
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: spacing.xs / 2,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceVariant,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedBadge: {
    backgroundColor: colors.success + '99',
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    minHeight: 200,
  },
  emptyText: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: spacing.sm,
  },
  modalTitle: {
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  photoInfo: {
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoInfoText: {
    color: colors.white,
    fontSize: 14,
  },
  uploadedText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: 'bold',
  },
  offlineText: {
    color: colors.warning,
    fontSize: 14,
  },
});