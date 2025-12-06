/**
 * Step 2: Photos
 * Grid de 8 fotos (2 páginas x 4 fotos) com upload, preview e descrição
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, IconButton, Dialog, Portal, TextInput, ProgressBar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '@/constants/theme';

interface PhotoData {
  id: string;
  uri: string;
  description: string;
  pageNumber: number;
  position: number;
  isUploaded: boolean;
}

interface Step2Props {
  photos: PhotoData[];
  language: 'EN' | 'ES';
  onPhotosChange: (photos: PhotoData[]) => void;
  onNext: () => void;
  onBack: () => void;
  uploadProgress?: Record<string, number>;
}

export function DefectReportStep2({
  photos,
  language,
  onPhotosChange,
  onNext,
  onBack,
  uploadProgress = {},
}: Step2Props) {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');

  // Labels traduzidos
  const labels = language === 'EN' ? {
    title: 'Photographs',
    subtitle: 'Add up to 8 photos (minimum 1 required)',
    page: 'Page',
    position: 'Position',
    addPhoto: 'Add Photo',
    takePhoto: 'Take Photo',
    choosePhoto: 'Choose from Gallery',
    removePhoto: 'Remove Photo',
    editDescription: 'Edit Description',
    description: 'Description',
    descriptionPlaceholder: 'Enter photo description...',
    save: 'Save',
    cancel: 'Cancel',
    next: 'Next: Additional Fields',
    back: 'Back',
    emptySlot: 'Empty',
    tapToAdd: 'Tap to add photo',
    required: 'At least 1 photo is required',
  } : {
    title: 'Fotografías',
    subtitle: 'Añadir hasta 8 fotos (mínimo 1 requerida)',
    page: 'Página',
    position: 'Posición',
    addPhoto: 'Añadir Foto',
    takePhoto: 'Tomar Foto',
    choosePhoto: 'Elegir de Galería',
    removePhoto: 'Eliminar Foto',
    editDescription: 'Editar Descripción',
    description: 'Descripción',
    descriptionPlaceholder: 'Ingrese descripción de la foto...',
    save: 'Guardar',
    cancel: 'Cancelar',
    next: 'Siguiente: Campos Adicionales',
    back: 'Atrás',
    emptySlot: 'Vacío',
    tapToAdd: 'Toca para añadir foto',
    required: 'Se requiere al menos 1 foto',
  };

  // Obter foto para posição específica
  const getPhotoForPosition = (page: number, position: number): PhotoData | null => {
    return photos.find(p => p.pageNumber === page && p.position === position) || null;
  };

  // Pedir permissões de câmara
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        language === 'EN' ? 'Permission Denied' : 'Permiso Denegado',
        language === 'EN' 
          ? 'Camera permission is required to take photos' 
          : 'Se requiere permiso de cámara para tomar fotos'
      );
      return false;
    }
    return true;
  };

  // Tirar foto com câmara
  const takePhoto = async (page: number, position: number) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      addPhoto(result.assets[0].uri, page, position);
    }
  };

  // Escolher foto da galeria
  const choosePhoto = async (page: number, position: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      addPhoto(result.assets[0].uri, page, position);
    }
  };

  // Adicionar foto
  const addPhoto = (uri: string, page: number, position: number) => {
    const newPhoto: PhotoData = {
      id: `${Date.now()}-${page}-${position}`,
      uri,
      description: '',
      pageNumber: page,
      position,
      isUploaded: false,
    };

    // Remover foto antiga na mesma posição (se existir)
    const updatedPhotos = photos.filter(
      p => !(p.pageNumber === page && p.position === position)
    );
    updatedPhotos.push(newPhoto);

    onPhotosChange(updatedPhotos);
  };

  // Mostrar opções de foto
  const showPhotoOptions = (page: number, position: number) => {
    Alert.alert(
      labels.addPhoto,
      '',
      [
        {
          text: labels.takePhoto,
          onPress: () => takePhoto(page, position),
        },
        {
          text: labels.choosePhoto,
          onPress: () => choosePhoto(page, position),
        },
        {
          text: labels.cancel,
          style: 'cancel',
        },
      ]
    );
  };

  // Abrir diálogo de edição
  const openEditDialog = (photo: PhotoData) => {
    setSelectedPhoto(photo);
    setPhotoDescription(photo.description);
    setDialogVisible(true);
  };

  // Guardar descrição
  const saveDescription = () => {
    if (selectedPhoto) {
      const updatedPhotos = photos.map(p =>
        p.id === selectedPhoto.id
          ? { ...p, description: photoDescription }
          : p
      );
      onPhotosChange(updatedPhotos);
    }
    setDialogVisible(false);
    setSelectedPhoto(null);
    setPhotoDescription('');
  };

  // Remover foto
  const removePhoto = (photo: PhotoData) => {
    Alert.alert(
      labels.removePhoto,
      language === 'EN' 
        ? 'Are you sure you want to remove this photo?' 
        : '¿Estás seguro de que quieres eliminar esta foto?',
      [
        {
          text: labels.cancel,
          style: 'cancel',
        },
        {
          text: labels.removePhoto,
          style: 'destructive',
          onPress: () => {
            const updatedPhotos = photos.filter(p => p.id !== photo.id);
            onPhotosChange(updatedPhotos);
          },
        },
      ]
    );
  };

  // Validar e avançar
  const handleNext = () => {
    if (photos.length === 0) {
      Alert.alert(
        language === 'EN' ? 'Required' : 'Requerido',
        labels.required
      );
      return;
    }
    onNext();
  };

  // Renderizar slot de foto
  const renderPhotoSlot = (page: number, position: number) => {
    const photo = getPhotoForPosition(page, position);
    const progress = photo ? uploadProgress[photo.id] || 0 : 0;

    return (
      <View key={`${page}-${position}`} style={styles.photoSlot}>
        <Text style={styles.photoLabel}>
          {labels.position} {position}
        </Text>

        {photo ? (
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={() => openEditDialog(photo)}
          >
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            
            {/* Progress bar durante upload */}
            {progress > 0 && progress < 100 && (
              <View style={styles.progressOverlay}>
                <ProgressBar
                  progress={progress / 100}
                  color={colors.primary}
                  style={styles.progressBar}
                />
              </View>
            )}

            {/* Botões de ação */}
            <View style={styles.photoActions}>
              <IconButton
                icon="pencil"
                size={20}
                iconColor="white"
                onPress={() => openEditDialog(photo)}
                style={styles.actionButton}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor="white"
                onPress={() => removePhoto(photo)}
                style={styles.actionButton}
              />
            </View>

            {/* Badge de descrição */}
            {photo.description && (
              <View style={styles.descriptionBadge}>
                <Text style={styles.descriptionBadgeText} numberOfLines={1}>
                  {photo.description}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptySlot}
            onPress={() => showPhotoOptions(page, position)}
          >
            <IconButton icon="camera-plus" size={40} iconColor={colors.primary} />
            <Text style={styles.emptySlotText}>{labels.tapToAdd}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title={labels.title} subtitle={labels.subtitle} />

        <Card.Content>
          {/* Página 2 - 4 fotos */}
          <Text style={styles.pageTitle}>{labels.page} 2</Text>
          <View style={styles.photoGrid}>
            {[1, 2, 3, 4].map(position => renderPhotoSlot(2, position))}
          </View>

          {/* Página 3 - 4 fotos */}
          <Text style={styles.pageTitle}>{labels.page} 3</Text>
          <View style={styles.photoGrid}>
            {[1, 2, 3, 4].map(position => renderPhotoSlot(3, position))}
          </View>

          {/* Contador */}
          <Text style={styles.counter}>
            {photos.length} / 8 {language === 'EN' ? 'photos' : 'fotos'}
          </Text>
        </Card.Content>
      </Card>

      {/* Botões de navegação */}
      <View style={styles.navigationButtons}>
        <Button
          mode="outlined"
          onPress={onBack}
          style={styles.navButton}
          icon="arrow-left"
        >
          {labels.back}
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.navButton}
          icon="arrow-right"
          contentStyle={styles.nextButtonContent}
        >
          {labels.next}
        </Button>
      </View>

      {/* Diálogo de edição de descrição */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{labels.editDescription}</Dialog.Title>
          <Dialog.Content>
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.dialogImage}
              />
            )}
            <TextInput
              label={labels.description}
              value={photoDescription}
              onChangeText={setPhotoDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder={labels.descriptionPlaceholder}
              style={styles.descriptionInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>{labels.cancel}</Button>
            <Button onPress={saveDescription}>{labels.save}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    margin: spacing.md,
    elevation: 2,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    color: colors.text,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoSlot: {
    width: '48%',
    marginBottom: spacing.md,
  },
  photoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  photoContainer: {
    aspectRatio: 4 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: 8,
  },
  actionButton: {
    margin: 0,
  },
  descriptionBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.xs,
  },
  descriptionBadgeText: {
    color: 'white',
    fontSize: 11,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.xs,
  },
  progressBar: {
    height: 4,
  },
  emptySlot: {
    aspectRatio: 4 / 3,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emptySlotText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  counter: {
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 14,
    color: colors.textSecondary,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  navButton: {
    flex: 1,
  },
  nextButtonContent: {
    flexDirection: 'row-reverse',
  },
  dialogImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  descriptionInput: {
    marginTop: spacing.sm,
  },
});
