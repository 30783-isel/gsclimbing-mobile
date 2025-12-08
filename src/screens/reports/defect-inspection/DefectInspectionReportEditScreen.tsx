/**
 * Ecrã de Edição do Defect Inspection Report
 * Permite editar informações gerais, trocar imagens e campos adicionais
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
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { colors, spacing } from '@/constants/theme';
import { API_CONFIG } from '@/constants/api';
import httpClient from '@/services/httpClient';
import type {
  DefectInspectionReportData,
  PhotoData,
  AdditionalField,
} from '@/types/defectInspectionReport.types';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';

export default function DefectInspectionReportEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reportId: string;
  }>();
  
  const reportId = parseInt(params.reportId || '0', 10);

  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Dados do formulário
  const [reportUuid, setReportUuid] = useState(''); // UUID do relatório
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

  // Carregar dados do relatório
  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      console.log('🔍 DEBUG: Starting loadReport for reportId:', reportId);
      
      const report = await defectInspectionReportAPI.getById(reportId);
      console.log('✅ DEBUG: Report loaded:', {
        reportId: report.reportId,
        uuid: report.uuid,
        site: report.site,
        numberPictures: report.numberPictures
      });
      
      // Guardar UUID para upload de fotos
      setReportUuid(report.uuid);
      
      // Preencher campos
      setSite(report.site || '');
      setWtgNumber(report.wtgNumber || '');
      setWtgType(report.wtgType || '');
      setYearConstruction(report.yearConstruction || '');
      
      // ✅ CARREGAR FOTOS EXISTENTES DO SERVIDOR
      console.log('📸 DEBUG: Loading photos from server...');
      console.log('📸 DEBUG: API_CONFIG.baseUrl:', API_CONFIG.baseUrl);
      
      const existingPhotos = await defectInspectionReportAPI.getPhotos(reportId);
      console.log('✅ DEBUG: Photos response:', {
        count: existingPhotos.length,
        photos: existingPhotos
      });
      
      // Criar array com 8 posições (2 páginas x 4 fotos)
      const initialPhotos: PhotoData[] = Array.from({ length: 8 }, (_, i) => {
        const pageNumber = i < 4 ? 2 : 3;
        const position = (i % 4) + 1;
        
        // Procurar se existe foto do servidor para esta posição
        const existingPhoto = existingPhotos[i];
        
        if (existingPhoto) {
          console.log(`📷 DEBUG Photo ${i + 1}:`, {
            fileId: existingPhoto.fileId,
            hash: existingPhoto.hash,
            downloadUrl: existingPhoto.downloadUrl,
            name: existingPhoto.name
          });
          
          // ✅ CONSTRUIR URL COMPLETO para a imagem
          // O servidor retorna: "/api/reports/files/download/{hash}"
          // Mas o endpoint correto é: "/api/reports/mobile/files/download/{hash}"
          const baseUrlClean = API_CONFIG.baseUrl.replace('/api/', '');
          
          // Corrigir o path para usar o endpoint mobile correto
          const correctPath = existingPhoto.downloadUrl.replace(
            '/api/reports/files/download/',
            '/api/reports/mobile/files/download/'
          );
          
          const fullImageUrl = correctPath.startsWith('http') 
            ? correctPath 
            : `${baseUrlClean}${correctPath}`;
          
          console.log(`🔗 DEBUG Photo ${i + 1} Full URL:`, fullImageUrl);
          
          return {
            id: `photo-${i}`,
            uri: fullImageUrl,
            description: existingPhoto.description || '',
            pageNumber,
            position,
            timestamp: Date.now(),
            isUploaded: true,
            fileId: existingPhoto.fileId.toString(),
          };
        }
        
        // Slot vazio
        console.log(`⬜ DEBUG Photo ${i + 1}: Empty slot`);
        return {
          id: `photo-${i}`,
          uri: '',
          description: '',
          pageNumber,
          position,
          timestamp: Date.now(),
          isUploaded: false,
        };
      });
      
      console.log('✅ DEBUG: initialPhotos array created:', initialPhotos.map(p => ({
        id: p.id,
        hasUri: !!p.uri,
        uri: p.uri.substring(0, 50) + '...',
        isUploaded: p.isUploaded
      })));
      
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
      
      console.log('✅ DEBUG: loadReport completed successfully');
      
    } catch (error) {
      console.error('❌ DEBUG: Error in loadReport:', error);
      console.error('❌ DEBUG: Error details:', {
        message: error.message,
        stack: error.stack
      });
      Alert.alert('Erro', 'Não foi possível carregar o relatório');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar permissões
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Precisamos de acesso à galeria de fotos');
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
        isUploaded: false, // Foto nova precisa de upload
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
        isUploaded: false, // Foto nova precisa de upload
      };
      setPhotos(newPhotos);
      setPhotoDialogVisible(false);
    }
  };

  // Remover foto
  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Remover Foto',
      'Tem a certeza que deseja remover esta foto?',
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
              timestamp: Date.now(),
              isUploaded: false,
            };
            setPhotos(newPhotos);
          },
        },
      ]
    );
  };

  // Abrir diálogo de foto
  const openPhotoDialog = (index: number) => {
    setSelectedPhotoIndex(index);
    setPhotoDialogVisible(true);
  };

  // Adicionar/Editar campo adicional
  const handleSaveField = () => {
    if (!fieldLabel.trim() || !fieldValue.trim()) {
      Alert.alert('Atenção', 'Preencha o título e o valor do campo');
      return;
    }

    const newFields = [...additionalFields];
    if (editingFieldIndex !== null) {
      // Editar existente
      newFields[editingFieldIndex] = {
        label: fieldLabel,
        value: fieldValue,
      };
    } else {
      // Adicionar novo
      if (newFields.length >= 7) {
        Alert.alert('Limite Atingido', 'Máximo de 7 campos adicionais');
        return;
      }
      newFields.push({
        label: fieldLabel,
        value: fieldValue,
      });
    }

    setAdditionalFields(newFields);
    closeFieldDialog();
  };

  // Remover campo adicional
  const handleRemoveField = (index: number) => {
    Alert.alert(
      'Remover Campo',
      'Tem a certeza que deseja remover este campo?',
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

  // Abrir diálogo de campo
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

  // Fechar diálogo de campo
  const closeFieldDialog = () => {
    setFieldDialogVisible(false);
    setEditingFieldIndex(null);
    setFieldLabel('');
    setFieldValue('');
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

      // 1. Upload das fotos novas/alteradas
      const photoFileIds: string[] = [];
      const photosToUpload = photos.filter(p => p.uri && !p.isUploaded);
      
      if (photosToUpload.length > 0) {
        console.log(`📸 Uploading ${photosToUpload.length} photos...`);
        
        for (let i = 0; i < photosToUpload.length; i++) {
          const photo = photosToUpload[i];
          try {
            console.log(`📤 Uploading photo ${i + 1}/${photosToUpload.length}`);
            
            // Criar FormData
            const formData = new FormData();
            const filename = photo.uri.split('/').pop() || `photo-${i + 1}.jpg`;
            
            // Adicionar ficheiro ao FormData
            if (photo.uri.startsWith('data:')) {
              // Data URL - converter para Blob
              const response = await fetch(photo.uri);
              const blob = await response.blob();
              console.log('   Blob criado:', blob.type, blob.size, 'bytes');
              // Usar Blob com cast para any para aceitar 3 parâmetros
              (formData as any).append('file', blob, filename);
            } else if (photo.uri.startsWith('http')) {
              // URL remota
              const response = await fetch(photo.uri);
              const blob = await response.blob();
              console.log('   Blob criado:', blob.type, blob.size, 'bytes');
              (formData as any).append('file', blob, filename);
            } else {
              // React Native - usar objeto com uri, type, name
              const file = {
                uri: photo.uri,
                type: 'image/jpeg',
                name: filename,
              } as any;
              formData.append('file', file);
            }
            
            // Adicionar descrição
            formData.append('description', photo.description || `Photo ${i + 1}`);
            
            console.log('📤 Enviando para:', `${API_CONFIG.baseFilesUrl}upload/${reportUuid}`);
            
            // Upload para o endpoint correto
            const response = await httpClient.post(
              `${API_CONFIG.baseFilesUrl}upload/${reportUuid}`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            );
            
            if (response.data.fileId) {
              photoFileIds.push(response.data.fileId);
              console.log(`✅ Photo ${i + 1} uploaded: ${response.data.fileId}`);
            }
            
            setUploadProgress((i + 1) / photosToUpload.length);
          } catch (error: any) {
            console.error(`❌ Erro ao fazer upload da foto ${i + 1}:`, error);
            console.error('   Status:', error.response?.status);
            console.error('   Data:', error.response?.data);
            // Continuar com as outras fotos mesmo se uma falhar
          }
        }
      }

      // 2. Preparar dados do relatório
      const reportData: any = {
        site,
        wtgNumber,
        wtgType,
        yearConstruction,
        photoFileIds,
      };

      // Adicionar campos adicionais
      additionalFields.forEach((field, index) => {
        reportData[`additionalField${index + 1}Label`] = field.label;
        reportData[`additionalField${index + 1}Text`] = field.value;
      });

      // 3. Atualizar relatório
      await defectInspectionReportAPI.update(reportId, reportData);

      Alert.alert(
        'Sucesso',
        'Relatório atualizado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Erro ao guardar relatório:', error);
      Alert.alert('Erro', 'Não foi possível guardar o relatório');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
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
            Editar Relatório
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

      <ScrollView style={styles.scrollView}>
        {/* Informações Gerais */}
        <Card style={styles.card}>
          <Card.Title title="Informações Gerais" />
          <Card.Content>
            <TextInput
              label="Site"
              value={site}
              onChangeText={setSite}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="WTG Number"
              value={wtgNumber}
              onChangeText={setWtgNumber}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="WTG Type"
              value={wtgType}
              onChangeText={setWtgType}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Year of Construction"
              value={yearConstruction}
              onChangeText={setYearConstruction}
              mode="outlined"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Fotografias - Página 2 */}
        <Card style={styles.card}>
          <Card.Title title="Fotografias - Página 2" />
          <Card.Content>
            <View style={styles.photosGrid}>
              {photos.slice(0, 4).map((photo, index) => {
                console.log(`🖼️ DEBUG Rendering Photo Page 2 - ${index + 1}:`, {
                  id: photo.id,
                  hasUri: !!photo.uri,
                  uri: photo.uri ? photo.uri.substring(0, 80) : 'empty',
                  isUploaded: photo.isUploaded
                });
                
                return (
                  <View key={photo.id} style={styles.photoContainer}>
                    <TouchableOpacity
                      style={styles.photoBox}
                      onPress={() => openPhotoDialog(index)}
                    >
                      {photo.uri ? (
                        <>
                          <Image 
                            source={{ uri: photo.uri }} 
                            style={styles.photo}
                            onLoad={() => console.log(`✅ DEBUG Photo ${index + 1} loaded successfully`)}
                            onError={(e) => console.error(`❌ DEBUG Photo ${index + 1} failed to load:`, e.nativeEvent)}
                          />
                          <View style={styles.photoOverlay}>
                            <IconButton
                              icon="pencil"
                              size={16}
                              iconColor={colors.white}
                              onPress={() => openPhotoDialog(index)}
                            />
                            <IconButton
                              icon="delete"
                              size={16}
                              iconColor={colors.white}
                              onPress={() => handleRemovePhoto(index)}
                            />
                          </View>
                        </>
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <IconButton icon="camera-plus" size={32} />
                          <Text style={styles.photoPlaceholderText}>
                            Foto {index + 1}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Fotografias - Página 3 */}
        <Card style={styles.card}>
          <Card.Title title="Fotografias - Página 3" />
          <Card.Content>
            <View style={styles.photosGrid}>
              {photos.slice(4, 8).map((photo, index) => {
                console.log(`🖼️ DEBUG Rendering Photo Page 3 - ${index + 5}:`, {
                  id: photo.id,
                  hasUri: !!photo.uri,
                  uri: photo.uri ? photo.uri.substring(0, 80) : 'empty',
                  isUploaded: photo.isUploaded
                });
                
                return (
                  <View key={photo.id} style={styles.photoContainer}>
                    <TouchableOpacity
                      style={styles.photoBox}
                      onPress={() => openPhotoDialog(index + 4)}
                    >
                      {photo.uri ? (
                        <>
                          <Image 
                            source={{ uri: photo.uri }} 
                            style={styles.photo}
                            onLoad={() => console.log(`✅ DEBUG Photo ${index + 5} loaded successfully`)}
                            onError={(e) => console.error(`❌ DEBUG Photo ${index + 5} failed to load:`, e.nativeEvent)}
                          />
                          <View style={styles.photoOverlay}>
                            <IconButton
                              icon="pencil"
                              size={16}
                              iconColor={colors.white}
                              onPress={() => openPhotoDialog(index + 4)}
                            />
                            <IconButton
                              icon="delete"
                              size={16}
                              iconColor={colors.white}
                              onPress={() => handleRemovePhoto(index + 4)}
                            />
                          </View>
                        </>
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <IconButton icon="camera-plus" size={32} />
                          <Text style={styles.photoPlaceholderText}>
                            Foto {index + 5}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
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
        >
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </ScrollView>

      {/* Diálogo de Foto */}
      <Portal>
        <Dialog
          visible={photoDialogVisible}
          onDismiss={() => setPhotoDialogVisible(false)}
        >
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
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPhotoDialogVisible(false)}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Diálogo de Campo Adicional */}
      <Portal>
        <Dialog visible={fieldDialogVisible} onDismiss={closeFieldDialog}>
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
            <Button onPress={closeFieldDialog}>Cancelar</Button>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    elevation: 4,
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.white,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  card: {
    margin: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: spacing.md,
  },
  photoBox: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: 8,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  photoPlaceholderText: {
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  fieldValueText: {
    color: colors.textSecondary,
  },
  fieldActions: {
    flexDirection: 'row',
  },
  saveButton: {
    margin: spacing.md,
    marginTop: spacing.lg,
  },
  dialogButton: {
    marginBottom: spacing.sm,
  },
  dialogInput: {
    marginBottom: spacing.md,
  },
  progressBar: {
    marginTop: spacing.sm,
  },
});