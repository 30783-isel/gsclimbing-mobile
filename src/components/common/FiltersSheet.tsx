import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, IconButton, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '@/constants/theme';
import type { ProjectFilters } from '@/types/project.types';

interface FiltersSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onApply: (filters: ProjectFilters) => void;
  initialFilters?: ProjectFilters;
  resultCount?: number;
}

export const FiltersSheet: React.FC<FiltersSheetProps> = ({
  visible,
  onDismiss,
  onApply,
  initialFilters = {},
  resultCount,
}) => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<ProjectFilters>({
    name: '',
    country: '',
    location: '',
    site: '',
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  useEffect(() => {
    // Contar filtros ativos
    const count = Object.values(filters).filter(
      (value) => value && value.trim() !== ''
    ).length;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleChange = (field: keyof ProjectFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setFilters({
      name: '',
      country: '',
      location: '',
      site: '',
    });
  };

  const handleApply = () => {
    onApply(filters);
    onDismiss();
  };

  const handleRemoveFilter = (field: keyof ProjectFilters) => {
    setFilters((prev) => ({ ...prev, [field]: '' }));
  };

  const hasActiveFilters = activeFiltersCount > 0;

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
                <View style={styles.headerLeft}>
                  <Text variant="headlineSmall" style={styles.title}>
                    {t('GSCLIMBING.FILTER')}
                  </Text>
                  {activeFiltersCount > 0 && (
                    <Chip
                      icon="filter"
                      style={styles.countChip}
                      textStyle={styles.countChipText}
                    >
                      {activeFiltersCount}
                    </Chip>
                  )}
                </View>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={onDismiss}
                  style={styles.closeButton}
                />
              </View>
            </View>

            {/* Active Filters Chips */}
            {hasActiveFilters && (
              <View style={styles.activeFiltersContainer}>
                <Text variant="bodySmall" style={styles.activeFiltersLabel}>
                  Filtros Ativos:
                </Text>
                <View style={styles.activeFiltersChips}>
                  {filters.name && (
                    <Chip
                      icon="tag"
                      onClose={() => handleRemoveFilter('name')}
                      style={styles.activeChip}
                      closeIconAccessibilityLabel="Remover"
                    >
                      {filters.name}
                    </Chip>
                  )}
                  {filters.country && (
                    <Chip
                      icon="flag"
                      onClose={() => handleRemoveFilter('country')}
                      style={styles.activeChip}
                      closeIconAccessibilityLabel="Remover"
                    >
                      {filters.country}
                    </Chip>
                  )}
                  {filters.location && (
                    <Chip
                      icon="map-marker"
                      onClose={() => handleRemoveFilter('location')}
                      style={styles.activeChip}
                      closeIconAccessibilityLabel="Remover"
                    >
                      {filters.location}
                    </Chip>
                  )}
                  {filters.site && (
                    <Chip
                      icon="domain"
                      onClose={() => handleRemoveFilter('site')}
                      style={styles.activeChip}
                      closeIconAccessibilityLabel="Remover"
                    >
                      {filters.site}
                    </Chip>
                  )}
                </View>
              </View>
            )}

            {/* Form */}
            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Pesquisar por:
              </Text>

              {/* Nome */}
              <TextInput
                label={t('GSCLIMBING.NAME')}
                value={filters.name || ''}
                onChangeText={(value) => handleChange('name', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="tag" />}
                right={
                  filters.name ? (
                    <TextInput.Icon
                      icon="close"
                      onPress={() => handleChange('name', '')}
                    />
                  ) : undefined
                }
              />

              {/* País */}
              <TextInput
                label={t('GSCLIMBING.COUNTRY')}
                value={filters.country || ''}
                onChangeText={(value) => handleChange('country', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="flag" />}
                right={
                  filters.country ? (
                    <TextInput.Icon
                      icon="close"
                      onPress={() => handleChange('country', '')}
                    />
                  ) : undefined
                }
              />

              {/* Localização */}
              <TextInput
                label={t('GSCLIMBING.LOCATION')}
                value={filters.location || ''}
                onChangeText={(value) => handleChange('location', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="map-marker" />}
                right={
                  filters.location ? (
                    <TextInput.Icon
                      icon="close"
                      onPress={() => handleChange('location', '')}
                    />
                  ) : undefined
                }
              />

              {/* Site */}
              <TextInput
                label={t('GSCLIMBING.SITE')}
                value={filters.site || ''}
                onChangeText={(value) => handleChange('site', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="domain" />}
                right={
                  filters.site ? (
                    <TextInput.Icon
                      icon="close"
                      onPress={() => handleChange('site', '')}
                    />
                  ) : undefined
                }
              />

              {/* Result Count */}
              {resultCount !== undefined && (
                <View style={styles.resultCount}>
                  <Text variant="bodyMedium" style={styles.resultCountText}>
                    📊 {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
                  </Text>
                </View>
              )}

              {/* Info */}
              <Text variant="bodySmall" style={styles.infoText}>
                💡 Deixe em branco os campos que não quer filtrar
              </Text>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={handleClear}
                style={styles.clearButton}
                icon="close-circle"
                disabled={!hasActiveFilters}
              >
                Limpar
              </Button>
              <Button
                mode="contained"
                onPress={handleApply}
                style={styles.applyButton}
                icon="check"
              >
                Aplicar
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
    maxHeight: '85%',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: colors.text,
  },
  countChip: {
    backgroundColor: colors.primary,
    height: 28,
  },
  countChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  activeFiltersContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activeFiltersLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  activeFiltersChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  activeChip: {
    backgroundColor: colors.primary + '20',
  },
  formContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    maxHeight: 400,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  resultCount: {
    backgroundColor: colors.success + '20',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  resultCountText: {
    color: colors.success,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});
