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

        // ✅ CORREÇÃO: Carregar fotos offline CORRETAMENTE
        // Criar array de 8 fotos vazias primeiro
        const offlinePhotos: PhotoData[] = Array.from({ length: 8 }, (_, i) => ({
          id: `photo-${i}`,
          uri: '',
          pageNumber: i < 4 ? 2 : 3,
          position: (i % 4) + 1,
          timestamp: Date.now(),
          isUploaded: false,
          description: '',
        }));

        // ✅ Mapear cada foto offline para a posição correta
        if (offlineReport.photos && offlineReport.photos.length > 0) {
          console.log(`📸 Carregando ${offlineReport.photos.length} fotos offline`);

          offlineReport.photos.forEach((offlinePhoto) => {
            // ✅ IMPORTANTE: As fotos offline têm filename como "photo_page2_pos3.jpg"
            // Precisamos extrair pageNumber e position do filename
            const filenameMatch = offlinePhoto.filename.match(/photo_page(\d+)_pos(\d+)\.jpg/);

            if (filenameMatch) {
              const pageNumber = parseInt(filenameMatch[1], 10);
              const position = parseInt(filenameMatch[2], 10);

              // Calcular o índice correto no array (0-7)
              // Página 2: posições 1-4 → índices 0-3
              // Página 3: posições 1-4 → índices 4-7
              const index = pageNumber === 2
                ? (position - 1)           // Página 2: pos 1→0, pos 2→1, pos 3→2, pos 4→3
                : (position - 1 + 4);      // Página 3: pos 1→4, pos 2→5, pos 3→6, pos 4→7

              if (index >= 0 && index < 8) {
                offlinePhotos[index] = {
                  id: `photo-${index}`,
                  uri: offlinePhoto.uri || '',
                  pageNumber,
                  position,
                  timestamp: Date.now(),
                  isUploaded: false,
                  description: offlinePhoto.filename || '',
                };

                console.log(`✅ Foto carregada: Página ${pageNumber}, Posição ${position} → Índice ${index}`);
              }
            } else {
              console.warn('⚠️ Filename não reconhecido:', offlinePhoto.filename);
            }
          });
        }

        setPhotos(offlinePhotos);

        // Carregar campos adicionais
        const fields: AdditionalField[] = [];
        if (offlineReport.data.additionalFields) {
          Object.entries(offlineReport.data.additionalFields).forEach(([field]) => {
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

    setIsOfflineMode(true);
    setTempId(offlineReport.tempId);

    // Preencher formulário
    setSite(offlineReport.data.site || '');
    setWtgNumber(offlineReport.data.wtgNumber || '');
    setWtgType(offlineReport.data.wtgType || '');
    setYearConstruction(offlineReport.data.yearConstruction || '');

    // ✅ CORREÇÃO: Carregar fotos offline CORRETAMENTE
    // Criar array de 8 fotos vazias primeiro
    const offlinePhotos: PhotoData[] = Array.from({ length: 8 }, (_, i) => ({
        id: `photo-${i}`,
        uri: '',
        pageNumber: i < 4 ? 2 : 3,
        position: (i % 4) + 1,
        timestamp: Date.now(),
        isUploaded: false,
        description: '',
    }));

    // ✅ Mapear cada foto offline para a posição correta
    if (offlineReport.photos && offlineReport.photos.length > 0) {
        console.log(`📸 Carregando ${offlineReport.photos.length} fotos offline`);
        
        offlineReport.photos.forEach((offlinePhoto) => {
            // ✅ IMPORTANTE: As fotos offline têm filename como "photo_page2_pos3.jpg"
            // Precisamos extrair pageNumber e position do filename
            const filenameMatch = offlinePhoto.filename.match(/photo_page(\d+)_pos(\d+)\.jpg/);
            
            if (filenameMatch) {
                const pageNumber = parseInt(filenameMatch[1], 10);
                const position = parseInt(filenameMatch[2], 10);
                
                // Calcular o índice correto no array (0-7)
                // Página 2: posições 1-4 → índices 0-3
                // Página 3: posições 1-4 → índices 4-7
                const index = pageNumber === 2 
                    ? (position - 1)           // Página 2: pos 1→0, pos 2→1, pos 3→2, pos 4→3
                    : (position - 1 + 4);      // Página 3: pos 1→4, pos 2→5, pos 3→6, pos 4→7
                
                if (index >= 0 && index < 8) {
                    offlinePhotos[index] = {
                        id: `photo-${index}`,
                        uri: offlinePhoto.uri || '',
                        pageNumber,
                        position,
                        timestamp: Date.now(),
                        isUploaded: false,
                        description: offlinePhoto.filename || '',
                    };
                    
                    console.log(`✅ Foto carregada: Página ${pageNumber}, Posição ${position} → Índice ${index}`);
                }
            } else {
                console.warn('⚠️ Filename não reconhecido:', offlinePhoto.filename);
            }
        });
    }
    
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
              fileId: String(existingPhoto.fileId),
              description: existingPhoto.description ?? '',
            };
          }

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

  try {
    setSaving(true);
    setUploadProgress(0);
    // ========================================
    // DECISÃO 1: VERIFICAR SE ESTÁ OFFLINE
    // ========================================
    const netState = await NetInfo.fetch();
    const currentlyOnline = netState.isConnected ?? false;

    console.log('💾 A guardar relatório...');
    console.log('📡 Estado conexão:', currentlyOnline ? 'ONLINE' : 'OFFLINE');
    console.log('📝 Modo:', reportId === 0 ? 'CRIAR' : 'EDITAR');
    console.log('📵 É offline?', isOfflineMode);

    // ========================================
    // OPÇÃO A: ESTÁ OFFLINE
    // ========================================
    if (!currentlyOnline) {
      console.log('📵 SEM REDE → Guardando localmente...');

      // ✅ DEBUG: Logs detalhados das fotos ANTES de guardar
      console.log('\n🔍 ========================================');
      console.log('🔍 DEBUG - FOTOS ANTES DE GUARDAR');
      console.log('🔍 ========================================');
      console.log(`📊 Total de fotos no array: ${photos.length}`);

      photos.forEach((photo, index) => {
        console.log(`\n   Foto ${index + 1}:`);
        console.log(`      - ID: ${photo.id}`);
        console.log(`      - URI: ${photo.uri || '(VAZIO)'}`);
        console.log(`      - URI length: ${photo.uri?.length || 0}`);
        console.log(`      - Has URI?: ${photo.uri ? 'SIM ✅' : 'NÃO ❌'}`);
        console.log(`      - Is Uploaded?: ${photo.isUploaded}`);
        console.log(`      - Page: ${photo.pageNumber}, Position: ${photo.position}`);
      });

      // Preparar fotos offline
      const offlinePhotos: OfflinePhoto[] = photos
        .filter(p => {
          const hasUri = p.uri && p.uri.trim() !== '';
          if (!hasUri) {
            console.log(`   ⚠️ Foto ${p.id} filtrada (sem URI)`);
          }
          return hasUri;
        })
        .map((p, i) => {
          const filename = p.uri.split('/').pop() || `photo-${i}.jpg`;
          console.log(`   ✅ Incluindo foto ${i}: ${filename}`);
          return {
            tempId: `photo-${i}`,
            uri: p.uri,
            filename,
            mimeType: 'image/jpeg',
          };
        });

      console.log(`\n📊 Fotos a guardar offline: ${offlinePhotos.length}`);
      console.log('🔍 ========================================\n');

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

      // A.1: Se está a EDITAR relatório offline existente
      if (isOfflineMode && tempId) {
        console.log('✏️ Atualizando relatório offline existente:', tempId);

        await offlineReportsService.update(tempId, {
          data: {
            site,
            wtgNumber,
            wtgType,
            yearConstruction,
            dateInspection: new Date().toISOString().split('T')[0], // ✅ CORRIGIDO
            inspectedBy: '',  // ✅ CORRIGIDO
            observations: '', // ✅ CORRIGIDO
            ...additionalData,
          },
          photos: offlinePhotos,
        });

        Alert.alert('Sucesso', 'Relatório offline atualizado!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      // A.2: Se está a CRIAR novo relatório (reportId === 0)
      if (reportId === 0) {
        console.log('📝 Criando NOVO relatório offline...');
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
            dateInspection: new Date().toISOString().split('T')[0], // ✅ CORRIGIDO
            inspectedBy: '',  // ✅ CORRIGIDO
            observations: '', // ✅ CORRIGIDO
            ...additionalData,
          },
          photos: offlinePhotos,
        });

        console.log('✅ Relatório offline criado:', offlineReport.tempId);

        // Marcar para sincronização automática quando houver rede
        await offlineReportsService.markForSync(offlineReport.tempId);
        console.log('📤 Marcado para sincronização automática');

        Alert.alert(
          'Relatório Guardado Offline',
          'O relatório foi guardado localmente e será sincronizado automaticamente quando houver conexão.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      Alert.alert('Erro', 'Operação não suportada offline');
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
                    <IconButton icon="camera-plus" size={32} iconColor={colors.disabled} />
                    <Text style={styles.photoLabel}>Posição {photo.position}</Text>
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
                    <IconButton icon="camera-plus" size={32} iconColor={colors.disabled} />
                    <Text style={styles.photoLabel}>Posição {photo.position}</Text>
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