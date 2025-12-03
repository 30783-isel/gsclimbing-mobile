import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  IconButton,
  Surface,
} from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import type { ReportPhotoData } from '@/services/api/reportPhotos.api';
import { reportPhotosAPI } from '@/services/api/reportPhotos.api';

const { width, height } = Dimensions.get('window');
const THUMBNAIL_SIZE = (width - spacing.md * 3) / 2;

interface PhotoGalleryProps {
  photos: ReportPhotoData[];
  isLoading?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  isLoading = false,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<ReportPhotoData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openPhoto = (photo: ReportPhotoData) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  const closePhoto = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedPhoto(null), 300);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>A carregar fotografias...</Text>
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconButton
          icon="image-off-outline"
          size={48}
          iconColor={colors.lightGray}
        />
        <Text variant="bodyMedium" style={styles.emptyText}>
          Sem fotografias disponíveis
        </Text>
      </View>
    );
  }

  const renderPhotoItem = ({ item }: { item: ReportPhotoData }) => {
    const photoUrl = reportPhotosAPI.getPhotoUrl(item.hash);
    const hasValidDescription = item.description && item.description.trim().length > 1;

    return (
      <TouchableOpacity
        style={styles.photoThumbnailContainer}
        onPress={() => openPhoto(item)}
        activeOpacity={0.8}
      >
        <Surface style={styles.photoThumbnail} elevation={2}>
          <Image
            source={{ uri: photoUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
          {hasValidDescription && (
            <View style={styles.photoOverlay}>
              <Text
                variant="bodySmall"
                style={styles.photoDescription}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            </View>
          )}
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.fileId.toString()}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhoto}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closePhoto}
          >
            <View style={styles.modalContent}>
              {selectedPhoto && (
                <ScrollView
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <Surface style={styles.closeButtonContainer} elevation={4}>
                    <IconButton
                      icon="close"
                      size={28}
                      iconColor={colors.white}
                      onPress={closePhoto}
                      style={styles.closeButton}
                    />
                  </Surface>

                  <TouchableOpacity activeOpacity={1}>
                    <Image
                      source={{
                        uri: reportPhotosAPI.getPhotoUrl(selectedPhoto.hash),
                      }}
                      style={styles.fullImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>

                  <Surface style={styles.photoInfoContainer} elevation={3}>
                    {selectedPhoto.description && (
                      <View style={styles.infoRow}>
                        <Text variant="labelMedium" style={styles.infoLabel}>
                          Descrição:
                        </Text>
                        <Text variant="bodyMedium" style={styles.infoValue}>
                          {selectedPhoto.description}
                        </Text>
                      </View>
                    )}

                    <View style={styles.infoRow}>
                      <Text variant="labelMedium" style={styles.infoLabel}>
                        Nome:
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={styles.infoValue}
                        numberOfLines={1}
                      >
                        {selectedPhoto.name}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text variant="labelMedium" style={styles.infoLabel}>
                        Data:
                      </Text>
                      <Text variant="bodySmall" style={styles.infoValue}>
                        {formatDate(selectedPhoto.createDate)}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text variant="labelMedium" style={styles.infoLabel}>
                        Tamanho:
                      </Text>
                      <Text variant="bodySmall" style={styles.infoValue}>
                        {formatFileSize(selectedPhoto.size)}
                      </Text>
                    </View>
                  </Surface>
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  gridContainer: {
    padding: spacing.xs,
  },
  photoThumbnailContainer: {
    flex: 1,
    margin: spacing.xs,
    maxWidth: THUMBNAIL_SIZE,
  },
  photoThumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.xs,
  },
  photoDescription: {
    color: colors.white,
    fontSize: 11,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackground: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 40,
    right: spacing.md,
    zIndex: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    margin: 0,
  },
  fullImage: {
    width: width,
    height: height * 0.7,
    marginTop: 60,
  },
  photoInfoContainer: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  infoRow: {
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    color: colors.text,
  },
});