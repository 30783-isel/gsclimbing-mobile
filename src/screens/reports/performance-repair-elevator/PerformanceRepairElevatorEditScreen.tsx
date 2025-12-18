/**
 * PerformanceRepairElevatorEditScreen
 * 
 * Ecrã de edição/criação do Performance Report Repair Elevator
 * Estrutura baseada no PDF:
 * - Página 1: Dados Fundamentais (Site, WTG no., WTG type, Year, Inspectors)
 * - Página 2: Statement of Work (Work completed, Windturbine operable)
 * - Página 3: Performance Report (texto livre)
 * - Página 4: Photo Documentation (até 4 fotos)
 * - Página 5: Additional Fields (até 3 campos extra)
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
  Platform,
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
  RadioButton,
  Chip,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

import { colors, spacing } from '@/constants/theme';
import { performanceRepairElevatorAPI } from '@/services/api/performanceRepairElevator.api';
import type {
  PerformanceRepairElevatorData,
  PhotoData,
  AdditionalField,
} from '@/types/performanceRepairElevator.types';
import { API_CONFIG } from '@/constants/api';
export default function PerformanceRepairElevatorEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reportId?: string;
    turbineId?: string;
    projectId?: string;
    turbineName?: string;
    projectName?: string;
  }>();

  // Parse de parâmetros
  const reportId = params.reportId ? parseInt(params.reportId, 10) : 0;
  const turbineId = params.turbineId ? parseInt(params.turbineId, 10) : 0;
  const projectId = params.projectId ? parseInt(params.projectId, 10) : 0;

  // Estados gerais
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [reportUuid, setReportUuid] = useState<string>('');

  // Página 1: Dados Fundamentais
  const [site, setSite] = useState('');
  const [wtgNumber, setWtgNumber] = useState('');
  const [wtgType, setWtgType] = useState('');
  const [yearConstruction, setYearConstruction] = useState('');
  const [inspectors, setInspectors] = useState('');

  // Página 2: Statement of Work
  const [workCompleted, setWorkCompleted] = useState<'yes' | 'no' | ''>('');
  const [windturbineOperable, setWindturbineOperable] = useState<'yes' | 'no' | 'limited' | ''>('');

  // Página 3: Performance Report
  const [performanceReport, setPerformanceReport] = useState('');

  // Página 4: Fotos (até 4 fotos)
  const [photos, setPhotos] = useState<PhotoData[]>([]);

  // Página 5: Additional Fields (até 3)
  const [additionalFields, setAdditionalFields] = useState<AdditionalField[]>([]);

  // Diálogos
  const [photoDialogVisible, setPhotoDialogVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [fieldDialogVisible, setFieldDialogVisible] = useState(false);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  // ====================================================================
  // useEffect - Carregar dados
  // ====================================================================
  useEffect(() => {
    checkConnection();
    loadData();
  }, []);

  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    setIsOnline(state.isConnected ?? false);
  };


const loadData = async () => {
  console.log('🔍 loadData called with reportId:', reportId);
  
  try {
    // Modo criar novo
    if (reportId === 0) {
      console.log('✅ Modo CREATE - inicializando fotos vazias');
      const emptyPhotos: PhotoData[] = Array.from({ length: 4 }, (_, i) => ({
        id: `photo-${i}`,
        uri: '',
        pageNumber: 4,
        position: i + 1,
        timestamp: Date.now(),
        isUploaded: false,
        description: '',
      }));
      setPhotos(emptyPhotos);
      setLoading(false);
      console.log('✅ CREATE mode initialized');
      return;
    }

    // Modo editar - carregar relatório existente
    console.log('📥 Fetching report from API...');
    const report = await performanceRepairElevatorAPI.getById(reportId);
    console.log('📦 Report received:', report);
    
    if (!report) {
      console.error('❌ Report is null/undefined');
      Alert.alert('Erro', 'Relatório não encontrado');
      setLoading(false);
      router.back();
      return;
    }
    
    console.log('📝 Setting basic fields...');
    setSite(report.site || '');
    setWtgNumber(report.wtgNumber || '');
    setWtgType(report.wtgType || '');
    setYearConstruction(report.yearConstruction || '');
    setReportUuid(report.uuid || '');
    
    console.log('📝 Setting specific fields...');
    setInspectors(report.inpectorsWorkers || '');
    setWorkCompleted((report.workCompleted || '') as any);
    setWindturbineOperable((report.turbineOperable || '') as any);
    setPerformanceReport(report.performanceReport || '');

    // Carregar campos adicionais
    const additionalFieldsData: AdditionalField[] = [];
    for (let i = 1; i <= 7; i++) {
      const label = report[`additionalField${i}Label`];
      const text = report[`additionalField${i}Text`];
      if (label && text) {
        additionalFieldsData.push({ label, value: text });
      }
    }
    setAdditionalFields(additionalFieldsData);

    // ✅ CARREGAR FOTOS - VERSÃO CORRIGIDA E COMPLETA
    console.log('📸 Loading photos...');
    try {
      const existingPhotos = await performanceRepairElevatorAPI.getPhotos(reportId);
      console.log('📸 Photos received:', existingPhotos?.length || 0);
      
      const initialPhotos: PhotoData[] = Array.from({ length: 4 }, (_, i) => {
        const existingPhoto = existingPhotos?.[i];
        
        if (existingPhoto) {
          // ✅ Seguir o padrão do DefectInspection
          const baseUrlClean = API_CONFIG.baseUrl.replace('/api/', '');
          const correctPath = existingPhoto.downloadUrl.replace(
            '/api/reports/files/download/',
            '/api/reports/mobile/files/download/'
          );
          const fullImageUrl = correctPath.startsWith('http')
            ? correctPath
            : `${baseUrlClean}${correctPath}`;
          
          console.log(`📸 Photo ${i + 1}:`, {
            fileId: existingPhoto.fileId,
            fullUrl: fullImageUrl
          });
          
          return {
            id: String(existingPhoto.fileId),
            uri: fullImageUrl,
            pageNumber: 4,
            position: i + 1,
            timestamp: Date.now(),
            isUploaded: true,
            fileId: String(existingPhoto.fileId),
            description: existingPhoto.description || '',
          };
        } else {
          return {
            id: `photo-${i}`,
            uri: '',
            pageNumber: 4,
            position: i + 1,
            timestamp: Date.now(),
            isUploaded: false,
            description: '',
          };
        }
      });
      
      setPhotos(initialPhotos);
      console.log('✅ Photos loaded');
      
    } catch (photoError) {
      console.error('⚠️ Error loading photos:', photoError);
      const emptyPhotos: PhotoData[] = Array.from({ length: 4 }, (_, i) => ({
        id: `photo-${i}`,
        uri: '',
        pageNumber: 4,
        position: i + 1,
        timestamp: Date.now(),
        isUploaded: false,
        description: '',
      }));
      setPhotos(emptyPhotos);
    }
    
    setLoading(false);
    console.log('✅ Data loaded successfully');
    
  } catch (error) {
    console.error('❌ Error in loadData:', error);
    Alert.alert('Erro', 'Não foi possível carregar o relatório');
    setLoading(false);
    router.back();
  }
};

  // ====================================================================
  // Validação
  // ====================================================================
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

  // ====================================================================
  // Save
  // ====================================================================
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      console.log('💾 Starting save process...');
      let savedReportUuid = reportUuid;
      let savedReportId = reportId;

      const data: PerformanceRepairElevatorData = {
        site,
        wtgNumber,
        wtgType,
        yearConstruction,
        inspectors,
        workCompleted,
        windturbineOperable,
        performanceReport,
        projectoId: projectId,
        turbinaId: turbineId,
        photos: [], // ✅ Criar sem fotos primeiro
        additionalFields,
      };

      // 1. Criar/Atualizar relatório PRIMEIRO (sem fotos)
      if (reportId === 0) {
        console.log('📝 Creating new report...');
        const result = await performanceRepairElevatorAPI.create(data);
        savedReportUuid = result.uuid;
        savedReportId = result.reportId;
        setReportUuid(result.uuid);
        console.log('✅ Report created:', result.reportId, result.uuid);
      } else {
        console.log('📝 Updating existing report...');
        await performanceRepairElevatorAPI.update(reportId, data);
        console.log('✅ Report updated');
      }

      // 2. Upload fotos novas (com o UUID do relatório)
      console.log('📸 Starting photo uploads...');
      const uploadedPhotos = [...photos];
      let photosChanged = false;

      for (let i = 0; i < uploadedPhotos.length; i++) {
        const photo = uploadedPhotos[i];
        if (photo.uri && !photo.isUploaded) {
          console.log(`📤 Uploading photo ${i + 1}...`);
          try {
            const uploaded = await performanceRepairElevatorAPI.uploadPhoto(photo, savedReportUuid);
            uploadedPhotos[i] = {
              ...photo,
              fileId: String(uploaded.fileId),
              isUploaded: true,
            };
            photosChanged = true;
            console.log(`✅ Photo ${i + 1} uploaded:`, uploaded.fileId);
          } catch (photoError) {
            console.error(`❌ Error uploading photo ${i + 1}:`, photoError);
            // Continuar com as outras fotos
          }
        }
      }

      // 3. Se houve fotos novas, atualizar relatório com IDs das fotos
      if (photosChanged) {
        console.log('📝 Updating report with photo IDs...');
        const finalData: PerformanceRepairElevatorData = {
          ...data,
          photos: uploadedPhotos,
        };
        await performanceRepairElevatorAPI.update(savedReportId, finalData);
        console.log('✅ Report updated with photos');
      }

      setPhotos(uploadedPhotos);
      console.log('✅ Save process completed');

      Alert.alert('Sucesso', 'Relatório guardado com sucesso', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('❌ Error saving report:', error);
      Alert.alert('Erro', error.message || 'Não foi possível guardar o relatório');
    } finally {
      setSaving(false);
    }
  };

  // ====================================================================
  // Fotos
  // ====================================================================
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'É necessária permissão para aceder à câmara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && selectedPhotoIndex !== null) {
      const newPhotos = [...photos];
      newPhotos[selectedPhotoIndex] = {
        ...newPhotos[selectedPhotoIndex],
        uri: result.assets[0].uri,
        fileId: undefined,
        isUploaded: false,
      };
      setPhotos(newPhotos);
      setPhotoDialogVisible(false);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'É necessária permissão para aceder à galeria');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && selectedPhotoIndex !== null) {
      const newPhotos = [...photos];
      newPhotos[selectedPhotoIndex] = {
        ...newPhotos[selectedPhotoIndex],
        uri: result.assets[0].uri,
        fileId: undefined,
        isUploaded: false,
      };
      setPhotos(newPhotos);
      setPhotoDialogVisible(false);
    }
  };

  const handleRemovePhoto = () => {
    if (selectedPhotoIndex === null) return;

    Alert.alert('Remover Foto', 'Tem a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          const newPhotos = [...photos];
          newPhotos[selectedPhotoIndex] = {
            ...newPhotos[selectedPhotoIndex],
            uri: '',
            fileId: undefined,
            isUploaded: false,
          };
          setPhotos(newPhotos);
          setPhotoDialogVisible(false);
        },
      },
    ]);
  };

  // ====================================================================
  // Campos Adicionais
  // ====================================================================
  const handleSaveField = () => {
    if (!fieldLabel.trim() || !fieldValue.trim()) {
      Alert.alert('Atenção', 'Preencha o título e valor do campo');
      return;
    }

    const newFields = [...additionalFields];
    if (editingFieldIndex !== null) {
      newFields[editingFieldIndex] = { label: fieldLabel, value: fieldValue };
    } else {
      if (newFields.length >= 3) {
        Alert.alert('Limite', 'Máximo de 3 campos adicionais');
        return;
      }
      newFields.push({ label: fieldLabel, value: fieldValue });
    }

    setAdditionalFields(newFields);
    setFieldDialogVisible(false);
    setFieldLabel('');
    setFieldValue('');
    setEditingFieldIndex(null);
  };

  const handleRemoveField = (index: number) => {
    Alert.alert('Remover Campo', 'Tem a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          const newFields = additionalFields.filter((_, i) => i !== index);
          setAdditionalFields(newFields);
        },
      },
    ]);
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

  // ====================================================================
  // Render
  // ====================================================================
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
            Performance Report Repair Elevator
          </Text>
        </View>
        <Chip
          icon={isOnline ? 'wifi' : 'wifi-off'}
          style={isOnline ? styles.onlineChip : styles.offlineChip}
        >
          {isOnline ? 'Online' : 'Offline'}
        </Chip>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Página 1: Dados Fundamentais */}
        <Card style={styles.card}>
          <Card.Title title="1. Dados Fundamentais" titleVariant="titleLarge" />
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
            <TextInput
              label="Inspectors/Workers"
              value={inspectors}
              onChangeText={setInspectors}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Página 2: Statement of Work */}
        <Card style={styles.card}>
          <Card.Title title="2. Statement of Work" titleVariant="titleLarge" />
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionLabel}>
              Work Completed
            </Text>
            <RadioButton.Group value={workCompleted} onValueChange={setWorkCompleted as any}>
              <View style={styles.radioRow}>
                <RadioButton.Item label="Yes" value="yes" />
                <RadioButton.Item label="No" value="no" />
              </View>
            </RadioButton.Group>

            <Divider style={styles.divider} />

            <Text variant="titleSmall" style={styles.sectionLabel}>
              Windturbine Operable
            </Text>
            <RadioButton.Group
              value={windturbineOperable}
              onValueChange={setWindturbineOperable as any}
            >
              <View style={styles.radioRow}>
                <RadioButton.Item label="Yes" value="yes" />
                <RadioButton.Item label="No" value="no" />
                <RadioButton.Item label="Limited" value="limited" />
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Página 3: Performance Report */}
        <Card style={styles.card}>
          <Card.Title title="3. Performance Report" titleVariant="titleLarge" />
          <Card.Content>
            <TextInput
              label="Descrição do desempenho"
              value={performanceReport}
              onChangeText={setPerformanceReport}
              mode="outlined"
              multiline
              numberOfLines={8}
              style={styles.textArea}
              placeholder="Descreva o desempenho, trabalhos realizados, observações..."
            />
          </Card.Content>
        </Card>

        {/* Página 4: Photo Documentation */}
        <Card style={styles.card}>
          <Card.Title title="4. Photo Documentation" titleVariant="titleLarge" />
          <Card.Content>
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoBox}
                  onPress={() => {
                    setSelectedPhotoIndex(index);
                    setPhotoDialogVisible(true);
                  }}
                >
                  {photo.uri ? (
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <IconButton icon="camera-plus" size={32} iconColor={colors.textSecondary} />
                      <Text variant="bodySmall" style={styles.photoPlaceholderText}>
                        Foto {index + 1}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Página 5: Additional Fields */}
        <Card style={styles.card}>
          <Card.Title
            title="5. Campos Adicionais"
            titleVariant="titleLarge"
            right={() => (
              <IconButton
                icon="plus"
                onPress={() => openFieldDialog()}
                disabled={additionalFields.length >= 3}
              />
            )}
          />
          <Card.Content>
            {additionalFields.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                Nenhum campo adicional. Clique em + para adicionar.
              </Text>
            ) : (
              additionalFields.map((field, index) => (
                <Card key={index} style={styles.fieldCard}>
                  <Card.Content>
                    <View style={styles.fieldHeader}>
                      <Text variant="titleSmall">{field.label}</Text>
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
                    <Text variant="bodyMedium">{field.value}</Text>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Botão de Guardar */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          {saving ? 'A guardar...' : 'Guardar Relatório'}
        </Button>
      </ScrollView>

      {/* Diálogo de Foto */}
      <Portal>
        <Dialog visible={photoDialogVisible} onDismiss={() => setPhotoDialogVisible(false)}>
          <Dialog.Title>Foto {(selectedPhotoIndex ?? 0) + 1}</Dialog.Title>
          <Dialog.Content>
            <Button
              icon="camera"
              mode="contained"
              onPress={handleTakePhoto}
              style={styles.dialogButton}
            >
              Tirar Foto
            </Button>
            <Button
              icon="image"
              mode="contained"
              onPress={handlePickPhoto}
              style={styles.dialogButton}
            >
              Escolher da Galeria
            </Button>
            {selectedPhotoIndex !== null && photos[selectedPhotoIndex].uri && (
              <Button
                icon="delete"
                mode="outlined"
                onPress={handleRemovePhoto}
                style={styles.dialogButton}
                textColor={colors.error}
              >
                Remover Foto
              </Button>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPhotoDialogVisible(false)}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Diálogo de Campo Adicional */}
        <Dialog visible={fieldDialogVisible} onDismiss={() => setFieldDialogVisible(false)}>
          <Dialog.Title>
            {editingFieldIndex !== null ? 'Editar Campo' : 'Novo Campo'}
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

// ====================================================================
// Styles
// ====================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        paddingTop: spacing.xl,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.white,
    opacity: 0.8,
  },
  onlineChip: {
    backgroundColor: colors.success,
  },
  offlineChip: {
    backgroundColor: colors.warning,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  input: {
    marginBottom: spacing.md,
  },
  textArea: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  divider: {
    marginVertical: spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoBox: {
    width: '48%',
    aspectRatio: 4 / 3,
    marginBottom: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: colors.textSecondary,
  },
  fieldCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.secondary,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  fieldActions: {
    flexDirection: 'row',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  saveButtonContent: {
    paddingVertical: spacing.sm,
  },
  dialogButton: {
    marginTop: spacing.sm,
  },
  dialogInput: {
    marginBottom: spacing.md,
  },
});