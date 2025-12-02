import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, ProgressBar, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useDefectInspectionForm } from '@/hooks/useDefectInspectionForm';
import { Page1GeneralInfo } from '@/components/reports/defect-inspection/Page1GeneralInfo';
import { PhotoGridPage } from '@/components/reports/defect-inspection/PhotoGridPage';
import { Page4AdditionalFields } from '@/components/reports/defect-inspection/Page4AdditionalFields';
import { colors, spacing } from '@/constants/theme';

export default function DefectInspectionReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    projectoId: string;
    turbinaId: string;
    projectName: string;
    turbineName: string;
  }>();

  const projectoId = parseInt(params.projectoId || '0', 10);
  const turbinaId = parseInt(params.turbinaId || '0', 10);

  const {
    formData,
    isSubmitting,
    nextStep,
    previousStep,
    updateField,
    takePhoto,
    pickPhoto,
    removePhoto,
    updatePhotoDescription,
    addAdditionalField,
    removeAdditionalField,
    updateAdditionalField,
    validateStep1,
    submit,
  } = useDefectInspectionForm(projectoId, turbinaId);

  const progress = formData.currentStep / formData.totalSteps;

  const handleNext = () => {
    if (formData.currentStep === 1) {
      if (!validateStep1()) {
        return;
      }
    }
    nextStep();
  };

  const handleSubmit = async () => {
    const result = await submit();
    if (result) {
      Toast.show({
        type: 'success',
        text1: 'Sucesso!',
        text2: 'Relatório criado com sucesso',
      });
      router.back();
    }
  };

  const renderStep = () => {
    switch (formData.currentStep) {
      case 1:
        return (
          <Page1GeneralInfo
            site={formData.site}
            wtgNumber={formData.wtgNumber}
            wtgType={formData.wtgType}
            yearConstruction={formData.yearConstruction}
            onUpdateField={(field, value) =>
              updateField(field as any, value)
            }
          />
        );

      case 2:
        return (
          <PhotoGridPage
            pageNumber={2}
            photos={formData.photos}
            onTakePhoto={takePhoto}
            onPickPhoto={pickPhoto}
            onRemovePhoto={removePhoto}
            onUpdateDescription={updatePhotoDescription}
          />
        );

      case 3:
        return (
          <PhotoGridPage
            pageNumber={3}
            photos={formData.photos}
            onTakePhoto={takePhoto}
            onPickPhoto={pickPhoto}
            onRemovePhoto={removePhoto}
            onUpdateDescription={updatePhotoDescription}
          />
        );

      case 4:
        return (
          <Page4AdditionalFields
            additionalFields={formData.additionalFields}
            onAddField={addAdditionalField}
            onRemoveField={removeAdditionalField}
            onUpdateField={updateAdditionalField}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
            />
            <View style={styles.headerCenter}>
              <Text variant="titleMedium" style={styles.headerTitle}>
                Defect Inspection Report
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                {params.projectName} • {params.turbineName}
              </Text>
            </View>
            <View style={{ width: 48 }} />
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color={colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.progressText}>
              Passo {formData.currentStep} de {formData.totalSteps}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>{renderStep()}</View>

        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          {formData.currentStep > 1 && (
            <Button
              mode="outlined"
              onPress={previousStep}
              icon="arrow-left"
              style={styles.navButton}
              disabled={isSubmitting}
            >
              Anterior
            </Button>
          )}

          {formData.currentStep < formData.totalSteps ? (
            <Button
              mode="contained"
              onPress={handleNext}
              icon="arrow-right"
              contentStyle={styles.nextButtonContent}
              style={[styles.navButton, styles.nextButton]}
              disabled={isSubmitting}
            >
              Próximo
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit}
              icon="check"
              contentStyle={styles.nextButtonContent}
              style={[styles.navButton, styles.submitButton]}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'A submeter...' : 'Submeter'}
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  navigation: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  navButton: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  nextButtonContent: {
    flexDirection: 'row-reverse',
  },
});
