/**
 * DefectInspectionReportCreateScreen
 * Ecrã principal de criação de Defect Inspection Report
 * Integra 3 steps + sistema offline + validação + sincronização
 */

import React, { useState } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { Appbar, ProgressBar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { useOfflineReports } from '@/hooks/useOfflineReports.hook';
import { OfflineSyncIndicator } from '@/components/OfflineSyncIndicator.component';
import { DefectReportStep1 } from '@/components/reports/DefectReportStep1.component';
import { DefectReportStep2 } from '@/components/reports/DefectReportStep2.component';
import { DefectReportStep3 } from '@/components/reports/DefectReportStep3.component';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';

interface PhotoData {
  id: string;
  uri: string;
  description: string;
  pageNumber: number;
  position: number;
  isUploaded: boolean;
}

interface AdditionalField {
  label: string;
  value: string;
}

export default function DefectInspectionReportCreateScreen() {
  const router = useRouter();
  const { projectId, turbineId, turbineName } = useLocalSearchParams<{
    projectId: string;
    turbineId: string;
    turbineName: string;
  }>();

  const { create, markForSync, isOnline } = useOfflineReports();

  // Estados do formulário
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: General Info
  const [site, setSite] = useState('');
  const [wtgNumber, setWtgNumber] = useState('');
  const [wtgType, setWtgType] = useState('');
  const [yearConstruction, setYearConstruction] = useState('');
  const [language, setLanguage] = useState<'EN' | 'ES'>('EN');

  // Step 2: Photos
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Step 3: Additional Fields
  const [additionalFields, setAdditionalFields] = useState<AdditionalField[]>([]);

  const totalSteps = 3;

  // Handle back button
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [currentStep]);

  // Atualizar campo
  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'site':
        setSite(value);
        break;
      case 'wtgNumber':
        setWtgNumber(value);
        break;
      case 'wtgType':
        setWtgType(value);
        break;
      case 'yearConstruction':
        setYearConstruction(value);
        break;
    }
  };

  // Submeter relatório
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      console.log('📝 Creating report...');
      console.log('Online:', isOnline);

      // Preparar dados do relatório
      const reportData = {
        site,
        wtgNumber,
        wtgType,
        yearConstruction,
        dateInspection: new Date().toISOString().split('T')[0],
        inspectedBy: '', // Obter do user context
        observations: '',
        language,
        additionalFields: additionalFields.reduce((acc, field, index) => {
          acc[`field${index + 1}`] = { label: field.label, value: field.value };
          return acc;
        }, {} as Record<string, { label: string; value: string }>),
      };

      // Criar relatório offline
      const offlineReport = await create({
        projectId: parseInt(projectId),
        turbineId: parseInt(turbineId),
        reportType: 0, // Defect Inspection Report
        language,
        data: reportData,
        photos: photos.map(p => ({
          tempId: p.id,
          uri: p.uri,
          filename: `photo_${p.pageNumber}_${p.position}.jpg`,
          mimeType: 'image/jpeg',
          base64: undefined, // Será convertido na sincronização
        })),
      });

      console.log('✅ Report created offline:', offlineReport.tempId);

      // Se estiver online, marcar para sincronizar imediatamente
      if (isOnline) {
        console.log('🌐 Online - marking for sync...');
        await markForSync(offlineReport.tempId);
        
        Toast.show({
          type: 'success',
          text1: '✅ Relatório a Sincronizar',
          text2: 'O relatório está a ser enviado para o servidor...',
          visibilityTime: 4000,
        });
      } else {
        console.log('📵 Offline - will sync later');
        
        Toast.show({
          type: 'info',
          text1: '📵 Relatório Guardado Offline',
          text2: 'Será sincronizado automaticamente quando houver conexão',
          visibilityTime: 4000,
        });
      }

      // Voltar atrás
      setTimeout(() => {
        router.back();
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error submitting report:', error);
      
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível guardar o relatório'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Voltar atrás (cancelar)
  const handleCancel = () => {
    Alert.alert(
      language === 'EN' ? 'Cancel Report?' : '¿Cancelar Informe?',
      language === 'EN'
        ? 'All data will be lost. Are you sure?'
        : 'Se perderán todos los datos. ¿Estás seguro?',
      [
        {
          text: language === 'EN' ? 'Keep Editing' : 'Seguir Editando',
          style: 'cancel',
        },
        {
          text: language === 'EN' ? 'Cancel Report' : 'Cancelar Informe',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  // Renderizar step atual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <DefectReportStep1
            site={site}
            wtgNumber={wtgNumber}
            wtgType={wtgType}
            yearConstruction={yearConstruction}
            language={language}
            onFieldChange={handleFieldChange}
            onLanguageChange={setLanguage}
            onNext={() => setCurrentStep(2)}
          />
        );

      case 2:
        return (
          <DefectReportStep2
            photos={photos}
            language={language}
            onPhotosChange={setPhotos}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
            uploadProgress={uploadProgress}
          />
        );

      case 3:
        return (
          <DefectReportStep3
            additionalFields={additionalFields}
            language={language}
            onFieldsChange={setAdditionalFields}
            onBack={() => setCurrentStep(2)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );

      default:
        return null;
    }
  };

  // Título do step
  const getStepTitle = () => {
    const titles = {
      EN: ['General Information', 'Photographs', 'Additional Fields'],
      ES: ['Información General', 'Fotografías', 'Campos Adicionales'],
    };
    return titles[language][currentStep - 1];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={handleCancel} />
        <Appbar.Content
          title={turbineName || 'Defect Inspection Report'}
          subtitle={`${language === 'EN' ? 'Step' : 'Paso'} ${currentStep}/${totalSteps}: ${getStepTitle()}`}
        />
      </Appbar.Header>

      {/* Progress Bar */}
      <ProgressBar
        progress={currentStep / totalSteps}
        color={colors.primary}
        style={styles.progressBar}
      />

      {/* Offline Indicator */}
      <OfflineSyncIndicator compact />

      {/* Step Content */}
      <View style={styles.content}>{renderStep()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressBar: {
    height: 4,
  },
  content: {
    flex: 1,
  },
});
