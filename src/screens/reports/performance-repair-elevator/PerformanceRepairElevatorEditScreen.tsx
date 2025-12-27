/**
 * PerformanceRepairElevatorEditScreen
 * ✅ COMPLETAMENTE CORRIGIDO E ALINHADO COM DefectInspectionReportEditScreen
 * 
 * Alterações aplicadas:
 * - photoGrid → photosGrid (grid 2x2)
 * - gap → justifyContent: 'space-between'
 * - Banner offline adicionado
 * - ProgressBar adicionada
 * - Estilos harmonizados
 * - Suporte offline completo
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
    RadioButton,
    Banner,
    ProgressBar,
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
    const tempIdParam = params.tempId || null;

    // Estados do formulário
    const [site, setSite] = useState('');
    const [wtgNumber, setWtgNumber] = useState('');
    const [wtgType, setWtgType] = useState('');
    const [yearConstruction, setYearConstruction] = useState('');
    const [inspectors, setInspectors] = useState('');
    const [workCompleted, setWorkCompleted] = useState<'' | 'Yes' | 'No'>('');
    const [windturbineOperable, setWindturbineOperable] = useState<'' | 'Yes' | 'No'>('');
    const [performanceReport, setPerformanceReport] = useState('');
    const [photos, setPhotos] = useState<PhotoData[]>([]);
    const [additionalFields, setAdditionalFields] = useState<AdditionalField[]>([]);
    const [reportUuid, setReportUuid] = useState('');

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [tempId, setTempId] = useState<string | null>(null);
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

    // Carregar dados
    useEffect(() => {
        loadData();
    }, [reportId, tempIdParam]);

    // ====================================================================
    // Load Data
    // ====================================================================
    const loadData = async () => {
        try {
            setLoading(true);

            // MODO 1: Carregar relatório offline
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
                    Object.entries(offlineReport.data.additionalFields).forEach(([_, field]) => {
                        if (field && typeof field === 'object' && 'label' in field && 'value' in field) {
                            fields.push({
                                label: (field as any).label,
                                value: (field as any).value
                            });
                        }
                    });
                }
                console.log('📋 Total de campos carregados:', fields.length); // ✅ ADICIONA ESTE LOG
                setAdditionalFields(fields);

                setLoading(false);
                return;
            }

            // MODO 2: Criar novo (reportId === 0)
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

            // MODO 3: Editar relatório existente online
            console.log('📥 Fetching report from API...');
            const report = await performanceRepairElevatorAPI.getById(reportId);

            if (!report) {
                Alert.alert('Erro', 'Relatório não encontrado');
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
                        // ✅ SOLUÇÃO SIMPLES E DIRETA
                        const fullImageUrl = `http://192.168.1.64:8080/api/reports/mobile/files/download/${existingPhoto.hash}`;

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
    // Save
    // ====================================================================
    const handleSave = async () => {
        if (!validateForm()) return;

        setSaving(true);
        setUploadProgress(0);

        try {
            // CENÁRIO 1: OFFLINE - CRIAR NOVO
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

                const additionalData: Record<string, { label: string; value: string }> = {};
                additionalFields.forEach((field, index) => {
                    if (field.label && field.value) {
                        additionalData[`additionalField${index + 1}`] = {
                            label: field.label,
                            value: field.value,
                        };
                    }
                });

                console.log('📋 Campos adicionais preparados:', JSON.stringify(additionalData, null, 2));
                console.log('📋 Número de campos:', Object.keys(additionalData).length);

                const offlineReport = await offlinePerformanceReportsService.create({
                    projectId: projectId || 0,
                    turbineId: turbineId || 0,
                    reportType: 1,
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

                await offlinePerformanceReportsService.markForSync(offlineReport.tempId);

                Toast.show({
                    type: 'success',
                    text1: '📵 Relatório Guardado Offline',
                    text2: 'Será sincronizado automaticamente',
                    visibilityTime: 4000,
                });

                setTimeout(() => router.back(), 1000);
                setSaving(false);
                return;
            }

            // CENÁRIO 2: OFFLINE - EDITAR EXISTENTE
            if (!isOnline && isOfflineMode && tempId) {
                console.log('📵 OFFLINE UPDATE → Atualizar relatório offline');

                const offlinePhotos = photos
                    .filter(p => p.uri && p.uri.trim() !== '')
                    .map((p) => ({
                        tempId: p.id,
                        uri: p.uri,
                        filename: `photo_page4_pos${p.position}.jpg`,
                        mimeType: 'image/jpeg',
                        description: p.description || '',
                    }));

                const additionalData: Record<string, { label: string; value: string }> = {};
                additionalFields.forEach((field, index) => {
                    if (field.label && field.value) {
                        additionalData[`additionalField${index + 1}`] = {
                            label: field.label,
                            value: field.value,
                        };
                    }
                });

                console.log('📋 Campos adicionais preparados:', JSON.stringify(additionalData, null, 2));
                console.log('📋 Número de campos:', Object.keys(additionalData).length);

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

                setTimeout(() => router.back(), 1000);
                setSaving(false);
                return;
            }

            // CENÁRIO 3 e 4: ONLINE
            const additionalData: Record<string, { label: string; value: string }> = {};
            additionalFields.forEach((field, index) => {
                if (field.label && field.value) {
                    additionalData[`additionalField${index + 1}`] = {
                        label: field.label,
                        value: field.value,
                    };
                }
            });

            console.log('📋 Campos adicionais preparados:', JSON.stringify(additionalData, null, 2));
            console.log('📋 Número de campos:', Object.keys(additionalData).length);

            const baseData: PerformanceRepairElevatorData = {
                site,
                wtgNumber,
                wtgType,
                yearConstruction,
                inspectors,
                workCompleted: convertToApiFormat(workCompleted),
                windturbineOperable: convertToApiFormat(windturbineOperable),
                performanceReport,
                projectoId: projectId || 0,
                turbinaId: turbineId || 0,
                photos: [],
                additionalFields: additionalFields,
            };

            if (reportId === 0) {
                // CRIAR NOVO ONLINE
                const createResponse = await performanceRepairElevatorAPI.create(baseData);
                const savedReportId = createResponse.reportId;
                const savedReportUuid = createResponse.uuid;

                if (!savedReportId) {
                    throw new Error('Report ID não retornado');
                }

                // Upload de fotos
                const photosToUpload = photos.filter(p => p.uri && p.uri.trim() !== '');
                if (photosToUpload.length > 0) {
                    for (let i = 0; i < photos.length; i++) {
                        const photo = photos[i];
                        if (photo.uri && photo.uri.trim() !== '') {
                            try {
                                await performanceRepairElevatorAPI.uploadPhoto(photo, savedReportUuid);
                                setUploadProgress((i + 1) / photosToUpload.length);
                            } catch (photoError) {
                                console.error(`❌ Error uploading photo ${i + 1}:`, photoError);
                            }
                        }
                    }
                }

                Alert.alert('Sucesso', 'Relatório criado com sucesso', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                // ATUALIZAR ONLINE
                await performanceRepairElevatorAPI.update(reportId, baseData);

                // Upload fotos novas
                const photosToUpload = photos.filter(p => p.uri && !p.isUploaded);
                if (photosToUpload.length > 0) {
                    for (let i = 0; i < photos.length; i++) {
                        const photo = photos[i];
                        if (photo.uri && !photo.isUploaded) {
                            try {
                                await performanceRepairElevatorAPI.uploadPhoto(photo, reportUuid);
                            } catch (photoError) {
                                console.error(`❌ Error uploading photo:`, photoError);
                            }
                        }
                    }
                }

                Alert.alert('Sucesso', 'Relatório atualizado com sucesso', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch (error: any) {
            console.error('❌ Error saving report:', error);
            Alert.alert('Erro', error?.message || 'Não foi possível guardar o relatório');
        } finally {
            setSaving(false);
            setUploadProgress(0);
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
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permissão Negada', 'Precisamos de acesso à câmara');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && selectedPhotoIndex !== null) {
            const newPhotos = [...photos];
            newPhotos[selectedPhotoIndex] = {
                ...newPhotos[selectedPhotoIndex],
                uri: result.assets[0].uri,
                isUploaded: false,
            };
            setPhotos(newPhotos);
            setPhotoDialogVisible(false);
        }
    };

    const handlePickPhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && selectedPhotoIndex !== null) {
            const newPhotos = [...photos];
            newPhotos[selectedPhotoIndex] = {
                ...newPhotos[selectedPhotoIndex],
                uri: result.assets[0].uri,
                isUploaded: false,
            };
            setPhotos(newPhotos);
            setPhotoDialogVisible(false);
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
                <IconButton
                    icon="content-save"
                    iconColor={colors.white}
                    size={24}
                    onPress={handleSave}
                    disabled={saving}
                />
            </View>

            {/* ✅ Banner Offline */}
            {!isOnline && (
                <Banner visible={true} icon="wifi-off" style={styles.offlineBanner}>
                    📵 Modo Offline - {isOfflineMode ? 'Editando relatório local' : 'Será guardado localmente'}
                </Banner>
            )}

            <ScrollView style={styles.scrollView}>
                {/* Card 1: Fundamental Data */}
                <Card style={styles.card}>
                    <Card.Title title="1. Fundamental Data" titleVariant="titleLarge" />
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
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>

                {/* Card 2: Statement of Work */}
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
                        <RadioButton.Group value={windturbineOperable} onValueChange={setWindturbineOperable as any}>
                            <View style={styles.radioRow}>
                                <RadioButton.Item label="Yes" value="Yes" />
                                <RadioButton.Item label="No" value="No" />
                            </View>
                        </RadioButton.Group>
                    </Card.Content>
                </Card>

                {/* Card 3: Performance Report */}
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

                {/* Card 4: Photo Documentation - ✅ CORRIGIDO */}
                <Card style={styles.card}>
                    <Card.Title title="4. Photo Documentation" titleVariant="titleLarge" />
                    <Card.Content>
                        <View style={styles.photosGrid}>
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
                                            <IconButton icon="camera-plus" size={32} iconColor={colors.disabled} />
                                            <Text style={styles.photoLabel}>Posição {photo.position}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Card.Content>
                </Card>

                {/* Card 5: Additional Fields */}
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

                {/* ✅ Progress Bar */}
                {saving && uploadProgress > 0 && (
                    <ProgressBar
                        progress={uploadProgress}
                        color={colors.primary}
                        style={styles.progressBar}
                    />
                )}

                {/* Botão Guardar */}
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={styles.saveButton}
                >
                    {saving ? 'A Guardar...' : 'Guardar Relatório'}
                </Button>
            </ScrollView>

            {/* Dialog Foto */}
            <Portal>
                <Dialog visible={photoDialogVisible} onDismiss={() => setPhotoDialogVisible(false)}>
                    <Dialog.Title>Adicionar Foto</Dialog.Title>
                    <Dialog.Content>
                        <Button
                            mode="outlined"
                            icon="camera"
                            onPress={handleTakePhoto}
                            style={styles.dialogButton}
                        >
                            Tirar Foto
                        </Button>
                        <Button
                            mode="outlined"
                            icon="image"
                            onPress={handlePickPhoto}
                            style={styles.dialogButton}
                        >
                            Escolher da Galeria
                        </Button>
                        {selectedPhotoIndex !== null && photos[selectedPhotoIndex]?.uri && (
                            <Button
                                mode="outlined"
                                icon="delete"
                                onPress={handleRemovePhoto}
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

            {/* Dialog Campo Adicional */}
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
        color: colors.textSecondary,
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
    textArea: {
        minHeight: 120,
    },
    sectionLabel: {
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    radioRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    divider: {
        marginVertical: spacing.md,
    },
    // ✅ CORRIGIDO: photosGrid em vez de photoGrid
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',  // ✅ Em vez de gap
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
        resizeMode: 'cover',
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
    fieldCard: {
        marginBottom: spacing.sm,
        backgroundColor: colors.surface,
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
        fontStyle: 'italic',
        paddingVertical: spacing.md,
    },
    progressBar: {
        marginHorizontal: spacing.md,
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