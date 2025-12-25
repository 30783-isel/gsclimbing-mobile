import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type {
  DefectInspectionReportFormData,
  PhotoData,
  DefectInspectionReportDTO,
} from '@/types/defectInspectionReport.types';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';
import { useAuthStore } from '@/store/authStore';

const TOTAL_STEPS = 4;
const MAX_ADDITIONAL_FIELDS = 7;

export const useDefectInspectionForm = (
  projectoId: number,
  turbinaId: number
) => {
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<DefectInspectionReportFormData>({
    site: '',
    wtgNumber: '',
    wtgType: '',
    yearConstruction: '',
    photos: [],
    additionalFields: [],
    projectoId,
    turbinaId,
    currentStep: 1,
    totalSteps: TOTAL_STEPS,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Navegação entre steps
  const nextStep = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, TOTAL_STEPS),
    }));
  }, []);

  const previousStep = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setFormData((prev) => ({
      ...prev,
      currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)),
    }));
  }, []);

  // Atualizar campos gerais
  const updateField = useCallback(<K extends keyof DefectInspectionReportFormData>(
    field: K,
    value: DefectInspectionReportFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Tirar foto com câmara
  const takePhoto = useCallback(
    async (pageNumber: number, position: number) => {
      try {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permissão Negada',
            'Precisa de dar permissão para aceder à câmara'
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const newPhoto: PhotoData = {
            id: `${Date.now()}-${position}`,
            uri: result.assets[0].uri,
            description: '',
            pageNumber,
            position,
            timestamp: Date.now(),
            isUploaded: false,
          };

          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos.filter(p => !(p.pageNumber === pageNumber && p.position === position)), newPhoto],
          }));
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Erro', 'Não foi possível tirar a foto');
      }
    },
    []
  );

  // Escolher foto da galeria
  const pickPhoto = useCallback(
    async (pageNumber: number, position: number) => {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permissão Negada',
            'Precisa de dar permissão para aceder à galeria'
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const newPhoto: PhotoData = {
            id: `${Date.now()}-${position}`,
            uri: result.assets[0].uri,
            description: '',
            pageNumber,
            position,
            timestamp: Date.now(),
            isUploaded: false,
          };

          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos.filter(p => !(p.pageNumber === pageNumber && p.position === position)), newPhoto],
          }));
        }
      } catch (error) {
        console.error('Error picking photo:', error);
        Alert.alert('Erro', 'Não foi possível escolher a foto');
      }
    },
    []
  );

  // Remover foto
  const removePhoto = useCallback((photoId: string) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== photoId),
    }));
  }, []);

  // Atualizar descrição da foto
  const updatePhotoDescription = useCallback((photoId: string, description: string) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.map((p) =>
        p.id === photoId ? { ...p, description } : p
      ),
    }));
  }, []);

  // Upload de uma foto
  const uploadPhoto = useCallback(
    async (photo: PhotoData, tempReportId: string): Promise<string | null> => {
      try {
        setUploadProgress((prev) => ({ ...prev, [photo.id]: 0 }));

        const result = await defectInspectionReportAPI.uploadPhoto(
          tempReportId,
          photo.uri,
          photo.description
        );

        setUploadProgress((prev) => ({ ...prev, [photo.id]: 100 }));

        if (result.success) {
          // Atualizar foto como uploaded
          setFormData((prev) => ({
            ...prev,
            photos: prev.photos.map((p) =>
              p.id === photo.id ? { ...p, isUploaded: true, fileId: result.fileId } : p
            ),
          }));
          return result.fileId;
        }

        return null;
      } catch (error) {
        console.error('Error uploading photo:', error);
        setUploadProgress((prev) => ({ ...prev, [photo.id]: -1 }));
        return null;
      }
    },
    []
  );

  // Adicionar campo adicional
  const addAdditionalField = useCallback(() => {
    if (formData.additionalFields.length < MAX_ADDITIONAL_FIELDS) {
      setFormData((prev) => ({
        ...prev,
        additionalFields: [...prev.additionalFields, { label: '', value: '' }],
      }));
    }
  }, [formData.additionalFields.length]);

  // Remover campo adicional
  const removeAdditionalField = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      additionalFields: prev.additionalFields.filter((_, i) => i !== index),
    }));
  }, []);

  // Atualizar campo adicional
  const updateAdditionalField = useCallback(
    (index: number, field: 'label' | 'value', value: string) => {
      setFormData((prev) => ({
        ...prev,
        additionalFields: prev.additionalFields.map((f, i) =>
          i === index ? { ...f, [field]: value } : f
        ),
      }));
    },
    []
  );

  // Validar step 1
  const validateStep1 = useCallback((): boolean => {
    if (!formData.site.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor preencha o Site');
      return false;
    }
    if (!formData.wtgNumber.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor preencha o WTG Number');
      return false;
    }
    return true;
  }, [formData]);

  // Converter formData para DTO
  const toDTO = useCallback((): DefectInspectionReportDTO => {
    const dto: DefectInspectionReportDTO = {
      site: formData.site,
      wtgNumber: formData.wtgNumber,
      wtgType: formData.wtgType,
      yearConstruction: formData.yearConstruction,
      projectoId: formData.projectoId!,
      turbinaId: formData.turbinaId!,
      userId: user?.username,
      photoFileIds: formData.photos
        .filter((p) => p.isUploaded && p.fileId)
        .map((p) => p.fileId!),
    };

    // Mapear campos adicionais
    formData.additionalFields.forEach((field, index) => {
      if (field.label && field.value) {
        const fieldNumber = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
        dto[`additionalField${fieldNumber}`] = {
          label: field.label,
          value: field.value,
        };
      }
    });

    return dto;
  }, [formData, user]);

  // Submeter relatório
