/**
 * Step 1: General Information
 * Campos obrigatórios com validação em tempo real e suporte offline
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Text, HelperText, Card, Button, Chip } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import { useOfflineReports } from '@/hooks/useOfflineReports';

interface Step1Props {
  site: string;
  wtgNumber: string;
  wtgType: string;
  yearConstruction: string;
  language: 'EN' | 'ES';
  onFieldChange: (field: string, value: string) => void;
  onLanguageChange: (lang: 'EN' | 'ES') => void;
  onNext: () => void;
}

export function DefectReportStep1({
  site,
  wtgNumber,
  wtgType,
  yearConstruction,
  language,
  onFieldChange,
  onLanguageChange,
  onNext,
}: Step1Props) {
  const { isOnline } = useOfflineReports();

  // Estados de validação
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validar campo individual
  const validateField = (field: string, value: string): string => {
    if (!value.trim()) {
      return 'Campo obrigatório';
    }

    if (field === 'yearConstruction') {
      const year = parseInt(value, 10);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
        return 'Ano inválido';
      }
    }

    return '';
  };

  // Handle blur (quando sai do campo)
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, getFieldValue(field));
    setErrors({ ...errors, [field]: error });
  };

  // Handle change
  const handleChange = (field: string, value: string) => {
    onFieldChange(field, value);
    
    // Se já tocou, validar em tempo real
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
  };

  // Obter valor do campo
  const getFieldValue = (field: string): string => {
    switch (field) {
      case 'site': return site;
      case 'wtgNumber': return wtgNumber;
      case 'wtgType': return wtgType;
      case 'yearConstruction': return yearConstruction;
      default: return '';
    }
  };

  // Validar todos os campos antes de avançar
  const validateAll = (): boolean => {
    const fields = ['site', 'wtgNumber', 'wtgType', 'yearConstruction'];
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    let isValid = true;

    fields.forEach(field => {
      newTouched[field] = true;
      const error = validateField(field, getFieldValue(field));
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setTouched(newTouched);
    setErrors(newErrors);

    return isValid;
  };

  // Avançar para próximo step
  const handleNext = () => {
    if (validateAll()) {
      onNext();
    }
  };

  // Labels traduzidos
  const labels = language === 'EN' ? {
    title: 'General Information',
    site: 'Site',
    wtgNumber: 'WTG Number',
    wtgType: 'WTG Type',
    yearConstruction: 'Year of Construction',
    language: 'Report Language',
    next: 'Next: Add Photos',
    required: '* Required field',
  } : {
    title: 'Información General',
    site: 'Sitio',
    wtgNumber: 'Número WTG',
    wtgType: 'Tipo WTG',
    yearConstruction: 'Año de Construcción',
    language: 'Idioma del Informe',
    next: 'Siguiente: Añadir Fotos',
    required: '* Campo obligatorio',
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={labels.title}
          subtitle={labels.required}
          right={() => (
            <View style={styles.statusChip}>
              {isOnline ? (
                <Chip icon="wifi" mode="flat" style={styles.onlineChip}>
                  Online
                </Chip>
              ) : (
                <Chip icon="wifi-off" mode="flat" style={styles.offlineChip}>
                  Offline
                </Chip>
              )}
            </View>
          )}
        />

        <Card.Content>
          {/* Site */}
          <TextInput
            label={`${labels.site} *`}
            value={site}
            onChangeText={(value) => handleChange('site', value)}
            onBlur={() => handleBlur('site')}
            error={touched.site && !!errors.site}
            mode="outlined"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />
          {touched.site && errors.site && (
            <HelperText type="error" visible={true}>
              {errors.site}
            </HelperText>
          )}

          {/* WTG Number */}
          <TextInput
            label={`${labels.wtgNumber} *`}
            value={wtgNumber}
            onChangeText={(value) => handleChange('wtgNumber', value)}
            onBlur={() => handleBlur('wtgNumber')}
            error={touched.wtgNumber && !!errors.wtgNumber}
            mode="outlined"
            style={styles.input}
            autoCapitalize="characters"
            returnKeyType="next"
          />
          {touched.wtgNumber && errors.wtgNumber && (
            <HelperText type="error" visible={true}>
              {errors.wtgNumber}
            </HelperText>
          )}

          {/* WTG Type */}
          <TextInput
            label={`${labels.wtgType} *`}
            value={wtgType}
            onChangeText={(value) => handleChange('wtgType', value)}
            onBlur={() => handleBlur('wtgType')}
            error={touched.wtgType && !!errors.wtgType}
            mode="outlined"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />
          {touched.wtgType && errors.wtgType && (
            <HelperText type="error" visible={true}>
              {errors.wtgType}
            </HelperText>
          )}

          {/* Year of Construction */}
          <TextInput
            label={`${labels.yearConstruction} *`}
            value={yearConstruction}
            onChangeText={(value) => handleChange('yearConstruction', value)}
            onBlur={() => handleBlur('yearConstruction')}
            error={touched.yearConstruction && !!errors.yearConstruction}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            maxLength={4}
            returnKeyType="done"
            placeholder="2024"
          />
          {touched.yearConstruction && errors.yearConstruction && (
            <HelperText type="error" visible={true}>
              {errors.yearConstruction}
            </HelperText>
          )}

          {/* Language Selection */}
          <View style={styles.languageContainer}>
            <Text style={styles.languageLabel}>{labels.language}</Text>
            <View style={styles.languageButtons}>
              <Button
                mode={language === 'EN' ? 'contained' : 'outlined'}
                onPress={() => onLanguageChange('EN')}
                style={styles.languageButton}
              >
                English
              </Button>
              <Button
                mode={language === 'ES' ? 'contained' : 'outlined'}
                onPress={() => onLanguageChange('ES')}
                style={styles.languageButton}
              >
                Español
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Next Button */}
      <Button
        mode="contained"
        onPress={handleNext}
        style={styles.nextButton}
        icon="arrow-right"
        contentStyle={styles.nextButtonContent}
      >
        {labels.next}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    margin: spacing.md,
    elevation: 2,
  },
  statusChip: {
    marginRight: spacing.md,
  },
  onlineChip: {
    backgroundColor: colors.success + '20',
  },
  offlineChip: {
    backgroundColor: colors.warning + '20',
  },
  input: {
    marginBottom: spacing.xs,
  },
  languageContainer: {
    marginTop: spacing.lg,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  languageButton: {
    flex: 1,
  },
  nextButton: {
    margin: spacing.md,
    marginTop: spacing.lg,
  },
  nextButtonContent: {
    flexDirection: 'row-reverse',
    paddingVertical: spacing.sm,
  },
});
