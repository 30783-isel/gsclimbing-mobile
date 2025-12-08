/**
 * DefectInspectionReportEditScreen
 * ✅ ADAPTADO PARA SUPORTE OFFLINE COMPLETO
 * 
 * Modos suportados:
 * 1. Criar novo online (reportId=0, isOnline=true)
 * 2. Editar existente online (reportId>0, isOnline=true)
 * 3. Criar novo offline (reportId=0, isOnline=false)
 * 4. Editar existente offline (tempId, isOffline=true)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  IconButton,
  Divider,
  Portal,
  Dialog,
  ProgressBar,
  Banner,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

import { colors, spacing } from '@/constants/theme';
import { API_CONFIG } from '@/constants/api';
import httpClient from '@/services/httpClient';
import type {
  DefectInspectionReportData,
  PhotoData,
  AdditionalField,
} from '@/types/defectInspectionReport.types';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';
import { offlineReportsService, OfflinePhoto } from '@/services/storage/offlineReports.service';
import { ReportType } from '@/types/report.types';

export default function DefectInspectionReportEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reportId?: string;
    tempId?: string;      // Para relatórios offline
    turbineId?: string;   // Para criar novo
    projectId?: string;   // Para criar novo
    turbineName?: string;
    projectName?: string;
  }>();

  // Parse de parâmetros
  const reportId = params.reportId ? parseInt(params.reportId, 10) : 0;
  const tempIdParam = params.tempId || null;
  const turbineId = params.turbineId ? parseInt(params.turbineId, 10) : 0;
  const projectId = params.projectId ? parseInt(params.projectId, 10) : 0;

  // Estados de conexão e modo
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [tempId, setTempId] = useState<string | null>(null);

  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Dados do formulário
  const [reportUuid, setReportUuid] = useState('');
  const [site, setSite] = useState('');
  const [wtgNumber, setWtgNumber] = useState('');
  const [wtgType, setWtgType] = useState('');
  const [yearConstruction, setYearConstruction] = useState('');
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [additionalFields, setAdditionalFields] = useState<AdditionalField[]>([]);

  // Estados para diálogos
  const [photoDialogVisible, setPhotoDialogVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [fieldDialogVisible, setFieldDialogVisible] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldValue, setFieldValue] = useState('');

  // Monitorar conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  // Carregar dados do relatório
  useEffect(() => {
    loadReport();
  }, [reportId, tempIdParam]);

  const loadReport = async () => {
    try {
      setLoading(true);

      // ========================================
      // MODO 1: Relatório offline (via tempId)
      // ========================================
      if (tempIdParam) {
        console.log('📵 Carregando relatório offline:', tempIdParam);
        const offlineReport = await offlineReportsService.getById(tempIdParam);

        if (!offlineReport) {
          Alert.alert('Erro', 'Relatório offline não encontrado');
          router.back();
          return;
        }

        setIsOfflineMode(true);
        setTempId(offlineReport.tempId);

        // Preencher formulário
        setSite(offlineReport.data.site || '');
        setWtgNumber(offlineReport.data.wtgNumber || '');
        setWtgType(offlineReport.data.wtgType || '');
        setYearConstruction(offlineReport.data.yearConstruction || '');

        // Carregar fotos offline
        const offlinePhotos: PhotoData[] = Array.from({ length: 8 }, (_, i) => {
          const offlinePhoto = offlineReport.photos[i];
          return {
            id: `photo-${i}`,
            uri: offlinePhoto?.uri || '',
            pageNumber: i < 4 ? 2 : 3,
            position: (i % 4) + 1,
            timestamp: Date.now(),
            isUploaded: false,
            description: offlinePhoto?.filename ?? '',
          };
        });
        setPhotos(offlinePhotos);

        // Carregar campos adicionais
        const fields: AdditionalField[] = Object.keys(offlineReport.data)
          .filter(key => key.startsWith('additionalField'))
          .map(key => offlineReport.data[key])
          .filter(field => field && field.label && field.value);
        setAdditionalFields(fields);

        console.log('✅ Relatório offline carregado');
        return;
      }

      // ========================================
      // MODO 2: Criar novo relatório (reportId === 0)
      // ========================================
      if (reportId === 0) {
        console.log('📝 Modo criação de novo relatório');
        setIsOfflineMode(false);

        // Inicializar formulário vazio
        setSite('');
        setWtgNumber('');
        setWtgType('');
        setYearConstruction('');

        // Inicializar 8 fotos vazias
        const emptyPhotos: PhotoData[] = Array.from({ length: 8 }, (_, i) => ({
          id: `photo-${i}`,
          uri: '',
          pageNumber: i < 4 ? 2 : 3,
          position: (i % 4) + 1,
          timestamp: Date.now(),
          isUploaded: false,
          description: '',
        }));
        setPhotos(emptyPhotos);

        setAdditionalFields([]);
        return;
      }

      // ========================================
      // MODO 3: Editar relatório online (reportId > 0)
      // ========================================
      if (reportId > 0 && isOnline) {
        console.log('🌐 Carregando relatório online:', reportId);

        const report = await defectInspectionReportAPI.getById(reportId);
        setReportUuid(report.uuid);

        setSite(report.site || '');
        setWtgNumber(report.wtgNumber || '');
        setWtgType(report.wtgType || '');
        setYearConstruction(report.yearConstruction || '');

        // Carregar fotos do servidor
        const existingPhotos = await defectInspectionReportAPI.getPhotos(reportId);

        const initialPhotos: PhotoData[] = Array.from({ length: 8 }, (_, i) => {
          const pageNumber = i < 4 ? 2 : 3;
          const position = (i % 4) + 1;
          const existingPhoto = existingPhotos[i];

          if (existingPhoto) {
            const baseUrlClean = API_CONFIG.baseUrl.replace('/api/', '');
            const correctPath = existingPhoto.downloadUrl.replace(
              '/api/reports/files/download/',
              '/api/reports/mobile/files/download/'
            );
            const fullImageUrl = correctPath.startsWith('http')
              ? correctPath
              : `${baseUrlClean}${correctPath}`;

            return {
              id: `photo-${i}`,
              uri: fullImageUrl,
              pageNumber,
              position,
              timestamp: Date.now(),
              isUploaded: true,
              fileId: String(existingPhoto.fileId),   // ✅ CORRIGIDO
              description: existingPhoto.description ?? "",
            };
          }

          return {
            id: `photo-${i}`,
            uri: '',
            pageNumber,
            position,
            timestamp: Date.now(),
            isUploaded: false,
            fileId: "",          // ← também é preciso adicionar isto!
            description: "",     // ← e isto, porque é obrigatório no tipo
          };
        });


        setPhotos(initialPhotos);

        // Carregar campos adicionais
        const fields: AdditionalField[] = [];
        for (let i = 1; i <= 7; i++) {
          const label = (report as any)[`additionalField${i}Label`];
          const value = (report as any)[`additionalField${i}Text`];
          if (label && value) {
            fields.push({ label, value });
          }
        }
        setAdditionalFields(fields);

        console.log('✅ Relatório online carregado');
        return;
      }

      // ========================================
      // MODO 4: Offline e tentou carregar relatório online
      // ========================================
      if (reportId > 0 && !isOnline) {
        Alert.alert(
          'Modo Offline',
          'Este relatório não está disponível offline. Conecte-se à internet.'
        );
        router.back();
      }

    } catch (error) {
      console.error('❌ Erro ao carregar relatório:', error);
      Alert.alert('Erro', 'Não foi possível carregar o relatório');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    if (!site.trim()) {
      Alert.alert('Atenção', 'Preencha o campo Site');
      return false;
    }
    if (!wtgNumber.trim()) {
      Alert.alert('Atenção', 'Preencha o campo WTG Number');
      return false;
    }
    if (!wtgType.trim()) {
      Alert.alert('Atenção', 'Preencha o campo WTG Type');
      return false;
    }
    if (!yearConstruction.trim()) {
      Alert.alert('Atenção', 'Preencha o campo Year of Construction');
      return false;
    }
    return true;
  };

  // Guardar alterações
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setUploadProgress(0);

      // ========================================
      // MODO OFFLINE: Guardar localmente
      // ========================================
      if (!isOnline) {
        console.log('📵 Guardando relatório offline...');

        // Preparar fotos offline
        const offlinePhotos: OfflinePhoto[] = photos
          .filter(p => p.uri)
          .map((p, i) => ({
            tempId: `photo-${i}`,
            uri: p.uri,
            filename: p.uri.split('/').pop() || `photo-${i}.jpg`,
            mimeType: 'image/jpeg',
          }));

        // Preparar campos adicionais
        const additionalData: Record<string, { label: string; value: string }> = {};
        additionalFields.forEach((field, index) => {
          if (field.label && field.value) {
            additionalData[`additionalField${index + 1}`] = {
              label: field.label,
              value: field.value,
            };
          }
        });

        // Se é edição de relatório offline existente
        if (isOfflineMode && tempId) {
          await offlineReportsService.update(tempId, {
            data: {
              site,
              wtgNumber,
              wtgType,
              yearConstruction,
              ...additionalData,
            },
            photos: offlinePhotos,
          });

          Alert.alert('Sucesso', 'Relatório offline atualizado!', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }

        // Se é criação de novo relatório offline
        const offlineReport = await offlineReportsService.create({
          projectId: projectId || 0,
          turbineId: turbineId || 0,
          reportType: ReportType.DEFECT_INSPECTION,
          language: 'EN',
          data: {
            site,
            wtgNumber,
            wtgType,
            yearConstruction,
            ...additionalData,
          },
          photos: offlinePhotos,
        });

        // Marcar para sincronização automática
        await offlineReportsService.markForSync(offlineReport.tempId);

        Alert.alert(
          'Relatório Guardado',
          'O relatório foi guardado offline e será sincronizado quando houver conexão.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      // ========================================
      // MODO ONLINE: Upload e API
      // ========================================

      // Upload de fotos novas
      const photoFileIds: number[] = [];
      for (const photo of photos) {
        if (photo.uri && !photo.isUploaded) {
          const formData = new FormData();
          formData.append('file', {
            uri: photo.uri,
            type: 'image/jpeg',
            name: photo.uri.split('/').pop() || 'photo.jpg',
          } as any);

          const uploadResponse = await httpClient.post(
            `${API_CONFIG.baseFilesUrl}upload/${reportUuid || 'temp'}`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (progressEvent) => {
                const progress = progressEvent.loaded / progressEvent.total;
                setUploadProgress(progress);
              },
            }
          );

          photoFileIds.push(uploadResponse.data.fileId);
        } else if (photo.fileId) {
          photoFileIds.push(Number(photo.fileId));
        }
      }

      // Preparar payload
      const reportData: any = {
        site,
        wtgNumber,
        wtgType,
        yearConstruction,
        photoFileIds,
      };

      // Adicionar campos adicionais
      additionalFields.forEach((field, index) => {
        if (field.label && field.value) {
          reportData[`additionalField${index + 1}`] = {
            label: field.label,
            value: field.value,
          };
        }
      });

      // Se é criação (reportId === 0), criar novo
      if (reportId === 0) {
        await defectInspectionReportAPI.create({
          ...reportData,
          turbineId: turbineId || 0,
          language: 'EN',
        });

        Alert.alert('Sucesso', 'Relatório criado com sucesso!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
      // Se é edição (reportId > 0), atualizar
      else {
        await defectInspectionReportAPI.update(reportId, reportData);

        Alert.alert('Sucesso', 'Relatório atualizado com sucesso!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }

    } catch (error: any) {
      console.error('❌ Erro ao guardar relatório:', error);
      Alert.alert('Erro', 'Não foi possível guardar o relatório');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  // Solicitar permissões
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Precisamos de acesso à galeria');
      return false;
    }
    return true;
  };

  // Selecionar foto
  const handleSelectPhoto = async (index: number) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos];
      newPhotos[index] = {
        ...newPhotos[index],
        uri: result.assets[0].uri,
        timestamp: Date.now(),
        isUploaded: false,
      };
      setPhotos(newPhotos);
      setPhotoDialogVisible(false);
    }
  };

  // Tirar foto
  const handleTakePhoto = async (index: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Precisamos de acesso à câmara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos];
      newPhotos[index] = {
        ...newPhotos[index],
        uri: result.assets[0].uri,
        timestamp: Date.now(),
        isUploaded: false,
      };
      setPhotos(newPhotos);
      setPhotoDialogVisible(false);
    }
  };

  // Remover foto
  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Remover Foto',
      'Tem a certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const newPhotos = [...photos];
            newPhotos[index] = {
              ...newPhotos[index],
              uri: '',
              fileId: undefined,
              isUploaded: false,
            };
            setPhotos(newPhotos);
            setPhotoDialogVisible(false);
          },
        },
      ]
    );
  };

  // Campos adicionais
  const handleSaveField = () => {
    if (!fieldLabel.trim() || !fieldValue.trim()) {
      Alert.alert('Atenção', 'Preencha o título e valor do campo');
      return;
    }

    const newFields = [...additionalFields];
    if (editingFieldIndex !== null) {
      newFields[editingFieldIndex] = { label: fieldLabel, value: fieldValue };
    } else {
      newFields.push({ label: fieldLabel, value: fieldValue });
    }

    setAdditionalFields(newFields);
    setFieldDialogVisible(false);
    setFieldLabel('');
    setFieldValue('');
    setEditingFieldIndex(null);
  };

  const handleRemoveField = (index: number) => {
    Alert.alert(
      'Remover Campo',
      'Tem a certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const newFields = additionalFields.filter((_, i) => i !== index);
            setAdditionalFields(newFields);
          },
        },
      ]
    );
  };

  const openFieldDialog = (index?: number) => {
    if (index !== undefined) {
      setEditingFieldIndex(index);
      setFieldLabel(additionalFields[index].label);
      setFieldValue(additionalFields[index].value);
    } else {
      setEditingFieldIndex(null);
      setFieldLabel('');
      setFieldValue('');
    }
    setFieldDialogVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>A carregar relatório...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.white}
          size={24}
          onPress={() => router.back()}
        />
        <View style={styles.headerCenter}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            {reportId === 0 ? 'Novo Relatório' : 'Editar Relatório'}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            Defect Inspection Report
          </Text>
        </View>
        <IconButton
          icon="content-save"
          iconColor={colors.white}
          size={24}
          onPress={handleSave}
          disabled={saving}
        />
      </View>

      {/* Banner Offline */}
      {!isOnline && (
        <Banner visible={true} icon="wifi-off" style={styles.offlineBanner}>
          📵 Modo Offline - {isOfflineMode ? 'Editando relatório local' : 'Será guardado localmente'}
        </Banner>
      )}

      <ScrollView style={styles.scrollView}>
        {/* Informações Gerais */}
        <Card style={styles.card}>
          <Card.Title title="Informações Gerais" />
          <Card.Content>
            <TextInput
              label="Site *"
              value={site}
              onChangeText={setSite}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="WTG Number *"
              value={wtgNumber}
              onChangeText={setWtgNumber}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="WTG Type *"
              value={wtgType}
              onChangeText={setWtgType}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Year of Construction *"
              value={yearConstruction}
              onChangeText={setYearConstruction}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Fotografias - Página 2 */}
        <Card style={styles.card}>
          <Card.Title title="Fotografias - Página 2" />
          <Card.Content>
            <View style={styles.photosGrid}>
              {photos.slice(0, 4).map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoSlot}
                  onPress={() => {
                    setSelectedPhotoIndex(index);
                    setPhotoDialogVisible(true);
                  }}
                >
                  {photo.uri ? (
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <IconButton icon="camera" size={32} iconColor={colors.lightGray} />
                      <Text variant="bodySmall" style={styles.photoPlaceholderText}>
                        Posição {index + 1}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Fotografias - Página 3 */}
        <Card style={styles.card}>
          <Card.Title title="Fotografias - Página 3" />
          <Card.Content>
            <View style={styles.photosGrid}>
              {photos.slice(4, 8).map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoSlot}
                  onPress={() => {
                    setSelectedPhotoIndex(index + 4);
                    setPhotoDialogVisible(true);
                  }}
                >
                  {photo.uri ? (
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <IconButton icon="camera" size={32} iconColor={colors.lightGray} />
                      <Text variant="bodySmall" style={styles.photoPlaceholderText}>
                        Posição {index + 5}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Campos Adicionais */}
        <Card style={styles.card}>
          <Card.Title
            title="Campos Adicionais"
            right={(props) => (
              <IconButton
                {...props}
                icon="plus"
                onPress={() => openFieldDialog()}
              />
            )}
          />
          <Card.Content>
            {additionalFields.length === 0 ? (
              <Text style={styles.emptyText}>
                Nenhum campo adicional. Clique em + para adicionar.
              </Text>
            ) : (
              additionalFields.map((field, index) => (
                <View key={index} style={styles.fieldItem}>
                  <View style={styles.fieldContent}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldValueText}>{field.value}</Text>
                  </View>
                  <View style={styles.fieldActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => openFieldDialog(index)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleRemoveField(index)}
                    />
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Progresso de Upload */}
        {saving && uploadProgress > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text>A enviar fotografias...</Text>
              <ProgressBar progress={uploadProgress} style={styles.progressBar} />
            </Card.Content>
          </Card>
        )}

        {/* Botão Guardar */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          icon={isOnline ? 'cloud-upload' : 'content-save'}
        >
          {saving ? 'A guardar...' : isOnline ? 'Guardar' : 'Guardar Offline'}
        </Button>
      </ScrollView>

      {/* Diálogo de Foto */}
      <Portal>
        <Dialog visible={photoDialogVisible} onDismiss={() => setPhotoDialogVisible(false)}>
          <Dialog.Title>Escolher Foto</Dialog.Title>
          <Dialog.Content>
            <Button
              mode="outlined"
              icon="camera"
              onPress={() => {
                if (selectedPhotoIndex !== null) {
                  handleTakePhoto(selectedPhotoIndex);
                }
              }}
              style={styles.dialogButton}
            >
              Tirar Foto
            </Button>
            <Button
              mode="outlined"
              icon="image"
              onPress={() => {
                if (selectedPhotoIndex !== null) {
                  handleSelectPhoto(selectedPhotoIndex);
                }
              }}
              style={styles.dialogButton}
            >
              Escolher da Galeria
            </Button>
            {selectedPhotoIndex !== null && photos[selectedPhotoIndex]?.uri && (
              <Button
                mode="outlined"
                icon="delete"
                onPress={() => {
                  if (selectedPhotoIndex !== null) {
                    handleRemovePhoto(selectedPhotoIndex);
                  }
                }}
                style={styles.dialogButton}
                textColor={colors.error}
              >
                Remover Foto
              </Button>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPhotoDialogVisible(false)}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Diálogo de Campo Adicional */}
      <Portal>
        <Dialog visible={fieldDialogVisible} onDismiss={() => setFieldDialogVisible(false)}>
          <Dialog.Title>
            {editingFieldIndex !== null ? 'Editar Campo' : 'Adicionar Campo'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Título do Campo"
              value={fieldLabel}
              onChangeText={setFieldLabel}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Valor"
              value={fieldValue}
              onChangeText={setFieldValue}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFieldDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSaveField}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.white,
    opacity: 0.8,
  },
  offlineBanner: {
    backgroundColor: colors.warning + '20',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: spacing.md,
  },
  input: {
    marginBottom: spacing.sm,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoSlot: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: colors.lightGray,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontWeight: 'bold',
  },
  fieldValueText: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  fieldActions: {
    flexDirection: 'row',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
  },
  progressBar: {
    marginTop: spacing.sm,
  },
  saveButton: {
    margin: spacing.md,
    marginBottom: spacing.xl,
  },
  dialogButton: {
    marginBottom: spacing.sm,
  },
  dialogInput: {
    marginBottom: spacing.sm,
  },
});