const submit = useCallback(async () => {
  if (!formData.projectoId || !formData.turbinaId) {
    Alert.alert('Erro', 'Projeto ou Turbina não especificados');
    return null;
  }

  setIsSubmitting(true);

  try {
    // ✅ 1. CRIAR RELATÓRIO PRIMEIRO (sem fotos)
    console.log('📝 Creating report without photos...');
    const dto = toDTO();
    const response = await defectInspectionReportAPI.create(dto);

    if (!response.success) {
      Alert.alert('Erro', response.message || 'Erro ao criar relatório');
      return null;
    }

    console.log('✅ Report created with UUID:', response.uuid);

    // ✅ 2. DEPOIS fazer upload das fotos com o UUID correto
    const reportUuid = response.uuid; // ← Usar o UUID retornado!
    
    if (formData.photos.length > 0) {
      console.log(`📤 Uploading ${formData.photos.length} photo(s)...`);
      
      for (const photo of formData.photos) {
        if (!photo.isUploaded) {
          console.log(`📷 Uploading photo: ${photo.id}`);
          await uploadPhoto(photo, reportUuid); // ← Usar o UUID REAL, não 'temp'
        }
      }
      
      console.log('✅ All photos uploaded');
    }

    Alert.alert(
      'Sucesso! ✅',
      `Relatório criado com ID: ${response.reportId}${
        formData.photos.length > 0 
          ? `\n${formData.photos.length} foto(s) enviada(s)` 
          : ''
      }`,
      [{ text: 'OK' }]
    );
    
    return response;
  } catch (error: any) {
    console.error('❌ Error submitting report:', error);
    Alert.alert(
      'Erro',
      error.response?.data?.message || error.message || 'Erro ao submeter relatório'
    );
    return null;
  } finally {
    setIsSubmitting(false);
  }
}, [formData, uploadPhoto, toDTO]);

  return {
    formData,
    isSubmitting,
    uploadProgress,
    
    // Navigation
    nextStep,
    previousStep,
    goToStep,
    
    // General fields
    updateField,
    
    // Photos
    takePhoto,
    pickPhoto,
    removePhoto,
    updatePhotoDescription,
    
    // Additional fields
    addAdditionalField,
    removeAdditionalField,
    updateAdditionalField,
    
    // Validation & Submit
    validateStep1,
    submit,
  };
};
