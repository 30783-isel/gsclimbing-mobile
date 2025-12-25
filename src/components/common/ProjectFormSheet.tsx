import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '@/constants/theme';
import type { Project, CreateProjectDTO, UpdateProjectDTO } from '@/types/project.types';

interface ProjectFormSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: CreateProjectDTO | UpdateProjectDTO) => Promise<void>;
  project?: Project | null;
  mode: 'create' | 'edit';
  onSave: (data: Partial<Project>) => Promise<void>;
}

export const ProjectFormSheet: React.FC<ProjectFormSheetProps> = ({
  visible,
  onDismiss,
  onSubmit,
  project,
  mode,
}) => {
  const { t } = useTranslation();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    location: '',
    numberTurbines: '',
    site: '',
    number: '',
    type: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Preencher form quando editar
  useEffect(() => {
    if (mode === 'edit' && project) {
      setFormData({
        name: project.name || '',
        country: project.country || '',
        location: project.location || '',
        numberTurbines: project.numberTurbines || '',
        site: project.site || '',
        number: project.number || '',
        type: project.type || '',
      });
    } else {
      // Reset no modo criar
      setFormData({
        name: '',
        country: '',
        location: '',
        numberTurbines: '',
        site: '',
        number: '',
        type: '',
      });
    }
    setErrors({});
  }, [mode, project, visible]);

  const handleChange = (field: string, value: string) => {
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

    // Campos obrigatórios
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'País é obrigatório';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Localização é obrigatória';
    }
    if (!formData.numberTurbines.trim()) {
      newErrors.numberTurbines = 'Número de turbinas é obrigatório';
    } else if (isNaN(Number(formData.numberTurbines))) {
      newErrors.numberTurbines = 'Deve ser um número';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onDismiss();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

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
                    ? t('GSCLIMBING.INSERT_PROJECT')
                    : t('GSCLIMBING.EDIT_PROJECT')}
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

              {/* País * */}
              <TextInput
                label={`${t('GSCLIMBING.COUNTRY')} *`}
                value={formData.country}
                onChangeText={(value) => handleChange('country', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.country}
                disabled={loading}
              />
              {errors.country && (
                <Text style={styles.errorText}>{errors.country}</Text>
              )}

              {/* Localização * */}
              <TextInput
                label={`${t('GSCLIMBING.LOCATION')} *`}
                value={formData.location}
                onChangeText={(value) => handleChange('location', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.location}
                disabled={loading}
              />
              {errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}

              {/* Número de Turbinas * */}
              <TextInput
                label={`${t('GSCLIMBING.NUMBER_TURBINES')} *`}
                value={formData.numberTurbines}
                onChangeText={(value) => handleChange('numberTurbines', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.numberTurbines}
                keyboardType="numeric"
                disabled={loading}
              />
              {errors.numberTurbines && (
                <Text style={styles.errorText}>{errors.numberTurbines}</Text>
              )}

              {/* Site (opcional) */}
              <TextInput
                label={t('GSCLIMBING.SITE')}
                value={formData.site}
                onChangeText={(value) => handleChange('site', value)}
                mode="outlined"
                style={styles.input}
                disabled={loading}
              />

              {/* Número (opcional) */}
              <TextInput
                label={t('GSCLIMBING.NUMBER')}
                value={formData.number}
                onChangeText={(value) => handleChange('number', value)}
                mode="outlined"
                style={styles.input}
                disabled={loading}
              />

              {/* Tipo (opcional) */}
              <TextInput
                label={t('GSCLIMBING.TYPE')}
                value={formData.type}
                onChangeText={(value) => handleChange('type', value)}
                mode="outlined"
                style={styles.input}
                disabled={loading}
              />

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
    maxHeight: 400,
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
  requiredNote: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
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