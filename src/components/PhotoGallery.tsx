import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions, Modal } from 'react-native';
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

  const renderPhoto = ({ item }: { item: ReportPhoto }) => (
    <TouchableOpacity
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

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="bodyLarge" style={styles.emptyText}>
        📷 Nenhuma foto adicionada
      </Text>
      <Text variant="bodySmall" style={styles.emptySubtext}>
        Toque no botão + para adicionar fotos
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          Fotos ({photos.length})
        </Text>
      </View>

      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

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

            {selectedPhoto && (
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
  grid: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: spacing.xs / 2,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.warning,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedBadge: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    color: colors.textLight,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: spacing.md,
  },
  modalTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  photoInfo: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
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
    fontWeight: 'bold',
  },
});