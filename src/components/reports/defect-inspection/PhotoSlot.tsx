import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, IconButton, Card, TextInput } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import type { PhotoData } from '@/types/defectInspectionReport.types';

interface PhotoSlotProps {
  photo?: PhotoData;
  position: number;
  pageNumber: number;
  onTakePhoto: (pageNumber: number, position: number) => void;
  onPickPhoto: (pageNumber: number, position: number) => void;
  onRemovePhoto: (photoId: string) => void;
  onUpdateDescription: (photoId: string, description: string) => void;
}

export const PhotoSlot: React.FC<PhotoSlotProps> = ({
  photo,
  position,
  pageNumber,
  onTakePhoto,
  onPickPhoto,
  onRemovePhoto,
  onUpdateDescription,
}) => {
  const handleAddPhoto = () => {
    Alert.alert(
      'Adicionar Foto',
      'Escolha uma opção',
      [
        {
          text: 'Tirar Foto',
          onPress: () => onTakePhoto(pageNumber, position),
        },
        {
          text: 'Escolher da Galeria',
          onPress: () => onPickPhoto(pageNumber, position),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  if (!photo) {
    // Empty slot - show add button
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.emptySlot} onPress={handleAddPhoto}>
          <IconButton icon="camera-plus" size={40} iconColor={colors.primary} />
          <Text variant="bodySmall" style={styles.emptyText}>
            Foto {position}
          </Text>
        </TouchableOpacity>
        <TextInput
          mode="outlined"
          placeholder="Descrição (opcional)"
          style={styles.descriptionInput}
          disabled
        />
      </View>
    );
  }

  // Photo exists - show image and description
  return (
    <View style={styles.container}>
      <Card style={styles.photoCard}>
        <Image source={{ uri: photo.uri }} style={styles.image} />
        <View style={styles.overlay}>
          {photo.isUploaded && (
            <View style={styles.uploadedBadge}>
              <IconButton icon="check-circle" size={20} iconColor="#4CAF50" />
            </View>
          )}
          <IconButton
            icon="delete"
            size={20}
            iconColor="#fff"
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Remover Foto',
                'Tem a certeza que deseja remover esta foto?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => onRemovePhoto(photo.id),
                  },
                ]
              );
            }}
          />
        </View>
      </Card>
      <TextInput
        mode="outlined"
        placeholder="Descrição da foto"
        value={photo.description}
        onChangeText={(text) => onUpdateDescription(photo.id, text)}
        style={styles.descriptionInput}
        multiline
        numberOfLines={2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: spacing.md,
  },
  emptySlot: {
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  photoCard: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomLeftRadius: 8,
  },
  uploadedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 20,
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  descriptionInput: {
    marginTop: spacing.xs,
    fontSize: 12,
  },
});
