/**
 * PerformanceRepairElevatorEditScreen
 * 
 * ✅ CORRIGIDO: Agora usa offlinePerformanceReportsService
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
import Toast from 'react-native-toast-message';
// ✅ USAR O SERVIÇO CORRETO
import { offlinePerformanceReportsService } from '@/services/storage/offlinePerformanceReports.service';

const convertToApiFormat = (value: '' | 'Yes' | 'No'): '' | 'yes' | 'no' => {
    if (value === 'Yes') return 'yes';
    if (value === 'No') return 'no';
    return '';
};

export default function PerformanceRepairElevatorEditScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        reportId?: string;
        tempId?: string;
        turbineId?: string;
        projectId?: string;
        turbineName?: string;
        projectName?: string;
    }>();

    // Parse de parâmetros
    const reportId = params.reportId ? parseInt(params.reportId, 10) : 0;
    const turbineId = params.turbineId ? parseInt(params.turbineId, 10) : 0;
    const projectId = params.projectId ? parseInt(params.projectId, 10) : 0;
    const tempIdParam = params.tempId;

    // Estados gerais
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [tempId, setTempId] = useState<string | null>(null);
    const [reportUuid, setReportUuid] = useState<string>('');

    // Página 1: Dados Fundamentais
    const [site, setSite] = useState('');
    const [wtgNumber, setWtgNumber] = useState('');
    const [wtgType, setWtgType] = useState('');
    const [yearConstruction, setYearConstruction] = useState('');
    const [inspectors, setInspectors] = useState('');

    // Página 2: Statement of Work
    const [workCompleted, setWorkCompleted] = useState<'Yes' | 'No' | ''>('');
    const [windturbineOperable, setWindturbineOperable] = useState<'Yes' | 'No' | ''>('');

    // Página 3: Performance Report
    const [performanceReport, setPerformanceReport] = useState('');

    // Página 4: Photos (4 posições)
    const [photos, setPhotos] = useState<PhotoData[]>([]);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [photoDialogVisible, setPhotoDialogVisible] = useState(false);

    // Página 5: Additional Fields (até 3)
    const [additionalFields, setAdditionalFields] = useState<AdditionalField[]>([]);
    const [fieldDialogVisible, setFieldDialogVisible] = useState(false);
    const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
    const [fieldLabel, setFieldLabel] = useState('');
    const [fieldValue, setFieldValue] = useState('');

    // ====================================================================
    // Lifecycle
    // ====================================================================
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = state.isConnected ?? false;
            console.log(`📡 Conexão mudou: ${online ? 'ONLINE' : 'OFFLINE'}`);
            setIsOnline(online);
        });

        NetInfo.fetch().then(state => {
            setIsOnline(state.isConnected ?? false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        loadData();
    }, [reportId, tempIdParam]);

    // ====================================================================
    // Load Data
    // ====================================================================
    const loadData = async () => {
        console.log('🔍 loadData called with reportId:', reportId, 'tempId:', tempIdParam);

        try {
            // ========================================
            // MODO 1: Carregar relatório offline
            // ========================================
            if (tempIdParam) {
                console.log('📵 Carregando relatório offline:', tempIdParam);
                // ✅ USAR offlinePerformanceReportsService
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

                setWorkCompleted(offlineReport.data.workCompleted || '');
                setWindturbineOperable(offlineReport.data.turbineOperable || '');
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

            // ========================================
            // MODO 2: Criar novo (reportId === 0)
            // ========================================
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
                return;
            }

            // ========================================
            // MODO 3: Editar relatório existente online
            // ========================================
            console.log('📥 Fetching report from API...');
            const report = await performanceRepairElevatorAPI.getById(reportId);

            if (!report) {
                Alert.alert('Erro', 'Relatório não encontrado');
                setLoading(false);
                router.back();
                return;
            }

            setSite(report.site || '');
            setWtgNumber(report.wtgNumber || '');
            setWtgType(report.wtgType || '');
            setYearConstruction(report.yearConstruction || '');
            setReportUuid(report.uuid || '');
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

            // Carregar fotos
            try {
                const existingPhotos = await performanceRepairElevatorAPI.getPhotos(reportId);

                const initialPhotos: PhotoData[] = Array.from({ length: 4 }, (_, i) => {
                    const existingPhoto = existingPhotos?.[i];

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
                            pageNumber: 4,
                            position: i + 1,
                            timestamp: Date.now(),
                            isUploaded: true,
                            fileId: String(existingPhoto.fileId),
                            description: existingPhoto.description ?? '',
                        };
                    }

                    return {
                        id: `photo-${i}`,
                        uri: '',
                        pageNumber: 4,
                        position: i + 1,
                        timestamp: Date.now(),
                        isUploaded: false,
                        description: '',
                    };
                });

                setPhotos(initialPhotos);
            } catch (photoError) {
                console.error('❌ Error loading photos:', photoError);
            }

            setLoading(false);
        } catch (error: any) {
            console.error('❌ Error in loadData:', error);
            Alert.alert('Erro', error?.message || 'Erro ao carregar relatório');
            setLoading(false);
        }
    };

    // ====================================================================
    // Validation
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
    // Save - COM SUPORTE OFFLINE COMPLETO
    // ====================================================================
    const handleSave = async () => {
        if (!validateForm()) return;

        setSaving(true);

        try {
            console.log('💾 Starting save process...');
            console.log(`🌐 Conexão: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

            // ========================================
            // CENÁRIO 1: OFFLINE - CRIAR NOVO
            // ========================================
            if (!isOnline && reportId === 0) {
                console.log('📵 OFFLINE CREATE → Guardar localmente');

                const offlinePhotos = photos
                    .filter(p => p.uri && p.uri.trim() !== '')
                    .map((p) => ({
                        tempId: p.id,
                        uri: p.uri,
                        filename: `photo_page4_pos${p.position}.jpg`,
                        mimeType: 'image/jpeg',
                        description: p.description || '',
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

                // ✅ USAR offlinePerformanceReportsService.create
                const offlineReport = await offlinePerformanceReportsService.create({
                    projectId: projectId || 0,
                    turbineId: turbineId || 0,
                    reportType: 1, // Performance = 1
                    data: {
                        site,
                        wtgNumber,
                        wtgType,
                        yearConstruction,
                        inpectorsWorkers: inspectors,
                        workCompleted: workCompleted || undefined,
                        turbineOperable: windturbineOperable || undefined,
                        performanceReport,
                        ...additionalData,
                    },
                    photos: offlinePhotos,
                });

                // ✅ Marcar para sincronização
                await offlinePerformanceReportsService.markForSync(offlineReport.tempId);

                Toast.show({
                    type: 'success',
                    text1: '📵 Relatório Guardado Offline',
                    text2: 'Será sincronizado automaticamente',
                    visibilityTime: 4000,
                });

                console.log('✅ Performance Report created offline:', offlineReport.tempId);

                setTimeout(() => {
                    router.back();
                }, 1000);

                setSaving(false);
                return;
            }

            // ========================================
            // CENÁRIO 2: OFFLINE - EDITAR EXISTENTE
            // ========================================
            if (!isOnline && isOfflineMode && tempId) {
                console.log('📵 OFFLINE UPDATE → Atualizar relatório offline:', tempId);

                const offlinePhotos = photos
                    .filter(p => p.uri && p.uri.trim() !== '')
                    .map((p) => ({
                        tempId: p.id,
                        uri: p.uri,
                        filename: `photo_page4_pos${p.position}.jpg`,
                        mimeType: 'image/jpeg',
                        description: p.description || '',
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

                // ✅ USAR offlinePerformanceReportsService.update
                await offlinePerformanceReportsService.update(tempId, {
                    data: {
                        site,
                        wtgNumber,
                        wtgType,
                        yearConstruction,
                        inpectorsWorkers: inspectors,
                        workCompleted: workCompleted || undefined,
                        turbineOperable: windturbineOperable || undefined,
                        performanceReport,
                        ...additionalData,
                    },
                    photos: offlinePhotos,
                });

                Toast.show({
                    type: 'success',
                    text1: '✅ Relatório Offline Atualizado',
                    text2: 'Será sincronizado automaticamente',
                    visibilityTime: 4000,
                });

                console.log('✅ Performance Report offline updated:', tempId);

                setTimeout(() => {
                    router.back();
                }, 1000);

                setSaving(false);
                return;
            }

            // ========================================
            // CENÁRIO 3 e 4: ONLINE (criar ou editar)
            // ========================================
            const baseData: PerformanceRepairElevatorData = {
                site,
                wtgNumber,
                wtgType,
                yearConstruction,
                inspectors,
                //TODO Colocar tudo a YES ou yes
                workCompleted: convertToApiFormat(workCompleted),
                windturbineOperable:convertToApiFormat(windturbineOperable),
                performanceReport,
                projectoId: projectId || 0,
                turbinaId: turbineId || 0,
                photos: [],
                additionalFields: additionalFields.map((field, index) => ({
                    [`additionalField${index + 1}Label`]: field.label,
                    [`additionalField${index + 1}Text`]: field.value,
                } as any)) as any,
            };

            if (reportId === 0) {
                // CRIAR NOVO ONLINE
                console.log('📝 Creating new report online...');

                const createResponse = await performanceRepairElevatorAPI.create(baseData);
                const savedReportId = createResponse.reportId;
                const savedReportUuid = createResponse.uuid;

                if (!savedReportId) {
                    throw new Error('Report ID não retornado');
                }

                // Upload de fotos
                const photosToUpload = photos.filter(p => p.uri && p.uri.trim() !== '');
                if (photosToUpload.length > 0) {
                    const uploadedPhotos = [...photos];
                    const uploadedPhotoIds: string[] = [];

                    for (let i = 0; i < photos.length; i++) {
                        const photo = photos[i];
                        if (photo.uri && photo.uri.trim() !== '') {
                            try {
                                const uploadedPhoto = await performanceRepairElevatorAPI.uploadPhoto(
                                    photo,           // ✅ primeiro: PhotoData
                                    savedReportUuid  // ✅ segundo: string (UUID)
                                );

                                uploadedPhotos[i] = {
                                    ...photo,
                                    isUploaded: true,
                                    fileId: String(uploadedPhoto.fileId),
                                };
                                uploadedPhotoIds.push(String(uploadedPhoto.fileId));
                            } catch (photoError: any) {
                                console.error(`❌ Error uploading photo ${i + 1}:`, photoError);
                            }
                        }
                    }

                    if (uploadedPhotoIds.length > 0) {
                        const finalData: PerformanceRepairElevatorData = {
                            ...baseData,
                            photos: uploadedPhotos,
                        };
                        await performanceRepairElevatorAPI.update(savedReportId, finalData);
                    }

                    setPhotos(uploadedPhotos);
                }

                Alert.alert('Sucesso', 'Relatório criado com sucesso', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                // ATUALIZAR ONLINE
                console.log('📝 Updating existing report...');

                const photosToUpload = photos.filter(p => p.uri && !p.isUploaded);

                if (photosToUpload.length === 0) {
                    await performanceRepairElevatorAPI.update(reportId, baseData);
                } else {
                    const uploadedPhotos = [...photos];
                    let photosChanged = false;

                    for (let i = 0; i < photos.length; i++) {
                        const photo = photos[i];
                        if (photo.uri && !photo.isUploaded) {
                            try {
                                const uploadedPhoto = await performanceRepairElevatorAPI.uploadPhoto(
                                    photo,           // ✅ primeiro: PhotoData
                                    reportUuid  // ✅ segundo: string (UUID)
                                );
                                uploadedPhotos[i] = {
                                    ...photo,
                                    isUploaded: true,
                                    fileId: String(uploadedPhoto.fileId),
                                };
                                photosChanged = true;
                            } catch (photoError: any) {
                                console.error(`❌ Error uploading photo ${i + 1}:`, photoError);
                            }
                        }
                    }

                    if (photosChanged) {
                        const finalData: PerformanceRepairElevatorData = {
                            ...baseData,
                            photos: uploadedPhotos,
                        };
                        await performanceRepairElevatorAPI.update(reportId, finalData);
                    } else {
                        await performanceRepairElevatorAPI.update(reportId, baseData);
                    }

                    setPhotos(uploadedPhotos);
                }

                Alert.alert('Sucesso', 'Relatório atualizado com sucesso', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch (error: any) {
            console.error('❌ Error saving report:', error);

            if (error.code === 'OFFLINE' || error.message === 'Sem conexão à Internet') {
                Alert.alert(
                    'Conexão Perdida',
                    'A conexão foi perdida. Relatório será guardado offline.',
                    [{ text: 'OK' }]
                );
                Toast.show({
                    type: 'info',
                    text1: '📵 Guardado Offline',
                    text2: 'Conexão perdida durante o save',
                    visibilityTime: 4000,
                });
                router.back();
            } else {
                Alert.alert('Erro', error?.message || 'Erro ao guardar relatório');
            }
        } finally {
            setSaving(false);
        }
    };

    // ====================================================================
    // Photo Handlers
    // ====================================================================
    const handleSelectPhoto = (index: number) => {
        setSelectedPhotoIndex(index);
        setPhotoDialogVisible(true);
    };

    const handleTakePhoto = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: false,
            });

            if (!result.canceled && selectedPhotoIndex !== null) {
                const newPhotos = [...photos];
                newPhotos[selectedPhotoIndex] = {
                    ...newPhotos[selectedPhotoIndex],
                    uri: result.assets[0].uri,
                    timestamp: Date.now(),
                    isUploaded: false,
                };
                setPhotos(newPhotos);
                setPhotoDialogVisible(false);
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível tirar a foto');
        }
    };

    const handlePickFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: false,
            });

            if (!result.canceled && selectedPhotoIndex !== null) {
                const newPhotos = [...photos];
                newPhotos[selectedPhotoIndex] = {
                    ...newPhotos[selectedPhotoIndex],
                    uri: result.assets[0].uri,
                    timestamp: Date.now(),
                    isUploaded: false,
                };
                setPhotos(newPhotos);
                setPhotoDialogVisible(false);
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível selecionar a foto');
        }
    };

    const handleRemovePhoto = () => {
        if (selectedPhotoIndex !== null) {
            const newPhotos = [...photos];
            newPhotos[selectedPhotoIndex] = {
                ...newPhotos[selectedPhotoIndex],
                uri: '',
                isUploaded: false,
                fileId: undefined,
            };
            setPhotos(newPhotos);
            setPhotoDialogVisible(false);
        }
    };

    // ====================================================================
    // Additional Fields Handlers
    // ====================================================================
    const handleAddField = () => {
        if (additionalFields.length >= 3) {
            Alert.alert('Limite Atingido', 'Máximo de 3 campos adicionais');
            return;
        }
        openFieldDialog();
    };

    const handleSaveField = () => {
        if (!fieldLabel.trim() || !fieldValue.trim()) {
            Alert.alert('Atenção', 'Preencha o nome e valor do campo');
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

    const handleDeleteField = (index: number) => {
        Alert.alert('Eliminar Campo', 'Tem a certeza?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
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
                            label="Inspectors / Workers"
                            value={inspectors}
                            onChangeText={setInspectors}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
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
                                <RadioButton.Item label="Yes" value="Yes" />
                                <RadioButton.Item label="No" value="No" />
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
                                <RadioButton.Item label="Yes" value="Yes" />
                                <RadioButton.Item label="No" value="No" />
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
                        <View style={styles.photoGrid}>
                            {photos.map((photo, index) => (
                                <TouchableOpacity
                                    key={photo.id}
                                    style={styles.photoSlot}
                                    onPress={() => handleSelectPhoto(index)}
                                >
                                    {photo.uri ? (
                                        <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                                    ) : (
                                        <View style={styles.photoPlaceholder}>
                                            <IconButton icon="camera-plus" size={32} />
                                            <Text variant="bodySmall">Foto {index + 1}</Text>
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
                        title="5. Additional Fields"
                        titleVariant="titleLarge"
                        right={() => (
                            <IconButton
                                icon="plus"
                                onPress={handleAddField}
                                disabled={additionalFields.length >= 3}
                            />
                        )}
                    />
                    <Card.Content>
                        {additionalFields.length === 0 ? (
                            <Text variant="bodyMedium" style={styles.emptyText}>
                                Nenhum campo adicional. Toque em + para adicionar (máx. 3)
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
                                                    onPress={() => handleDeleteField(index)}
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

                {/* Botão Save */}
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={styles.saveButton}
                    icon="content-save"
                >
                    {saving ? 'A guardar...' : 'Guardar Relatório'}
                </Button>
            </ScrollView>

            {/* Photo Dialog */}
            <Portal>
                <Dialog visible={photoDialogVisible} onDismiss={() => setPhotoDialogVisible(false)}>
                    <Dialog.Title>Selecionar Foto</Dialog.Title>
                    <Dialog.Content>
                        <Button
                            mode="outlined"
                            onPress={handleTakePhoto}
                            icon="camera"
                            style={styles.dialogButton}
                        >
                            Tirar Foto
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={handlePickFromGallery}
                            icon="image"
                            style={styles.dialogButton}
                        >
                            Escolher da Galeria
                        </Button>
                        {selectedPhotoIndex !== null && photos[selectedPhotoIndex].uri && (
                            <Button
                                mode="outlined"
                                onPress={handleRemovePhoto}
                                icon="delete"
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

            {/* Field Dialog */}
            <Portal>
                <Dialog visible={fieldDialogVisible} onDismiss={() => setFieldDialogVisible(false)}>
                    <Dialog.Title>
                        {editingFieldIndex !== null ? 'Editar Campo' : 'Novo Campo'}
                    </Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Nome do Campo"
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

// Styles (mesmos do anterior)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingTop: Platform.OS === 'ios' ? 50 : spacing.md,
        paddingBottom: spacing.md,
    },
    headerCenter: { flex: 1, marginHorizontal: spacing.sm },
    headerTitle: { color: colors.white, fontWeight: 'bold' },
    headerSubtitle: { color: colors.white, opacity: 0.9 },
    onlineChip: { backgroundColor: colors.success },
    offlineChip: { backgroundColor: colors.warning },
    scrollView: { flex: 1 },
    content: { padding: spacing.md, paddingBottom: spacing.xl },
    card: { marginBottom: spacing.md },
    input: { marginBottom: spacing.md },
    textArea: { minHeight: 120 },
    sectionLabel: { marginBottom: spacing.xs, marginTop: spacing.sm },
    radioRow: { flexDirection: 'row', justifyContent: 'space-around' },
    divider: { marginVertical: spacing.md },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    photoSlot: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fieldCard: { marginBottom: spacing.sm, backgroundColor: colors.surface },
    fieldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    fieldActions: { flexDirection: 'row' },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontStyle: 'italic',
        paddingVertical: spacing.md,
    },
    saveButton: { marginTop: spacing.md, paddingVertical: spacing.xs },
    dialogButton: { marginBottom: spacing.sm },
    dialogInput: { marginBottom: spacing.md },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: { marginTop: spacing.md, color: colors.textSecondary },
});