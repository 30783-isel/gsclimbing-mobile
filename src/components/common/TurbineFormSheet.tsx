import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, IconButton, Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '@/constants/theme';
import type { Turbine, CreateTurbineDTO, UpdateTurbineDTO } from '@/types/turbine.types';

interface TurbineFormSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: CreateTurbineDTO | UpdateTurbineDTO) => Promise<void>;
  turbine?: Turbine | null;
  mode: 'create' | 'edit';
  projectId: string;
}

export const TurbineFormSheet: React.FC<TurbineFormSheetProps> = ({
  visible,
  onDismiss,
  onSubmit,
  turbine,
  mode,
  projectId,
}) => {
  const { t } = useTranslation();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    site: '',
    number: '',
    type: '',
    year: '',
    // Report flags
    defectsInspectionReport: false,
    examinationTransformer: false,
    measurements6KV: false,
    measurements690V400V: false,
    measurementsMwSwitchgear: false,
    onboardCraneInspectionReport: false,
    performanceReportRepairElevator: false,
    statutoryInspectionReport: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Preencher form quando editar
  useEffect(() => {
    if (mode === 'edit' && turbine) {
      setFormData({
        name: turbine.name || '',
        site: turbine.site || '',
        number: turbine.number || '',
        type: turbine.type || '',
        year: turbine.year || '',
        defectsInspectionReport: turbine.defectsInspectionReport || false,
        examinationTransformer: turbine.examinationTransformer || false,
        measurements6KV: turbine.measurements6KV || false,
        measurements690V400V: turbine.measurements690V400V || false,
        measurementsMwSwitchgear: turbine.measurementsMwSwitchgear || false,
        onboardCraneInspectionReport: turbine.onboardCraneInspectionReport || false,
        performanceReportRepairElevator: turbine.performanceReportRepairElevator || false,
        statutoryInspectionReport: turbine.statutoryInspectionReport || false,
      });
    } else {
      // Reset no modo criar
      setFormData({
        name: '',
        site: '',
        number: '',
        type: '',
        year: '',
        defectsInspectionReport: false,
        examinationTransformer: false,
        measurements6KV: false,
        measurements690V400V: false,
        measurementsMwSwitchgear: false,
        onboardCraneInspectionReport: false,
        performanceReportRepairElevator: false,
        statutoryInspectionReport: false,
      });
    }
    setErrors({});
  }, [mode, turbine, visible]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Campo obrigatório
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    // Validar ano se preenchido
    if (formData.year && isNaN(Number(formData.year))) {
      newErrors.year = 'Ano deve ser numérico';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = mode === 'create' 
        ? { ...formData, projectId }
        : formData;
      
      await onSubmit(submitData);
      onDismiss();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { key: 'defectsInspectionReport', label: 'Defect Inspection Report' },
    { key: 'examinationTransformer', label: 'Examination Transformer' },
    { key: 'measurements6KV', label: 'Measurements 6KV' },
    { key: 'measurements690V400V', label: 'Measurements 690V/400V' },
    { key: 'measurementsMwSwitchgear', label: 'Measurements MV Switchgear' },
    { key: 'onboardCraneInspectionReport', label: 'Onboard Crane Inspection' },
    { key: 'performanceReportRepairElevator', label: 'Performance Repair Elevator' },
    { key: 'statutoryInspectionReport', label: 'Statutory Inspection Report' },
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.sheetContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.dragHandle} />
              <View style={styles.headerContent}>
                <Text variant="headlineSmall" style={styles.title}>
                  {mode === 'create'
                    ? t('GSCLIMBING.ADDTURBINE')
                    : t('GSCLIMBING.EDIT') + ' Turbina'}
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={onDismiss}
                  style={styles.closeButton}
                />
              </View>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Nome * */}
              <TextInput
                label={`${t('GSCLIMBING.NAME')} *`}
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.name}
                disabled={loading}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              {/* Site */}
              <TextInput
                label={t('GSCLIMBING.SITE')}
                value={formData.site}
                onChangeText={(value) => handleChange('site', value)}
                mode="outlined"
                style={styles.input}
                disabled={loading}
              />

              {/* Número WTG */}
              <TextInput
                label={t('GSCLIMBING.NUMBER')}
                value={formData.number}
                onChangeText={(value) => handleChange('number', value)}
                mode="outlined"
                style={styles.input}
                disabled={loading}
                placeholder="ex: 01, 02, 03..."
              />

              {/* Tipo */}
              <TextInput
                label={t('GSCLIMBING.TYPE')}
                value={formData.type}
                onChangeText={(value) => handleChange('type', value)}
                mode="outlined"
                style={styles.input}
                disabled={loading}
                placeholder="ex: Vestas V90, Siemens..."
              />

              {/* Ano */}
              <TextInput
                label={t('GSCLIMBING.YEAR')}
                value={formData.year}
                onChangeText={(value) => handleChange('year', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.year}
                keyboardType="numeric"
                disabled={loading}
                placeholder="ex: 2020"
              />
              {errors.year && (
                <Text style={styles.errorText}>{errors.year}</Text>
              )}

              {/* Divider */}
              <View style={styles.divider}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Tipos de Relatórios Disponíveis
                </Text>
                <Text variant="bodySmall" style={styles.sectionSubtitle}>
                  Selecione os tipos de relatórios que podem ser criados para esta turbina
                </Text>
              </View>

              {/* Report Checkboxes */}
              {reportTypes.map((report) => (
                <View key={report.key} style={styles.checkboxRow}>
                  <Checkbox
                    status={formData[report.key as keyof typeof formData] ? 'checked' : 'unchecked'}
                    onPress={() => handleChange(report.key, !formData[report.key as keyof typeof formData])}
                    color={colors.primary}
                    disabled={loading}
                  />
                  <Text
                    style={styles.checkboxLabel}
                    onPress={() => handleChange(report.key, !formData[report.key as keyof typeof formData])}
                  >
                    {report.label}
                  </Text>
                </View>
              ))}

              {/* Nota */}
              <Text variant="bodySmall" style={styles.requiredNote}>
                * Campos obrigatórios
              </Text>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.cancelButton}
                disabled={loading}
              >
                {t('GSCLIMBING.CANCEL')}
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                loading={loading}
                disabled={loading}
              >
                {mode === 'create' ? t('GSCLIMBING.ADD') : t('GSCLIMBING.SAVE')}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  formContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    maxHeight: 500,
  },
  input: {
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  divider: {
    marginVertical: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  requiredNote: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});