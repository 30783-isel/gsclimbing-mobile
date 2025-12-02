import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { Text, TextInput, Button, Card, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CameraComponent } from '@/components/CameraComponent';
import { PhotoGallery } from '@/components/PhotoGallery';
import { useReports } from '@/hooks/useReports';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing } from '@/constants/theme';
import { ReportType, REPORT_TYPE_NAMES } from '@/types/report.types';
import type { ReportPhoto, CreateReportDTO } from '@/types/report.types';

export default function CreateReportScreen() {
  const { id, turbineId, type } = useLocalSearchParams<{
    id: string;
    turbineId: string;
    type: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  // Hooks
  const { createReport, uploadPhotos } = useReports();
  const { user } = useAuthStore();

  // Parse report type
  const reportType = parseInt(type || '0') as ReportType;
  const reportTypeName = REPORT_TYPE_NAMES[reportType];

  // State
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Handler quando uma foto é tirada
   */
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

  /**
   * Handler para eliminar foto
   */
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

  /**
   * Handler para guardar relatório
   * Cria o relatório e faz upload das fotos
   */
  const handleSave = async () => {
    // Validação: pelo menos 1 foto
    if (photos.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos uma foto ao relatório');
      return;
    }

    // Validação: user autenticado
    if (!user) {
      Alert.alert('Erro', 'Utilizador não autenticado');
      return;
    }

    setSaving(true);

    try {
      // 1. Criar relatório
      console.log('📝 Criando relatório...');
      const reportData: CreateReportDTO = {
        userId: user.idUser,
        site: '', // Pode ser preenchido se tiveres info da turbina
        wtgNumber: turbineId,
        projectoId: parseInt(id),
        turbinaId: parseInt(turbineId),
        typeReport: reportType,
      };

      const newReport = await createReport(reportData);
      console.log('✅ Relatório criado com ID:', newReport.reportId);

      // 2. Upload das fotos
      console.log(`📸 Iniciando upload de ${photos.length} fotos...`);
      const uploadResults = await uploadPhotos(
        newReport.reportId.toString(),
        photos
      );

      // Verificar resultados
      const successCount = uploadResults.filter((r) => r.success).length;
      const failCount = uploadResults.length - successCount;

      // 3. Mostrar resultado
      if (failCount === 0) {
        // Tudo OK
        Alert.alert(
          '✅ Sucesso!',
          `Relatório criado com ${photos.length} foto(s)`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else if (successCount > 0) {
        // Parcial
        Alert.alert(
          '⚠️ Atenção',
          `Relatório criado mas apenas ${successCount} de ${photos.length} fotos foram carregadas.`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        // Nenhuma foto carregada
        Alert.alert(
          '❌ Erro',
          'Relatório criado mas nenhuma foto foi carregada. Tente fazer upload manualmente.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Erro ao guardar relatório:', error);
      
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível criar o relatório. Tente novamente.'
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handler para cancelar
   */
  const handleCancel = () => {
    if (photos.length > 0) {
      Alert.alert(
        'Cancelar',
        'Tem certeza? As fotos serão perdidas.',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Sim, cancelar',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
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
        {/* Observações */}
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
              disabled={saving}
            />
          </Card.Content>
        </Card>

        {/* Fotos */}
        <Card style={styles.card}>
          <Card.Content>
            <PhotoGallery
              photos={photos}
              onAddPhoto={() => setCameraVisible(true)}
              onDeletePhoto={handleDeletePhoto}
              readonly={saving}
            />
          </Card.Content>
        </Card>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text variant="bodySmall" style={styles.infoText}>
            💡 Adicione pelo menos 1 foto para criar o relatório
          </Text>
          {photos.length > 0 && (
            <Text variant="bodySmall" style={styles.infoText}>
              📸 {photos.length} foto(s) adicionada(s)
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Botões */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleCancel}
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
          {saving ? 'A guardar...' : 'Guardar'}
        </Button>
      </View>

      {/* Modal da Câmara */}
      <Modal
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => !saving && setCameraVisible(false)}
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
    marginVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});