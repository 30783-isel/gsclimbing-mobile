import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { Text, TextInput, Button, Card, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CameraComponent } from '@/components/CameraComponent';
import { PhotoGallery } from '@/components/PhotoGallery';
import { colors, spacing } from '@/constants/theme';
import { ReportType, REPORT_TYPE_NAMES } from '@/types/report.types';
import type { ReportPhoto } from '@/types/report.types';

export default function CreateReportScreen() {
  const { id, turbineId, type } = useLocalSearchParams<{
    id: string;
    turbineId: string;
    type: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  const reportType = parseInt(type || '0') as ReportType;
  const reportTypeName = REPORT_TYPE_NAMES[reportType];

  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoTaken = (uri: string) => {
    const newPhoto: ReportPhoto = {
      id: Date.now().toString(),
      reportId: '', // Será preenchido após criar o relatório
      uri,
      filename: `photo_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: 0,
      timestamp: Date.now(),
      isUploaded: false,
      isOffline: true,
    };

    setPhotos((prev) => [...prev, newPhoto]);
    setCameraVisible(false);
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Eliminar Foto',
      'Tem a certeza que deseja eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (photos.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos uma foto ao relatório');
      return;
    }

    setSaving(true);
    try {
      // TODO: Implementar criação do relatório via API
      // TODO: Upload das fotos
      console.log('Saving report:', {
        turbineId,
        type: reportType,
        observations,
        photos: photos.length,
      });

      Alert.alert(
        'Sucesso',
        'Relatório criado com sucesso',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving report:', error);
      Alert.alert('Erro', 'Não foi possível criar o relatório');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Novo Relatório
        </Text>
        <Chip icon="file-document" style={styles.typeChip}>
          {reportTypeName}
        </Chip>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Observations Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Observações
            </Text>
            <TextInput
              value={observations}
              onChangeText={setObservations}
              mode="outlined"
              multiline
              numberOfLines={6}
              placeholder="Adicione observações sobre a inspeção..."
              style={styles.textArea}
            />
          </Card.Content>
        </Card>

        {/* Photos Section */}
        <Card style={styles.card}>
          <Card.Content>
            <PhotoGallery
              photos={photos}
              onAddPhoto={() => setCameraVisible(true)}
              onDeletePhoto={handleDeletePhoto}
            />
          </Card.Content>
        </Card>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text variant="bodySmall" style={styles.infoText}>
            💡 As fotos serão sincronizadas automaticamente quando houver conexão
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.cancelButton}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          loading={saving}
          disabled={saving || photos.length === 0}
        >
          Guardar
        </Button>
      </View>

      {/* Camera Modal */}
      <Modal
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => setCameraVisible(false)}
      >
        <CameraComponent
          onPhotoTaken={handlePhotoTaken}
          onClose={() => setCameraVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white + '20',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: spacing.md,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
  },
  infoContainer: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.info + '20',
    borderRadius: 8,
  },
  infoText: {
    color: colors.info,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});