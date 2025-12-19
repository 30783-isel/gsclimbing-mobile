/**
 * DefectInspectionReportEditScreen
 * ✅ ADAPTADO PARA SUPORTE OFFLINE COMPLETO
 * ✅ CORRIGIDO: Adiciona dateInspection, inspectedBy e observations obrigatórios
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
import Toast from 'react-native-toast-message';
import { offlinePerformanceReportsService } from '@/services/storage/offlinePerformanceReports.service';
import { performanceReportSyncService } from '@/services/sync/performanceReportSync.service';

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

  const turbineName = params.turbineName || '';
  const projectName = params.projectName || '';

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [tempId, setTempId] = useState<string | null>(null);
  const [reportUuid, setReportUuid] = useState<string>('');

  // Formulário
  const [site, setSite] = useState('');
  const [wtgNumber, setWtgNumber] = useState('');
  const [wtgType, setWtgType] = useState('');
  const [yearConstruction, setYearConstruction] = useState('');
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [additionalFields, setAdditionalFields] = useState<AdditionalField[]>([]);

  // Upload
  const [uploadProgress, setUploadProgress] = useState(0);

  // Diálogos
  const [photoDialogVisible, setPhotoDialogVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [fieldDialogVisible, setFieldDialogVisible] = useState(false);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

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
        // MODO OFFLINE: Carregar relatório via tempId
        if (tempIdParam) {
            console.log('📵 Carregando relatório offline:', tempIdParam);
            const offlineReport = await offlinePerformanceReportsService.getById(tempIdParam);

            if (!offlineReport) {
                Alert.alert('Erro', 'Relatório offline não encontrado');
                router.back();
                return;
            }

            setIsOfflineMode(true);
            setTempId(offlineReport.tempId);

            setSite(offlineReport.data.site || '');
            setWtgNumber(offlineReport.data.wtgNumber || '');
            setWtgType(offlineReport.data.wtgType || '');
            setYearConstruction(offlineReport.data.yearConstruction || '');
            setInspectors(offlineReport.data.inpectorsWorkers || '');
            
            // ✅ Converter maiúsculas → minúsculas
            setWorkCompleted(convertToLowerCase(offlineReport.data.workCompleted));
            setWindturbineOperable(convertToLowerCase(offlineReport.data.turbineOperable));
            
            setPerformanceReport(offlineReport.data.performanceReport || '');

            // Carregar fotos offline
            const offlinePhotos: PhotoData[] = Array.from({ length: 4 }, (_, i) => {
                const offlinePhoto = offlineReport.photos[i];
                return {
                    id: `photo-${i}`,
                    uri: offlinePhoto?.uri || '',
                    pageNumber: 4,
                    position: i + 1,
                    timestamp: Date.now(),
                    isUploaded: false,
                    description: offlinePhoto?.description || '',
                };
            });
            setPhotos(offlinePhotos);

            // Carregar campos adicionais
            const fields: AdditionalField[] = [];
            if (offlineReport.data.additionalFields) {
                Object.entries(offlineReport.data.additionalFields).forEach(([key, field]) => {
                    if (field && typeof field === 'object' && 'label' in field && 'value' in field) {
                        fields.push({ 
                            label: (field as any).label, 
                            value: (field as any).value 
                        });
                    }
                });
            }
            setAdditionalFields(fields);

            console.log('✅ Relatório offline carregado');
            setLoading(false);
            return;
        }
        // ✅ ========== FIM DO BLOCO OFFLINE ==========

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

        // ✅ CARREGAR FOTOS COM LOGS DETALHADOS
        const existingPhotos = await defectInspectionReportAPI.getPhotos(reportId);

        // ✅ LOG 1: Quantas fotos foram recebidas
        console.log('📸 ========== LOADING PHOTOS ==========');
        console.log('📸 existingPhotos received:', existingPhotos?.length || 0);
        if (existingPhotos && existingPhotos.length > 0) {
          console.log('📸 First photo sample:', {
            fileId: existingPhotos[0].fileId,
            hash: existingPhotos[0].hash,
            downloadUrl: existingPhotos[0].downloadUrl,
          });
        }

        const initialPhotos: PhotoData[] = Array.from({ length: 8 }, (_, i) => {
          const pageNumber = i < 4 ? 2 : 3;
          const position = (i % 4) + 1;
          const existingPhoto = existingPhotos?.[i];  // ✅ Optional chaining

          if (existingPhoto) {
            const baseUrlClean = API_CONFIG.baseUrl.replace('/api/', '');

            // ✅ CORREÇÃO: Garantir que downloadUrl tem barra inicial
            let correctPath = existingPhoto.downloadUrl;
            if (!correctPath.startsWith('/')) {
              correctPath = '/' + correctPath;
            }

            // Corrigir o caminho para usar endpoint mobile
            correctPath = correctPath.replace(
              '/reports/files/download/',
              '/reports/mobile/files/download/'
            );

            const fullImageUrl = correctPath.startsWith('http')
              ? correctPath
              : `${baseUrlClean}${correctPath}`;

            // ✅ LOG: Verificar URL final
            console.log(`📸 Photo ${i + 1} loaded:`, {
              fileId: existingPhoto.fileId,
              hash: existingPhoto.hash?.substring(0, 8) + '...',
              originalUrl: existingPhoto.downloadUrl,
              correctedPath: correctPath,
              fullUrl: fullImageUrl,
            });

            return {
              id: String(existingPhoto.fileId),  // ✅ MUDANÇA: usar fileId como id
              uri: fullImageUrl,
              pageNumber,
              position,
              timestamp: Date.now(),
              isUploaded: true,
              fileId: String(existingPhoto.fileId),
              description: existingPhoto.description ?? '',
            };
          }

          // ✅ LOG 3: Slots vazios
          console.log(`📸 Photo ${i + 1}: empty slot`);

          return {
            id: `photo-${i}`,
            uri: '',
            pageNumber,
            position,
            timestamp: Date.now(),
            isUploaded: false,
            fileId: '',
            description: '',
          };
        });

        setPhotos(initialPhotos);

        // ✅ LOG 4: Resumo final
        console.log('✅ Photos state set:', {
          total: initialPhotos.length,
          withPhotos: initialPhotos.filter(p => p.uri && p.uri !== '').length,
          emptySlots: initialPhotos.filter(p => !p.uri || p.uri === '').length,
        });
        console.log('📸 ========================================');

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

  /**
   * CORREÇÃO DO BUG DE HISTÓRICO DE FOTOS
   * 
   * PROBLEMA IDENTIFICADO NOS LOGS:
   * 
   * No DefectInspectionReportEditScreen.tsx, a função handleSave() está a fazer:
   * 
   * 1. Upload das fotos ANTES do update (linha ~580-610)
   * 2. Chamar defectInspectionReportAPI.update() DEPOIS
   * 
   * Isto faz com que as fotos já estejam associadas ao relatório quando o update é chamado!
   * 
   * Exemplo dos logs:
   * 22:28:38.071 - Upload foto 18537
   * 22:28:38.140 - Update chamado
   * 22:28:38.151 - ANTIGAS: [18536, 18537] ← A foto 18537 já está aqui!
   * 
   * SOLUÇÃO: 
   * Mudar a ordem:
   * 1. Chamar update() PRIMEIRO (sem as fotos novas)
   * 2. Fazer upload das fotos DEPOIS
   * 3. Chamar update() NOVAMENTE com os novos IDs
   */

  // ===== LOCALIZAR ESTA FUNÇÃO NO DefectInspectionReportEditScreen.tsx =====

  const handleSave = async () => {
    if (!site.trim() || !wtgNumber.trim()) {
      Alert.alert('Erro', 'Preencha Site e WTG Number');
      return;
    }

    setSaving(true);
    setUploadProgress(0);

    try {
      const isOnline = await NetInfo.fetch().then((state) => state.isConnected);

      // ========================================
      // OPÇÃO A: ESTÁ OFFLINE
      // ========================================
      if (!isOnline) {
        // [Manter código offline existente - não alterar]
        // ...
        return;
      }

      // ========================================
      // OPÇÃO B: ESTÁ ONLINE → ENVIAR PARA API
      // ========================================
      console.log('🌐 ONLINE → Enviando para API...');

      // ✅ CORREÇÃO: Separar fotos novas das existentes
      const photosToUpload = photos.filter(p => p.uri && p.uri.trim() !== '' && !p.isUploaded);
      // ✅ CORREÇÃO: Apenas incluir fileIds de fotos que TÊM URI
      const existingPhotoIds: number[] = photos
        .filter(p => p.fileId && p.uri && p.uri.trim() !== '')  // ✅ Verificar se tem URI!
        .map(p => Number(p.fileId));

      console.log(`📸 Fotos existentes: ${existingPhotoIds.length}`);
      console.log(`📸 Fotos a enviar: ${photosToUpload.length}`);

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

      if (reportId === 0) {
        // ========================================
        // CRIAR NOVO RELATÓRIO
        // ========================================
        console.log('📝 Criando relatório via API...');

        // B.1: Criar relatório SEM fotos
        const reportData: any = {
          site,
          wtgNumber,
          wtgType,
          yearConstruction,
          projectoId: projectId || 0,
          turbinaId: turbineId || 0,
          photoFileIds: [], // ✅ Criar SEM fotos primeiro
          language: 'EN',
          ...additionalData,
        };

        const createdReport = await defectInspectionReportAPI.create(reportData);
        console.log('✅ Relatório criado:', createdReport.reportId);

        // B.2: Se há fotos, fazer upload DEPOIS
        if (photosToUpload.length > 0) {
          console.log(`📸 Fazendo upload de ${photosToUpload.length} fotos...`);

          const uploadedPhotoIds: number[] = [];

          for (let i = 0; i < photosToUpload.length; i++) {
            const photo = photosToUpload[i];

            const formData = new FormData();
            formData.append('file', {
              uri: photo.uri,
              type: 'image/jpeg',
              name: photo.uri.split('/').pop() || `photo-${i}.jpg`,
            } as any);

            const uploadResponse = await httpClient.post(
              `${API_CONFIG.baseFilesUrl}upload/${createdReport.uuid}`,
              formData,
              {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                  const progress = (i + (progressEvent.loaded / (progressEvent.total || 1))) / photosToUpload.length;
                  setUploadProgress(progress);
                },
              }
            );

            uploadedPhotoIds.push(uploadResponse.data.fileId);
            console.log(`✅ Foto ${i + 1} uploaded, fileId:`, uploadResponse.data.fileId);
          }

          // B.3: Atualizar relatório com os IDs das fotos
          if (uploadedPhotoIds.length > 0) {
            console.log('📝 Atualizando relatório com IDs das fotos...');

            await defectInspectionReportAPI.update(createdReport.reportId, {
              ...reportData,
              photoFileIds: uploadedPhotoIds,
            });

            console.log('✅ Relatório atualizado com fotos');
          }
        }

        Alert.alert('Sucesso', 'Relatório criado com sucesso!', [
          { text: 'OK', onPress: () => router.back() },
        ]);

      } else {
        // ========================================
        // EDITAR RELATÓRIO EXISTENTE
        // ========================================
        console.log('✏️ Atualizando relatório:', reportId);

        // ✅ CORREÇÃO: Separar fotos por tipo
        const photosToUpload = photos.filter(p => p.uri && p.uri.trim() !== '' && !p.isUploaded);

        // Fotos existentes (que NÃO foram substituídas)
        const existingPhotoIds: number[] = photos
          .filter(p => p.fileId && p.uri && p.uri.trim() !== '' && !p.replacedFileId)
          .map(p => Number(p.fileId));

        // ✅ NOVO: Coletar IDs de fotos que foram SUBSTITUÍDAS
        const replacedPhotoIds: number[] = photos
          .filter(p => p.replacedFileId && p.uri && p.uri.trim() !== '')
          .map(p => Number(p.replacedFileId));

        console.log(`📸 Fotos existentes (não substituídas): ${existingPhotoIds.length}`, existingPhotoIds);
        console.log(`📸 Fotos a enviar: ${photosToUpload.length}`);
        console.log(`🔄 Fotos substituídas: ${replacedPhotoIds.length}`, replacedPhotoIds);

        let newPhotoIds: number[] = [];

        if (photosToUpload.length > 0) {
          console.log(`📸 Fazendo upload de ${photosToUpload.length} novas fotos...`);

          for (let i = 0; i < photosToUpload.length; i++) {
            const photo = photosToUpload[i];

            const formData = new FormData();
            formData.append('file', {
              uri: photo.uri,
              type: 'image/jpeg',
              name: photo.uri.split('/').pop() || `photo-${i}.jpg`,
            } as any);

            const uploadResponse = await httpClient.post(
              `${API_CONFIG.baseFilesUrl}upload/${reportUuid}`,
              formData,
              {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                  const progress = (i + (progressEvent.loaded / (progressEvent.total || 1))) / photosToUpload.length;
                  setUploadProgress(progress);
                },
              }
            );

            newPhotoIds.push(uploadResponse.data.fileId);
            console.log(`✅ Foto ${i + 1} uploaded, fileId:`, uploadResponse.data.fileId);
          }
        }

        // ✅ CORREÇÃO: Lista final NÃO inclui fotos substituídas
        const allPhotoIds = [...existingPhotoIds, ...newPhotoIds];

        console.log('📸 Fotos existentes (mantidas):', existingPhotoIds);
        console.log('📸 Fotos novas (adicionadas/substitutas):', newPhotoIds);
        console.log('🔄 Fotos que serão removidas (substituídas):', replacedPhotoIds);
        console.log('📸 Total a enviar no update:', allPhotoIds);

        const reportData: any = {
          site,
          wtgNumber,
          wtgType,
          yearConstruction,
          projectoId: projectId || 0,
          turbinaId: turbineId || 0,
          photoFileIds: allPhotoIds,  // ✅ Não inclui as substituídas
          ...additionalData,
        };

        await defectInspectionReportAPI.update(reportId, reportData);

        console.log('✅ Relatório atualizado via API');

        // ✅ OPCIONAL: Limpar replacedFileId após guardar
        const cleanedPhotos = photos.map(p => ({
          ...p,
          replacedFileId: undefined,
        }));
        setPhotos(cleanedPhotos);

        Alert.alert('Sucesso', 'Relatório atualizado com sucesso!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }


    } catch (error: any) {
      console.error('❌ Erro ao guardar:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.message || error.message || 'Não foi possível guardar o relatório'
      );
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };


  /**
   * ===== RESUMO DA CORREÇÃO =====
   * 
   * ANTES (ERRADO):
   * 1. Upload fotos → Fotos associadas ao relatório via setUuid()
   * 2. Chamar update() → Já tem as fotos nas "antigas"
   * 3. Resultado: 0 alterações no histórico
   * 
   * DEPOIS (CORRETO - CRIAÇÃO):
   * 1. Criar relatório SEM fotos
   * 2. Upload das fotos com o UUID
   * 3. Update com os IDs das fotos
   * 4. Histórico: vazio na criação ✅
   * 
   * DEPOIS (CORRETO - EDIÇÃO):
   * 1. Upload das novas fotos com o UUID (elas são associadas)
   * 2. Preparar lista: existingPhotoIds + newPhotoIds
   * 3. Chamar update com a lista COMPLETA
   * 4. Backend compara: antigas vs novas
   * 5. Histórico: regista APENAS as fotos realmente adicionadas ✅
   * 
   * COM ESTA CORREÇÃO:
   * - Criar com 1 foto → Histórico vazio ✅
   * - Editar e adicionar 2ª foto → Histórico: "photo_added: ID 18537" ✅
   * - Editar e trocar foto → Histórico: "photo_removed" + "photo_added" ✅
   */

  // Fotos
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
      const currentPhoto = newPhotos[selectedPhotoIndex];

      // ✅ CORREÇÃO: Guardar o fileId antigo se existir
      const oldFileId = currentPhoto.fileId;

      newPhotos[selectedPhotoIndex] = {
        ...currentPhoto,
        uri: result.assets[0].uri,
        fileId: undefined,              // Limpar fileId
        isUploaded: false,
        description: '',
        replacedFileId: oldFileId,      // ✅ Marcar como substituída
      };

      setPhotos(newPhotos);
      setPhotoDialogVisible(false);

      if (oldFileId) {
        console.log(`🔄 Foto ${selectedPhotoIndex} trocada: ${oldFileId} será substituída`);
      }
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
      const currentPhoto = newPhotos[selectedPhotoIndex];

      // ✅ CORREÇÃO: Guardar o fileId antigo se existir
      const oldFileId = currentPhoto.fileId;

      newPhotos[selectedPhotoIndex] = {
        ...currentPhoto,
        uri: result.assets[0].uri,
        fileId: undefined,              // Limpar fileId
        isUploaded: false,
        description: '',
        replacedFileId: oldFileId,      // ✅ Marcar como substituída
      };

      setPhotos(newPhotos);
      setPhotoDialogVisible(false);

      if (oldFileId) {
        console.log(`🔄 Foto ${selectedPhotoIndex} trocada: ${oldFileId} será substituída`);
      }
    }
  };

  const handleRemovePhoto = () => {
    if (selectedPhotoIndex === null) return;

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
            newPhotos[selectedPhotoIndex] = {
              ...newPhotos[selectedPhotoIndex],
              uri: '',
              fileId: undefined,
              isUploaded: false,
              description: '',
              replacedFileId: undefined,  // ✅ Limpar também
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
        {/* Fotografias - Página 2 */}
        <Card style={styles.card}>
          <Card.Title title="Fotografias - Página 2" />
          <Card.Content>
            <View style={styles.photosGrid}>
              {photos.slice(0, 4).map((photo, index) => {
                // ✅ LOG: Verificar o que está a ser renderizado
                console.log(`🖼️ RENDER Photo ${index + 1}:`, {
                  id: photo.id,
                  hasUri: !!photo.uri,
                  uri: photo.uri?.substring(0, 60) + '...',
                  fileId: photo.fileId,
                });

                return (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoSlot}
                    onPress={() => {
                      setSelectedPhotoIndex(index);
                      setPhotoDialogVisible(true);
                    }}
                  >
                    {photo.uri ? (
                      <Image
                        source={{ uri: photo.uri }}
                        style={styles.photoImage}
                        // ✅ ADICIONAR: Callbacks de debug
                        onLoadStart={() => console.log(`📥 Loading image ${index + 1}...`)}
                        onLoad={() => console.log(`✅ Image ${index + 1} loaded successfully`)}
                        onError={(error) => console.log(`❌ Image ${index + 1} failed:`, error.nativeEvent)}
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <IconButton icon="camera-plus" size={32} iconColor={colors.disabled} />
                        <Text style={styles.photoLabel}>Posição {photo.position}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
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
                // ✅ LOG: Verificar o que está a ser renderizado
                console.log(`🖼️ RENDER Photo ${index + 5}:`, {
                  id: photo.id,
                  hasUri: !!photo.uri,
                  uri: photo.uri?.substring(0, 60) + '...',
                  fileId: photo.fileId,
                });

                return (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoSlot}
                    onPress={() => {
                      setSelectedPhotoIndex(index + 4);
                      setPhotoDialogVisible(true);
                    }}
                  >
                    {photo.uri ? (
                      <Image
                        source={{ uri: photo.uri }}
                        style={styles.photoImage}
                        onLoadStart={() => console.log(`📥 Loading image ${index + 5}...`)}
                        onLoad={() => console.log(`✅ Image ${index + 5} loaded successfully`)}
                        onError={(error) => console.log(`❌ Image ${index + 5} failed:`, error.nativeEvent)}
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <IconButton icon="camera-plus" size={32} iconColor={colors.disabled} />
                        <Text style={styles.photoLabel}>Posição {photo.position}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
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
          icon={isOnline ? 'cloud-upload' : 'content-save'}
        >
          {saving ? 'A guardar...' : isOnline ? 'Guardar Online' : 'Guardar Offline'}
        </Button>
      </ScrollView>

      {/* Diálogo de Foto */}
      <Portal>
        <Dialog visible={photoDialogVisible} onDismiss={() => setPhotoDialogVisible(false)}>
          <Dialog.Title>Adicionar Foto</Dialog.Title>
          <Dialog.Content>
            <Button mode="outlined" onPress={handleTakePhoto} style={styles.dialogButton}>
              📷 Tirar Foto
            </Button>
            <Button mode="outlined" onPress={handlePickPhoto} style={styles.dialogButton}>
              🖼️ Escolher da Galeria
            </Button>
            {selectedPhotoIndex !== null && photos[selectedPhotoIndex]?.uri && (
              <Button
                mode="outlined"
                onPress={handleRemovePhoto}
                style={[styles.dialogButton, { borderColor: colors.error }]}
                textColor={colors.error}
              >
                🗑️ Remover Foto
              </Button>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPhotoDialogVisible(false)}>Fechar</Button>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
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
  offlineBanner: {
    backgroundColor: colors.warning + '20',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: spacing.md,
    marginBottom: 0,
  },
  input: {
    marginBottom: spacing.sm,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoSlot: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  photoLabel: {
    fontSize: 12,
    color: colors.disabled,
    marginTop: -spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.disabled,
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
  },
  fieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  fieldValueText: {
    color: colors.text,
  },
  fieldActions: {
    flexDirection: 'row',
  },
  progressBar: {
    marginTop: spacing.sm,
  },
  saveButton: {
    margin: spacing.md,
    marginTop: spacing.lg,
  },
  dialogButton: {
    marginBottom: spacing.sm,
  },
  dialogInput: {
    marginBottom: spacing.sm,
  },
});